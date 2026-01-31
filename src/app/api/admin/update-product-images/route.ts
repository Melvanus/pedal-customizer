import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { sku, imageFilenames } = await request.json();

    if (!sku || !Array.isArray(imageFilenames)) {
      return NextResponse.json(
        { error: "Invalid request. Provide sku and imageFilenames array." },
        { status: 400 }
      );
    }

    // Read the current data
    const dataPath = path.join(process.cwd(), "Enclosures", "enclosures_data.json");
    const rawData = await fs.readFile(dataPath, "utf-8");
    const data = JSON.parse(rawData);

    // Find the product
    const product = data.products.find((p: any) => p.sku === sku);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify all image files exist
    const imageDir = path.join(process.cwd(), "Enclosures", "images");
    const existingFiles = await fs.readdir(imageDir);
    
    const validFilenames = imageFilenames.filter((filename) =>
      existingFiles.includes(filename)
    );

    if (validFilenames.length === 0) {
      return NextResponse.json({ error: "No valid image files found" }, { status: 400 });
    }

    // Update the product
    product.image_url = validFilenames[0]; // Primary image (backwards compatibility)
    product.image_urls = validFilenames; // All images

    // Write back to file
    await fs.writeFile(dataPath, JSON.stringify(data, null, 4), "utf-8");

    return NextResponse.json({
      success: true,
      sku,
      imageCount: validFilenames.length,
      images: validFilenames,
    });
  } catch (error: any) {
    console.error("Error updating product images:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
