# Admin Mode - Image Management

## Overview
Admin mode allows you to manage product images via drag & drop directly in the UI.

## How to Use

### 1. Enable Admin Mode
- Click the **🔒 Admin** button in the top right of the tabs
- Button turns green (🔓) when active

### 2. Add Images to Products

#### Single Image
1. Select an image file from `Enclosures/images/` in your file explorer
2. Drag it onto any product card
3. Drop - the image will be associated with that product

#### Multiple Images (Gallery)
1. Select multiple image files from `Enclosures/images/`
2. Drag them onto a product card
3. Drop - all images will be added to that product's gallery
4. Users can navigate through images using ◀ / ▶ buttons

### 3. Visual Feedback
- **Green border + overlay**: Appears when dragging over a product card
- **Image counter**: Shows "1 / 3" for products with multiple images
- **Navigation buttons**: Appear automatically when product has multiple images

### 4. Image Requirements
- Images must already exist in `Enclosures/images/` folder
- Supported formats: jpg, jpeg, png, gif, webp
- No file size limits (though large files may slow loading)

## Technical Details

### API Endpoints
- `POST /api/admin/update-product-images` - Associates images with products
- `GET /api/admin/list-images` - Lists available images

### Data Structure
Products in `enclosures_data.json` now support:
```json
{
  "sku": "A-5168",
  "image_url": "A-5168 White.jpg",
  "image_urls": [
    "A-5168 White.jpg",
    "A-5168 White Side.jpg",
    "A-5168 White Top.jpg"
  ]
}
```

### Workflow
1. Add new images to `Enclosures/images/`
2. Enable admin mode in UI
3. Drag images from file explorer to product cards
4. Page reloads to show updated images
5. Changes are saved to `enclosures_data.json`

## Notes
- The first image in `image_urls` is used as the primary image
- If `image_urls` exists, `image_url` is kept for backwards compatibility
- Page reloads after updating to ensure fresh data
- No need to rename files - use existing filenames
