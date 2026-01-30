"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Download, ChevronRight, Star, Hammer, Mountain, Sparkles, Palette, Radiation } from "lucide-react";

export type OptionItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  customerPriceEUR: number;
  shortDescription?: string;
  longDescription?: string;
};

export type PaintOption = OptionItem & {
  sku: string;
  finish?: string;
  color?: string;
  available?: boolean;
  displayedName: string;
  customerPriceEUR: number;
  shortDescription?: string;
  longDescription?: string;
  rgb?: string;
  pantone?: string;
  isCustomColor?: boolean;
};

type PedalCustomizerProps = {
  paintOptions: PaintOption[];
  designOptions: OptionItem[];
  ledOptions: OptionItem[];
  otherOptions: OptionItem[];
  favouritePaintIds: string[];
};

const formatPrice = (value: number) => `€${value.toFixed(2)}`;
const normalize = (value: string) => value.toLowerCase().trim();

// Helper function to get finish type icon
const getFinishIcon = (finish?: string) => {
  if (!finish) return { Icon: Palette, color: "#888" };
  
  const finishLower = finish.toLowerCase();
  
  if (finishLower.includes("gloss")) {
    return { Icon: Star, color: "#ffd700" }; // Gold for glossy
  } else if (finishLower.includes("hammer")) {
    return { Icon: Hammer, color: "#a0a0a0" }; // Gray for hammered
  } else if (finishLower.includes("sand") || finishLower.includes("texture")) {
    return { Icon: Mountain, color: "#d4a574" }; // Sandy brown
  } else if (finishLower.includes("glow")) {
    return { Icon: Radiation, color: "#00ff00" }; // Green for glow-in-the-dark
  } else if (finishLower.includes("metallic")) {
    return { Icon: Sparkles, color: "#c0c0c0" }; // Silver for metallic
  } else {
    return { Icon: Palette, color: "#888" }; // Default for matte/standard
  }
};

export function PedalCustomizer({
  paintOptions,
  designOptions,
  ledOptions,
  otherOptions,
  favouritePaintIds,
}: PedalCustomizerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"paint" | "design" | "led" | "other">("paint");
  const [selectedPaintId, setSelectedPaintId] = React.useState(paintOptions[0]?.id ?? "");
  const [selectedDesignId, setSelectedDesignId] = React.useState(designOptions[0]?.id ?? "");
  const [selectedLedId, setSelectedLedId] = React.useState(ledOptions[0]?.id ?? "");
  const [selectedOtherIds, setSelectedOtherIds] = React.useState<string[]>([]);
  const [labelText, setLabelText] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [colorFilter, setColorFilter] = React.useState("");
  const [finishFilter, setFinishFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState("favourites");
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [customColor, setCustomColor] = React.useState("#808080");
  const [customFinish, setCustomFinish] = React.useState<"Matte" | "Glossy">("Matte");

  const selectedPaint = paintOptions.find((item) => item.id === selectedPaintId);
  const selectedDesign = designOptions.find((item) => item.id === selectedDesignId);
  const selectedLed = ledOptions.find((item) => item.id === selectedLedId);
  const selectedOthers = otherOptions.filter((item) => selectedOtherIds.includes(item.id));

  const totalPrice =
    (selectedPaint?.customerPriceEUR ?? 0) +
    (selectedDesign?.customerPriceEUR ?? 0) +
    (selectedLed?.customerPriceEUR ?? 0) +
    selectedOthers.reduce((sum, item) => sum + item.customerPriceEUR, 0);

  const paintStats = React.useMemo(() => {
    const available = paintOptions.length;
    const uniqueColors = new Set(paintOptions.map((option) => option.color).filter(Boolean)).size;
    const uniqueFinishes = new Set(paintOptions.map((option) => option.finish).filter(Boolean)).size;
    const avgPrice = paintOptions.reduce((sum, option) => sum + option.customerPriceEUR, 0) / (paintOptions.length || 1);
    return { available, uniqueColors, uniqueFinishes, avgPrice };
  }, [paintOptions]);

  const colorOptions = React.useMemo(
    () => Array.from(new Set(paintOptions.map((option) => option.color).filter(Boolean))).sort(),
    [paintOptions]
  );

  const finishOptions = React.useMemo(
    () => Array.from(new Set(paintOptions.map((option) => option.finish).filter(Boolean))).sort(),
    [paintOptions]
  );

  const filteredPaintOptions = React.useMemo(() => {
    const term = normalize(searchTerm);
    const hasActiveFilters = Boolean(term || colorFilter || finishFilter);
    
    const filtered = paintOptions
      .filter((option) =>
        term
          ? [option.name, option.sku, option.color, option.finish]
              .filter(Boolean)
              .some((value) => normalize(String(value)).includes(term))
          : true
      )
      .filter((option) => (colorFilter ? option.color === colorFilter : true))
      .filter((option) => (finishFilter ? option.finish === finishFilter : true))
      .filter((option) => hasActiveFilters ? !option.isCustomColor : true);

    if (sortBy === "favourites") {
      return [...filtered].sort((a, b) => {
        const aIndex = favouritePaintIds.indexOf(a.id);
        const bIndex = favouritePaintIds.indexOf(b.id);
        
        // If both are favourites, sort by their position in the favourites list
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        // If only a is a favourite, it comes first
        if (aIndex !== -1) return -1;
        // If only b is a favourite, it comes first
        if (bIndex !== -1) return 1;
        // Neither are favourites, maintain alphabetical order
        return a.name.localeCompare(b.name);
      });
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === "price") return a.customerPriceEUR - b.customerPriceEUR;
      if (sortBy === "sku") return a.sku.localeCompare(b.sku);
      if (sortBy === "color") return (a.color ?? "").localeCompare(b.color ?? "");
      if (sortBy === "finish") return (a.finish ?? "").localeCompare(b.finish ?? "");
      return a.name.localeCompare(b.name);
    });
  }, [paintOptions, searchTerm, colorFilter, finishFilter, sortBy, favouritePaintIds]);

  const handleToggleOther = (id: string) => {
    setSelectedOtherIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleDownload = () => {
    const designPayload = selectedDesign ? { ...selectedDesign, labelText } : { labelText };
    const payload = {
      createdAt: new Date().toISOString(),
      paint: selectedPaint ?? null,
      design: designPayload,
      led: selectedLed ?? null,
      other: selectedOthers,
      totalPrice,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pedal-configuration.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleProceedToSummary = () => {
    const configData = {
      paint: selectedPaint ?? null,
      design: selectedDesign ?? null,
      labelText,
      led: selectedLed ?? null,
      other: selectedOthers,
      totalPrice,
    };
    
    // Store configuration in sessionStorage
    sessionStorage.setItem("pedalConfiguration", JSON.stringify(configData));
    
    // Navigate to summary page
    router.push("/customize/summary");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#e0e0e0", background: "#0a0a0a" }}>
      {/* Ultra-Compact Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          color: "white",
          padding: "0.5rem 1rem",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          borderBottom: "2px solid #333",
          flexShrink: 0,
        }}
      >
        <h1 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 400 }}>
          Fuzzy Engineering Pedal Customizer
        </h1>
      </div>

      {/* Scrollable Content Area */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", paddingTop: "0", paddingBottom: "200px" }}>
          {/* Floating Tabs & Filters Panel */}
          <div
            style={{
              position: "sticky",
              top: "1rem",
              width: "100%",
              maxWidth: "800px",
              background: "rgba(26, 26, 26, 0.85)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 6px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "10px",
              zIndex: 100,
              padding: "1rem",
              marginBottom: "2rem",
              marginTop: "1rem",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: activeTab === "paint" ? "1rem" : 0, borderBottom: "2px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
              {(["paint", "design", "led", "other"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "0.6rem 1.2rem",
                    border: "none",
                    background: activeTab === tab ? "#fff" : "transparent",
                    color: activeTab === tab ? "#000" : "#888",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    borderRadius: "6px",
                    transition: "all 0.3s ease",
                  }}
                >
                  {tab === "paint" && "Paint / Finish"}
                  {tab === "design" && "Design / Labeling"}
                  {tab === "led" && "LED"}
                  {tab === "other" && "Other"}
                </button>
              ))}
            </div>

            {/* Filters for Paint Tab */}
            {activeTab === "paint" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label style={{ fontWeight: 600, color: "#ccc", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>
                    Search Products
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, SKU, color..."
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "2px solid #333",
                      borderRadius: "5px",
                      fontSize: "0.9rem",
                      background: "#0f0f0f",
                      color: "#e0e0e0",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: "#ccc", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>
                    Filter by Color
                  </label>
                  <select
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "2px solid #333",
                      borderRadius: "5px",
                      fontSize: "0.9rem",
                      background: "#0f0f0f",
                      color: "#e0e0e0",
                    }}
                  >
                    <option value="">All Colors</option>
                    {colorOptions.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: "#ccc", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>
                    Filter by Finish
                  </label>
                  <select
                    value={finishFilter}
                    onChange={(e) => setFinishFilter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "2px solid #333",
                      borderRadius: "5px",
                      fontSize: "0.9rem",
                      background: "#0f0f0f",
                      color: "#e0e0e0",
                    }}
                  >
                    <option value="">All Finishes</option>
                    {finishOptions.map((finish) => (
                      <option key={finish} value={finish}>{finish}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: "#ccc", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "2px solid #333",
                      borderRadius: "5px",
                      fontSize: "0.9rem",
                      background: "#0f0f0f",
                      color: "#e0e0e0",
                    }}
                  >
                    <option value="favourites">Fuzzy's Favourites</option>
                    <option value="name">Name</option>
                    <option value="sku">SKU</option>
                    <option value="price">Price</option>
                    <option value="color">Color</option>
                    <option value="finish">Finish</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Paint/Finish Tab */}
          {activeTab === "paint" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
                {filteredPaintOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => {
                      setSelectedPaintId(option.id);
                      if (option.isCustomColor) {
                        setShowColorPicker(true);
                      }
                    }}
                    style={{
                      background: "#0f0f0f",
                      borderRadius: "10px",
                      overflow: "hidden",
                      boxShadow: selectedPaintId === option.id ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      cursor: "pointer",
                      border: selectedPaintId === option.id ? "2px solid #fff" : "2px solid #2d2d2d",
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
                    <div style={{ width: "100%", height: "160px", background: "#1a1a1a", padding: "0.75rem", position: "relative" }}>
                      <Image src={option.image} alt={option.name} fill unoptimized style={{ objectFit: "contain" }} />
                    </div>
                    <div style={{ padding: "1rem" }}>
                      {option.isCustomColor && (
                        <div style={{
                          background: "rgba(255, 165, 0, 0.15)",
                          border: "1px solid rgba(255, 165, 0, 0.5)",
                          borderRadius: "5px",
                          padding: "0.5rem",
                          marginBottom: "0.75rem",
                          fontSize: "0.75rem",
                          color: "#ffaa00",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <span style={{ fontSize: "1rem" }}>⚠️</span>
                          <span>Requires Manual Review</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
                            {option.sku}
                          </span>
                          {(() => {
                            const { Icon, color } = getFinishIcon(option.isCustomColor ? customFinish : option.finish);
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
                                title={option.isCustomColor ? customFinish : (option.finish || "Standard Finish")}
                              >
                                <Icon size={16} color={color} />
                              </div>
                            );
                          })()}
                          {(option.rgb || option.isCustomColor) && (
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                background: option.isCustomColor ? customColor : option.rgb,
                                border: "2px solid rgba(255, 255, 255, 0.3)",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                              }}
                              title={option.isCustomColor ? `Custom: ${customColor}` : (option.pantone ? `Color: ${option.color}\nPantone: ${option.pantone}` : `Color: ${option.color}`)}
                            />
                          )}
                        </div>
                        <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>
                          {formatPrice(option.customerPriceEUR)}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem", color: "#e0e0e0", lineHeight: 1.3 }}>
                        {option.displayedName}
                      </div>
                      {option.shortDescription && (
                        <div style={{ fontSize: "0.8rem", color: "#999", marginBottom: "0.75rem", lineHeight: 1.4 }}>
                          {option.shortDescription}
                        </div>
                      )}
                      {option.isCustomColor && (
                        <div style={{
                          fontSize: "0.75rem",
                          color: "#888",
                          fontStyle: "italic",
                          marginBottom: "0.75rem",
                          padding: "0.5rem",
                          background: "rgba(255, 255, 255, 0.05)",
                          borderRadius: "5px",
                        }}>
                          📅 Custom colors are hand-sprayed and require 5-7 business days
                        </div>
                      )}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #2d2d2d" }}>
                          <span style={{ fontWeight: 600, color: "#888", fontSize: "0.8rem" }}>Color</span>
                          <span style={{ color: "#aaa", fontSize: "0.8rem" }}>{option.isCustomColor ? "Custom RGB" : (option.color || "—")}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0" }}>
                          <span style={{ fontWeight: 600, color: "#888", fontSize: "0.8rem" }}>Finish</span>
                          <span style={{ color: "#aaa", fontSize: "0.8rem" }}>{option.isCustomColor ? customFinish : (option.finish || "—")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          )}

          {/* Design/Labeling Tab */}
          {activeTab === "design" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "2rem",
                }}
              >
                {designOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setSelectedDesignId(option.id)}
                    style={{
                      background: "#0f0f0f",
                      borderRadius: "10px",
                      overflow: "hidden",
                      boxShadow: selectedDesignId === option.id ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      cursor: "pointer",
                      border: selectedDesignId === option.id ? "2px solid #fff" : "2px solid #2d2d2d",
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
                    <div style={{ width: "100%", height: "160px", background: "#1a1a1a", padding: "0.75rem", position: "relative" }}>
                      <Image src={option.image} alt={option.name} fill unoptimized style={{ objectFit: "contain" }} />
                    </div>
                    <div style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e0e0e0" }}>{option.name}</div>
                        <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>
                          {formatPrice(option.customerPriceEUR)}
                        </span>
                      </div>
                      {option.shortDescription && (
                        <div style={{ fontSize: "0.8rem", color: "#999", lineHeight: 1.4 }}>
                          {option.shortDescription}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: "#0f0f0f",
                  padding: "1.5rem",
                  borderRadius: "10px",
                  border: "1px solid #2d2d2d",
                }}
              >
                <label style={{ fontWeight: 600, color: "#ccc", fontSize: "0.9rem", display: "block", marginBottom: "0.5rem" }}>
                  Custom Label Text
                </label>
                <input
                  type="text"
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  placeholder="e.g. Aurora Drive"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #333",
                    borderRadius: "5px",
                    fontSize: "1rem",
                    background: "#1a1a1a",
                    color: "#e0e0e0",
                  }}
                />
              </div>
            </div>
          )}

          {/* LED Tab */}
          {activeTab === "led" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {ledOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => setSelectedLedId(option.id)}
                  style={{
                    background: "#0f0f0f",
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: selectedLedId === option.id ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    cursor: "pointer",
                    border: selectedLedId === option.id ? "2px solid #fff" : "2px solid #2d2d2d",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 5px 20px rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = selectedLedId === option.id ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)";
                  }}
                >
                  <div style={{ width: "100%", height: "160px", background: "#1a1a1a", padding: "0.75rem", position: "relative" }}>
                    <Image src={option.image} alt={option.name} fill unoptimized style={{ objectFit: "contain" }} />
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e0e0e0" }}>{option.name}</div>
                      <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>
                        {formatPrice(option.customerPriceEUR)}
                      </span>
                    </div>
                    {option.shortDescription && (
                      <div style={{ fontSize: "0.8rem", color: "#999", lineHeight: 1.4 }}>
                        {option.shortDescription}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other Tab */}
          {activeTab === "other" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {otherOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleToggleOther(option.id)}
                  style={{
                    background: "#0f0f0f",
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: selectedOtherIds.includes(option.id) ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    cursor: "pointer",
                    border: selectedOtherIds.includes(option.id) ? "2px solid #fff" : "2px solid #2d2d2d",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 5px 20px rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = selectedOtherIds.includes(option.id) ? "0 5px 20px rgba(255, 255, 255, 0.2)" : "0 3px 15px rgba(0,0,0,0.5)";
                  }}
                >
                  <div style={{ width: "100%", height: "160px", background: "#1a1a1a", padding: "0.75rem", position: "relative" }}>
                    <Image src={option.image} alt={option.name} fill unoptimized style={{ objectFit: "contain" }} />
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e0e0e0" }}>{option.name}</div>
                      <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>
                        {formatPrice(option.customerPriceEUR)}
                      </span>
                    </div>
                    {option.shortDescription && (
                      <div style={{ fontSize: "0.8rem", color: "#999", lineHeight: 1.4 }}>
                        {option.shortDescription}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Configuration Summary Panel */}
        <div
          style={{
            position: "fixed",
            bottom: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            width: "85%",
            maxWidth: "800px",
            background: "rgba(26, 26, 26, 0.85)",
            padding: "1rem",
            borderRadius: "10px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            zIndex: 1000,
            backdropFilter: "blur(10px)",
          }}
        >
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem", color: "#fff", textAlign: "center" }}>
            Configuration Summary
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <button
              onClick={() => setActiveTab("paint")}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "0.5rem",
                background: activeTab === "paint" ? "#fff" : "#0f0f0f",
                borderRadius: "5px",
                textAlign: "center",
                border: activeTab === "paint" ? "2px solid #fff" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "paint") {
                  e.currentTarget.style.background = "#1a1a1a";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "paint") {
                  e.currentTarget.style.background = "#0f0f0f";
                }
              }}
            >
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: activeTab === "paint" ? "#000" : "#888", marginBottom: "0.25rem" }}>Paint/Finish</span>
              <span style={{ fontSize: "0.8rem", color: activeTab === "paint" ? "#000" : "#aaa" }}>
                {selectedPaint ? selectedPaint.displayedName : "—"}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("design")}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "0.5rem",
                background: activeTab === "design" ? "#fff" : "#0f0f0f",
                borderRadius: "5px",
                textAlign: "center",
                border: activeTab === "design" ? "2px solid #fff" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "design") {
                  e.currentTarget.style.background = "#1a1a1a";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "design") {
                  e.currentTarget.style.background = "#0f0f0f";
                }
              }}
            >
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: activeTab === "design" ? "#000" : "#888", marginBottom: "0.25rem" }}>Design</span>
              <span style={{ fontSize: "0.8rem", color: activeTab === "design" ? "#000" : "#aaa" }}>{selectedDesign?.name || "—"}</span>
            </button>
            <button
              onClick={() => setActiveTab("design")}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "0.5rem",
                background: activeTab === "design" ? "#fff" : "#0f0f0f",
                borderRadius: "5px",
                textAlign: "center",
                border: activeTab === "design" ? "2px solid #fff" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "design") {
                  e.currentTarget.style.background = "#1a1a1a";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "design") {
                  e.currentTarget.style.background = "#0f0f0f";
                }
              }}
            >
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: activeTab === "design" ? "#000" : "#888", marginBottom: "0.25rem" }}>Label Text</span>
              <span style={{ fontSize: "0.8rem", color: activeTab === "design" ? "#000" : "#aaa" }}>{labelText || "—"}</span>
            </button>
            <button
              onClick={() => setActiveTab("led")}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "0.5rem",
                background: activeTab === "led" ? "#fff" : "#0f0f0f",
                borderRadius: "5px",
                textAlign: "center",
                border: activeTab === "led" ? "2px solid #fff" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "led") {
                  e.currentTarget.style.background = "#1a1a1a";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "led") {
                  e.currentTarget.style.background = "#0f0f0f";
                }
              }}
            >
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: activeTab === "led" ? "#000" : "#888", marginBottom: "0.25rem" }}>LED</span>
              <span style={{ fontSize: "0.8rem", color: activeTab === "led" ? "#000" : "#aaa" }}>{selectedLed?.name || "—"}</span>
            </button>
            <button
              onClick={() => setActiveTab("other")}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "0.5rem",
                background: activeTab === "other" ? "#fff" : "#0f0f0f",
                borderRadius: "5px",
                textAlign: "center",
                border: activeTab === "other" ? "2px solid #fff" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "other") {
                  e.currentTarget.style.background = "#1a1a1a";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "other") {
                  e.currentTarget.style.background = "#0f0f0f";
                }
              }}
            >
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: activeTab === "other" ? "#000" : "#888", marginBottom: "0.25rem" }}>Other Options</span>
              <span style={{ fontSize: "0.8rem", color: activeTab === "other" ? "#000" : "#aaa" }}>{selectedOthers.length ? selectedOthers.map((o) => o.name).join(", ") : "None"}</span>
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", marginBottom: "0.5rem", borderTop: "2px solid #fff", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>Total:</span>
              <span style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#fff" }}>{formatPrice(totalPrice)}</span>
            </div>
            <button
              onClick={handleProceedToSummary}
              style={{
                padding: "0.6rem 1.4rem",
                background: "#fff",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "transform 0.2s ease, background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.background = "#e0e0e0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "#fff";
              }}
            >
              Review & Submit
              <ChevronRight size={16} />
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: "0.6rem 1.2rem",
                background: "transparent",
                color: "#fff",
                border: "2px solid #fff",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "transform 0.2s ease, background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Download size={16} />
              Download JSON
            </button>
          </div>
        </div>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowColorPicker(false)}
        >
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: "15px",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", color: "#fff" }}>
              🎨 Custom Paint Color
            </h2>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#ccc", marginBottom: "0.5rem" }}>
                Choose Your Color
              </label>
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                style={{
                  width: "100%",
                  height: "60px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: customColor,
                }}
              />
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#aaa", fontFamily: "monospace" }}>
                Selected: {customColor}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#ccc", marginBottom: "0.75rem" }}>
                Finish Type
              </label>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setCustomFinish("Matte")}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: customFinish === "Matte" ? "2px solid #fff" : "2px solid rgba(255, 255, 255, 0.2)",
                    background: customFinish === "Matte" ? "#fff" : "transparent",
                    color: customFinish === "Matte" ? "#000" : "#fff",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  🎨 Matte
                </button>
                <button
                  onClick={() => setCustomFinish("Glossy")}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: customFinish === "Glossy" ? "2px solid #fff" : "2px solid rgba(255, 255, 255, 0.2)",
                    background: customFinish === "Glossy" ? "#fff" : "transparent",
                    color: customFinish === "Glossy" ? "#000" : "#fff",
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

            <div style={{
              background: "rgba(255, 165, 0, 0.15)",
              border: "1px solid rgba(255, 165, 0, 0.5)",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
              fontSize: "0.85rem",
              color: "#ffaa00",
              lineHeight: 1.5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                <strong>Important Note</strong>
              </div>
              <div style={{ paddingLeft: "1.7rem" }}>
                • Custom colors are hand-sprayed<br />
                • Requires manual review and confirmation<br />
                • Production time: 5-7 business days<br />
                • May vary slightly from digital preview
              </div>
            </div>

            <button
              onClick={() => setShowColorPicker(false)}
              style={{
                width: "100%",
                padding: "0.9rem",
                borderRadius: "8px",
                border: "2px solid #fff",
                background: "#fff",
                color: "#000",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e0e0e0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
              }}
            >
              Apply Custom Color
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
