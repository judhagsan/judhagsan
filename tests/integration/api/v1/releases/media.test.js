import sharp from "sharp";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeEach(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

async function sender() {
  const user = await orchestrator.activateUser(
    await orchestrator.createUser({ username: "mediasender" }),
  );
  await orchestrator.addFeaturesToUser(user, ["admin", "send:release_email"]);
  const session = await orchestrator.createSession(user);
  return {
    "Content-Type": "application/json",
    Cookie: `session_id=${session.token}`,
  };
}
async function animatedGif() {
  return sharp(Buffer.from([255, 0, 0, 0, 255, 0]), {
    raw: { width: 1, height: 2, channels: 3, pageHeight: 1 },
  })
    .gif({ loop: 0, delay: [100, 200] })
    .toBuffer();
}
const endpoint = `${webserver.origin}/api/v1/releases/media`;

test("protects uploads and rejects invalid or oversized files", async () => {
  const anonymous = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "AAAA" }),
  });
  expect(anonymous.status).toBe(403);
  const regular = await orchestrator.activateUser(
    await orchestrator.createUser({ username: "regularmedia" }),
  );
  const session = await orchestrator.createSession(regular);
  const headers = {
    "Content-Type": "application/json",
    Cookie: `session_id=${session.token}`,
  };
  expect(
    (
      await fetch(endpoint, {
        method: "POST",
        headers,
        body: '{"content":"AAAA"}',
      })
    ).status,
  ).toBe(403);
  await orchestrator.addFeaturesToUser(regular, ["admin"]);
  expect(
    (
      await fetch(endpoint, {
        method: "POST",
        headers,
        body: '{"content":"AAAA"}',
      })
    ).status,
  ).toBe(403);
  const adminHeaders = await sender();
  for (const content of [
    Buffer.from("<svg></svg>").toString("base64"),
    Buffer.alloc(3_000_001).toString("base64"),
  ]) {
    expect(
      (
        await fetch(endpoint, {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({ content }),
        })
      ).status,
    ).toBe(400);
  }
});

test("serves immutable animated media without a session and deduplicates identical uploads", async () => {
  const headers = await sender();
  const gif = await animatedGif();
  const payload = JSON.stringify({ content: gif.toString("base64") });
  const uploaded = await fetch(endpoint, {
    method: "POST",
    headers,
    body: payload,
  });
  expect(uploaded.status).toBe(201);
  const media = await uploaded.json();
  const duplicate = await (
    await fetch(endpoint, { method: "POST", headers, body: payload })
  ).json();
  expect(duplicate.id).toBe(media.id);
  const image = await fetch(media.url);
  expect(image.status).toBe(200);
  expect(image.headers.get("content-type")).toBe("image/gif");
  expect(image.headers.get("cache-control")).toContain("immutable");
  expect(image.headers.get("x-content-type-options")).toBe("nosniff");
  const bytes = Buffer.from(await image.arrayBuffer());
  expect(bytes.equals(gif)).toBe(true);
  expect((await sharp(bytes).metadata()).pages).toBe(2);
  expect(
    (
      await fetch(media.url, {
        headers: { "If-None-Match": image.headers.get("etag") },
      })
    ).status,
  ).toBe(304);
  const head = await fetch(media.url, { method: "HEAD" });
  expect(head.status).toBe(200);
  expect(head.headers.get("content-length")).toBe(String(gif.length));
  expect((await fetch(`${endpoint}/invalid`)).status).toBe(404);
  expect(
    (await fetch(`${endpoint}/00000000-0000-4000-8000-000000000000`)).status,
  ).toBe(404);
});

test("sends formatted Markdown and an uploaded GIF through the email transport", async () => {
  const headers = await sender();
  const gif = await animatedGif();
  const media = await (
    await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: gif.toString("base64") }),
    })
  ).json();
  const created = await fetch(
    `${webserver.origin}/api/v1/releases/announcements`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        kind: "general",
        subject: "Novidades em Markdown",
        body: `## Olá, {{username}}!\n\nTexto **forte** e *itálico*.\n\n[Conheça o projeto](https://example.com/projeto)\n\n![Animação](${media.url})\n\n| A | B |\n| --- | --- |\n| 1 | 2 |`,
      }),
    },
  );
  expect(created.status).toBe(201);
  const draft = await created.json();
  expect(
    (
      await fetch(
        `${webserver.origin}/api/v1/releases/announcements/${draft.id}/test`,
        { method: "POST", headers, body: "{}" },
      )
    ).status,
  ).toBe(200);
  const mailOrigin = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;
  const messages = await (await fetch(`${mailOrigin}/messages`)).json();
  expect(messages).toHaveLength(1);
  const html = await (
    await fetch(`${mailOrigin}/messages/${messages[0].id}.html`)
  ).text();
  const text = await (
    await fetch(`${mailOrigin}/messages/${messages[0].id}.plain`)
  ).text();
  expect(html).toContain('href="https://example.com/projeto"');
  expect(html).toContain(`src="${media.url}"`);
  expect(html).toContain('alt="Animação"');
  expect(html).toContain('scope="col"');
  expect(html).toContain("Olá, mediasender!");
  expect(html).not.toContain("## Olá");
  expect(text).toContain(`Animação (${media.url})`);
  expect(text).toContain("Conheça o projeto (https://example.com/projeto)");
  expect((await fetch(media.url)).status).toBe(200);
});
