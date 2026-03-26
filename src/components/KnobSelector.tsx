"use client";

import * as React from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { resolveColors, type ColorEntry } from "@/lib/colorUtils";
import { KnobSvg } from "./KnobSvg";

export type KnobVariant = {
  name: string;
  sku: string;
  price_usd: number;
  price_eur: number;
  image_url: string;
  product_url: string;
  supplier: string;
  diameter_mm: number;
  height_mm: number;
  shaft_diameter_mm: number;
  color: string;
  shaft_type: string;
  knob_type: string;
  knob_categories: string[];
  local_image_folder?: string;
  primaryColor: string;
  secondaryColor: string;
  primaryDarkColor?: string;
  primaryLightColor?: string;
  available_colors: ColorEntry[];
  svg_path?: string;
  template_svg_path?: string;
  diameter_label: string;
};

export type KnobType = {
  knob_type: string;
  canonical_type: string;
  folder: string;
  template_svg_path?: string;
  available_sizes_mm: number[];
  available_colors: ColorEntry[];
  variants: KnobVariant[];
};

export type KnobSelection = {
  knobType: KnobType;
  selectedSize: number;
  selectedColorKey: string;
  selectedVariant: KnobVariant;
};

type KnobSelectorProps = {
  knobTypes: KnobType[];
  selectedKnobTypeId: string;
  onSelectKnobType: (id: string) => void;
  onShowDetails?: (knobType: KnobType) => void;
};

function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`;
}

/** Get the cheapest variant price for a knob type */
function getMinPrice(knobType: KnobType): number {
  if (knobType.variants.length === 0) return 0;
  return Math.min(...knobType.variants.map((v) => v.price_eur));
}

/** Get a local preview image URL for a knob type */
function getPreviewImage(knobType: KnobType): string {
  return `/api/data/knobs/preview/${encodeURIComponent(knobType.knob_type)}`;
}

export function KnobSelector({
  knobTypes,
  selectedKnobTypeId,
  onSelectKnobType,
  onShowDetails,
}: KnobSelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredKnobTypes = React.useMemo(() => {
    if (!searchTerm.trim()) return knobTypes;
    const term = searchTerm.toLowerCase().trim();
    return knobTypes.filter(
      (kt) =>
        kt.knob_type.toLowerCase().includes(term) ||
        kt.canonical_type.toLowerCase().includes(term) ||
        kt.variants.some((v) => v.color.toLowerCase().includes(term) || v.knob_categories.some((c) => c.toLowerCase().includes(term)))
    );
  }, [knobTypes, searchTerm]);

  return (
    <div>
      {/* Search */}
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          maxWidth: "500px",
          background: "rgba(26, 26, 26, 0.85)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "10px",
          zIndex: 99,
          padding: "1rem",
          marginBottom: "2rem",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <label style={{ fontWeight: 600, color: "#ccc", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>
          Search Knobs
        </label>
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#666",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type, color, category..."
            style={{
              width: "100%",
              padding: "0.5rem 0.5rem 0.5rem 2rem",
              border: "2px solid #333",
              borderRadius: "5px",
              fontSize: "0.9rem",
              background: "#0f0f0f",
              color: "#e0e0e0",
            }}
          />
        </div>
      </div>

      {/* Grid */}
      <div
        data-section="product-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {filteredKnobTypes.map((knobType) => {
          const isSelected = selectedKnobTypeId === knobType.knob_type;
          const previewImage = getPreviewImage(knobType);
          const minPrice = getMinPrice(knobType);
          const resolvedColors = resolveColors(knobType.available_colors);
          const templateUrl = knobType.template_svg_path
            ? `/api/data/knobs/${knobType.template_svg_path.split("/").map(s => encodeURIComponent(s)).join("/")}`
            : null;

          return (
            <div
              key={knobType.knob_type}
              onClick={() => {
                if (onShowDetails) {
                  onShowDetails(knobType);
                } else {
                  onSelectKnobType(knobType.knob_type);
                }
              }}
              style={{
                background: "#0f0f0f",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: isSelected ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
                border: isSelected ? "2px solid #fff" : "2px solid #2d2d2d",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 5px 20px rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isSelected
                  ? "0 5px 20px rgba(255, 255, 255, 0.2)"
                  : "0 3px 15px rgba(0,0,0,0.5)";
              }}
            >
              {/* Image area */}
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  background: "#1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* SVG preview on the left, product image on the right */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", width: "100%", height: "100%" }}>
                  {/* SVG Template Preview */}
                  {templateUrl ? (
                    <div style={{ width: "80px", height: "80px", flexShrink: 0 }}>
                      <KnobSvg
                        svgUrl={templateUrl}
                        diameterMm={10}
                        primaryColor={resolvedColors[0]?.hex || "#888888"}
                        secondaryColor={knobType.variants[0]?.secondaryColor || "#888888"}
                        primaryDarkColor={knobType.variants[0]?.primaryDarkColor}
                        primaryLightColor={knobType.variants[0]?.primaryLightColor}
                        width="80px"
                        height="80px"
                      />
                    </div>
                  ) : null}

                  {/* Product image */}
                  <div style={{ flex: 1, height: "100%", position: "relative" }}>
                    {previewImage ? (
                      <Image
                        src={previewImage}
                        alt={knobType.knob_type}
                        fill
                        unoptimized
                        style={{ objectFit: "contain" }}
                        onError={(e) => {
                          // Hide broken image
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#555" }}>
                        No image
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info area */}
              <div style={{ padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e0e0e0" }}>{knobType.knob_type}</div>
                    {knobType.canonical_type && (
                      <div style={{ fontSize: "0.7rem", color: "#666", marginTop: "0.15rem" }}>{knobType.canonical_type}</div>
                    )}
                  </div>
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap" }}>
                    {minPrice > 0 ? `from ${formatPrice(minPrice)}` : "—"}
                  </span>
                </div>

                {/* Sizes */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
                  {knobType.available_sizes_mm.map((size) => (
                    <span
                      key={size}
                      style={{
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                        background: "#1a1a1a",
                        border: "1px solid #333",
                        fontSize: "0.7rem",
                        color: "#aaa",
                      }}
                    >
                      {size}mm
                    </span>
                  ))}
                </div>

                {/* Colors */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {resolvedColors.slice(0, 8).map((color) => (
                    <div
                      key={color.key}
                      title={color.displayName}
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: color.hex,
                        border: "1px solid #555",
                      }}
                    />
                  ))}
                  {resolvedColors.length > 8 && (
                    <span style={{ fontSize: "0.7rem", color: "#666", alignSelf: "center" }}>
                      +{resolvedColors.length - 8}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredKnobTypes.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
          No knobs match your search. Try broadening your terms — or just go full &quot;any knob will do.&quot;
        </div>
      )}
    </div>
  );
}
