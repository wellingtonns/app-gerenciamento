import { createClient } from "@libsql/client";

const STATE_KEY = process.env.APP_STATE_KEY || "global";

function getClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error("Missing Turso credentials. Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.");
  }
  return createClient({ url, authToken });
}

async function ensureSchema() {
  const client = getClient();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

async function readJsonBody(req: any): Promise<any> {
  if (req?.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req?.body === "string" && req.body.length) {
    return JSON.parse(req.body);
  }

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve());
    req.on("error", (error: Error) => reject(error));
  });

  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

export default async function handler(req: any, res: any) {
  try {
    await ensureSchema();
    const client = getClient();

    if (req.method === "GET") {
      const result = await client.execute({
        sql: "SELECT data FROM app_state WHERE key = ? LIMIT 1",
        args: [STATE_KEY]
      });
      const row = result.rows[0] as { data?: string } | undefined;
      const data = row?.data ? JSON.parse(String(row.data)) : null;
      return res.status(200).json({ data });
    }

    if (req.method === "PUT") {
      const payload = await readJsonBody(req);
      const data = payload?.data;
      if (!data) {
        return res.status(400).json({ error: "Missing 'data' payload." });
      }

      await client.execute({
        sql: `
          INSERT INTO app_state (key, data, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            data = excluded.data,
            updated_at = excluded.updated_at
        `,
        args: [STATE_KEY, JSON.stringify(data), new Date().toISOString()]
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return res.status(500).json({ error: message });
  }
}
