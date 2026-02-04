"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";

type BananaPhysics = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDragging: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
  lastX: number;
  lastY: number;
};

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

const BANANA_SIZE = 140; // Approximate banana size

export function EnclosureSizeSelector({
  sizes,
  selectedSize,
  onSelectSize,
  recommendedSize,
  onShowDetails,
}: EnclosureSizeSelectorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const [hasBeenTouched, setHasBeenTouched] = React.useState(false);
  
  const [banana, setBanana] = React.useState<BananaPhysics>({
    x: 600,
    y: 150,
    vx: 0.5,
    vy: 0.3,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    lastX: 600,
    lastY: 150,
  });

  // Physics simulation with repelling forces and gravitational attraction
  React.useEffect(() => {
    const DRAG = 0.98;
    const BOUNCE_DAMPING = 0.7;
    const REPEL_DISTANCE = 100; // Distance at which repelling starts (shorter range)
    const REPEL_FORCE = 0.25; // Strength of repelling force
    const GRAVITY_FORCE = 1.0; // Strength of gravitational attraction to target

    const animate = () => {
      setBanana((prev) => {
        if (prev.isDragging) {
          return prev;
        }

        const container = containerRef.current;
        if (!container) return prev;

        let { x, y, vx, vy } = prev;

        // Calculate banana center position (fixed coords relative to viewport)
        const bananaCenterX = x + BANANA_SIZE / 2;
        const bananaCenterY = y + BANANA_SIZE / 2;

        // Calculate gravitational attraction to target position (if not touched)
        if (!hasBeenTouched) {
          const selectedCard = container.querySelector('[data-enclosure-card][data-selected="true"]');
          if (selectedCard) {
            const sizeBox = selectedCard.querySelector('[data-size-box]');
            if (sizeBox) {
              const sizeBoxRect = sizeBox.getBoundingClientRect();
              
              // Target position: right of the actual size box (in viewport coordinates)
              const targetX = sizeBoxRect.right + 15 + BANANA_SIZE / 2;
              const targetY = sizeBoxRect.top + (sizeBoxRect.height / 2);
              
              // Calculate distance to target
              const dx = targetX - (x + BANANA_SIZE / 2);
              const dy = targetY - (y + BANANA_SIZE / 2);
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Apply gravitational force (with damping near target to reduce overshoot)
              if (distance > 5) {
                // Scale force down when getting close to reduce overshoot
                const distanceScale = Math.min(1, distance / 200);
                const dampingFactor = distance < 200 ? (distance / 200) ** 2 : 1;
                const forceMagnitude = GRAVITY_FORCE * distanceScale * dampingFactor;
                vx += (dx / distance) * forceMagnitude;
                vy += (dy / distance) * forceMagnitude;
                
                // Apply extra drag when moving toward target to reduce overshoot
                vx *= 0.92;
                vy *= 0.92;
              } else {
                // Strong damping when very close
                vx *= 0.3;
                vy *= 0.3;
              }
            }
          }
        }

        // Apply repelling forces from text elements only
        let repelForceX = 0;
        let repelForceY = 0;

        // Find only text elements (not the cards themselves, so user can place banana near scale visualizations)
        const textElements = container.querySelectorAll('h2, h3, h4, p, span, div[style*="fontSize"]');

        textElements.forEach((element) => {
          const rect = (element as HTMLElement).getBoundingClientRect();
          
          // Skip if element has no dimensions (might be hidden or empty)
          if (rect.width === 0 || rect.height === 0) return;
          
          // Calculate element center
          const elementCenterX = rect.left + rect.width / 2;
          const elementCenterY = rect.top + rect.height / 2;

          // Calculate distance from banana center to element center
          const dx = bananaCenterX - elementCenterX;
          const dy = bananaCenterY - elementCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Apply repelling force if within repel distance
          if (distance < REPEL_DISTANCE && distance > 0) {
            // Force gets stronger the closer we are (inverse square-ish)
            const forceMagnitude = REPEL_FORCE * (1 - distance / REPEL_DISTANCE) ** 2;
            
            // Normalize direction and apply force
            repelForceX += (dx / distance) * forceMagnitude;
            repelForceY += (dy / distance) * forceMagnitude;
          }
        });

        // Apply repelling forces to velocity
        vx += repelForceX;
        vy += repelForceY;

        // Apply drag
        vx *= DRAG;
        vy *= DRAG;

        // Update position
        x += vx;
        y += vy;

        // Wall collisions with bounce (using window dimensions)
        if (x <= 0) {
          x = 0;
          vx = Math.abs(vx) * BOUNCE_DAMPING;
        }
        if (x >= window.innerWidth - BANANA_SIZE) {
          x = window.innerWidth - BANANA_SIZE;
          vx = -Math.abs(vx) * BOUNCE_DAMPING;
        }
        if (y <= 0) {
          y = 0;
          vy = Math.abs(vy) * BOUNCE_DAMPING;
        }
        if (y >= window.innerHeight - BANANA_SIZE) {
          y = window.innerHeight - BANANA_SIZE;
          vy = -Math.abs(vy) * BOUNCE_DAMPING;
        }

        // Stop if velocity is very small
        if (Math.abs(vx) < 0.01) vx = 0;
        if (Math.abs(vy) < 0.01) vy = 0;

        return { ...prev, x, y, vx, vy };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [hasBeenTouched, selectedSize]);

  // Mouse event handlers
  const handleBananaMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setHasBeenTouched(true);
    const bananaElement = e.currentTarget as HTMLDivElement;
    const rect = bananaElement.getBoundingClientRect();
    
    setBanana((prev) => ({
      ...prev,
      isDragging: true,
      dragOffsetX: e.clientX - rect.left,
      dragOffsetY: e.clientY - rect.top,
      vx: 0,
      vy: 0,
    }));
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setBanana((prev) => {
        if (!prev.isDragging) return prev;
        
        // Use viewport coordinates directly for fixed positioning
        const newX = e.clientX - prev.dragOffsetX;
        const newY = e.clientY - prev.dragOffsetY;
        
        // Track velocity while dragging
        const vx = newX - prev.x;
        const vy = newY - prev.y;
        
        return { ...prev, x: newX, y: newY, vx, vy, lastX: prev.x, lastY: prev.y };
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      setBanana((prev) => {
        if (!prev.isDragging) return prev;

        // Quadratic throw effect based on last velocity  
        let totalVelocity = Math.sqrt(prev.vx * prev.vx + prev.vy * prev.vy);
        console.log("Total velocity on release:", totalVelocity);

        let multiplier = Math.min(1000, (totalVelocity) ** 1000);

        // 

        // Keep the velocity from dragging for throwing effect (2x multiplier)
        return {
          ...prev,
          isDragging: false,
          vx: prev.vx * multiplier,
          vy: prev.vy * multiplier,
        };
      });
    };

    if (banana.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [banana.isDragging]);

  return (
    <div ref={containerRef} data-section="enclosure-size-selector" style={{ position: "relative" }}>
      <div data-section="size-header" style={{ marginBottom: "2rem" }}>
        <h2 data-section="size-title" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
          Choose Your Enclosure Size
        </h2>
        <p data-section="size-description" style={{ color: "#888", fontSize: "0.95rem" }}>
          Select the perfect size for your pedal. {recommendedSize && `We recommend ${recommendedSize} for your selected effect.`}
        </p>
      </div>

      <div
        data-section="size-cards-grid"
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
              data-enclosure-card
              data-section="size-card"
              data-selected={isSelected}
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
                padding: "1rem",
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
                data-visual-representation
                style={{
                  width: "100%",
                  height: "160px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.5rem",
                  background: "#0a0a0a",
                  borderRadius: "8px",
                  position: "relative",
                }}
              >
                <div
                  data-size-box
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
                    boxSizing: "border-box",
                  }}
                >
                  {size.name}
                </div>
              </div>

              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "0.7rem",
                  marginTop: "0rem",
                  textAlign: "center",
                }}
              >
                {size.name}
              </h3>

              {!isRecommended && (
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#ffaa00",
                    textAlign: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  +€5.00
                </div>
              )}

              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#aaa",
                  textAlign: "center",
                  marginBottom: "0.25rem",
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
                  marginBottom: "0.25rem",
                  flex: 1,
                  textAlign: "center",
                }}
              >
                {size.funny_description}
              </p>

              <div
                style={{
                  marginBottom: "0.75rem",
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

      {/* Floating Banana for Scale */}
      <div
        data-section="banana-for-scale"
        onMouseDown={handleBananaMouseDown}
        style={{
          position: "fixed",
          left: `${banana.x}px`,
          top: `${banana.y}px`,
          width: "160px",
          height: "160px",
          fontSize: "90px",
          cursor: banana.isDragging ? "grabbing" : "grab",
          userSelect: "none",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
          transition: banana.isDragging ? "none" : "filter 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!banana.isDragging) {
            e.currentTarget.style.filter = "drop-shadow(0 4px 12px rgba(255,215,0,0.4))";
          }
        }}
        onMouseLeave={(e) => {
          if (!banana.isDragging) {
            e.currentTarget.style.filter = "drop-shadow(0 2px 8px rgba(0,0,0,0.3))";
          }
        }}
      >
        <img 
          src="/api/data/image/banana.svg" 
          alt="Banana for scale"
          style={{
            width: BANANA_SIZE + "px",
            height: BANANA_SIZE + "px",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#fff",
            marginTop: "0.25rem",
            textAlign: "center",
            pointerEvents: "none",
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
          }}
        >
          for scale
        </div>
      </div>
    </div>
  );
}

// Helper function to scale visual representation (top-down view - as pedals sit on pedalboard)
// Using actual dimensions from dimensions_mm: length × width × height
// We display length (depth) as CSS height, width as CSS width, at 0.85 scale
function getSizeWidth(sizeName: string): string {
  // Width (side-to-side on pedalboard)
  const widths: { [key: string]: string } = {
    "1590A": "35.1px",   // 39mm × 0.9
    "1590B": "54.9px",   // 61mm × 0.9
    "125B": "60.3px",    // 67mm × 0.9
    "1590BB": "84.6px",  // 94mm × 0.9
    "1590BS": "85.5px",  // 95mm × 0.9
    "1590XX": "108px",   // 120mm × 0.9
  };
  return widths[sizeName] || "60px";
}

function getSizeHeight(sizeName: string): string {
  // Length (depth on pedalboard)
  const heights: { [key: string]: string } = {
    "1590A": "83.7px",   // 93mm × 0.9
    "1590B": "99.9px",   // 111mm × 0.9
    "125B": "109.8px",   // 122mm × 0.9
    "1590BB": "107.1px", // 119mm × 0.9
    "1590BS": "112.5px", // 125mm × 0.9
    "1590XX": "130.5px", // 145mm × 0.9
  };
  return heights[sizeName] || "80px";
}
