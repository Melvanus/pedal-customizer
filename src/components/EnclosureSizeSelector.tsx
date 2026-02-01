"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";

export type EnclosureSize = {
  name: string;
  dimensions: string;
  description: string;
  funny_description: string;
  capacity: string;
  best_for: string[];
};

type EnclosureSizeSelectorProps = {
  sizes: EnclosureSize[];
  selectedSize: string;
  onSelectSize: (size: string) => void;
  recommendedSize?: string;
  onShowDetails?: (size: EnclosureSize) => void;
};

export function EnclosureSizeSelector({
  sizes,
  selectedSize,
  onSelectSize,
  recommendedSize,
  onShowDetails,
}: EnclosureSizeSelectorProps) {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
          Choose Your Enclosure Size
        </h2>
        <p style={{ color: "#888", fontSize: "0.95rem" }}>
          Select the perfect size for your pedal. {recommendedSize && `We recommend ${recommendedSize} for your selected effect.`}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {sizes.map((size) => {
          const isSelected = size.name === selectedSize;
          const isRecommended = size.name === recommendedSize;

          return (
            <div
              key={size.name}
              onClick={() => {
                if (onShowDetails) {
                  onShowDetails(size);
                } else {
                  onSelectSize(size.name);
                }
              }}
              style={{
                background: isSelected ? "#2a2a2a" : "#1a1a1a",
                border: isSelected ? "3px solid #fff" : "2px solid #333",
                borderRadius: "12px",
                padding: "1.5rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#666";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#333";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {isRecommended && (
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#4ade80",
                    color: "#000",
                    padding: "0.4rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    boxShadow: "0 4px 12px rgba(74, 222, 128, 0.3)",
                  }}
                >
                  <CheckCircle2 size={14} /> BEST FIT
                </div>
              )}

              {/* Visual size representation */}
              <div
                style={{
                  width: "100%",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                  background: "#0a0a0a",
                  borderRadius: "8px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: getSizeWidth(size.name),
                    height: getSizeHeight(size.name),
                    background: isSelected ? "#fff" : "#333",
                    borderRadius: "4px",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    color: isSelected ? "#000" : "#888",
                    fontWeight: 700,
                  }}
                >
                  {size.name}
                </div>
              </div>

              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "0.5rem",
                  textAlign: "center",
                }}
              >
                {size.name}
              </h3>

              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#aaa",
                  textAlign: "center",
                  marginBottom: "0.75rem",
                  fontFamily: "monospace",
                  background: "#0a0a0a",
                  padding: "0.5rem",
                  borderRadius: "4px",
                }}
              >
                {size.dimensions}
              </div>

              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#ccc",
                  lineHeight: 1.5,
                  marginBottom: "1rem",
                  flex: 1,
                }}
              >
                {size.description}
              </p>

              <div
                style={{
                  background: "#ffd70033",
                  border: "1px solid #ffd700",
                  borderRadius: "6px",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  fontSize: "0.85rem",
                  color: "#ffd700",
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                💬 {size.funny_description}
              </div>

              <div
                style={{
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  CAPACITY
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#fff",
                    background: "#333",
                    padding: "0.5rem",
                    borderRadius: "4px",
                  }}
                >
                  {size.capacity}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  BEST FOR
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {size.best_for.map((item) => (
                    <span
                      key={item}
                      style={{
                        fontSize: "0.75rem",
                        color: "#fff",
                        background: "#0a0a0a",
                        padding: "0.35rem 0.6rem",
                        borderRadius: "4px",
                        border: "1px solid #333",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
        }}
      >
        <h4 style={{ color: "#fff", marginBottom: "0.75rem", fontSize: "0.95rem" }}>
          📏 Size Comparison Guide
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            fontSize: "0.85rem",
            color: "#ccc",
          }}
        >
          <div>
            <strong style={{ color: "#fff" }}>1590A:</strong> Ultra-compact, credit card sized. Perfect for simple circuits.
          </div>
          <div>
            <strong style={{ color: "#fff" }}>1590B:</strong> Standard size, fits 90% of classic pedals. Most popular choice.
          </div>
          <div>
            <strong style={{ color: "#fff" }}>1590BB:</strong> Wide format, great for complex circuits with many controls.
          </div>
          <div>
            <strong style={{ color: "#fff" }}>125B:</strong> Similar to 1590B but slightly taller. Good for taller components.
          </div>
          <div>
            <strong style={{ color: "#fff" }}>1590XX:</strong> Massive enclosure for multi-effect units or complex setups.
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to scale visual representation (vertical orientation - as pedals sit on pedalboard)
function getSizeWidth(sizeName: string): string {
  const widths: { [key: string]: string } = {
    "1590A": "40px",
    "1590B": "50px",
    "125B": "60px",
    "1590BB": "50px",
    "1590BS": "45px",
    "1590XX": "70px",
  };
  return widths[sizeName] || "50px";
}

function getSizeHeight(sizeName: string): string {
  const heights: { [key: string]: string } = {
    "1590A": "60px",
    "1590B": "80px",
    "125B": "85px",
    "1590BB": "110px",
    "1590BS": "130px",
    "1590XX": "150px",
  };
  return heights[sizeName] || "80px";
}
