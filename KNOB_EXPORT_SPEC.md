# Knob Scraper Export Specification for Pedal Customizer

## Context

The pedal customizer app renders knobs on an SVG enclosure visualizer using **template SVGs** (one per knob type) that get dynamically recolored via `primaryColor`, `secondaryColor`, `primaryDarkColor`, and `primaryLightColor`. Product photos (JPGs from Tayda) are shown in the selection grid and detail modal. The data is loaded from a single `data/knobs/knobs.json` file, and all images/SVGs are served through a local API route at `/api/data/knobs/[...path]` — **no external URLs are loaded at runtime**.

## Current Problems (Why We Need This Spec)

1. **Image path mismatch**: Variants have a `diameter_label` like `"12.5mm"` but the actual on-disk folder containing images might be `"12mm"` (because multiple similar sizes share one image set). There is no reliable field that maps a variant to its actual image directory.

2. **Empty size folders**: Some size directories exist but are empty (e.g., `Types/Aluminum Control Knurled/12.5mm/` is empty, images are in `12mm/`). This happens when multiple variants with different `diameter_mm` values share the same physical images.

3. **No per-variant image path**: The app has no way to go from a specific variant (type + size + color) to its local product photo. We had to build a fuzzy "find first image" fallback API which is fragile.

4. **Unused fields**: Several fields (`image_url`, `local_image_folder`, `svg_path`, `diameter_label`) are either external URLs we can't use, or point to paths that don't exist on disk.

---

## Requested JSON Structure

The scraper should output `knobs.json` with this structure:

```jsonc
{
  "generated_at": "2026-03-25T23:21:23.879767+00:00",  // ISO-8601 timestamp
  "type_count": 49,
  "knob_count": 304,

  "knob_types": [
    {
      // ══════════════════════════════════════════════════
      // TYPE-LEVEL (one entry per knob style/shape)
      // ══════════════════════════════════════════════════
      "knob_type": "Boss Style",
      "canonical_type": "Skirted",
      "template_svg_path": "Types/Boss Style/Boss_Style_template.svg",

      "available_sizes_mm": [20, 23, 27, 33, 44],

      "available_colors": [
        { "black": "#1a1a1a" },
        { "white": "#f5f5f0" },
        { "blue": "#2255aa" },
        { "cream": "#f5e6c8" }
      ],

      // Type-level preview image (first available product photo for the selector grid)
      // Path relative to data/knobs/
      "preview_image": "Types/Boss Style/20mm/images/Boss_Style_Black_Knob_20x12mm_1.jpg",

      "variants": [
        {
          // ══════════════════════════════════════════════════
          // VARIANT-LEVEL (one entry per SKU / buyable product)
          // ══════════════════════════════════════════════════
          "name": "Boss Style Black Knob 20x12mm Shaft 6mm",
          "sku": "A-1234",
          "price_usd": 0.85,
          "price_eur": 0.78,
          "product_url": "https://www.taydaelectronics.com/...",
          "supplier": "Tayda Electronics",

          // Physical specs
          "diameter_mm": 20,
          "height_mm": 12,
          "shaft_diameter_mm": 6.0,
          "shaft_type": "Set Screw",
          "color": "Black",

          // Categorization
          "knob_type": "Boss Style",
          "knob_categories": ["skirted", "medium", "plastic"],

          // SVG rendering colors (used to dynamically recolor the template SVG)
          "primaryColor": "#1a1a1a",
          "secondaryColor": "#888888",
          "primaryDarkColor": "#0a0a0a",
          "primaryLightColor": "#3a3a3a",

          // Image paths (all relative to data/knobs/)
          "image_path": "Types/Boss Style/20mm/images/Boss_Style_Black_Knob_20x12mm_1.jpg",
          "image_paths": [
            "Types/Boss Style/20mm/images/Boss_Style_Black_Knob_20x12mm_1.jpg",
            "Types/Boss Style/20mm/images/Boss_Style_Black_Knob_20x12mm_2.jpg"
          ],
          "image_is_exact": true,

          // Size folder — MUST match actual directory name under Types/{knob_type}/
          "size_folder": "20mm"
        }
      ]
    }
  ]
}
```

---

## Directory Layout on Disk

The scraper creates this structure. The JSON references paths within it.

```
data/knobs/
├── knobs.json
└── Types/
    └── {knob_type}/                          # e.g. "Boss Style" — matches knob_type field
        ├── {Knob_Type}_template.svg          # One template SVG per type
        └── {size_folder}/                    # e.g. "20mm" — matches size_folder field
            ├── images/
            │   ├── {Variant_Name}_1.jpg      # Product photos (color-specific)
            │   └── {Variant_Name}_2.jpg
            └── {Variant_Name}_datasheet.pdf  # Optional
```

---

## Field Reference

### Fields the App Uses (Critical)

| Field | Level | Used For |
|---|---|---|
| `knob_type` | type | Display name, selection key, maps to folder name |
| `canonical_type` | type | Visual family grouping for filtering |
| `template_svg_path` | type | Rendering the knob shape on the enclosure SVG |
| `available_sizes_mm` | type | Size selection buttons |
| `available_colors` | type | Color selection buttons (`{ colorName: "#hex" }` map) |
| `preview_image` | type | **NEW** — Grid thumbnail in knob selector |
| `diameter_mm` | variant | Matching variants to selected size, SVG scaling |
| `color` | variant | Matching variants to selected color |
| `price_eur` | variant | Pricing display |
| `primaryColor` | variant | SVG recoloring — main body fill |
| `secondaryColor` | variant | SVG recoloring — accent/detail fill |
| `primaryDarkColor` | variant | SVG recoloring — dark shadow shade (optional) |
| `primaryLightColor` | variant | SVG recoloring — light highlight shade (optional) |
| `image_path` | variant | **NEW** — Primary local product photo |
| `image_paths` | variant | **NEW** — All photos for modal gallery |
| `image_is_exact` | variant | **NEW** — `false` if photo is a fallback from another color |
| `size_folder` | variant | **NEW** — Exact directory name for this variant's size |
| `sku` | variant | Reference / order info |
| `name` | variant | Display in detail modal |
| `product_url` | variant | Link to supplier page |
| `price_usd` | variant | Reference pricing |
| `height_mm` | variant | Product detail info |
| `shaft_diameter_mm` | variant | Product detail info |
| `shaft_type` | variant | Product detail info |
| `knob_categories` | variant | Filtering / search |

### Fields to Remove (No Longer Needed)

| Old Field | Why |
|---|---|
| `image_url` | External Tayda URL — we don't load external images at runtime |
| `local_image_folder` | Old flat `Knobs\...` path that doesn't match `Types/` directory structure |
| `local_datasheet` | Old flat path — not used by the app |
| `svg_path` | Per-variant SVGs don't exist on disk; only template SVGs exist |
| `diameter_label` | Replaced by `size_folder` which is guaranteed to match the actual directory name |
| `folder` | Type-level field — redundant since `folder` is always `Types/{knob_type}` |
| `available_colors` (variant-level) | Redundant — already exists at type level, no need to duplicate per variant |
| `template_svg_path` (variant-level) | Redundant — already exists at type level |

---

## Rules

### Size Folder Naming

The `size_folder` value **must exactly match** the directory name on disk.

- Use a **rounded integer** when possible: `"20mm"` not `"20.02mm"`
- If two variants have `diameter_mm` of 20.0 and 20.02, they should **both** use `size_folder: "20mm"` and their images live together in the `20mm/` directory
- For fractional sizes that are meaningfully different (e.g., 12mm vs 12.5mm vs 12.7mm), keep them as separate folders
- **Never create an empty size folder** — only create a size directory if there are actual images/files in it

### Image Path Resolution

- `image_path`: The primary product photo for this specific variant. Path relative to `data/knobs/`. Should be the color-specific photo when available.
- `image_paths`: Array of ALL product photos for this variant (typically 2-3 angles). Same path convention.
- `image_is_exact`:
  - `true` — the photo shows this exact color variant
  - `false` — it's a fallback photo from another color in the same size folder (use this when a specific color variant has no dedicated photo)
- `preview_image` (type-level): The first good photo found for this knob type. Used as the grid thumbnail. Pick the most common/default color variant.

### Color Values

- `available_colors` at type level: Aggregate all unique colors across variants. Each entry is `{ "colorName": "#hex" }`. The hex value should match the `primaryColor` of variants with that color.
- `primaryColor`: The dominant color of the knob body. This is the main fill color used in SVG rendering. **Required**.
- `secondaryColor`: Accent color (indicator line, cap detail, etc.). **Required**.
- `primaryDarkColor`: Darker shade for shadow/depth effects. Optional — omit if not applicable.
- `primaryLightColor`: Lighter shade for highlight effects. Optional — omit if not applicable.

### `available_sizes_mm`

List of unique `diameter_mm` values across all variants for this type, sorted ascending. These become the size selection buttons in the UI.

### `knob_type` = Folder Name

The `knob_type` string is used as the directory name under `Types/`. They must always match:
- `knob_type: "Boss Style"` → directory is `Types/Boss Style/`
- `knob_type: "Chicken Head"` → directory is `Types/Chicken Head/`

---

## Example: Full Type Entry

```jsonc
{
  "knob_type": "Chicken Head",
  "canonical_type": "Pointer",
  "template_svg_path": "Types/Chicken Head/Chicken_Head_template.svg",
  "available_sizes_mm": [24, 27, 32],
  "available_colors": [
    { "black": "#1a1a1a" },
    { "blue": "#2244aa" },
    { "cream": "#f5e6c8" },
    { "green": "#2d5a27" },
    { "oxblood": "#4a1c1c" },
    { "red": "#cc2222" },
    { "yellow": "#ccaa22" }
  ],
  "preview_image": "Types/Chicken Head/24mm/images/Chicken_Head_Black_Knob_23x14mm_Shaft_64mm_1.jpg",
  "variants": [
    {
      "name": "Chicken Head Black Knob 23x14mm Shaft 6.4mm",
      "sku": "A-1140",
      "price_usd": 0.65,
      "price_eur": 0.60,
      "product_url": "https://www.taydaelectronics.com/...",
      "supplier": "Tayda Electronics",
      "diameter_mm": 24,
      "height_mm": 14,
      "shaft_diameter_mm": 6.4,
      "shaft_type": "Set Screw",
      "color": "Black",
      "knob_type": "Chicken Head",
      "knob_categories": ["pointer", "medium", "plastic"],
      "primaryColor": "#1a1a1a",
      "secondaryColor": "#888888",
      "primaryDarkColor": "#0a0a0a",
      "primaryLightColor": "#3a3a3a",
      "image_path": "Types/Chicken Head/24mm/images/Chicken_Head_Black_Knob_23x14mm_Shaft_64mm_1.jpg",
      "image_paths": [
        "Types/Chicken Head/24mm/images/Chicken_Head_Black_Knob_23x14mm_Shaft_64mm_1.jpg",
        "Types/Chicken Head/24mm/images/Chicken_Head_Black_Knob_23x14mm_Shaft_64mm_2.jpg",
        "Types/Chicken Head/24mm/images/Chicken_Head_Black_Knob_23x14mm_Shaft_64mm_3.jpg"
      ],
      "image_is_exact": true,
      "size_folder": "24mm"
    },
    {
      "name": "Chicken Head Blue Knob 23x14mm",
      "sku": "A-1141",
      "price_usd": 0.65,
      "price_eur": 0.60,
      "product_url": "https://www.taydaelectronics.com/...",
      "supplier": "Tayda Electronics",
      "diameter_mm": 24,
      "height_mm": 14,
      "shaft_diameter_mm": 6.4,
      "shaft_type": "Set Screw",
      "color": "Blue",
      "knob_type": "Chicken Head",
      "knob_categories": ["pointer", "medium", "plastic"],
      "primaryColor": "#2244aa",
      "secondaryColor": "#888888",
      "image_path": "Types/Chicken Head/24mm/images/Chicken_Head_Blue_Knob_23x14mm_1.jpg",
      "image_paths": [
        "Types/Chicken Head/24mm/images/Chicken_Head_Blue_Knob_23x14mm_1.jpg",
        "Types/Chicken Head/24mm/images/Chicken_Head_Blue_Knob_23x14mm_2.jpg",
        "Types/Chicken Head/24mm/images/Chicken_Head_Blue_Knob_23x14mm_3.jpg"
      ],
      "image_is_exact": true,
      "size_folder": "24mm"
    }
  ]
}
```

---

## Migration Checklist

When updating the scraper, these are all the changes in one place:

- [ ] Add `preview_image` at type level (path to first available photo)
- [ ] Add `image_path` per variant (primary photo, relative to `data/knobs/`)
- [ ] Add `image_paths` per variant (all photos array)
- [ ] Add `image_is_exact` per variant (`true`/`false`)
- [ ] Add `size_folder` per variant (matches actual directory name)
- [ ] Remove `image_url` (external URL)
- [ ] Remove `local_image_folder` (old flat path)
- [ ] Remove `local_datasheet` (old flat path)
- [ ] Remove `svg_path` (variant-level SVGs don't exist)
- [ ] Remove `diameter_label` (replaced by `size_folder`)
- [ ] Remove `folder` from type level (redundant — always `Types/{knob_type}`)
- [ ] Remove `available_colors` from variant level (redundant — exists at type level)
- [ ] Remove `template_svg_path` from variant level (redundant — exists at type level)
- [ ] Ensure no empty size folders are created on disk
- [ ] Ensure `size_folder` values match actual directory names
