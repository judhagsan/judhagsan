import {
  reasonToSkipSeeding,
  ACCOUNTS,
  DEVICES,
  ADMIN_FEATURES,
  USER_FEATURES,
  SUPPORTER_FEATURES,
  PENDING_FEATURES,
} from "infra/scripts/seed-dev.js";

// A guarda é o que separa "duas contas de conveniência" de "conta de admin com
// senha publicada em repositório aberto". Cada caminho dela tem teste.
describe("seed-dev: reasonToSkipSeeding()", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.VERCEL;
    delete process.env.CI;
    process.env.NODE_ENV = "development";
    process.env.POSTGRES_HOST = "localhost";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("With local database and development environment", () => {
    expect(reasonToSkipSeeding()).toBeNull();
  });

  test.each(["localhost", "127.0.0.1", "::1", "host.docker.internal"])(
    "With POSTGRES_HOST=%s",
    (host) => {
      process.env.POSTGRES_HOST = host;
      expect(reasonToSkipSeeding()).toBeNull();
    },
  );

  test("With remote database", () => {
    process.env.POSTGRES_HOST = "db.aws.exemplo.com";
    expect(reasonToSkipSeeding()).toBe(
      "POSTGRES_HOST=db.aws.exemplo.com não é um banco local",
    );
  });

  test("Without POSTGRES_HOST", () => {
    delete process.env.POSTGRES_HOST;
    expect(reasonToSkipSeeding()).toBe("POSTGRES_HOST não definido");
  });

  test("In production", () => {
    process.env.NODE_ENV = "production";
    expect(reasonToSkipSeeding()).toBe("NODE_ENV=production");
  });

  test("On Vercel", () => {
    process.env.VERCEL = "1";
    expect(reasonToSkipSeeding()).toBe("rodando na Vercel");
  });

  test("On CI", () => {
    process.env.CI = "true";
    expect(reasonToSkipSeeding()).toBe("rodando em CI");
  });

  test("Platform wins over local host", () => {
    process.env.VERCEL = "1";
    process.env.POSTGRES_HOST = "localhost";
    expect(reasonToSkipSeeding()).toBe("rodando na Vercel");
  });
});

describe("seed-dev: accounts", () => {
  test("Seeds one account per state the panel can show", () => {
    expect(ACCOUNTS.map((account) => account.email)).toEqual([
      "admin@teste.com",
      "user@teste.com",
      "apoiador@teste.com",
      "pendente@teste.com",
    ]);
    expect(ACCOUNTS.every((account) => account.password === "12345678")).toBe(
      true,
    );
  });

  test("Only the admin receives the `admin` feature", () => {
    expect(ADMIN_FEATURES).toContain("admin");
    expect(USER_FEATURES).not.toContain("admin");
  });

  test("The admin has every feature of a regular user, plus more", () => {
    for (const feature of USER_FEATURES) {
      expect(ADMIN_FEATURES).toContain(feature);
    }

    expect(ADMIN_FEATURES).toContain("update:user:others");
    expect(ADMIN_FEATURES).toContain("delete:user:others");
    expect(ADMIN_FEATURES.length).toBeGreaterThan(USER_FEATURES.length);
  });

  // O card de hardware precisa de distribuição para mostrar alguma coisa: com
  // a base vazia não há como ver se as barras, a moda e o seletor funcionam.
  test("Seeds devices for every account that can log in", () => {
    const loggable = ACCOUNTS.filter(
      (account) => account.email !== "pendente@teste.com",
    );

    for (const account of loggable) {
      expect(DEVICES[account.email]?.length).toBeGreaterThan(0);
    }

    // Quem nunca ativou o cadastro nunca entrou no app para mandar telemetria.
    expect(DEVICES["pendente@teste.com"]).toBeUndefined();
  });

  // O índice único é (user_id, hardware_uuid): com uuid fixo o seed atualiza a
  // mesma máquina, em vez de inventar uma nova a cada `npm run dev`.
  test("Every seeded device has a stable hardware_uuid", () => {
    const uuids = Object.values(DEVICES)
      .flat()
      .map((device) => device.hardware_uuid);

    expect(uuids.every(Boolean)).toBe(true);
    expect(new Set(uuids).size).toBe(uuids.length);
  });

  test("Only the supporter account carries `apoiador`", () => {
    const withSupporterFeature = ACCOUNTS.filter((account) =>
      account.features.includes("apoiador"),
    );

    expect(withSupporterFeature.map((account) => account.email)).toEqual([
      "apoiador@teste.com",
    ]);
    // O admin fora da lista é de propósito: apoio é estado de pagamento, e
    // concedê-lo ao admin o jogaria na UI de apoiador sem nunca ter assinado.
    expect(ADMIN_FEATURES).not.toContain("apoiador");
  });

  // O painel decide "pendente" pela presença de `read:activation_token`, que é
  // o que uma conta carrega antes de clicar no email. Uma conta semeada com
  // qualquer outra feature junto não representaria esse estado.
  test("The pending account has only the activation feature", () => {
    expect(PENDING_FEATURES).toEqual(["read:activation_token"]);

    const pendingAccount = ACCOUNTS.find(
      (account) => account.email === "pendente@teste.com",
    );
    expect(pendingAccount.features).toEqual(["read:activation_token"]);
  });

  test("The supporter is a regular user plus `apoiador`", () => {
    for (const feature of USER_FEATURES) {
      expect(SUPPORTER_FEATURES).toContain(feature);
    }
    expect(SUPPORTER_FEATURES).toContain("apoiador");
    expect(SUPPORTER_FEATURES).toHaveLength(USER_FEATURES.length + 1);
  });
});
