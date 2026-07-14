import database from "infra/database.js";
import user from "models/user.js";
import supporter from "models/supporter.js";
import { ValidationError } from "infra/errors.js";

jest.mock("infra/database.js", () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

jest.mock("models/user.js", () => ({
  __esModule: true,
  default: {
    findOneById: jest.fn(),
    addFeatures: jest.fn(),
    setFeatures: jest.fn(),
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe("supporter.grant", () => {
  test("adds the apoiador feature and opts into the wall on first grant", async () => {
    user.findOneById.mockResolvedValue({
      id: "u1",
      features: ["read:session"],
    });
    user.addFeatures.mockResolvedValue({});
    database.query.mockResolvedValue({
      rows: [
        {
          id: "u1",
          features: ["read:session", "apoiador"],
          supporter_wall_opt_in: true,
        },
      ],
    });

    const result = await supporter.grant("u1");

    expect(user.addFeatures).toHaveBeenCalledWith("u1", ["apoiador"]);
    // setWallOptIn(userId, true): entra no mural por padrão.
    expect(database.query).toHaveBeenCalledTimes(1);
    expect(database.query.mock.calls[0][0].values).toEqual(["u1", true]);
    expect(result.supporter_wall_opt_in).toBe(true);
  });

  test("is a no-op when the user is already a supporter", async () => {
    user.findOneById.mockResolvedValue({
      id: "u1",
      features: ["read:session", "apoiador"],
    });

    const result = await supporter.grant("u1");

    expect(user.addFeatures).not.toHaveBeenCalled();
    // Não mexe no opt-in: preserva uma escolha anterior de sair do mural.
    expect(database.query).not.toHaveBeenCalled();
    expect(result.features).toContain("apoiador");
  });
});

describe("supporter.revoke", () => {
  test("removes only the apoiador feature, keeping the others", async () => {
    user.findOneById.mockResolvedValue({
      id: "u1",
      features: ["read:session", "apoiador", "update:user"],
    });
    user.setFeatures.mockResolvedValue({});

    await supporter.revoke("u1");

    expect(user.setFeatures).toHaveBeenCalledWith("u1", [
      "read:session",
      "update:user",
    ]);
  });

  test("is safe when the user does not have the feature", async () => {
    user.findOneById.mockResolvedValue({
      id: "u1",
      features: ["read:session"],
    });
    user.setFeatures.mockResolvedValue({});

    await supporter.revoke("u1");

    expect(user.setFeatures).toHaveBeenCalledWith("u1", ["read:session"]);
  });
});

describe("supporter.listPublic", () => {
  test("returns only opted-in supporters (query filters by feature + opt-in)", async () => {
    database.query.mockResolvedValue({
      rows: [{ username: "ana" }, { username: "bruno" }],
    });

    const rows = await supporter.listPublic();

    const queried = database.query.mock.calls[0][0];
    expect(queried.text).toContain("supporter_wall_opt_in = true");
    expect(queried.text).toContain("$1 = ANY(features)");
    expect(queried.values).toEqual(["apoiador"]);
    expect(rows).toEqual([{ username: "ana" }, { username: "bruno" }]);
  });
});

describe("supporter.setDiscordId", () => {
  test("maps a unique-violation (23505) to a friendly ValidationError", async () => {
    database.query.mockRejectedValue(
      Object.assign(new Error("dup"), { cause: { code: "23505" } }),
    );

    await expect(supporter.setDiscordId("u1", "discord-123")).rejects.toThrow(
      ValidationError,
    );
  });

  test("rethrows unexpected database errors as-is", async () => {
    const dbError = Object.assign(new Error("connection lost"), {
      cause: { code: "08006" },
    });
    database.query.mockRejectedValue(dbError);

    await expect(supporter.setDiscordId("u1", "discord-123")).rejects.toBe(
      dbError,
    );
  });
});
