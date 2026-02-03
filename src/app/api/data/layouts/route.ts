import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET() {
  try {
    const layoutsPath = path.join(process.cwd(), "data", "enclosure_layouts.json");
    const layoutsData = await fs.readFile(layoutsPath, "utf-8");
    const layouts = JSON.parse(layoutsData);
    
    return NextResponse.json(layouts);
  } catch (error) {
    console.error("Error loading enclosure layouts:", error);
    return NextResponse.json({ error: "Failed to load layouts" }, { status: 500 });
  }
}
