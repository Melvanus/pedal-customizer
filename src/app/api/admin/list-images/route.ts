import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const imageDir = path.join(process.cwd(), "data", "images");
    const files = await fs.readdir(imageDir);
    
    // Filter only image files
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    return NextResponse.json({ images: imageFiles });
  } catch (error: any) {
    console.error("Error listing images:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
