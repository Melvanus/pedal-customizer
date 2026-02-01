import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const categoryFileMap: Record<string, string> = {
  paint: "enclosures_data.json",
  design: "design_labeling.json",
  led: "led.json",
  other: "other.json",
};

export async function POST(request: NextRequest) {
  try {
    const { identifier, category, imageFilenames } = await request.json();

    if (!identifier || !category || !Array.isArray(imageFilenames)) {
      return NextResponse.json(
        { error: "Invalid request. Provide identifier, category, and imageFilenames array." },
        { status: 400 }
      );
    }

    const fileName = categoryFileMap[category];
    if (!fileName) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Read the current data
    const dataPath = path.join(process.cwd(), "data", fileName);
    const rawData = await fs.readFile(dataPath, "utf-8");
    const data = JSON.parse(rawData);

    // Find the option (handle both flat array and products wrapper)
    const options = Array.isArray(data) ? data : data.products || [];
    let option;

    if (category === "paint") {
      option = options.find((p: any) => p.sku === identifier);
    } else {
      // For design/led/other, match by name
      option = options.find((p: any) => 
        p.name.toLowerCase().replace(/\s+/g, "-") === identifier ||
        p.name === identifier ||
        p.id === identifier
      );
    }

    if (!option) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    // Verify all image files exist
    const imageDir = path.join(process.cwd(), "data", "images");
    const existingFiles = await fs.readdir(imageDir);
    
    const validFilenames = imageFilenames.filter((filename) =>
      existingFiles.includes(filename)
    );

    // Update the option (allow empty array to delete all images)
    if (validFilenames.length > 0) {
      // For paint products, use image_url and image_urls
      if (category === "paint") {
        option.image_url = validFilenames[0];
        option.image_urls = validFilenames;
        // Clean up old fields if they exist
        delete option.image;
        delete option.images;
      } else {
        // For other categories, use image and images
        option.image = validFilenames[0];
        option.images = validFilenames;
      }
    } else {
      // No images provided - use default Logo.png
      if (category === "paint") {
        option.image_url = "Logo.png";
        option.image_urls = ["Logo.png"];
        delete option.image;
        delete option.images;
      } else {
        option.image = "Logo.png";
        option.images = ["Logo.png"];
      }
    }

    // Write back to file
    await fs.writeFile(dataPath, JSON.stringify(data, null, 4), "utf-8");

    return NextResponse.json({
      success: true,
      identifier,
      category,
      imageCount: validFilenames.length > 0 ? validFilenames.length : 1,
      images: validFilenames.length > 0 ? validFilenames : ["Logo.png"],
    });
  } catch (error: any) {
    console.error("Error updating option images:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
