import cleanup from "models/cleanup.js";

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return response
      .status(405)
      .json({ name: "MethodNotAllowedError", status_code: 405 });
  }

  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return response.status(500).json({
      name: "InternalServerError",
      message: "CRON_SECRET não configurado.",
      status_code: 500,
    });
  }

  // Vercel Cron envia: Authorization: Bearer <CRON_SECRET>
  const header = request.headers["authorization"] || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (provided !== expectedSecret) {
    return response.status(401).json({
      name: "UnauthorizedError",
      message: "Credencial inválida.",
      status_code: 401,
    });
  }

  const result = await cleanup.runCleanup();

  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json({
    ok: true,
    ran_at: new Date().toISOString(),
    ...result,
  });
}
