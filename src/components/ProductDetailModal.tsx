"use client";

import * as React from "react";
import Image from "next/image";
import { X, ArrowRight } from "lucide-react";

export type ProductModalData = {
  type: "effect" | "size" | "paint" | "design" | "led" | "other";
  title: string;
  subtitle?: string;
  price?: number;
  image?: string;
  images?: string[];
  description?: string;
  details?: Array<{ label: string; value: string | string[] }>;
  additionalSections?: Array<{ title: string; content: React.ReactNode }>;
  isCustomColor?: boolean;
  is_custom_color?: boolean;
  customColor?: string;
  customFinish?: "Matte" | "Glossy";
  onCustomColorChange?: (color: string) => void;
  onCustomFinishChange?: (finish: "Matte" | "Glossy") => void;
  ledColor?: string;
  customLedColor?: string;
  onLedColorChange?: (color: string) => void;
  onCustomLedColorChange?: (color: string) => void;
};

type ProductDetailModalProps = {
  product: ProductModalData | null;
  onClose: () => void;
  onSelectAndContinue: () => void;
  nextTabName?: string;
};

export function ProductDetailModal({
  product,
  onClose,
  onSelectAndContinue,
  nextTabName,
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    if (!product) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [product, onClose]);

  // Reset image index when product changes
  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [product]);

  if (!product) return null;

  const images = product.images || (product.image ? [product.image] : []);
  const currentImage = images[currentImageIndex] || product.image;
  const hasMultipleImages = images.length > 1;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "2rem",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1a1a",
          border: "2px solid #333",
          borderRadius: "16px",
          maxWidth: "700px",
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "#333",
            border: "none",
            color: "#fff",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = "#000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#333";
            e.currentTarget.style.color = "#fff";
          }}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div style={{ padding: "2rem" }}>
          {/* Image Section */}
          {currentImage && (
            <div
              style={{
                width: "100%",
                height: "250px",
                background: "#0a0a0a",
                borderRadius: "12px",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "1px solid #333",
                position: "relative",
              }}
            >
              <Image
                src={currentImage}
                alt={product.title}
                width={400}
                height={250}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
              
              {/* Image Navigation */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePrevImage}
                    style={{
                      position: "absolute",
                      left: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(0, 0, 0, 0.7)",
                      border: "1px solid #fff",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      color: "#fff",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.color = "#000";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                      e.currentTarget.style.color = "#fff";
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNextImage}
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(0, 0, 0, 0.7)",
                      border: "1px solid #fff",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      color: "#fff",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.color = "#000";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                      e.currentTarget.style.color = "#fff";
                    }}
                  >
                    ›
                  </button>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "1rem",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(0, 0, 0, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "20px",
                      padding: "0.4rem 0.8rem",
                      color: "#fff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Title & Price */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#fff",
                marginBottom: "0.5rem",
                lineHeight: 1.2,
              }}
            >
              {product.title}
            </h2>
            {product.subtitle && (
              <p style={{ color: "#888", fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                {product.subtitle}
              </p>
            )}
            {product.price !== undefined && (
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#4ade80",
                  marginTop: "0.5rem",
                }}
              >
                {product.price > 0 ? `+€${product.price.toFixed(2)}` : "Included"}
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                background: "#0a0a0a",
                borderRadius: "8px",
                border: "1px solid #333",
              }}
            >
              <p style={{ color: "#ccc", fontSize: "0.95rem", lineHeight: 1.6 }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Details Grid */}
          {product.details && product.details.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "1rem",
                }}
              >
                Specifications
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {product.details.map((detail, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      padding: "0.75rem",
                      background: "#0a0a0a",
                      borderRadius: "8px",
                      border: "1px solid #333",
                    }}
                  >
                    <div
                      style={{
                        flex: "0 0 140px",
                        fontWeight: 600,
                        color: "#888",
                        fontSize: "0.85rem",
                      }}
                    >
                      {detail.label}
                    </div>
                    <div style={{ flex: 1, color: "#fff", fontSize: "0.9rem" }}>
                      {Array.isArray(detail.value) ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {detail.value.map((item, i) => (
                            <span
                              key={i}
                              style={{
                                background: "#333",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "12px",
                                fontSize: "0.85rem",
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        detail.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Sections */}
          {product.additionalSections?.map((section, idx) => (
            <div key={idx} style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "1rem",
                }}
              >
                {section.title}
              </h3>
              <div>{section.content}</div>
            </div>
          ))}

          {/* LED Color Picker */}
          {product.type === "led" && !product.title.includes("No LED") && product.onLedColorChange && product.onCustomLedColorChange && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "1rem",
                }}
              >
                💡 Choose LED Color
              </h3>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", 
                gap: "0.75rem",
                marginBottom: "1rem"
              }}>
                {["Red", "Blue", "Green", "Yellow", "White", "Amber", "UV"].map((color) => {
                  const colorMap: Record<string, string> = {
                    "Red": "#ff0000",
                    "Blue": "#0066ff",
                    "Green": "#00ff00",
                    "Yellow": "#ffff00",
                    "White": "#ffffff",
                    "Amber": "#ffbf00",
                    "UV": "#bf00ff"
                  };
                  
                  return (
                    <div
                      key={color}
                      onClick={() => product.onLedColorChange!(color)}
                      style={{
                        background: "#0a0a0a",
                        borderRadius: "8px",
                        padding: "0.75rem",
                        cursor: "pointer",
                        border: product.ledColor === color ? "2px solid #fff" : "2px solid #333",
                        boxShadow: product.ledColor === color ? "0 3px 10px rgba(255, 255, 255, 0.2)" : "none",
                        transition: "all 0.2s ease",
                        textAlign: "center"
                      }}
                      onMouseEnter={(e) => {
                        if (product.ledColor !== color) {
                          e.currentTarget.style.borderColor = "#666";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (product.ledColor !== color) {
                          e.currentTarget.style.borderColor = "#333";
                        }
                      }}
                    >
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: colorMap[color],
                        margin: "0 auto 0.5rem",
                        boxShadow: `0 0 15px ${colorMap[color]}`,
                        border: color === "White" ? "1px solid #666" : "none"
                      }} />
                      <div style={{ fontSize: "0.8rem", color: "#e0e0e0", fontWeight: product.ledColor === color ? 600 : 400 }}>
                        {color}
                      </div>
                    </div>
                  );
                })}
                
                {/* Custom Color Option */}
                <div
                  onClick={() => product.onLedColorChange!("Custom")}
                  style={{
                    background: "#0a0a0a",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    cursor: "pointer",
                    border: product.ledColor === "Custom" ? "2px solid #fff" : "2px solid #333",
                    boxShadow: product.ledColor === "Custom" ? "0 3px 10px rgba(255, 255, 255, 0.2)" : "none",
                    transition: "all 0.2s ease",
                    textAlign: "center"
                  }}
                  onMouseEnter={(e) => {
                    if (product.ledColor !== "Custom") {
                      e.currentTarget.style.borderColor = "#666";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (product.ledColor !== "Custom") {
                      e.currentTarget.style.borderColor = "#333";
                    }
                  }}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, #ff0000 0%, #00ff00 33%, #0000ff 66%, #ff00ff 100%)`,
                    margin: "0 auto 0.5rem",
                    border: "2px solid #666"
                  }} />
                  <div style={{ fontSize: "0.8rem", color: "#e0e0e0", fontWeight: product.ledColor === "Custom" ? 600 : 400 }}>
                    Custom
                  </div>
                </div>
              </div>
              
              {/* Custom Color Picker */}
              {product.ledColor === "Custom" && (
                <div style={{ 
                  marginTop: "1rem", 
                  padding: "1rem", 
                  background: "#0a0a0a", 
                  borderRadius: "8px",
                  border: "1px solid #333"
                }}>
                  <label style={{ fontSize: "0.85rem", color: "#e0e0e0", display: "block", marginBottom: "0.5rem" }}>
                    Custom RGB Color:
                  </label>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <input
                      type="color"
                      value={product.customLedColor || "#ff0000"}
                      onChange={(e) => product.onCustomLedColorChange!(e.target.value)}
                      style={{
                        width: "60px",
                        height: "60px",
                        border: "2px solid #666",
                        borderRadius: "8px",
                        cursor: "pointer",
                        background: "transparent"
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={product.customLedColor || "#ff0000"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                            product.onCustomLedColorChange!(val);
                          }
                        }}
                        placeholder="#ff0000"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          background: "#1a1a1a",
                          border: "1px solid #666",
                          borderRadius: "5px",
                          color: "#e0e0e0",
                          fontSize: "0.9rem",
                          fontFamily: "monospace"
                        }}
                      />
                      <div style={{ fontSize: "0.75rem", color: "#777", marginTop: "0.25rem" }}>
                        Enter hex color code (e.g., #ff0000)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Color Picker */}
          {product.isCustomColor && product.onCustomColorChange && product.onCustomFinishChange && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "1rem",
                }}
              >
                🎨 Customize Your Color
              </h3>
              
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#ccc",
                    marginBottom: "0.5rem",
                  }}
                >
                  Choose Your Color
                </label>
                <input
                  type="color"
                  value={product.customColor || "#808080"}
                  onChange={(e) => product.onCustomColorChange?.(e.target.value)}
                  style={{
                    width: "100%",
                    height: "60px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: product.customColor || "#808080",
                  }}
                />
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#aaa",
                    fontFamily: "monospace",
                  }}
                >
                  Selected: {product.customColor || "#808080"}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#ccc",
                    marginBottom: "0.75rem",
                  }}
                >
                  Finish Type
                </label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    onClick={() => product.onCustomFinishChange?.("Matte")}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border:
                        product.customFinish === "Matte"
                          ? "2px solid #fff"
                          : "2px solid rgba(255, 255, 255, 0.2)",
                      background: product.customFinish === "Matte" ? "#fff" : "transparent",
                      color: product.customFinish === "Matte" ? "#000" : "#fff",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    🎨 Matte
                  </button>
                  <button
                    onClick={() => product.onCustomFinishChange?.("Glossy")}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border:
                        product.customFinish === "Glossy"
                          ? "2px solid #fff"
                          : "2px solid rgba(255, 255, 255, 0.2)",
                      background: product.customFinish === "Glossy" ? "#fff" : "transparent",
                      color: product.customFinish === "Glossy" ? "#000" : "#fff",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    ⭐ Glossy
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255, 165, 0, 0.15)",
                  border: "1px solid rgba(255, 165, 0, 0.5)",
                  borderRadius: "8px",
                  padding: "1rem",
                  fontSize: "0.85rem",
                  color: "#ffaa00",
                  lineHeight: 1.5,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                  <strong>Important Note</strong>
                </div>
                <p style={{ margin: 0 }}>
                  Custom colors may vary slightly from screen display. We'll match your selection as
                  closely as possible with automotive-grade paint.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: "1.5rem 2rem",
            borderTop: "1px solid #333",
            display: "flex",
            gap: "1rem",
            background: "#0a0a0a",
            borderBottomLeftRadius: "16px",
            borderBottomRightRadius: "16px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "0.875rem 1.5rem",
              background: "#333",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#333";
            }}
          >
            Back
          </button>
          <button
            onClick={onSelectAndContinue}
            style={{
              flex: 2,
              padding: "0.875rem 1.5rem",
              background: "#fff",
              border: "none",
              borderRadius: "8px",
              color: "#000",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e5e5e5";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Select & Continue {nextTabName && `to ${nextTabName}`}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
