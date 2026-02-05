"use client";

import * as React from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";

export type CompatibleMod = {
  name: string;
  description: string;
  hint?: string;
  customer_price_eur: number;
  adds_technical_specs?: {
    potentiometers?: number;
    switches?: number;
    io_jacks?: number;
    led_count?: number;
  };
  adds_controls?: Array<{ label: string; type: string; description: string }>;
  removes_controls?: string[];
  additional_options?: Array<{
    label: string;
    description: string;
    type: "NumberRange" | "MultiSelect";
    range?: [number, number];
    default?: number | string[];
    options?: string[];
    max_selections?: number;
  }>;
};

export type EffectPedal = {
  id: string;
  name: string;
  inspired_by: string;
  categories: string[];
  description: string;
  sound_characters: string[];
  controls: Array<{ label: string; type: string; description: string }>;
  image: string;
  images?: string[];
  technical_specs: {
    pcb_reference: string;
    schematic_link: string;
    potentiometers: number;
    switches: number;
    io_jacks: number;
    led_count: number;
    complexity: string;
  };
  recommended_enclosure: string;
  compatible_mods: CompatibleMod[];
  customer_price_eur: number;
  popular: boolean;
};

type EffectSelectorProps = {
  pedals: EffectPedal[];
  categories: string[];
  soundCharacters: string[];
  selectedPedalId: string;
  onSelectPedal: (id: string) => void;
  onShowDetails?: (pedal: EffectPedal) => void;
  adminMode?: boolean;
  dragOverSku?: string | null;
  currentImageIndex?: Record<string, number>;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, identifier: string) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, identifier: string, category: string) => void;
  onDeleteImage?: (e: React.MouseEvent, identifier: string, category: string, imageToDelete: string) => void;
};

export function EffectSelector({
  pedals,
  categories,
  soundCharacters,
  selectedPedalId,
  onSelectPedal,
  onShowDetails,
  adminMode = false,
  dragOverSku = null,
  currentImageIndex = {},
  onDragOver,
  onDragLeave,
  onDrop,
  onDeleteImage,
}: EffectSelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [characterFilter, setCharacterFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState("popular");
  const [detailPedalId, setDetailPedalId] = React.useState<string | null>(null);

  const filteredPedals = React.useMemo(() => {
    let filtered = [...pedals];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.inspired_by.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.sound_characters.some((char) => char.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((p) => p.categories.includes(categoryFilter));
    }

    // Sound character filter
    if (characterFilter) {
      filtered = filtered.filter((p) =>
        p.sound_characters.includes(characterFilter)
      );
    }

    // Sort
    if (sortBy === "popular") {
      filtered.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "complexity") {
      const complexityOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      filtered.sort(
        (a, b) =>
          (complexityOrder[a.technical_specs.complexity as keyof typeof complexityOrder] || 999) -
          (complexityOrder[b.technical_specs.complexity as keyof typeof complexityOrder] || 999)
      );
    } else if (sortBy === "size") {
      filtered.sort((a, b) => a.recommended_enclosure.localeCompare(b.recommended_enclosure));
    }

    return filtered;
  }, [pedals, searchTerm, categoryFilter, characterFilter, sortBy]);

  const detailPedal = detailPedalId ? pedals.find((p) => p.id === detailPedalId) : null;

  return (
    <>
      {/* Filters */}
      <div
        data-section="effect-filters"
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <label
            data-section="search-label"
            style={{
              fontWeight: 600,
              color: "#ccc",
              fontSize: "0.8rem",
              display: "block",
              marginBottom: "0.4rem",
            }}
          >
            <Search size={14} style={{ display: "inline", marginRight: "0.25rem" }} />
            Search Pedals
          </label>
          <input
            data-section="search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, sound, characteristics..."
            style={{
              width: "100%",
              padding: "0.6rem",
              border: "1px solid #333",
              borderRadius: "6px",
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div>
          <label
            data-section="category-label"
            style={{
              fontWeight: 600,
              color: "#ccc",
              fontSize: "0.8rem",
              display: "block",
              marginBottom: "0.4rem",
            }}
          >
            Category
          </label>
          <select
            data-section="category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem",
              border: "1px solid #333",
              borderRadius: "6px",
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "0.9rem",
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            data-section="sound-character-label"
            style={{
              fontWeight: 600,
              color: "#ccc",
              fontSize: "0.8rem",
              display: "block",
              marginBottom: "0.4rem",
            }}
          >
            Sound Character
          </label>
          <select
            data-section="sound-character-select"
            value={characterFilter}
            onChange={(e) => setCharacterFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem",
              border: "1px solid #333",
              borderRadius: "6px",
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "0.9rem",
            }}
          >
            <option value="">All Characters</option>
            {soundCharacters.map((char) => (
              <option key={char} value={char}>
                {char}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            data-section="sort-label"
            style={{
              fontWeight: 600,
              color: "#ccc",
              fontSize: "0.8rem",
              display: "block",
              marginBottom: "0.4rem",
            }}
          >
            Sort By
          </label>
          <select
            data-section="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem",
              border: "1px solid #333",
              borderRadius: "6px",
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "0.9rem",
            }}
          >
            <option value="popular">Popular</option>
            <option value="name">Name</option>
            <option value="complexity">Complexity</option>
            <option value="size">Enclosure Size</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div data-section="results-count" style={{ marginBottom: "1rem", color: "#888", fontSize: "0.85rem" }}>
        Showing {filteredPedals.length} of {pedals.length} pedals
      </div>

      {/* Pedal Grid */}
      <div
        data-section="pedal-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {filteredPedals.map((pedal) => {
          const isSelected = pedal.id === selectedPedalId;
          const isDragOver = adminMode && dragOverSku === pedal.id;
          const displayedImage = pedal.images && pedal.images.length > 0
            ? pedal.images[currentImageIndex[pedal.id] || 0]
            : pedal.image;
          const hasMultipleImages = pedal.images && pedal.images.length > 1;
          
          return (
            <div
              key={pedal.id}
              data-section="pedal-card"
              onClick={(e) => {
                if (adminMode) {
                  e.stopPropagation();
                  onSelectPedal(pedal.id);
                  return;
                }
                if (onShowDetails) {
                  onShowDetails(pedal);
                } else {
                  onSelectPedal(pedal.id);
                }
              }}
              onDragOver={adminMode && onDragOver ? (e) => onDragOver(e, pedal.id) : undefined}
              onDragLeave={adminMode && onDragLeave ? onDragLeave : undefined}
              onDrop={adminMode && onDrop ? (e) => onDrop(e, pedal.id, "effect") : undefined}
              style={{
                background: "#0f0f0f",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: isSelected ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
                border: isDragOver 
                  ? "2px dashed #4ade80" 
                  : isSelected 
                  ? "2px solid #fff" 
                  : "2px solid #2d2d2d",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 5px 20px rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isSelected ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)";
              }}
            >
              {adminMode && isDragOver && (
                <div
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    left: "0.5rem",
                    background: "#4ade80",
                    color: "#000",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    zIndex: 10,
                  }}
                >
                  📁 Drop images here
                </div>
              )}

              {pedal.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    background: "#ffd700",
                    color: "#000",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    zIndex: 10,
                  }}
                >
                  ⭐ POPULAR
                </div>
              )}

              <div style={{ width: "100%", height: "160px", background: "rgb(255,255,255)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {adminMode && onDeleteImage && displayedImage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage(e, pedal.id, "effect", displayedImage);
                    }}
                    style={{
                      position: "absolute",
                      top: "0.5rem",
                      left: "0.5rem",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.3rem 0.5rem",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      zIndex: 20,
                    }}
                  >
                    ×
                  </button>
                )}
                
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newIndex = ((currentImageIndex[pedal.id] || 0) - 1 + pedal.images!.length) % pedal.images!.length;
                        // Would need parent to handle this - for now just visual
                      }}
                      style={{
                        position: "absolute",
                        left: "0.5rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        border: "1px solid #fff",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 15,
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newIndex = ((currentImageIndex[pedal.id] || 0) + 1) % pedal.images!.length;
                        // Would need parent to handle this - for now just visual
                      }}
                      style={{
                        position: "absolute",
                        right: "0.5rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        border: "1px solid #fff",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 15,
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
                
                {/* Image */}
                <div style={{ position: "relative", width: "100%", height: "100%", padding: "0rem"}}>
                  {displayedImage.toLowerCase().endsWith('.svg') ? (
                    <img
                      src={displayedImage}
                      alt={pedal.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain"
                      }}
                    />
                  ) : (
                    <Image
                      src={displayedImage}
                      alt={pedal.name}
                      fill
                      unoptimized
                      style={{ objectFit: "contain" }}
                    />
                  )}
                </div>
              </div>

              <div style={{ padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {pedal.categories.map((cat) => (
                      <div
                        key={cat}
                        style={{
                          display: "inline-block",
                          background: "#333",
                          color: "#fff",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>
                    €{pedal.customer_price_eur.toFixed(2)}
                  </span>
                </div>

                <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem", color: "#e0e0e0", lineHeight: 1.3 }}>
                  {pedal.name}
                </div>

                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    fontStyle: "italic",
                    marginBottom: "0.75rem",
                  }}
                >
                  Inspired by: {pedal.inspired_by}
                </div>

                <div style={{ fontSize: "0.8rem", color: "#999", marginBottom: "0.75rem", lineHeight: 1.4 }}>
                  {pedal.description.slice(0, 80)}
                  {pedal.description.length > 80 ? "..." : ""}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.25rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {pedal.sound_characters.slice(0, 3).map((char) => (
                    <span
                      key={char}
                      style={{
                        fontSize: "0.7rem",
                        color: "#aaa",
                        background: "#0a0a0a",
                        padding: "0.2rem 0.4rem",
                        borderRadius: "3px",
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
                {/*}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderTop: "1px solid #2d2d2d" }}>
                  <span style={{ fontWeight: 600, color: "#888", fontSize: "0.8rem" }}>Recommended Size</span>
                  <span style={{ color: "#aaa", fontSize: "0.8rem" }}>📦 {pedal.recommended_enclosure}</span>
                </div>
                */}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {detailPedal && (
        <div
          onClick={() => setDetailPedalId(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1a1a1a",
              border: "2px solid #333",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setDetailPedalId(null)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "#333",
                border: "none",
                color: "#fff",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>

            <h2 style={{ margin: "0 0 0.5rem 0", color: "#fff" }}>
              {detailPedal.name}
            </h2>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#888",
                fontStyle: "italic",
                marginBottom: "1rem",
              }}
            >
              Inspired by: {detailPedal.inspired_by}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {detailPedal.categories.map((cat) => (
                <div
                  key={cat}
                  style={{
                    display: "inline-block",
                    background: "#333",
                    color: "#fff",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>

            <p style={{ color: "#ccc", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              {detailPedal.description}
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ color: "#fff", marginBottom: "0.5rem" }}>
                Sound Characteristics
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {detailPedal.sound_characters.map((char) => (
                  <span
                    key={char}
                    style={{
                      fontSize: "0.85rem",
                      color: "#fff",
                      background: "#333",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "6px",
                      fontWeight: 600,
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ color: "#fff", marginBottom: "0.5rem" }}>
                Technical Specifications
              </h4>
              <div
                style={{
                  background: "#0a0a0a",
                  padding: "1rem",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  color: "#ccc",
                }}
              >
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>PCB Reference:</strong> {detailPedal.technical_specs.pcb_reference}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Potentiometers:</strong> {detailPedal.technical_specs.potentiometers}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Switches:</strong> {detailPedal.technical_specs.switches}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>I/O Jacks:</strong> {detailPedal.technical_specs.io_jacks}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>LED Count:</strong> {detailPedal.technical_specs.led_count}
                </div>
                <div>
                  <strong>Complexity:</strong>{" "}
                  <span style={{ textTransform: "capitalize" }}>
                    {detailPedal.technical_specs.complexity}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ color: "#fff", marginBottom: "0.5rem" }}>
                Recommended Enclosure
              </h4>
              <div
                style={{
                  background: "#333",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                {detailPedal.recommended_enclosure}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ color: "#fff", marginBottom: "0.5rem" }}>
                Compatible Mods
              </h4>
              <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#ccc" }}>
                {detailPedal.compatible_mods.map((mod, idx) => (
                  <li key={idx} style={{ marginBottom: "0.25rem" }}>
                    {mod.name}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                onSelectPedal(detailPedal.id);
                setDetailPedalId(null);
              }}
              style={{
                width: "100%",
                padding: "1rem",
                background: "#fff",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                marginTop: "1rem",
              }}
            >
              Select This Pedal
            </button>
          </div>
        </div>
      )}
    </>
  );
}
