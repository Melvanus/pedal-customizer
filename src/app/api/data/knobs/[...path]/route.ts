import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";

const getContentType = (fileName: string) => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".json")) return "application/json";
  return "image/jpeg";
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const knobsRoot = path.join(process.cwd(), "data", "knobs");
  const rawPath = params.path.map(decodeURIComponent).join("/");
  const safePath = path.normalize(rawPath).replace(/^([.][.][\/\\])+/g, "");
  const filePath = path.join(knobsRoot, safePath);

  if (!filePath.startsWith(knobsRoot)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await fs.readFile(filePath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
