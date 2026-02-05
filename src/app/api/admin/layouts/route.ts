import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LAYOUTS_FILE = path.join(process.cwd(), "data", "enclosure_layouts.json");

// GET: Read all layouts
export async function GET() {
  try {
    const fileContents = fs.readFileSync(LAYOUTS_FILE, "utf8");
    const layouts = JSON.parse(fileContents);
    return NextResponse.json({ success: true, layouts });
  } catch (error) {
    console.error("Error reading layouts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read layouts" },
      { status: 500 }
    );
  }
}

// POST: Update a specific layout
export async function POST(request: NextRequest) {
  try {
    const { layoutId, updatedLayout } = await request.json();
    
    // Read current layouts
    const fileContents = fs.readFileSync(LAYOUTS_FILE, "utf8");
    const layouts = JSON.parse(fileContents);
    
    // Find and update the layout (or add if new)
    const index = layouts.findIndex((l: any) => l.id === layoutId);
    if (index === -1) {
      // Add new layout
      layouts.push(updatedLayout);
    } else {
      // Update existing layout
      layouts[index] = updatedLayout;
    }
    
    // Write back to file with pretty formatting
    fs.writeFileSync(LAYOUTS_FILE, JSON.stringify(layouts, null, 2), "utf8");
    
    return NextResponse.json({ success: true, layout: updatedLayout });
  } catch (error) {
    console.error("Error updating layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update layout" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a layout
export async function DELETE(request: NextRequest) {
  try {
    const { layoutId } = await request.json();
    
    // Read current layouts
    const fileContents = fs.readFileSync(LAYOUTS_FILE, "utf8");
    const layouts = JSON.parse(fileContents);
    
    // Filter out the layout to delete
    const filteredLayouts = layouts.filter((l: any) => l.id !== layoutId);
    
    if (filteredLayouts.length === layouts.length) {
      return NextResponse.json(
        { success: false, error: "Layout not found" },
        { status: 404 }
      );
    }
    
    // Write back to file with pretty formatting
    fs.writeFileSync(LAYOUTS_FILE, JSON.stringify(filteredLayouts, null, 2), "utf8");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete layout" },
      { status: 500 }
    );
  }
}
