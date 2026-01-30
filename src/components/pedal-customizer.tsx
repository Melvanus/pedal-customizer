"use client";

import * as React from "react";
import Image from "next/image";
import { Download } from "lucide-react";

export type OptionItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  customerPriceEUR: number;
};

export type PaintOption = OptionItem & {
  sku: string;
  finish?: string;
  color?: string;
  available?: boolean;
  displayedName: string;
  customerPriceEUR: number;
};

type PedalCustomizerProps = {
  paintOptions: PaintOption[];
  designOptions: OptionItem[];
  ledOptions: OptionItem[];
  otherOptions: OptionItem[];
};

const formatPrice = (value: number) => `€${value.toFixed(2)}`;
const normalize = (value: string) => value.toLowerCase().trim();

export function PedalCustomizer({
  paintOptions,
  designOptions,
  ledOptions,
  otherOptions,
}: PedalCustomizerProps) {
  const [activeTab, setActiveTab] = React.useState<"paint" | "design" | "led" | "other">("paint");
  const [selectedPaintId, setSelectedPaintId] = React.useState(paintOptions[0]?.id ?? "");
  const [selectedDesignId, setSelectedDesignId] = React.useState(designOptions[0]?.id ?? "");
  const [selectedLedId, setSelectedLedId] = React.useState(ledOptions[0]?.id ?? "");
  const [selectedOtherIds, setSelectedOtherIds] = React.useState<string[]>([]);
  const [labelText, setLabelText] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [colorFilter, setColorFilter] = React.useState("");
  const [finishFilter, setFinishFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState("name");

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
    return paintOptions
      .filter((option) =>
        term
          ? [option.name, option.sku, option.color, option.finish]
              .filter(Boolean)
              .some((value) => normalize(String(value)).includes(term))
          : true
      )
      .filter((option) => (colorFilter ? option.color === colorFilter : true))
      .filter((option) => (finishFilter ? option.finish === finishFilter : true))
      .sort((a, b) => {
        if (sortBy === "price") return a.customerPriceEUR - b.customerPriceEUR;
        if (sortBy === "sku") return a.sku.localeCompare(b.sku);
        if (sortBy === "color") return (a.color ?? "").localeCompare(b.color ?? "");
        if (sortBy === "finish") return (a.finish ?? "").localeCompare(b.finish ?? "");
        return a.name.localeCompare(b.name);
      });
  }, [paintOptions, searchTerm, colorFilter, finishFilter, sortBy]);

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

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#e0e0e0", background: "#0a0a0a", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          color: "white",
          padding: "1rem 0",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          borderBottom: "2px solid #333",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem", fontWeight: 300 }}>
          Fuzzy Engineering Pedal Customizer
        </h1>
        <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Configure Your Custom Pedal</p>
      </div>

      {/* Container */}
      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "2rem" }}>
        {/* Tabs */}
        <div
          style={{
            background: "#1a1a1a",
            padding: "1.5rem",
            borderRadius: "10px",
            boxShadow: "0 2px 15px rgba(0,0,0,0.5)",
            marginBottom: "2rem",
            border: "1px solid #333",
          }}
        >
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "2px solid #2d2d2d" }}>
            {(["paint", "design", "led", "other"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  background: activeTab === tab ? "#fff" : "transparent",
                  color: activeTab === tab ? "#000" : "#888",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  borderRadius: "5px 5px 0 0",
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

          {/* Paint/Finish Tab */}
          {activeTab === "paint" && (
            <>
              {/* Filters */}
              <div
                style={{
                  background: "#0f0f0f",
                  padding: "1.5rem",
                  borderRadius: "10px",
                  marginBottom: "2rem",
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr",
                  gap: "1rem",
                  border: "1px solid #2d2d2d",
                }}
              >
                <div>
                  <label style={{ fontWeight: 600, color: "#ccc", fontSize: "0.9rem", display: "block", marginBottom: "0.5rem" }}>
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
                      background: "#1a1a1a",
                      color: "#e0e0e0",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: "#ccc", fontSize: "0.9rem", display: "block", marginBottom: "0.5rem" }}>
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
                      background: "#1a1a1a",
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
                  <label style={{ fontWeight: 600, color: "#ccc", fontSize: "0.9rem", display: "block", marginBottom: "0.5rem" }}>
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
                      background: "#1a1a1a",
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
                  <label style={{ fontWeight: 600, color: "#ccc", fontSize: "0.9rem", display: "block", marginBottom: "0.5rem" }}>
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
                      background: "#1a1a1a",
                      color: "#e0e0e0",
                    }}
                  >
                    <option value="name">Name</option>
                    <option value="sku">SKU</option>
                    <option value="price">Price</option>
                    <option value="color">Color</option>
                    <option value="finish">Finish</option>
                  </select>
                </div>
              </div>

              {/* Paint Grid */}
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
                    onClick={() => setSelectedPaintId(option.id)}
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
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
                        <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>
                          {formatPrice(option.customerPriceEUR)}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem", color: "#e0e0e0", lineHeight: 1.3 }}>
                        {option.displayedName}
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #2d2d2d" }}>
                          <span style={{ fontWeight: 600, color: "#888", fontSize: "0.8rem" }}>Color</span>
                          <span style={{ color: "#aaa", fontSize: "0.8rem" }}>{option.color || "—"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0" }}>
                          <span style={{ fontWeight: 600, color: "#888", fontSize: "0.8rem" }}>Finish</span>
                          <span style={{ color: "#aaa", fontSize: "0.8rem" }}>{option.finish || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Design/Labeling Tab */}
          {activeTab === "design" && (
            <>
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e0e0e0" }}>{option.name}</div>
                        <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>
                          {formatPrice(option.customerPriceEUR)}
                        </span>
                      </div>
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
            </>
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e0e0e0" }}>{option.name}</div>
                      <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>
                        {formatPrice(option.customerPriceEUR)}
                      </span>
                    </div>
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e0e0e0" }}>{option.name}</div>
                      <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fff" }}>
                        {formatPrice(option.customerPriceEUR)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div
          style={{
            background: "#1a1a1a",
            padding: "2rem",
            borderRadius: "10px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.5)",
            position: "sticky",
            top: "2rem",
            border: "1px solid #333",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem", color: "#fff" }}>
            Configuration Summary
          </h2>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #2d2d2d" }}>
              <span style={{ fontWeight: 600, color: "#888" }}>Paint/Finish</span>
              <span style={{ color: "#aaa", textAlign: "right", maxWidth: "60%" }}>
                {selectedPaint ? `${selectedPaint.displayedName} (${selectedPaint.sku})` : "—"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #2d2d2d" }}>
              <span style={{ fontWeight: 600, color: "#888" }}>Design/Labeling</span>
              <span style={{ color: "#aaa" }}>{selectedDesign?.name || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #2d2d2d" }}>
              <span style={{ fontWeight: 600, color: "#888" }}>Label Text</span>
              <span style={{ color: "#aaa" }}>{labelText || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #2d2d2d" }}>
              <span style={{ fontWeight: 600, color: "#888" }}>LED</span>
              <span style={{ color: "#aaa" }}>{selectedLed?.name || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #2d2d2d" }}>
              <span style={{ fontWeight: 600, color: "#888" }}>Other Options</span>
              <span style={{ color: "#aaa" }}>{selectedOthers.length ? selectedOthers.map((o) => o.name).join(", ") : "None"}</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "1rem 0",
              marginBottom: "1.5rem",
              fontSize: "1.5rem",
              fontWeight: "bold",
              borderTop: "2px solid #fff",
            }}
          >
            <span style={{ color: "#fff" }}>Total</span>
            <span style={{ color: "#fff" }}>{formatPrice(totalPrice)}</span>
          </div>
          <button
            onClick={handleDownload}
            style={{
              width: "100%",
              padding: "1rem",
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: "10px",
              fontSize: "1.1rem",
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
            <Download size={20} />
            Download Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
