"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Download, ChevronRight, Star, Hammer, Mountain, Sparkles, Palette, Radiation, Cat, Sun, LucideCircleSlash2, Circle } from "lucide-react";
import { EffectSelector, type EffectPedal } from "./EffectSelector";
import { EnclosureSizeSelector, type EnclosureSize } from "./EnclosureSizeSelector";
import { ProductDetailModal, type ProductModalData, type SelectedModWithOptions } from "./ProductDetailModal";

export type OptionItem = {
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

export type PaintOption = OptionItem & {
  supplier_sku: string;
  supplier_id: string;
  internal_product_id: string;
  finish?: string;
  color?: string;
  available?: boolean;
  displayed_name: string;
  customer_price_eur: number;
  short_description?: string;
  long_description?: string;
  rgb?: string;
  pantone?: string;
  is_custom_color?: boolean;
};

type PedalCustomizerProps = {
  effectPedals: EffectPedal[];
  enclosureSizes: EnclosureSize[];
  paintOptions: PaintOption[];
  designOptions: OptionItem[];
  ledOptions: OptionItem[];
  favouritePaintIds: string[];
};

const formatPrice = (value: number) => `€${value.toFixed(2)}`;
const normalize = (value: string) => value.toLowerCase().trim();

// Helper function to get finish type icon
const getFinishIcon = (finish?: string) => {
  if (!finish) return { Icon: Palette, color: "#888" };
  
  const finishLower = finish.toLowerCase();
  
  if (finishLower.includes("gloss")) {
    return { Icon: Sun, color: "#ffd700" }; // Gold for glossy
  } else if (finishLower.includes("matte")) {
    return { Icon: Circle, color: "#555" }; // Dark gray for matte
  } else if (finishLower.includes("hammer")) {
    return { Icon: Hammer, color: "#a0a0a0" }; // Gray for hammered
  } else if (finishLower.includes("sand") || finishLower.includes("texture")) {
    return { Icon: Mountain, color: "#d4a574" }; // Sandy brown
  } else if (finishLower.includes("glow")) {
    return { Icon: Radiation, color: "#00ff00" }; // Green for glow-in-the-dark
  } else if (finishLower.includes("metallic")) {
    return { Icon: Sparkles, color: "#c0c0c0" }; // Silver for metallic
  } else if (finishLower.includes("furry")) {
    return { Icon: Cat, color: "#d2691e" }; // Brown for furry
  } else {
    return { Icon: Palette, color: "#888" }; // Default for matte/standard
  }
};

export function PedalCustomizer({
  effectPedals,
  enclosureSizes,
  paintOptions,
  designOptions,
  ledOptions,
  favouritePaintIds,
}: PedalCustomizerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"effect" | "size" | "paint" | "design" | "led">("effect");
  const [selectedEffectId, setSelectedEffectId] = React.useState(effectPedals[0]?.id ?? "");
  const [selectedEnclosureSizeId, setSelectedEnclosureSizeId] = React.useState(enclosureSizes[0]?.name ?? "");
  const [selectedPaintId, setSelectedPaintId] = React.useState(paintOptions[0]?.id ?? "");
  const [selectedDesignId, setSelectedDesignId] = React.useState(designOptions[0]?.id ?? "");
  const [selectedLedId, setSelectedLedId] = React.useState(ledOptions[0]?.id ?? "");
  const [selectedLedColor, setSelectedLedColor] = React.useState<string>("Red");
  const [customLedColor, setCustomLedColor] = React.useState<string>("#ff0000");
  const [selectedEffectMods, setSelectedEffectMods] = React.useState<SelectedModWithOptions[]>([]);
  const [labelText, setLabelText] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [colorFilter, setColorFilter] = React.useState("");
  const [finishFilter, setFinishFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState("favourites");
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [customColor, setCustomColor] = React.useState("#808080");
  const [customFinish, setCustomFinish] = React.useState<"Matte" | "Glossy">("Matte");
  const [hasInteractedWithCustomPaint, setHasInteractedWithCustomPaint] = React.useState(false);
  const [adminMode, setAdminMode] = React.useState(false);
  const [availableImages, setAvailableImages] = React.useState<string[]>([]);
  const [dragOverSku, setDragOverSku] = React.useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = React.useState<Record<string, number>>({});
  const [modalProduct, setModalProduct] = React.useState<ProductModalData | null>(null);
  const [summaryHeight, setSummaryHeight] = React.useState(0);
  const summaryRef = React.useRef<HTMLDivElement>(null);

  const selectedEffect = effectPedals.find((item) => item.id === selectedEffectId);
  const selectedSize = enclosureSizes.find((item) => item.name === selectedEnclosureSizeId);
  const selectedPaint = paintOptions.find((item) => item.id === selectedPaintId);
  const selectedDesign = designOptions.find((item) => item.id === selectedDesignId);
  const selectedLed = ledOptions.find((item) => item.id === selectedLedId);

  // Auto-select recommended enclosure size when effect changes
  React.useEffect(() => {
    if (selectedEffect?.recommended_enclosure) {
      setSelectedEnclosureSizeId(selectedEffect.recommended_enclosure);
    }
    // Reset mods when effect changes
    setSelectedEffectMods([]);
  }, [selectedEffectId, selectedEffect]);

  // Measure configuration summary height and update padding
  React.useEffect(() => {
    const measureHeight = () => {
      if (summaryRef.current) {
        const height = summaryRef.current.offsetHeight;
        setSummaryHeight(height + 32); // +32 for top margin (1rem) + some extra spacing
      }
    };
    
    // Measure on mount and when window resizes
    measureHeight();
    window.addEventListener('resize', measureHeight);
    
    return () => window.removeEventListener('resize', measureHeight);
  }, []);

  // Calculate mod costs
  const modsTotalPrice = React.useMemo(() => {
    return selectedEffectMods.reduce((sum, { mod }) => sum + mod.customer_price_eur, 0);
  }, [selectedEffectMods]);

  const totalPrice =
    (selectedEffect?.customer_price_eur ?? 0) +
    modsTotalPrice +
    (selectedPaint?.customer_price_eur ?? 0) +
    (selectedDesign?.customer_price_eur ?? 0) +
    (selectedLed?.customer_price_eur ?? 0);

  // Tab navigation helper
  const advanceToNextTab = () => {
    const tabOrder: Array<typeof activeTab> = ["effect", "size", "paint", "design", "led"];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  const getNextTabName = (): string | undefined => {
    const tabNames = {
      effect: "Size",
      size: "Paint",
      paint: "Design",
      design: "LED",
      led: "Other",
      other: undefined,
    };
    return tabNames[activeTab];
  };

  // Modal handler for select & continue
  const handleModalSelectAndContinue = () => {
    // Handle selection based on modal type
    if (modalProduct) {
      switch (modalProduct.type) {
        case "effect":
          // Find effect by name and select it
          const effectPedal = effectPedals.find(
            p => p.name === modalProduct.title
          );
          if (effectPedal) {
            setSelectedEffectId(effectPedal.id);
          }
          break;
        case "size":
          // Select the size by name
          const size = enclosureSizes.find(
            s => s.name === modalProduct.title
          );
          if (size) {
            setSelectedEnclosureSizeId(size.name);
          }
          break;
        case "paint":
          // Find the paint option and select it
          const paintOption = paintOptions.find(
            p => (p.displayed_name || p.name) === modalProduct.title
          );
          if (paintOption) {
            setSelectedPaintId(paintOption.id);
            if (paintOption.is_custom_color && !hasInteractedWithCustomPaint) {
              setShowColorPicker(true);
            }
          }
          break;
        case "design":
          const designOption = designOptions.find(
            d => d.name === modalProduct.title
          );
          if (designOption) {
            setSelectedDesignId(designOption.id);
          }
          break;
        case "led":
          const ledOption = ledOptions.find(
            l => l.name === modalProduct.title
          );
          if (ledOption) {
            setSelectedLedId(ledOption.id);
          }
          break;
      }
    }
    
    setModalProduct(null);
    advanceToNextTab();
  };

  const paintStats = React.useMemo(() => {
    const available = paintOptions.length;
    const uniqueColors = new Set(paintOptions.map((option) => option.color).filter(Boolean)).size;
    const uniqueFinishes = new Set(paintOptions.map((option) => option.finish).filter(Boolean)).size;
    const avgPrice = paintOptions.reduce((sum, option) => sum + option.customer_price_eur, 0) / (paintOptions.length || 1);
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
          ? [option.name, option.supplier_sku, option.color, option.finish]
              .filter(Boolean)
              .some((value) => normalize(String(value)).includes(term))
          : true
      )
      .filter((option) => (colorFilter ? option.color === colorFilter : true))
      .filter((option) => (finishFilter ? option.finish === finishFilter : true))
      .filter((option) => hasActiveFilters ? !option.is_custom_color : true);

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
      if (sortBy === "price") return a.customer_price_eur - b.customer_price_eur;
      if (sortBy === "sku") return a.supplier_sku.localeCompare(b.supplier_sku);
      if (sortBy === "color") return (a.color ?? "").localeCompare(b.color ?? "");
      if (sortBy === "finish") return (a.finish ?? "").localeCompare(b.finish ?? "");
      return a.name.localeCompare(b.name);
    });
  }, [paintOptions, searchTerm, colorFilter, finishFilter, sortBy, favouritePaintIds]);

  // Load available images when admin mode is enabled
  React.useEffect(() => {
    if (adminMode) {
      fetch("/api/admin/list-images")
        .then((res) => res.json())
        .then((data) => setAvailableImages(data.images || []))
        .catch(console.error);
    }
  }, [adminMode]);

  const handleDragOver = (e: React.DragEvent, identifier: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSku(identifier);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSku(null);
  };

  const handleDrop = async (e: React.DragEvent, identifier: string, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSku(null);

    const files = Array.from(e.dataTransfer.files);
    const imageFilenames = files.map((f) => f.name);

    if (imageFilenames.length === 0) return;

    try {
      const response = await fetch("/api/admin/update-option-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, category, imageFilenames }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Updated ${identifier} with ${result.imageCount} image(s)`);
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating images:", error);
      alert("Failed to update images");
    }
  };

  const handleDeleteImage = async (e: React.MouseEvent, identifier: string, category: string, imageToDelete: string) => {
    e.stopPropagation();
    
    if (!confirm(`Delete "${imageToDelete}"?`)) return;

    // Get the option to find its current images
    let option: any;
    if (category === "paint") {
      option = paintOptions.find((p) => p.supplier_sku === identifier);
    } else if (category === "design") {
      option = designOptions.find((p) => p.id === identifier);
    } else if (category === "led") {
      option = ledOptions.find((p) => p.id === identifier);
    } else if (category === "effect") {
      option = effectPedals.find((p) => p.id === identifier);
    }

    if (!option) {
      alert("Option not found");
      return;
    }

    // Get current images and filter out the one to delete
    const currentImages = option.images || [option.image];
    const updatedImages = currentImages.filter((img: string) => img !== imageToDelete);

    // Extract just the filenames from various path formats
    const filenames = updatedImages.map((img: string) => {
      // Handle /api/data/image/, /api/data/images/, /api/images/, or plain filename
      const match = img.match(/(?:\/api\/(?:data\/)?images?\/)?(.+)$/);
      return match ? decodeURIComponent(match[1]) : img;
    });

    try {
      const response = await fetch("/api/admin/update-option-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, category, imageFilenames: filenames }),
      });

      const result = await response.json();

      if (result.success) {
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    }
  };

  const handleDownload = () => {
    const designPayload = selectedDesign ? { ...selectedDesign, labelText } : { labelText };
    const payload = {
      createdAt: new Date().toISOString(),
      effect: selectedEffect ?? null,
      enclosureSize: selectedSize ?? null,
      paint: selectedPaint ?? null,
      design: designPayload,
      led: selectedLed ?? null,
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
    // If custom paint with custom color selected, override the rgb value
    let paintConfig = selectedPaint ?? null;
    if (paintConfig && paintConfig.is_custom_color && customColor) {
      paintConfig = { ...paintConfig, rgb: customColor };
    }
    
    const configData = {
      effect: selectedEffect ?? null,
      effectMods: selectedEffectMods,
      enclosureSize: selectedSize ?? null,
      paint: paintConfig,
      design: selectedDesign ?? null,
      labelText,
      led: selectedLed ?? null,
      ledColor: selectedLedColor === "Custom" ? customLedColor : selectedLedColor,
      totalPrice,
    };
    
    // Store configuration in sessionStorage
    sessionStorage.setItem("pedalConfiguration", JSON.stringify(configData));
    
    // Navigate to summary page
    router.push("/customize/summary");
  };

  return (
    <div data-section="pedal-customizer-main" style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#e0e0e0", background: "#0a0a0a" }}>
      {/* Floating Admin Button - Top Right */}
      <button
        data-section="admin-toggle-button"
        onClick={() => setAdminMode(!adminMode)}
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          padding: "0.6rem 1.2rem",
          border: "2px solid #4ade80",
          background: adminMode ? "#4ade80" : "rgba(0, 0, 0, 0.7)",
          color: adminMode ? "#000" : "#4ade80",
          fontWeight: 600,
          fontSize: "0.85rem",
          cursor: "pointer",
          borderRadius: "6px",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          zIndex: 9999,
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
        title="Toggle admin mode for drag & drop image management"
      >
        {adminMode ? "🔓" : "🔒"} Admin
      </button>
      
      {/* Ultra-Compact Header */}
      <div
        data-section="header"
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
        <h1 data-section="header-title" style={{ fontSize: "1.25rem", margin: 0, fontWeight: 400 }}>
          Fuzzy Engineering Pedal Customizer
        </h1>
      </div>

      {/* Scrollable Content Area */}
      <div data-section="content-area" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Configuration Summary - Fixed at top */}
        <div
          ref={summaryRef}
          data-section="configuration-summary"
          style={{
            position: "absolute",
            top: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 3rem)",
            maxWidth: "800px",
            background: "rgba(26, 26, 26, 0.85)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "10px",
            zIndex: 100,
            padding: "0.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "0.5rem",
          }}
        >
                <button
                  data-section="tab-effect"
                  onClick={() => setActiveTab("effect")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "0.5rem",
                    background: activeTab === "effect" ? "#fff" : "#0f0f0f",
                    borderRadius: "5px",
                    textAlign: "center",
                    border: activeTab === "effect" ? "2px solid #fff" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "effect") {
                      e.currentTarget.style.background = "#1a1a1a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "effect") {
                      e.currentTarget.style.background = "#0f0f0f";
                    }
                  }}
                >
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: activeTab === "effect" ? "#000" : "#888", marginBottom: "0.25rem" }}>Effect</span>
                  <span style={{ fontSize: "0.8rem", color: activeTab === "effect" ? "#000" : "#aaa" }}>
                    {selectedEffect ? selectedEffect.name : "—"}
                  </span>
                </button>
                <button
                  data-section="tab-size"
                  onClick={() => setActiveTab("size")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "0.5rem",
                    background: activeTab === "size" ? "#fff" : "#0f0f0f",
                    borderRadius: "5px",
                    textAlign: "center",
                    border: activeTab === "size" ? "2px solid #fff" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "size") {
                      e.currentTarget.style.background = "#1a1a1a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "size") {
                      e.currentTarget.style.background = "#0f0f0f";
                    }
                  }}
                >
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: activeTab === "size" ? "#000" : "#888", marginBottom: "0.25rem" }}>Size</span>
                  <span style={{ fontSize: "0.8rem", color: activeTab === "size" ? "#000" : "#aaa" }}>
                    {selectedSize ? selectedSize.name : "—"}
                  </span>
                </button>
                <button
                  data-section="tab-paint"
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
                    {selectedPaint ? selectedPaint.displayed_name : "—"}
                  </span>
                </button>
                <button
                  data-section="tab-design"
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
                  data-section="tab-led"
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
        </div>

        {/* Scrollable Content */}
        <div data-section="tab-content-scrollable" style={{ flex: 1, overflowY: "auto", padding: "1.5rem", paddingTop: `${summaryHeight || 130}px`, paddingBottom: "250px" }}>
          {/* Filters for Paint Tab - Separate Panel */}
          {activeTab === "paint" && (
            <div
              data-section="paint-filters-panel"
              style={{
                position: "sticky",
                top: 0,
                width: "100%",
                maxWidth: "800px",
                background: "rgba(26, 26, 26, 0.85)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px",
                zIndex: 99,
                padding: "1rem",
                marginBottom: "2rem",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
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
                    placeholder="Search by name, color, finish..."
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
            </div>
          )}

          {/* Effect Tab */}
          {activeTab === "effect" && (
            <div data-section="tab-content-effect">
            <EffectSelector
              pedals={effectPedals}
              categories={Array.from(new Set(effectPedals.flatMap(p => p.categories))).sort()}
              soundCharacters={Array.from(new Set(effectPedals.flatMap(p => p.sound_characters))).sort()}
              selectedPedalId={selectedEffectId}
              onSelectPedal={setSelectedEffectId}
              adminMode={adminMode}
              dragOverSku={dragOverSku}
              currentImageIndex={currentImageIndex}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDeleteImage={handleDeleteImage}
              onShowDetails={(pedal) => {
                setModalProduct({
                  type: "effect",
                  title: pedal.name,
                  subtitle: `Inspired by: ${pedal.inspired_by}`,
                  price: pedal.customer_price_eur,
                  image: pedal.image,
                  description: pedal.description,
                  category: pedal.categories,
                  pcbSupplier: pedal.technical_specs.pcb_reference,
                  recommendedSize: pedal.recommended_enclosure,
                  details: [
                    { label: "Sound", value: pedal.sound_characters },
                  ],
                  technicalSpecs: {
                    potentiometers: pedal.technical_specs.potentiometers,
                    switches: pedal.technical_specs.switches,
                    io_jacks: pedal.technical_specs.io_jacks,
                    led_count: pedal.technical_specs.led_count,
                    complexity: pedal.technical_specs.complexity,
                  },
                  controls: pedal.controls,
                  compatibleMods: pedal.compatible_mods,
                  selectedMods: selectedEffectMods,
                  onModsChange: setSelectedEffectMods,
                });
              }}
            />
            </div>
          )}

          {/* Enclosure Size Tab */}
          {activeTab === "size" && (
            <div data-section="tab-content-size">
            <EnclosureSizeSelector
              sizes={enclosureSizes}
              selectedSize={selectedEnclosureSizeId}
              onSelectSize={setSelectedEnclosureSizeId}
              recommendedSize={selectedEffect?.recommended_enclosure}
              onShowDetails={(size) => {
                const isRecommended = size.name === selectedEffect?.recommended_enclosure;
                const additionalCost = isRecommended ? 0 : 5;
                setModalProduct({
                  type: "size",
                  title: size.name,
                  subtitle: size.dimensions,
                  price: additionalCost,
                  description: size.description,
                  details: [
                    { label: "Dimensions", value: size.dimensions },
                    { label: "Capacity", value: size.capacity },
                    { label: "Best For", value: size.best_for },
                  ],
                  additionalSections: [
                    ...(additionalCost > 0 ? [{
                      title: "⚠️ Note",
                      content: (
                        <div style={{ fontSize: "0.85rem", color: "#ffaa00", lineHeight: 1.5 }}>
                          Non-standard size for this effect. Additional €5.00 charge applies.
                        </div>
                      ),
                    }] : []),
                    {
                      title: "Funny Description",
                      content: (
                        <div
                          style={{
                            padding: "1rem",
                            background: "#0a0a0a",
                            borderRadius: "8px",
                            border: "1px solid #333",
                            fontStyle: "italic",
                            color: "#ccc",
                          }}
                        >
                          {size.funny_description}
                        </div>
                      ),
                    },
                  ],
                });
              }}
            />
            </div>
          )}

          {/* Paint/Finish Tab */}
          {activeTab === "paint" && (
            <div
              data-section="tab-content-paint"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
                {filteredPaintOptions.map((option) => {
                  const currentImageIdx = currentImageIndex[option.supplier_sku] || 0;
                  const images = option.images || [option.image];
                  const currentImage = images[currentImageIdx] || option.image;
                  
                  return (
                  <div
                    key={option.id}
                    onClick={() => {
                      if (!adminMode) {
                        // Open modal for product details
                        setModalProduct({
                          type: "paint",
                          title: option.displayed_name || option.name,
                          subtitle: `${option.color || ""} ${option.finish || ""}`.trim(),
                          price: option.customer_price_eur,
                          image: currentImage,
                          images: option.images && option.images.length > 0 ? option.images : [currentImage],
                          description: option.long_description || option.short_description || option.description,
                          details: [
                            { label: "Color", value: option.color || "Custom" },
                            { label: "Finish", value: option.finish || "Custom" },
                            { label: "Dimensions", value: "120mm × 94mm × 34mm (L×W×H)" },
                          ],
                          is_custom_color: option.is_custom_color,
                          customColor: customColor,
                          customFinish: customFinish,
                          onCustomColorChange: (color: string) => {
                            setCustomColor(color);
                            setHasInteractedWithCustomPaint(true);
                            setModalProduct((prev) => prev ? { ...prev, customColor: color } : null);
                          },
                          onCustomFinishChange: (finish: "Matte" | "Glossy") => {
                            setCustomFinish(finish);
                            setHasInteractedWithCustomPaint(true);
                            setModalProduct((prev) => prev ? { ...prev, customFinish: finish } : null);
                          },
                          additionalSections: option.is_custom_color ? [
                            {
                              title: "⚠️ Note",
                              content: (
                                <div style={{ fontSize: "0.85rem", color: "#ffaa00", lineHeight: 1.5 }}>
                                  Custom paint requires manual review and has extended production time (5-7 business days).
                                </div>
                              ),
                            },
                          ] : undefined,
                        });
                      } else {
                        // Admin mode: direct selection
                        setSelectedPaintId(option.id);
                        if (option.is_custom_color) {
                          setShowColorPicker(true);
                        }
                      }
                    }}
                    onDragOver={adminMode ? (e) => handleDragOver(e, option.supplier_sku) : undefined}
                    onDragLeave={adminMode ? handleDragLeave : undefined}
                    onDrop={adminMode ? (e) => handleDrop(e, option.supplier_sku, "paint") : undefined}
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
                    <div style={{ width: "100%", height: "160px", background: "#1a1a1a", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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
                          <button
                            onClick={(e) => handleDeleteImage(e, option.supplier_sku, "paint", currentImage)}
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
                        </>
                      )}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(prev => ({
                                ...prev,
                                [option.supplier_sku]: Math.max(0, currentImageIdx - 1)
                              }));
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
                              setCurrentImageIndex(prev => ({
                                ...prev,
                                [option.supplier_sku]: Math.min(images.length - 1, currentImageIdx + 1)
                              }));
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
                          {
                            adminMode == true ? 
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
                              : null
                          }
  
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
          )}

          {/* Design/Labeling Tab */}
          {activeTab === "design" && (
            <div data-section="tab-content-design">
              <div
                data-section="design-options-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "2rem",
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
                        setModalProduct({
                          type: "design",
                          title: option.name,
                          price: option.customer_price_eur,
                          image: currentImage,
                          images: images,
                          description: option.long_description || option.short_description || option.description,
                          details: [
                            { label: "Style", value: "Graphic Design" },
                            { label: "Format", value: "Printed Label" },
                          ],
                        });
                      } else {
                        setSelectedDesignId(option.id);
                      }
                    }}
                    onDragOver={adminMode ? (e) => handleDragOver(e, option.id) : undefined}
                    onDragLeave={adminMode ? handleDragLeave : undefined}
                    onDrop={adminMode ? (e) => handleDrop(e, option.id, "design") : undefined}
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
                    <div style={{ width: "100%", height: "160px", background: "#1a1a1a", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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
                        <button
                          onClick={(e) => handleDeleteImage(e, option.id, "design", currentImage)}
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
                      </>
                      )}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(prev => ({...prev, [option.id]: Math.max(0, currentImageIdx - 1)}));
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
                              setCurrentImageIndex(prev => ({...prev, [option.id]: Math.min(images.length - 1, currentImageIdx + 1)}));
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
            </div>
          )}

          {/* LED Tab */}
          {activeTab === "led" && (
            <>
            <div
              data-section="tab-content-led"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
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
                      setModalProduct({
                        type: "led",
                        title: option.name,
                        price: option.customer_price_eur,
                        image: currentImage,
                        images: images,
                        description: option.long_description || option.short_description || option.description,
                        details: [
                          { label: "Type", value: "LED Indicator" },
                          { label: "Installation", value: "Pre-wired & Tested" },
                        ],
                        ledColor: selectedLedColor,
                        customLedColor: customLedColor,
                        onLedColorChange: (color: string) => {
                          setSelectedLedColor(color);
                          setModalProduct((prev) => prev ? { ...prev, ledColor: color } : null);
                        },
                        onCustomLedColorChange: (color: string) => {
                          setCustomLedColor(color);
                          setModalProduct((prev) => prev ? { ...prev, customLedColor: color } : null);
                        },
                      });
                    } else {
                      setSelectedLedId(option.id);
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
                  onDragOver={adminMode ? (e) => handleDragOver(e, option.id) : undefined}
                  onDragLeave={adminMode ? handleDragLeave : undefined}
                  onDrop={adminMode ? (e) => handleDrop(e, option.id, "led") : undefined}
                >
                  <div style={{ 
                    width: "100%", 
                    height: "160px", 
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
                        <button
                          onClick={(e) => handleDeleteImage(e, option.id, "led", currentImage)}
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
                      </>
                    )}
                    
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(prev => ({
                              ...prev,
                              [option.id]: currentImageIdx > 0 ? currentImageIdx - 1 : images.length - 1
                            }));
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
                            setCurrentImageIndex(prev => ({
                              ...prev,
                              [option.id]: currentImageIdx < images.length - 1 ? currentImageIdx + 1 : 0
                            }));
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
            
            {/* LED Color Picker - only show if an LED option is selected */}
            {selectedLed && !selectedLed.name.includes("No LED") && (
              <div style={{ 
                marginTop: "2rem", 
                background: "#0f0f0f", 
                borderRadius: "15px", 
                padding: "1.5rem",
                border: "2px solid #2d2d2d",
                boxShadow: "0 5px 20px rgba(0,0,0,0.3)"
              }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#fff" }}>
                  💡 LED Color Selection
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#999", marginBottom: "1rem" }}>
                  Choose the color of your LED indicator
                </p>
                
                {/* Standard Color Options */}
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
                        onClick={() => setSelectedLedColor(color)}
                        style={{
                          background: "#1a1a1a",
                          borderRadius: "8px",
                          padding: "0.75rem",
                          cursor: "pointer",
                          border: selectedLedColor === color ? "2px solid #fff" : "2px solid #333",
                          boxShadow: selectedLedColor === color ? "0 3px 10px rgba(255, 255, 255, 0.2)" : "none",
                          transition: "all 0.2s ease",
                          textAlign: "center"
                        }}
                        onMouseEnter={(e) => {
                          if (selectedLedColor !== color) {
                            e.currentTarget.style.borderColor = "#666";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedLedColor !== color) {
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
                        <div style={{ fontSize: "0.8rem", color: "#e0e0e0", fontWeight: selectedLedColor === color ? 600 : 400 }}>
                          {color}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Custom Color Option */}
                  <div
                    onClick={() => setSelectedLedColor("Custom")}
                    style={{
                      background: "#1a1a1a",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      cursor: "pointer",
                      border: selectedLedColor === "Custom" ? "2px solid #fff" : "2px solid #333",
                      boxShadow: selectedLedColor === "Custom" ? "0 3px 10px rgba(255, 255, 255, 0.2)" : "none",
                      transition: "all 0.2s ease",
                      textAlign: "center"
                    }}
                    onMouseEnter={(e) => {
                      if (selectedLedColor !== "Custom") {
                        e.currentTarget.style.borderColor = "#666";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedLedColor !== "Custom") {
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
                    <div style={{ fontSize: "0.8rem", color: "#e0e0e0", fontWeight: selectedLedColor === "Custom" ? 600 : 400 }}>
                      Custom
                    </div>
                  </div>
                </div>
                
                {/* Custom Color Picker */}
                {selectedLedColor === "Custom" && (
                  <div style={{ 
                    marginTop: "1rem", 
                    padding: "1rem", 
                    background: "#1a1a1a", 
                    borderRadius: "8px",
                    border: "1px solid #333"
                  }}>
                    <label style={{ fontSize: "0.85rem", color: "#e0e0e0", display: "block", marginBottom: "0.5rem" }}>
                      Custom RGB Color:
                    </label>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <input
                        type="color"
                        value={customLedColor}
                        onChange={(e) => setCustomLedColor(e.target.value)}
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
                          value={customLedColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                              setCustomLedColor(val);
                            }
                          }}
                          placeholder="#ff0000"
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            background: "#0a0a0a",
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
            </>
          )}

        </div>

        {/* Bottom Action Bar - Total Price & Review Button */}
        <div
          data-section="bottom-action-bar"
          style={{
            position: "fixed",
            bottom: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            width: "85%",
            maxWidth: "400px",
            background: "rgba(26, 26, 26, 0.85)",
            padding: "1rem",
            borderRadius: "10px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            zIndex: 1000,
            backdropFilter: "blur(10px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div data-section="total-price-display" style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>Total:</span>
            <span style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#fff" }}>{formatPrice(totalPrice)}</span>
          </div>
          <button
            data-section="review-submit-button"
            onClick={handleProceedToSummary}
            style={{
              padding: "0.7rem 1.6rem",
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
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

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onSelectAndContinue={handleModalSelectAndContinue}
        nextTabName={getNextTabName()}
      />
    </div>
  );
}
