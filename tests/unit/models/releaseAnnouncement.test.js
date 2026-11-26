import releaseAnnouncement from "models/releaseAnnouncement.js";

const content = {
  subject: "Uma novidade",
  body: "Conheça nosso novo projeto.",
};

describe("announcement kinds", () => {
  test("keeps legacy API payloads as Pindorama announcements", () => {
    expect(releaseAnnouncement.validateInput(content)).toEqual({
      ...content,
      kind: "pindorama",
      tag: null,
    });
  });

  test("general news ignores a leftover version and rejects unknown kinds", () => {
    expect(
      releaseAnnouncement.validateInput({
        ...content,
        kind: "general",
        tag: "v0.6.2",
      }),
    ).toEqual({
      ...content,
      kind: "general",
      tag: null,
    });
    expect(() =>
      releaseAnnouncement.validateInput({ ...content, kind: "unknown" }),
    ).toThrow("tipo de novidade");
  });

  test("changing only the announcement kind requires a new test email", () => {
    const tested = {
      ...content,
      kind: "general",
      tag: null,
      tested_at: "2026-11-25T12:00:00Z",
      tested_content_hash: releaseAnnouncement.computeContentHash({
        ...content,
        kind: "general",
      }),
    };
    expect(releaseAnnouncement.isTestedForCurrentContent(tested)).toBe(true);
    expect(
      releaseAnnouncement.isTestedForCurrentContent({
        ...tested,
        kind: "pindorama",
      }),
    ).toBe(false);
  });
});
