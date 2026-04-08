import { readFile } from "fs/promises";
import { join } from "path";

export async function POST() {
  try {
    const filePath = join(process.cwd(), "..", "data", "transactions.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return Response.json({ success: true, count: data.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
