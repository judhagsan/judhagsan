import dns from "node:dns";

import emailValidation from "infra/emailValidation.js";
import { ValidationError } from "infra/errors.js";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("emailValidation.validateFormat", () => {
  test("accepts well-formed addresses and returns them trimmed", () => {
    expect(emailValidation.validateFormat("user@example.com")).toBe(
      "user@example.com",
    );
    expect(emailValidation.validateFormat("  user@example.com  ")).toBe(
      "user@example.com",
    );
    expect(
      emailValidation.validateFormat("first.last+tag@sub.example.co"),
    ).toBe("first.last+tag@sub.example.co");
  });

  test.each([
    ["empty string", ""],
    ["missing @", "notanemail"],
    ["domain without dot", "user@nodot"],
    ["double @", "user@@example.com"],
    ["whitespace inside", "a b@example.com"],
    ["not a string", 12345],
    ["null", null],
    ["too long (> 254 chars)", `${"a".repeat(250)}@example.com`],
  ])("rejects %s", (_label, input) => {
    expect(() => emailValidation.validateFormat(input)).toThrow(
      ValidationError,
    );
  });
});

describe("emailValidation.validateDomainIsDeliverable", () => {
  test("passes when the domain has MX records", async () => {
    jest
      .spyOn(dns.promises, "resolveMx")
      .mockResolvedValue([{ exchange: "mx.example.com", priority: 10 }]);
    const resolveSpy = jest.spyOn(dns.promises, "resolve");

    await expect(
      emailValidation.validateDomainIsDeliverable("user@example.com"),
    ).resolves.toBeUndefined();
    // Com MX presente, nem chega a consultar registros A.
    expect(resolveSpy).not.toHaveBeenCalled();
  });

  test("falls back to A/AAAA records when there is no MX (ENODATA)", async () => {
    jest
      .spyOn(dns.promises, "resolveMx")
      .mockRejectedValue(
        Object.assign(new Error("no mx"), { code: "ENODATA" }),
      );
    jest.spyOn(dns.promises, "resolve").mockResolvedValue(["203.0.113.10"]);

    await expect(
      emailValidation.validateDomainIsDeliverable("user@example.com"),
    ).resolves.toBeUndefined();
  });

  test("rejects when the domain does not exist and has no A record", async () => {
    jest
      .spyOn(dns.promises, "resolveMx")
      .mockRejectedValue(
        Object.assign(new Error("not found"), { code: "ENOTFOUND" }),
      );
    jest
      .spyOn(dns.promises, "resolve")
      .mockRejectedValue(
        Object.assign(new Error("not found"), { code: "ENOTFOUND" }),
      );

    await expect(
      emailValidation.validateDomainIsDeliverable(
        "user@dominioinexistente.com",
      ),
    ).rejects.toThrow(ValidationError);
  });

  test("rejects when MX resolves to an empty set and there is no A record", async () => {
    jest.spyOn(dns.promises, "resolveMx").mockResolvedValue([]);
    jest
      .spyOn(dns.promises, "resolve")
      .mockRejectedValue(
        Object.assign(new Error("no data"), { code: "ENODATA" }),
      );

    await expect(
      emailValidation.validateDomainIsDeliverable("user@example.com"),
    ).rejects.toThrow(ValidationError);
  });

  test("fails open on a transient DNS error (does not block signup)", async () => {
    jest
      .spyOn(dns.promises, "resolveMx")
      .mockRejectedValue(
        Object.assign(new Error("temporary"), { code: "ESERVFAIL" }),
      );
    const resolveSpy = jest.spyOn(dns.promises, "resolve");

    await expect(
      emailValidation.validateDomainIsDeliverable("user@example.com"),
    ).resolves.toBeUndefined();
    // Fail-open: não tenta sequer o fallback de A.
    expect(resolveSpy).not.toHaveBeenCalled();
  });
});

describe("emailValidation.assertValidEmail", () => {
  test("returns the normalized email when format and domain are valid", async () => {
    jest
      .spyOn(dns.promises, "resolveMx")
      .mockResolvedValue([{ exchange: "mx.example.com", priority: 10 }]);

    await expect(
      emailValidation.assertValidEmail("  User@example.com  "),
    ).resolves.toBe("User@example.com");
  });

  test("throws on bad format without touching DNS", async () => {
    const resolveMxSpy = jest.spyOn(dns.promises, "resolveMx");

    await expect(
      emailValidation.assertValidEmail("naoehemail"),
    ).rejects.toThrow(ValidationError);
    expect(resolveMxSpy).not.toHaveBeenCalled();
  });
});
