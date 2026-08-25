import {
  reasonToSkipSeeding,
  ACCOUNTS,
  ADMIN_FEATURES,
  USER_FEATURES,
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
  test("Seeds admin@teste.com and user@teste.com", () => {
    expect(ACCOUNTS.map((account) => account.email)).toEqual([
      "admin@teste.com",
      "user@teste.com",
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

  test("No account is seeded as a supporter", () => {
    for (const account of ACCOUNTS) {
      expect(account.features).not.toContain("apoiador");
    }
  });
});
