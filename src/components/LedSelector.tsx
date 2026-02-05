"use client";

import * as React from "react";
import Image from "next/image";
import { IMAGE_CONFIG } from "@/lib/imageConfig";

export type LedOption = {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
  customer_price_eur: number;
  short_description?: string;
  long_description?: string;
};

type LedSelectorProps = {
  ledOptions: LedOption[];
  selectedLedId: string;
  onSelectLed: (id: string) => void;
  onShowDetails?: (led: LedOption) => void;
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

export function LedSelector({
  ledOptions,
  selectedLedId,
  onSelectLed,
  onShowDetails,
  adminMode = false,
  dragOverSku = null,
  currentImageIndex = {},
  onImageIndexChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onDeleteImage,
}: LedSelectorProps) {
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
      {ledOptions.map((option) => {
        const currentImageIdx = currentImageIndex[option.id] ?? 0;
        const images = option.images || [option.image];
        const currentImage = images[currentImageIdx];
        
        return (
          <div
            key={option.id}
            onClick={() => {
              if (!adminMode) {
                if (onShowDetails) {
                  onShowDetails(option);
                } else {
                  onSelectLed(option.id);
                }
              } else {
                onSelectLed(option.id);
              }
            }}
            style={{
              background: "#0f0f0f",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: selectedLedId === option.id ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              cursor: adminMode ? "copy" : "pointer",
              border: dragOverSku === option.id ? "2px dashed #4ade80" : selectedLedId === option.id ? "2px solid #fff" : "2px solid #2d2d2d",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 5px 20px rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = selectedLedId === option.id ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)";
            }}
            onDragOver={adminMode && onDragOver ? (e) => onDragOver(e, option.id) : undefined}
            onDragLeave={adminMode && onDragLeave ? onDragLeave : undefined}
            onDrop={adminMode && onDrop ? (e) => onDrop(e, option.id, "led") : undefined}
          >
            <div style={{ 
              width: "100%", 
              height: `${IMAGE_CONFIG.cardHeights.led}px`, 
              background: "#1a1a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden"
            }}>
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
                      onClick={(e) => onDeleteImage(e, option.id, "led", currentImage)}
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
                      const newIndex = currentImageIdx > 0 ? currentImageIdx - 1 : images.length - 1;
                      onImageIndexChange(option.id, newIndex);
                    }}
                    style={{
                      position: "absolute",
                      left: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(26, 26, 26, 0.8)",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      color: "#fff",
                      fontSize: "1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 10,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(26, 26, 26, 0.95)";
                      e.currentTarget.style.borderColor = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(26, 26, 26, 0.8)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    }}
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newIndex = currentImageIdx < images.length - 1 ? currentImageIdx + 1 : 0;
                      onImageIndexChange(option.id, newIndex);
                    }}
                    style={{
                      position: "absolute",
                      right: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(26, 26, 26, 0.8)",
                      border: "2px solid rgba(255, 255, 255, 0.3)",
                      color: "#fff",
                      fontSize: "1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 10,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(26, 26, 26, 0.95)";
                      e.currentTarget.style.borderColor = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(26, 26, 26, 0.8)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    }}
                  >
                    →
                  </button>
                  <div style={{
                    position: "absolute",
                    bottom: "0.5rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(26, 26, 26, 0.8)",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    color: "#999",
                    zIndex: 10,
                  }}>
                    {currentImageIdx + 1} / {images.length}
                  </div>
                </>
              )}
              
              <div style={{ padding: "0.75rem", position: "relative", width: "100%", height: "100%" }}>
                {currentImage.toLowerCase().endsWith('.svg') ? (
                  <img src={currentImage} alt={option.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <Image src={currentImage} alt={option.name} fill unoptimized style={{ objectFit: "contain" }} />
                )}
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
