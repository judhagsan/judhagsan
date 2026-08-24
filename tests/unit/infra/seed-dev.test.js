import {
  motivoParaNaoSemear,
  CONTAS,
  FEATURES_ADMIN,
  FEATURES_USUARIO,
} from "infra/scripts/seed-dev.js";

// A guarda é o que separa "duas contas de conveniência" de "conta de admin com
// senha publicada em repositório aberto". Cada caminho dela tem teste.
describe("seed-dev: motivoParaNaoSemear()", () => {
  const envOriginal = process.env;

  beforeEach(() => {
    process.env = { ...envOriginal };
    delete process.env.VERCEL;
    delete process.env.CI;
    process.env.NODE_ENV = "development";
    process.env.POSTGRES_HOST = "localhost";
  });

  afterAll(() => {
    process.env = envOriginal;
  });

  test("Libera com banco local e ambiente de desenvolvimento", () => {
    expect(motivoParaNaoSemear()).toBeNull();
  });

  test.each(["localhost", "127.0.0.1", "::1", "host.docker.internal"])(
    "Libera com POSTGRES_HOST=%s",
    (host) => {
      process.env.POSTGRES_HOST = host;
      expect(motivoParaNaoSemear()).toBeNull();
    },
  );

  test("Bloqueia banco remoto", () => {
    process.env.POSTGRES_HOST = "db.aws.exemplo.com";
    expect(motivoParaNaoSemear()).toBe(
      "POSTGRES_HOST=db.aws.exemplo.com não é um banco local",
    );
  });

  test("Bloqueia sem POSTGRES_HOST", () => {
    delete process.env.POSTGRES_HOST;
    expect(motivoParaNaoSemear()).toBe("POSTGRES_HOST não definido");
  });

  test("Bloqueia em produção", () => {
    process.env.NODE_ENV = "production";
    expect(motivoParaNaoSemear()).toBe("NODE_ENV=production");
  });

  test("Bloqueia na Vercel", () => {
    process.env.VERCEL = "1";
    expect(motivoParaNaoSemear()).toBe("rodando na Vercel");
  });

  test("Bloqueia em CI", () => {
    process.env.CI = "true";
    expect(motivoParaNaoSemear()).toBe("rodando em CI");
  });

  test("A plataforma vence o host local", () => {
    process.env.VERCEL = "1";
    process.env.POSTGRES_HOST = "localhost";
    expect(motivoParaNaoSemear()).toBe("rodando na Vercel");
  });
});

describe("seed-dev: contas", () => {
  test("Semeia admin@teste.com e user@teste.com", () => {
    expect(CONTAS.map((conta) => conta.email)).toEqual([
      "admin@teste.com",
      "user@teste.com",
    ]);
    expect(CONTAS.every((conta) => conta.password === "12345678")).toBe(true);
  });

  test("O admin tem as features do usuário comum e mais", () => {
    for (const feature of FEATURES_USUARIO) {
      expect(FEATURES_ADMIN).toContain(feature);
    }

    expect(FEATURES_ADMIN).toContain("update:user:others");
    expect(FEATURES_ADMIN).toContain("delete:user:others");
    expect(FEATURES_ADMIN.length).toBeGreaterThan(FEATURES_USUARIO.length);
  });

  test("Nenhuma conta nasce apoiadora", () => {
    for (const conta of CONTAS) {
      expect(conta.features).not.toContain("apoiador");
    }
  });
});
