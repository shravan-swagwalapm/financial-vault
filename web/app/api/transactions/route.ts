import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "..", "data", "transactions.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load transactions";
    return Response.json({ error: message }, { status: 500 });
  }
}
