"use client";

import * as React from "react";
import Image from "next/image";
import { Sparkles, Sun } from "lucide-react";
import { IMAGE_CONFIG } from "@/lib/imageConfig";
import type { ProductModalData } from "./ProductDetailModal";

export type PaintOption = {
  id: string;
  name: string;
  displayed_name: string;
  supplier_sku: string;
  supplier_id: string;
  internal_product_id: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
  customer_price_eur: number;
  short_description?: string;
  long_description?: string;
  finish?: string;
  color?: string;
  rgb?: string;
  pantone?: string;
  is_custom_color?: boolean;
};

type PaintSelectorProps = {
  paintOptions: PaintOption[];
  selectedPaintId: string;
  onSelectPaint: (id: string) => void;
  onShowDetails?: (paint: PaintOption) => void;
  customColor?: string;
  customFinish?: "Matte" | "Glossy";
  adminMode?: boolean;
  dragOverSku?: string | null;
  currentImageIndex?: Record<string, number>;
  onImageIndexChange?: (sku: string, index: number) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, sku: string) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, sku: string, category: string) => void;
  onDeleteImage?: (e: React.MouseEvent, sku: string, category: string, image: string) => void;
  onOpenModal?: (product: ProductModalData) => void;
  onShowColorPicker?: () => void;
};

function getFinishIcon(finish?: string) {
  if (finish === "Matte") {
    return { Icon: Sun, color: "#888" };
  }
  return { Icon: Sparkles, color: "#ffd700" };
}

function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`;
}

export function PaintSelector({
  paintOptions,
  selectedPaintId,
  onSelectPaint,
  onShowDetails,
  customColor = "#ff0000",
  customFinish = "Matte",
  adminMode = false,
  dragOverSku = null,
  currentImageIndex = {},
  onImageIndexChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onDeleteImage,
  onOpenModal,
  onShowColorPicker,
}: PaintSelectorProps) {
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
      {paintOptions.map((option) => {
        const currentImageIdx = currentImageIndex[option.supplier_sku] || 0;
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
                  onSelectPaint(option.id);
                }
              } else {
                onSelectPaint(option.id);
                if (option.is_custom_color && onShowColorPicker) {
                  onShowColorPicker();
                }
              }
            }}
            onDragOver={adminMode && onDragOver ? (e) => onDragOver(e, option.supplier_sku) : undefined}
            onDragLeave={adminMode && onDragLeave ? onDragLeave : undefined}
            onDrop={adminMode && onDrop ? (e) => onDrop(e, option.supplier_sku, "paint") : undefined}
            style={{
              background: dragOverSku === option.supplier_sku ? "#1a3a1a" : "#0f0f0f",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: selectedPaintId === option.id ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease, background 0.2s ease",
              cursor: adminMode ? "copy" : "pointer",
              border: dragOverSku === option.supplier_sku ? "2px dashed #4ade80" : selectedPaintId === option.id ? "2px solid #fff" : "2px solid #2d2d2d",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 5px 20px rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = selectedPaintId === option.id ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)";
            }}
          >
            <div style={{ width: "100%", height: `${IMAGE_CONFIG.cardHeights.paint}px`, background: "#1a1a1a", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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
                      onClick={(e) => onDeleteImage(e, option.supplier_sku, "paint", currentImage)}
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
                      onImageIndexChange(option.supplier_sku, Math.max(0, currentImageIdx - 1));
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
                    onMouseEnter={(e) => {
                      if (currentImageIdx > 0) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                    }}
                  >
                    ◀
                  </button>
                  <div style={{
                    position: "absolute",
                    bottom: "0.5rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0, 0, 0, 0.7)",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "12px",
                    zIndex: 10,
                    color: "#fff",
                    fontSize: "0.7rem",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}>
                    {currentImageIdx + 1} / {images.length}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageIndexChange(option.supplier_sku, Math.min(images.length - 1, currentImageIdx + 1));
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
                    onMouseEnter={(e) => {
                      if (currentImageIdx < images.length - 1) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                    }}
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
              </div>
            </div>
            <div style={{ padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e0e0e0", lineHeight: 1.3, flex: "1 1 auto", minWidth: 0 }}>
                  {option.displayed_name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "0 0 auto" }}>
                  {adminMode && (
                    <span
                      style={{
                        background: "#fff",
                        color: "#000",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "15px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {option.internal_product_id}
                    </span>
                  )}

                  {(() => {
                    const { Icon, color } = getFinishIcon(option.is_custom_color ? customFinish : option.finish);
                    return (
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                        title={option.is_custom_color ? customFinish : (option.finish || "Standard Finish")}
                      >
                        <Icon size={16} color={color} />
                      </div>
                    );
                  })()}
                  {(option.rgb || option.is_custom_color) && (
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: option.is_custom_color ? customColor : option.rgb,
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                      }}
                      title={option.is_custom_color ? `Custom: ${customColor}` : (option.pantone ? `Color: ${option.color}\nPantone: ${option.pantone}` : `Color: ${option.color}`)}
                    />
                  )}
                  <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap" }}>
                    {formatPrice(option.customer_price_eur)}
                  </span>
                </div>
              </div>
              {option.short_description && (
                <div style={{ fontSize: "0.8rem", color: "#999", marginBottom: "0.75rem", lineHeight: 1.4 }}>
                  {option.short_description}
                </div>
              )}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #2d2d2d" }}>
                  <span style={{ fontWeight: 600, color: "#888", fontSize: "0.8rem" }}>Color</span>
                  <span style={{ color: "#aaa", fontSize: "0.8rem" }}>{option.is_custom_color ? "Custom RGB" : (option.color || "—")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0" }}>
                  <span style={{ fontWeight: 600, color: "#888", fontSize: "0.8rem" }}>Finish</span>
                  <span style={{ color: "#aaa", fontSize: "0.8rem" }}>{option.is_custom_color ? customFinish : (option.finish || "—")}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
