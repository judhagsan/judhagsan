import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import userDevice from "models/userDevice.js";
import supporter from "models/supporter.js";
import webserver from "infra/webserver.js";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function getAllEmails() {
  const response = await fetch(`${emailHttpUrl}/messages`);
  const list = await response.json();

  const detailed = [];
  for (const item of list) {
    const plainResponse = await fetch(
      `${emailHttpUrl}/messages/${item.id}.plain`,
    );
    const htmlResponse = await fetch(
      `${emailHttpUrl}/messages/${item.id}.html`,
    );
    detailed.push({
      ...item,
      text: await plainResponse.text(),
      html: await htmlResponse.text(),
    });
  }
  return detailed;
}

async function createSenderSession({ email = "sender@judhagsan.com" } = {}) {
  const created = await orchestrator.createUser({
    username: "releasesender",
    email,
  });
  const activated = await orchestrator.activateUser(created);
  await orchestrator.addFeaturesToUser(activated, [
    "admin",
    "send:release_email",
  ]);
  const sessionObject = await orchestrator.createSession(activated);
  return { user: activated, session: sessionObject };
}

beforeEach(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Release announcements API (/api/v1/releases/announcements)", () => {
  test("blocks anonymous users, regular users, and admins without `send:release_email`", async () => {
    const anonResponse = await fetch(
      `${webserver.origin}/api/v1/releases/announcements`,
    );
    expect(anonResponse.status).toBe(403);

    const regularUser = await orchestrator.activateUser(
      await orchestrator.createUser({ username: "comum" }),
    );
    const regularSession = await orchestrator.createSession(regularUser);

    const regularResponse = await fetch(
      `${webserver.origin}/api/v1/releases/announcements`,
      {
        headers: { Cookie: `session_id=${regularSession.token}` },
      },
    );
    expect(regularResponse.status).toBe(403);

    await orchestrator.addFeaturesToUser(regularUser, ["admin"]);
    const adminWithoutFeatureResponse = await fetch(
      `${webserver.origin}/api/v1/releases/announcements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${regularSession.token}`,
        },
        body: JSON.stringify({
          tag: "v0.6.2",
          subject: "Novo release",
          body: "Conteúdo do release.",
        }),
      },
    );
    expect(adminWithoutFeatureResponse.status).toBe(403);
  });

  test("enforces test-before-send lock, re-locks on edit, and broadcasts personalized batches without duplicates", async () => {
    const { user: sender, session } = await createSenderSession();

    // Usuário comum confirmado com Windows
    const regularTarget = await orchestrator.activateUser(
      await orchestrator.createUser({
        username: "carlos",
        email: "carlos@judhagsan.com",
      }),
    );
    await userDevice.upsert({
      userId: regularTarget.id,
      hardwareUuid: "carlos-pc",
      os: "Windows 11",
      pindoramaVersion: "0.6.1",
    });

    // Apoiador confirmado com macOS
    const supporterTarget = await orchestrator.activateUser(
      await orchestrator.createUser({
        username: "marina",
        email: "marina@judhagsan.com",
      }),
    );
    await supporter.grant(supporterTarget.id);
    await userDevice.upsert({
      userId: supporterTarget.id,
      hardwareUuid: "marina-mac",
      os: "macOS 15",
      pindoramaVersion: "0.6.1",
    });

    // Usuário confirmado que desativou avisos de release (NÃO deve receber)
    const optedOutTarget = await orchestrator.activateUser(
      await orchestrator.createUser({
        username: "silencio",
        email: "silencio@judhagsan.com",
      }),
    );
    await user.updateReleaseEmailPreference(optedOutTarget.id, false);

    // Usuário pendente de ativação (NÃO deve receber)
    await orchestrator.createUser({
      username: "naoativado",
      email: "naoativado@judhagsan.com",
    });

    // 1. Listagem inicial: 3 elegíveis (sender + carlos + marina)
    const initialListRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements`,
      {
        headers: { Cookie: `session_id=${session.token}` },
      },
    );
    expect(initialListRes.status).toBe(200);
    const initialList = await initialListRes.json();
    expect(initialList.eligible_recipients).toBe(3);

    // 2. Criar rascunho
    const createRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          tag: "v0.6.2",
          subject: "Pindorama {{tag}} chegou!",
          body: "Olá **{{username}}**!\n\n- Importação de SVG\n- Novo efeito Glow",
        }),
      },
    );
    expect(createRes.status).toBe(201);
    const draft = await createRes.json();
    expect(draft.status).toBe("draft");
    expect(draft.is_tested_for_current_content).toBe(false);

    // 3. Tentar enviar para todos antes do teste -> 400
    const blockedSendRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${draft.id}/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ batch_size: 2 }),
      },
    );
    expect(blockedSendRes.status).toBe(400);

    // 4. Enviar teste para o próprio admin -> desbloqueia
    const testRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${draft.id}/test`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ simulate_supporter: true }),
      },
    );
    expect(testRes.status).toBe(200);
    const testBody = await testRes.json();
    expect(testBody.sent_to).toBe(sender.email);
    expect(testBody.announcement.is_tested_for_current_content).toBe(true);

    const emailsAfterTest = await getAllEmails();
    expect(emailsAfterTest).toHaveLength(1);
    expect(emailsAfterTest[0].recipients).toEqual([`<${sender.email}>`]);
    expect(emailsAfterTest[0].subject).toBe("[TESTE] Pindorama v0.6.2 chegou!");
    expect(emailsAfterTest[0].html).toContain("Apoiador do Pindorama");

    // 5. Editar rascunho -> fecha a trava de novo
    const editRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${draft.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          tag: "v0.6.2",
          subject: "Pindorama {{tag}} disponível agora!",
          body: "Olá **{{username}}**!\n\n- Importação de SVG completa\n- Novo efeito Glow",
        }),
      },
    );
    expect(editRes.status).toBe(200);
    const edited = await editRes.json();
    expect(edited.is_tested_for_current_content).toBe(false);
    expect(edited.tested_at).toBeNull();

    const blockedAfterEditRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${draft.id}/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ batch_size: 2 }),
      },
    );
    expect(blockedAfterEditRes.status).toBe(400);

    // 6. Novo teste com texto final -> desbloqueia de novo
    await orchestrator.deleteAllEmails();
    const retestRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${draft.id}/test`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
      },
    );
    expect(retestRes.status).toBe(200);
    await orchestrator.deleteAllEmails();

    // 7. Disparo em lotes de 2 (3 elegíveis -> 2 lotes)
    const batch1Res = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${draft.id}/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ batch_size: 2 }),
      },
    );
    expect(batch1Res.status).toBe(200);
    const batch1 = await batch1Res.json();
    expect(batch1.batch.sent).toBe(2);
    expect(batch1.remaining).toBe(1);
    expect(batch1.announcement.status).toBe("sending");

    const batch2Res = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${draft.id}/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ batch_size: 2 }),
      },
    );
    expect(batch2Res.status).toBe(200);
    const batch2 = await batch2Res.json();
    expect(batch2.batch.sent).toBe(1);
    expect(batch2.remaining).toBe(0);
    expect(batch2.announcement.status).toBe("sent");
    expect(batch2.announcement.counts.sent).toBe(3);

    // Chamada extra após concluído não reenvia nada
    const batch3Res = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${draft.id}/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({ batch_size: 2 }),
      },
    );
    expect(batch3Res.status).toBe(200);
    const batch3 = await batch3Res.json();
    expect(batch3.batch.processed).toBe(0);

    // Conferir os 3 e-mails enviados no MailCatcher
    const sentEmails = await getAllEmails();
    expect(sentEmails).toHaveLength(3);

    const recipients = sentEmails.map((m) => m.recipients[0]).sort();
    expect(recipients).toEqual([
      "<carlos@judhagsan.com>",
      "<marina@judhagsan.com>",
      `<${sender.email}>`,
    ]);

    const carlosMail = sentEmails.find(
      (m) => m.recipients[0] === "<carlos@judhagsan.com>",
    );
    expect(carlosMail.html).toContain("Olá, carlos!");
    expect(carlosMail.html).toContain("/api/v1/download/windows");
    expect(carlosMail.html).not.toContain("Apoiador do Pindorama");

    const marinaMail = sentEmails.find(
      (m) => m.recipients[0] === "<marina@judhagsan.com>",
    );
    expect(marinaMail.html).toContain("Olá, marina!");
    expect(marinaMail.html).toContain("/api/v1/download/macos");
    expect(marinaMail.html).toContain("Apoiador do Pindorama");

    // Campanha enviada não pode ser editada nem excluída
    const editSentRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${draft.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          tag: "v0.6.2",
          subject: "Outro",
          body: "Outro corpo",
        }),
      },
    );
    expect(editSentRes.status).toBe(400);

    const deleteSentRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${draft.id}`,
      {
        method: "DELETE",
        headers: { Cookie: `session_id=${session.token}` },
      },
    );
    expect(deleteSentRes.status).toBe(400);
  });

  test("deletes unsent drafts", async () => {
    const { session } = await createSenderSession();

    const createRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          tag: "v0.6.3",
          subject: "Rascunho temporário",
          body: "Conteúdo para descartar.",
        }),
      },
    );
    const created = await createRes.json();

    const deleteRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${created.id}`,
      {
        method: "DELETE",
        headers: { Cookie: `session_id=${session.token}` },
      },
    );
    expect(deleteRes.status).toBe(204);

    const getRes = await fetch(
      `${webserver.origin}/api/v1/releases/announcements/${created.id}`,
      {
        headers: { Cookie: `session_id=${session.token}` },
      },
    );
    expect(getRes.status).toBe(404);
  });
});
