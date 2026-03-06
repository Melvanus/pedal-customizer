"use client";

import * as React from "react";
import Image from "next/image";
import { IMAGE_CONFIG } from "@/lib/imageConfig";
import type { ColorEntry } from "@/lib/colorUtils";

export type DesignOption = {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
  customer_price_eur: number;
  short_description?: string;
  long_description?: string;
  available_colors?: ColorEntry[];
};

type DesignSelectorProps = {
  designOptions: DesignOption[];
  selectedDesignId: string;
  onSelectDesign: (id: string) => void;
  onShowDetails?: (design: DesignOption) => void;
  adminMode?: boolean;
  dragOverSku?: string | null;
  currentImageIndex?: Record<string, number>;
  onImageIndexChange?: (id: string, index: number) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, id: string, category: string) => void;
  onDeleteImage?: (e: React.MouseEvent, id: string, category: string, image: string) => void;
};

function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`;
}

export function DesignSelector({
  designOptions,
  selectedDesignId,
  onSelectDesign,
  onShowDetails,
  adminMode = false,
  dragOverSku = null,
  currentImageIndex = {},
  onImageIndexChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onDeleteImage,
}: DesignSelectorProps) {
  return (
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
      {designOptions.map((option) => {
        const currentImageIdx = currentImageIndex[option.id] || 0;
        const images = option.images || [option.image];
        const currentImage = images[currentImageIdx] || option.image;
        
        return (
          <div
            key={option.id}
            onClick={() => {
              if (!adminMode) {
                if (onShowDetails) {
                  onShowDetails(option);
                } else {
                  onSelectDesign(option.id);
                }
              } else {
                onSelectDesign(option.id);
              }
            }}
            onDragOver={adminMode && onDragOver ? (e) => onDragOver(e, option.id) : undefined}
            onDragLeave={adminMode && onDragLeave ? onDragLeave : undefined}
            onDrop={adminMode && onDrop ? (e) => onDrop(e, option.id, "design") : undefined}
            style={{
              background: dragOverSku === option.id ? "#1a3a1a" : "#0f0f0f",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: selectedDesignId === option.id ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease, background 0.2s ease",
              cursor: adminMode ? "copy" : "pointer",
              border: dragOverSku === option.id ? "2px dashed #4ade80" : selectedDesignId === option.id ? "2px solid #fff" : "2px solid #2d2d2d",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 5px 20px rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = selectedDesignId === option.id ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)";
            }}
          >
            <div style={{ width: "100%", height: `${IMAGE_CONFIG.cardHeights.design}px`, background: "#1a1a1a", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {adminMode && (
                <>
                  <div style={{
                    position: "absolute",
                    top: "0.5rem",
                    left: "0.5rem",
                    background: "rgba(0, 0, 0, 0.8)",
                    color: "#4ade80",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "5px",
                    fontSize: "0.7rem",
                    zIndex: 10,
                    border: "1px solid #4ade80",
                  }}>
                    🔧 Drop images here
                  </div>
                  {onDeleteImage && (
                    <button
                      onClick={(e) => onDeleteImage(e, option.id, "design", currentImage)}
                      style={{
                        position: "absolute",
                        top: "0.5rem",
                        right: "0.5rem",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "rgba(220, 38, 38, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        color: "#fff",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        transition: "all 0.2s ease",
                        fontWeight: "bold",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(220, 38, 38, 1)";
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(220, 38, 38, 0.9)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      ×
                    </button>
                  )}
                </>
              )}
              {images.length > 1 && onImageIndexChange && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageIndexChange(option.id, Math.max(0, currentImageIdx - 1));
                    }}
                    disabled={currentImageIdx === 0}
                    style={{
                      position: "absolute",
                      left: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(0, 0, 0, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "1rem",
                      opacity: currentImageIdx === 0 ? 0.3 : 1,
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => { if (currentImageIdx > 0) e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)"; }}
                  >
                    ◀
                  </button>
                  <div style={{position: "absolute", bottom: "0.5rem", left: "50%", transform: "translateX(-50%)", background: "rgba(0, 0, 0, 0.7)", padding: "0.25rem 0.75rem", borderRadius: "12px", zIndex: 10, color: "#fff", fontSize: "0.7rem", border: "1px solid rgba(255, 255, 255, 0.2)"}}>
                    {currentImageIdx + 1} / {images.length}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageIndexChange(option.id, Math.min(images.length - 1, currentImageIdx + 1));
                    }}
                    disabled={currentImageIdx === images.length - 1}
                    style={{
                      position: "absolute",
                      right: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(0, 0, 0, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "1rem",
                      opacity: currentImageIdx === images.length - 1 ? 0.3 : 1,
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => { if (currentImageIdx < images.length - 1) e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)"; }}
                  >
                    ▶
                  </button>
                </>
              )}
              <div style={{ position: "relative", width: "100%", height: "100%", padding: "0.75rem" }}>
                {currentImage.toLowerCase().endsWith('.svg') ? (
                  <img src={currentImage} alt={option.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <Image src={currentImage} alt={option.name} fill unoptimized style={{ objectFit: "contain" }} />
                )}
                {/* "EXAMPLE" watermark overlay for design images */}
                <div
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "0.5rem",
                    transform: "rotate(15deg)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "rgba(255, 255, 255, 0.3)",
                    textShadow: "0 0 3px rgba(0, 0, 0, 0.8)",
                    pointerEvents: "none",
                    letterSpacing: "0.1em",
                  }}
                >
                  EXAMPLE
                </div>
              </div>
            </div>
            <div style={{ padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e0e0e0" }}>{option.name}</div>
                <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>
                  {formatPrice(option.customer_price_eur)}
                </span>
              </div>
              {option.short_description && (
                <div style={{ fontSize: "0.8rem", color: "#999", lineHeight: 1.4 }}>
                  {option.short_description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
