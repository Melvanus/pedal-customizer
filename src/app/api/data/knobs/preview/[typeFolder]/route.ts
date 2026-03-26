import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function isImage(name: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase());
}

/** Recursively find the first image file in a directory */
async function findFirstImage(dir: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    // Check files in this directory first
    for (const entry of entries) {
      if (entry.isFile() && isImage(entry.name)) {
        return path.join(dir, entry.name);
      }
    }
    // Then recurse into subdirectories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const found = await findFirstImage(path.join(dir, entry.name));
        if (found) return found;
      }
    }
  } catch {
    // directory doesn't exist or can't be read
  }
  return null;
}

const getContentType = (fileName: string) => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { typeFolder: string } }
) {
  const knobsRoot = path.join(process.cwd(), "data", "knobs");
  const typeFolder = decodeURIComponent(params.typeFolder);
  const safePath = path.normalize(typeFolder).replace(/^([.][.][\/\\])+/g, "");
  const typePath = path.join(knobsRoot, "Types", safePath);

  if (!typePath.startsWith(knobsRoot)) {
    return new Response("Not found", { status: 404 });
  }

  const imagePath = await findFirstImage(typePath);
  if (!imagePath || !imagePath.startsWith(knobsRoot)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await fs.readFile(imagePath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": getContentType(imagePath),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
