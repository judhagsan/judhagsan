import authorization from "models/authorization.js";
import { InternalServerError } from "infra/errors.js";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };

      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("with unknown `feature`", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        authorization.can(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user` and known `feature`", () => {
      const createdUser = {
        features: ["create:user"],
      };

      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });

    test("with `admin` feature", () => {
      const adminUser = {
        features: ["admin"],
      };

      expect(authorization.can(adminUser, "admin")).toBe(true);
    });

    // `admin` marca quem enxerga o painel, e só. Se um dia ela passar a
    // conceder permissão por tabela, é aqui que quebra primeiro.
    test("`admin` does not grant privileged features by itself", () => {
      const adminUser = {
        features: ["admin"],
      };

      expect(authorization.can(adminUser, "update:user:others")).toBe(false);
      expect(authorization.can(adminUser, "delete:user:others")).toBe(false);
      expect(authorization.can(adminUser, "read:status:all")).toBe(false);
    });
  });

  describe(".filterOutput() with `read:user:all`", () => {
    const adminUser = { features: ["read:user:all"] };

    const storedUsers = [
      {
        id: "id-1",
        username: "alguem",
        email: "alguem@judhagsan.com",
        features: ["create:session"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        // Colunas que existem na tabela e não podem sair na listagem.
        password: "$2a$hash",
        mercadopago_preapproval_id: "preapproval-123",
      },
    ];

    test("maps the list to the public shape", () => {
      expect(
        authorization.filterOutput(adminUser, "read:user:all", storedUsers),
      ).toEqual([
        {
          id: "id-1",
          username: "alguem",
          email: "alguem@judhagsan.com",
          features: ["create:session"],
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-02T00:00:00.000Z",
        },
      ]);
    });

    // O filtro é a última barreira antes da resposta HTTP: se um dia alguém
    // trocar o SELECT por `SELECT *`, é este teste que segura o hash da senha.
    test("never leaks password or payment identifiers", () => {
      const [output] = authorization.filterOutput(
        adminUser,
        "read:user:all",
        storedUsers,
      );

      expect(output).not.toHaveProperty("password");
      expect(output).not.toHaveProperty("mercadopago_preapproval_id");
    });

    test("with an empty list", () => {
      expect(
        authorization.filterOutput(adminUser, "read:user:all", []),
      ).toEqual([]);
    });
  });

  describe(".filterOutput()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };

      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("with unknown `feature`", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        authorization.filterOutput(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` but no `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };

      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` and `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };

      const resource = {
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        email: "resource@resource.com",
        password: "resource",
      };

      const result = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );

      expect(result).toEqual({
        id: 1,
        username: "resource",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });

    // `features` é o mapa de privilégios da conta, e esta é a visão de um
    // usuário sobre outro. Exposta, dizia a qualquer um qual username tem
    // `admin` ou `manage:supporter`.
    test("`read:user` never exposes features, email or password", () => {
      const result = authorization.filterOutput(
        { features: ["read:user"] },
        "read:user",
        {
          id: 1,
          username: "resource",
          features: ["admin", "manage:supporter"],
          email: "resource@resource.com",
          password: "$2a$hash",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      );

      expect(result).not.toHaveProperty("features");
      expect(result).not.toHaveProperty("email");
      expect(result).not.toHaveProperty("password");
    });
  });
});
