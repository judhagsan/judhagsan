import database from "infra/database.js";
import supporter from "models/supporter.js";
import contribution from "models/contribution.js";

jest.mock("infra/database.js", () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock("models/supporter.js", () => ({
  __esModule: true,
  default: { grant: jest.fn(), revoke: jest.fn() },
}));
jest.mock("models/discord.js", () => ({
  __esModule: true,
  default: { removeSupporterRole: jest.fn() },
}));

// Silencia os logs de diagnóstico do webhook durante os testes.
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
});

// Resolve o evento para um usuário (por email) e trata as consultas internas
// (idempotência, discord id) com respostas neutras.
function mockDbResolvingTo(userId) {
  database.query.mockImplementation(async (queryObject) => {
    const text = queryObject?.text || "";
    if (text.includes("abacatepay_webhook_events") && text.includes("SELECT")) {
      return { rowCount: 0, rows: [] }; // isEventProcessed -> não processado
    }
    if (text.includes("LOWER(email)")) {
      return userId
        ? { rows: [{ id: userId }], rowCount: 1 }
        : { rows: [], rowCount: 0 };
    }
    if (text.includes("discord_user_id")) {
      return { rows: [{ discord_user_id: null }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  });
}

function eventFor(eventName) {
  return {
    id: `evt_${eventName}`,
    event: eventName,
    data: { customer: { email: "apoiador@teste.com" } },
  };
}

describe("contribution.handleWebhookEvent — concessão", () => {
  test.each(["subscription.completed", "subscription.renewed", "charge.paid"])(
    "concede o apoiador em %s",
    async (eventName) => {
      mockDbResolvingTo("u1");

      const outcome = await contribution.handleWebhookEvent(
        eventFor(eventName),
      );

      expect(supporter.grant).toHaveBeenCalledWith("u1");
      expect(supporter.revoke).not.toHaveBeenCalled();
      expect(outcome).toEqual({ paid: true, granted: true });
    },
  );
});

describe("contribution.handleWebhookEvent — revogação", () => {
  test.each([
    "subscription.cancelled",
    "subscription.canceled",
    "subscription.expired",
    "subscription.suspended",
  ])("revoga o apoiador em %s", async (eventName) => {
    mockDbResolvingTo("u1");

    const outcome = await contribution.handleWebhookEvent(eventFor(eventName));

    expect(supporter.revoke).toHaveBeenCalledWith("u1");
    expect(supporter.grant).not.toHaveBeenCalled();
    expect(outcome).toEqual({ revoked: true });
  });

  test("NÃO revoga numa falha pontual de cobrança (deixa o retry agir)", async () => {
    mockDbResolvingTo("u1");

    const outcome = await contribution.handleWebhookEvent(
      eventFor("charge.failed"),
    );

    expect(supporter.revoke).not.toHaveBeenCalled();
    expect(supporter.grant).not.toHaveBeenCalled();
    expect(outcome).toEqual({ ignored: "charge.failed" });
  });
});

describe("contribution.handleWebhookEvent — casos de borda", () => {
  test("evento sem usuário correspondente não concede nem revoga", async () => {
    mockDbResolvingTo(null);

    const outcome = await contribution.handleWebhookEvent(
      eventFor("subscription.completed"),
    );

    expect(supporter.grant).not.toHaveBeenCalled();
    expect(supporter.revoke).not.toHaveBeenCalled();
    expect(outcome).toEqual({ unmatched: true });
  });

  test("evento já processado é ignorado como duplicado (idempotência)", async () => {
    database.query.mockResolvedValue({
      rowCount: 1,
      rows: [{ "?column?": 1 }],
    });

    const outcome = await contribution.handleWebhookEvent(
      eventFor("subscription.completed"),
    );

    expect(supporter.grant).not.toHaveBeenCalled();
    expect(outcome).toEqual({ duplicate: true });
  });
});
