"use client";

import * as React from "react";
import Image from "next/image";
import { X, ArrowRight } from "lucide-react";
import type { CompatibleMod } from "./EffectSelector";

export type SelectedModWithOptions = {
  mod: CompatibleMod;
  options?: Record<string, any>; // Stores user selections for additional_options
};

export type ProductModalData = {
  type: "effect" | "size" | "paint" | "design" | "led" | "other";
  title: string;
  subtitle?: string;
  price?: number;
  image?: string;
  images?: string[];
  description?: string;
  category?: string | string[];
  pcbSupplier?: string;
  recommendedSize?: string;
  details?: Array<{ label: string; value: string | string[] }>;
  technicalSpecs?: {
    potentiometers: number;
    switches: number;
    io_jacks: number;
    led_count: number;
    complexity: string;
  };
  controls?: Array<{ label: string; type: string; description: string }>;
  compatibleMods?: CompatibleMod[];
  selectedMods?: SelectedModWithOptions[];
  onModsChange?: (mods: SelectedModWithOptions[]) => void;
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
  availableBezelColors?: string[];
  selectedBezelColor?: string | null;
  onBezelColorChange?: (color: string) => void;
};

type ProductDetailModalProps = {
  product: ProductModalData | null;
  onClose: () => void;
  onSelectAndContinue: () => void;
  nextTabName?: string;
  imageSize?: { width: number; height: number };
};

export function ProductDetailModal({
  product,
  onClose,
  onSelectAndContinue,
  nextTabName,
  imageSize = { width: 400, height: 250 },
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [localSelectedMods, setLocalSelectedMods] = React.useState<SelectedModWithOptions[]>([]);

  // Initialize local mods from product when it changes
  React.useEffect(() => {
    console.log('🔄 [ProductDetailModal] Initializing modal with product:', {
      productType: product?.type,
      productTitle: product?.title,
      selectedMods: product?.selectedMods,
      modsCount: product?.selectedMods?.length || 0
    });
    if (product) {
      setLocalSelectedMods(product.selectedMods || []);
    } else {
      setLocalSelectedMods([]);
    }
    // Use JSON.stringify to ensure deep comparison of selected mods
  }, [product]);

  // Compute effective controls based on selected mods
  const effectiveControls = React.useMemo(() => {
    if (!product?.controls) return [];
    
    let controls = [...product.controls];
    
    localSelectedMods.forEach(({ mod }) => {
      // Remove controls specified in removes_controls
      if (mod.removes_controls) {
        controls = controls.filter(c => !mod.removes_controls!.includes(c.label));
      }
      // Add new controls from adds_controls
      if (mod.adds_controls) {
        controls = [...controls, ...mod.adds_controls];
      }
    });
    
    return controls;
  }, [product?.controls, localSelectedMods]);

  // Compute total mod price
  const modsTotalPrice = React.useMemo(() => {
    return localSelectedMods.reduce((sum, { mod }) => sum + (mod.customer_price_eur ?? 0), 0);
  }, [localSelectedMods]);

  // Compute effective technical specs based on selected mods
  const effectiveTechnicalSpecs = React.useMemo(() => {
    if (!product?.technicalSpecs) return null;
    
    const specs = { ...product.technicalSpecs };
    
    localSelectedMods.forEach(({ mod }) => {
      if (mod.adds_technical_specs) {
        if (mod.adds_technical_specs.potentiometers) {
          specs.potentiometers += mod.adds_technical_specs.potentiometers;
        }
        if (mod.adds_technical_specs.switches) {
          specs.switches += mod.adds_technical_specs.switches;
        }
        if (mod.adds_technical_specs.io_jacks) {
          specs.io_jacks += mod.adds_technical_specs.io_jacks;
        }
        if (mod.adds_technical_specs.led_count) {
          specs.led_count += mod.adds_technical_specs.led_count;
        }
      }
    });
    
    return specs;
  }, [product?.technicalSpecs, localSelectedMods]);

  const handleModToggle = (mod: CompatibleMod) => {
    console.log('🎯 [ProductDetailModal] Toggling mod:', mod.name);
    setLocalSelectedMods(prev => {
      const isSelected = prev.some(m => m.mod.name === mod.name);
      let newMods;
      if (isSelected) {
        console.log('  ➖ Removing mod:', mod.name);
        newMods = prev.filter(m => m.mod.name !== mod.name);
      } else {
        console.log('  ➕ Adding mod:', mod.name);
        // Initialize with default values for additional_options
        const defaultOptions: Record<string, any> = {};
        if (mod.additional_options) {
          mod.additional_options.forEach(opt => {
            if (opt.type === "NumberRange" && opt.default !== undefined) {
              defaultOptions[opt.label] = opt.default;
            } else if (opt.type === "MultiSelect" && opt.default !== undefined) {
              defaultOptions[opt.label] = opt.default;
            }
          });
        }
        newMods = [...prev, { mod, options: defaultOptions }];
      }
      console.log('  � New mods state:', newMods.map(m => m.mod.name));
      // Don't call onModsChange here - let the useEffect handle it
      return newMods;
    });
  };

  const handleModOptionChange = (modName: string, optionLabel: string, value: any) => {
    setLocalSelectedMods(prev => {
      const newMods = prev.map(item => {
        if (item.mod.name === modName) {
          return {
            ...item,
            options: {
              ...item.options,
              [optionLabel]: value,
            },
          };
        }
        return item;
      });
      // Don't call onModsChange here - let the useEffect handle it
      return newMods;
    });
  };

  // Notify parent of changes
  React.useEffect(() => {
    console.log('🔁 [ProductDetailModal] Sync effect running. LocalSelectedMods:', 
      localSelectedMods.map(m => m.mod.name));
    if (product?.onModsChange) {
      console.log('  📤 Calling onModsChange from effect with', localSelectedMods.length, 'mods');
      product.onModsChange(localSelectedMods);
    }
  }, [localSelectedMods, product?.onModsChange]);

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
      data-section="modal-overlay"
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
        data-section="modal-content"
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
          data-section="close-button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "0.25rem",
            right: "0.25rem",
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
        <div data-section="modal-body" style={{ padding: "1rem" }}>
          {/* Image Section */}
          {currentImage && (
            <div
              data-section="product-image"
              style={{
                width: "100%",
                height: `${imageSize.height}px`,
                background: product.type === "effect" ? "#ffffff" : "#0a0a0a",
                borderRadius: "12px",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "1px solid #333",
                position: "relative",
              }}
            >
              {currentImage.toLowerCase().endsWith('.svg') ? (
                <img
                  src={currentImage}
                  alt={product.title}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <Image
                  src={currentImage}
                  alt={product.title}
                  width={imageSize.width}
                  height={imageSize.height}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
              
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
          <div data-section="title-price" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              {/* Left: Title and Subtitle (takes most space, can overlap with price) */}
              <div style={{ flex: "1 1 auto", minWidth: 0, marginBottom: "1rem" }}>
                <h2
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {product.title}
                </h2>
                {product.subtitle && product.type === "effect" && (
                  <div style={{ fontSize: "0.85rem", color: "#888", fontStyle: "italic", marginTop: "0.25rem" }}>
                    Inspired by: {product.subtitle.replace("Inspired by: ", "")}
                  </div>
                )}
                {product.subtitle && product.type !== "effect" && (
                  <p style={{ color: "#888", fontSize: "0.85rem", margin: 0, marginTop: "0.25rem" }}>
                    {product.subtitle}
                  </p>
                )}
              </div>
              {/* Right: Price (fixed width, won't force text wrap) */}
              {product.price !== undefined && (
                <div style={{ flex: "0 0 auto", minWidth: "180px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#4ade80",
                        marginTop: 0,
                      }}
                    >
                      {product.price > 0 ? `€${(product.price + modsTotalPrice).toFixed(2)}` : modsTotalPrice > 0 ? `€${modsTotalPrice.toFixed(2)}` : "Included"}
                    </div>
                    {modsTotalPrice > 0 && (
                      <div style={{ fontSize: "0.75rem", color: "#888", textAlign: "right", whiteSpace: "nowrap" }}>
                        Base: €{product.price.toFixed(2)}<br/>+ Mods: €{modsTotalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div
              data-section="product-description"
              style={{
                marginTop: "-1.75rem",
                marginBottom: "1rem",
                padding: "1rem",
                background: "#0a0a0a",
                borderRadius: "8px",
                border: "1px solid #333",
              }}
            >
              <p style={{marginTop: "-0.25rem", marginBottom: "-0.25rem", color: "#ccc", fontSize: "0.95rem", lineHeight: 1.6 }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Specifications (for effect pedals) - Combined General Info + Technical Specs */}
          {product.type === "effect" && (product.category || product.recommendedSize || effectiveTechnicalSpecs) && (
            <div data-section="specifications" style={{ marginBottom: "0.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "0.25rem",
                }}
              >
                Specifications
              </h3>
              <div
                style={{
                  padding: "0.75rem",
                  background: "#0a0a0a",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: "0.5rem",
                }}
              >
                {product.category && (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "#888",
                        marginBottom: "0.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {"Category"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      {Array.isArray(product.category) 
                        ? product.category[0]
                        : product.category}
                    </div>
                  </div>
                )}
                {product.recommendedSize && (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "#888",
                        marginBottom: "0.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Rec. Size
                    </div>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "#fff",
                      }}
                    >
                      {product.recommendedSize}
                    </div>
                  </div>
                )}
                {effectiveTechnicalSpecs && (
                  <>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "#888",
                          marginBottom: "0.25rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Pots
                      </div>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {effectiveTechnicalSpecs.potentiometers}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "#888",
                          marginBottom: "0.25rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Switches
                      </div>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {effectiveTechnicalSpecs.switches}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "#888",
                          marginBottom: "0.25rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        In/Outputs
                      </div>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {effectiveTechnicalSpecs.io_jacks}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "#888",
                          marginBottom: "0.25rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        LEDs
                      </div>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {effectiveTechnicalSpecs.led_count}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Compatible Mods Section (for effect pedals) */}
          {product.type === "effect" && product.compatibleMods && product.compatibleMods.length > 0 && (
            <div data-section="compatible-mods" style={{ marginBottom: "0.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "0.25rem",
                }}
              >
                Compatible Modifications
                {localSelectedMods.length > 0 && (
                  <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#4ade80", marginLeft: "0.5rem" }}>
                    (+€{modsTotalPrice.toFixed(2)})
                  </span>
                )}
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {product.compatibleMods.map((mod, idx) => {
                  const isSelected = localSelectedMods.some(m => m.mod.name === mod.name);
                  const selectedMod = localSelectedMods.find(m => m.mod.name === mod.name);
                  
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "1rem",
                        background: isSelected ? "#0f2a0f" : "#0a0a0a",
                        borderRadius: "8px",
                        border: isSelected ? "2px solid #4ade80" : "1px solid #333",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleModToggle(mod)}
                          style={{
                            width: "20px",
                            height: "20px",
                            marginTop: "0.2rem",
                            cursor: "pointer",
                            accentColor: "#4ade80",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>
                              {mod.name}
                            </div>
                            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#4ade80" }}>
                              +€{(mod.customer_price_eur ?? 0).toFixed(2)}
                            </div>
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#aaa", lineHeight: 1.5, marginBottom: (isSelected && mod.hint) || (mod.additional_options && isSelected) ? "0.75rem" : 0 }}>
                            {mod.description}
                          </div>
                          
                          {isSelected && mod.hint && (
                            <div style={{ 
                              fontSize: "0.8rem", 
                              color: "#ffaa00", 
                              background: "rgba(255, 170, 0, 0.1)",
                              padding: "0.5rem",
                              borderRadius: "4px",
                              border: "1px solid rgba(255, 170, 0, 0.3)",
                              marginBottom: mod.additional_options && isSelected ? "0.75rem" : 0,
                            }}>
                              💡 {mod.hint}
                            </div>
                          )}

                          {/* Additional Options for this mod */}
                          {isSelected && mod.additional_options && mod.additional_options.length > 0 && (
                            <div style={{ 
                              marginTop: "0.1rem",
                              paddingTop: "0.1rem",
                              borderTop: "1px solid #333",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem",
                            }}>
                              {mod.additional_options.map((option, optIdx) => {
                                const currentValue = selectedMod?.options?.[option.label];
                                
                                return (
                                  <div key={optIdx}>
                                    <div style={{ 
                                      display: "flex", 
                                      alignItems: "baseline", 
                                      gap: "0.75rem",
                                      marginBottom: "0.1rem" 
                                    }}>
                                      <label style={{ 
                                        fontSize: "0.85rem", 
                                        fontWeight: 600, 
                                        color: "#ccc",
                                        whiteSpace: "nowrap"
                                      }}>
                                        {option.label}
                                      </label>
                                      <div style={{ fontSize: "0.75rem", color: "#888" }}>
                                        {option.description}
                                      </div>
                                    </div>

                                    {option.type === "NumberRange" && option.range && (
                                      <div style={{ 
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "0.75rem",
                                        marginBottom: "0.1rem",
                                        marginTop: "0.1rem",
                                        }}>
                                        <input
                                          type="number"
                                          min={option.range[0]}
                                          max={option.range[1]}
                                          value={currentValue ?? option.default ?? option.range[0]}
                                          onChange={(e) => handleModOptionChange(mod.name, option.label, Number(e.target.value))}
                                          style={{
                                            width: "100px",
                                            padding: "0.2rem",
                                            background: "#0a0a0a",
                                            border: "1px solid #555",
                                            borderRadius: "4px",
                                            color: "#fff",
                                            fontSize: "0.9rem",
                                          }}
                                        />
                                        <div style={{ fontSize: "0.7rem", color: "#666" }}>
                                          Range: {option.range[0]} - {option.range[1]} Hz
                                        </div>
                                      </div>
                                    )}

                                    {option.type === "MultiSelect" && option.options && (
                                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {option.options.map((choice, choiceIdx) => {
                                          const selectedChoices = (currentValue as string[]) || option.default || [];
                                          const isChoiceSelected = selectedChoices.includes(choice);
                                          const canSelect = !isChoiceSelected && (!option.max_selections || selectedChoices.length < option.max_selections);
                                          
                                          return (
                                            <label
                                              key={choiceIdx}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                padding: "0.5rem",
                                                background: isChoiceSelected ? "#0f2a0f" : "#0a0a0a",
                                                border: isChoiceSelected ? "1px solid #4ade80" : "1px solid #555",
                                                borderRadius: "4px",
                                                cursor: isChoiceSelected || canSelect ? "pointer" : "not-allowed",
                                                opacity: isChoiceSelected || canSelect ? 1 : 0.5,
                                              }}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isChoiceSelected}
                                                disabled={!isChoiceSelected && !canSelect}
                                                onChange={(e) => {
                                                  const newSelections = e.target.checked
                                                    ? [...selectedChoices, choice]
                                                    : selectedChoices.filter(c => c !== choice);
                                                  handleModOptionChange(mod.name, option.label, newSelections);
                                                }}
                                                style={{
                                                  width: "16px",
                                                  height: "16px",
                                                  cursor: "pointer",
                                                  accentColor: "#4ade80",
                                                }}
                                              />
                                              <span style={{ fontSize: "0.85rem", color: "#fff" }}>{choice}</span>
                                            </label>
                                          );
                                        })}
                                        <div style={{ fontSize: "0.7rem", color: "#666", marginTop: "0.25rem" }}>
                                          {option.max_selections && `Select up to ${option.max_selections} options`}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls Section (for effect pedals) */}
          {product.type === "effect" && effectiveControls && effectiveControls.length > 0 && (
            <div data-section="controls" style={{ marginBottom: "0.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "0.25rem",
                }}
              >
                Controls
              </h3>
              <div
                style={{
                  padding: "1rem",
                  background: "#0a0a0a",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {effectiveControls.map((control, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                      paddingBottom: idx < effectiveControls.length - 1 ? "0.5rem" : "0",
                      borderBottom: idx < effectiveControls.length - 1 ? "1px solid #333" : "none",
                    }}
                  >
                    <div
                      style={{
                        flex: "0 0 auto",
                        display: "flex",
                        alignItems: "baseline",
                        gap: "0.5rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {control.label}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#666",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        ({control.type})
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        fontSize: "0.85rem",
                        color: "#aaa",
                        lineHeight: 1.4,
                      }}
                    >
                        {control.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details Grid */}
          {product.details && product.details.length > 0 && (
            <div data-section="details-grid" style={{ marginBottom: "0.5rem" }}>
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
                        flex: "0 0 80px",
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

          {/* Custom Paint Color & Finish Selector */}
          {product.type === "paint" && product.is_custom_color && product.onCustomColorChange && product.onCustomFinishChange && (
            <div data-section="custom-paint" style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "1rem",
                }}
              >
                Customize Your Paint
              </h3>
              
              {/* Color Picker */}
              <div style={{ 
                marginBottom: "1.5rem", 
                padding: "1rem", 
                background: "#0a0a0a", 
                borderRadius: "8px",
                border: "1px solid #333"
              }}>
                <label style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", display: "block", marginBottom: "0.75rem" }}>
                  Custom Color:
                </label>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <input
                    type="color"
                    value={product.customColor || "#000000"}
                    onChange={(e) => product.onCustomColorChange!(e.target.value)}
                    style={{
                      width: "80px",
                      height: "80px",
                      border: "2px solid #666",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: "transparent"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={product.customColor || "#000000"}
                      onChange={(e) => product.onCustomColorChange!(e.target.value)}
                      placeholder="#000000"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "#1a1a1a",
                        border: "1px solid #666",
                        borderRadius: "6px",
                        color: "#fff",
                        fontSize: "1rem",
                        fontFamily: "monospace"
                      }}
                    />
                    <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.5rem" }}>
                      Enter hex color code or use the picker
                    </div>
                  </div>
                </div>
              </div>

              {/* Finish Selector */}
              <div style={{ 
                padding: "1rem", 
                background: "#0a0a0a", 
                borderRadius: "8px",
                border: "1px solid #333"
              }}>
                <label style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", display: "block", marginBottom: "0.75rem" }}>
                  Finish Type:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {(["Matte", "Glossy"] as const).map((finish) => (
                    <div
                      key={finish}
                      onClick={() => product.onCustomFinishChange!(finish)}
                      style={{
                        background: "#1a1a1a",
                        borderRadius: "8px",
                        padding: "1rem",
                        cursor: "pointer",
                        border: product.customFinish === finish ? "2px solid #4ade80" : "2px solid #333",
                        transition: "all 0.2s ease",
                        textAlign: "center"
                      }}
                      onMouseEnter={(e) => {
                        if (product.customFinish !== finish) {
                          e.currentTarget.style.borderColor = "#666";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (product.customFinish !== finish) {
                          e.currentTarget.style.borderColor = "#333";
                        }
                      }}
                    >
                      <div style={{ fontSize: "1rem", fontWeight: 600, color: product.customFinish === finish ? "#4ade80" : "#fff" }}>
                        {finish}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem" }}>
                        {finish === "Matte" ? "Smooth, non-reflective" : "Shiny, reflective"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Additional Sections */}
          {product.additionalSections?.map((section, idx) => (
            <div key={idx} style={{ marginBottom: "0.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "0.25rem",
                }}
              >
                {section.title}
              </h3>
              <div>{section.content}</div>
            </div>
          ))}

          {/* LED Bezel/Lens Color Picker */}
          {product.type === "led" && product.availableBezelColors && product.availableBezelColors.length > 0 && product.onBezelColorChange && (
            <div data-section="led-bezel-color-picker" style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "1rem",
                }}
              >
                🎨 Choose Bezel/Lens Color
              </h3>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", 
                gap: "0.75rem",
                marginBottom: "1rem"
              }}>
                {product.availableBezelColors.map((color) => {
                  const colorMap: Record<string, string> = {
                    "red": "#ff0000",
                    "blue": "#0066ff",
                    "green": "#00ff00",
                    "yellow": "#ffff00",
                    "amber": "#ffbf00",
                    "purple": "#bf00ff",
                    "clear": "#ffffff",
                  };
                  
                  const displayName = color.charAt(0).toUpperCase() + color.slice(1);
                  const hexColor = colorMap[color.toLowerCase()] || "#888888";
                  
                  return (
                    <div
                      key={color}
                      onClick={() => product.onBezelColorChange!(color)}
                      style={{
                        background: "#0a0a0a",
                        borderRadius: "8px",
                        padding: "0.75rem",
                        cursor: "pointer",
                        border: product.selectedBezelColor === color ? "2px solid #fff" : "2px solid #333",
                        boxShadow: product.selectedBezelColor === color ? "0 3px 10px rgba(255, 255, 255, 0.2)" : "none",
                        transition: "all 0.2s ease",
                        textAlign: "center"
                      }}
                      onMouseEnter={(e) => {
                        if (product.selectedBezelColor !== color) {
                          e.currentTarget.style.borderColor = "#666";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (product.selectedBezelColor !== color) {
                          e.currentTarget.style.borderColor = "#333";
                        }
                      }}
                    >
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: hexColor,
                        margin: "0 auto 0.5rem",
                        boxShadow: color.toLowerCase() !== "clear" ? `0 0 15px ${hexColor}` : "none",
                        border: color.toLowerCase() === "clear" ? "2px solid #666" : "none",
                        opacity: color.toLowerCase() === "clear" ? 0.3 : 1,
                      }} />
                      <div style={{ fontSize: "0.8rem", color: "#e0e0e0", fontWeight: product.selectedBezelColor === color ? 600 : 400 }}>
                        {displayName}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{
                background: "rgba(255, 165, 0, 0.1)",
                border: "1px solid rgba(255, 165, 0, 0.3)",
                borderRadius: "8px",
                padding: "0.75rem",
                fontSize: "0.85rem",
                color: "#ffaa00",
                lineHeight: 1.5,
              }}>
                <strong>ℹ️ Note:</strong> The bezel/lens color affects the appearance of the LED indicator on your pedal enclosure.
              </div>
            </div>
          )}

          {/* LED Color Picker */}
          {product.type === "led" && product.onLedColorChange && product.onCustomLedColorChange && (
            <div data-section="led-color-picker" style={{ marginBottom: "1.5rem" }}>
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
            <div data-section="custom-color-picker" style={{ marginBottom: "1.5rem" }}>
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
                  Custom colors may vary slightly from screen display. We&apos;ll match your selection as
                  closely as possible with automotive-grade paint.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          data-section="action-buttons"
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
