"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle, Download, Mail } from "lucide-react";
import { EnclosureVisualizer } from "@/components/EnclosureVisualizer";

type SelectedModWithOptions = {
  mod: {
    name: string;
    description: string;
    customer_price_eur: number;
    adds_controls?: Array<{ label: string; type: string; description: string }>;
    removes_controls?: string[];
    additional_options?: Array<{
      label: string;
      description: string;
      type: string;
      range?: [number, number];
      default?: number | string[];
      options?: string[];
      max_selections?: number;
    }>;
  };
  options?: Record<string, any>;
};

type ConfigData = {
  effect?: any;
  effectMods?: SelectedModWithOptions[];
  enclosureSize?: any;
  paint: any;
  design: any;
  labelText: string;
  led: any;
  ledColor?: string;
  totalPrice: number;
};

const formatPrice = (value: number | undefined) => {
  if (value === undefined || value === null) return "€0.00";
  return `€${value.toFixed(2)}`;
};

const getLedColorHex = (color: string): string => {
  const colorMap: Record<string, string> = {
    "Red": "#ff0000",
    "Blue": "#0066ff",
    "Green": "#00ff00",
    "Yellow": "#ffff00",
    "White": "#ffffff",
    "Amber": "#ffbf00",
    "UV": "#bf00ff"
  };
  return color.startsWith("#") ? color : (colorMap[color] || "#ff0000");
};

export default function SummaryPage() {
  const [config, setConfig] = React.useState<ConfigData | null>(null);
  const [customerName, setCustomerName] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [customerNotes, setCustomerNotes] = React.useState("");
  const [pedalName, setPedalName] = React.useState("");
  const [controlLabels, setControlLabels] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingLedColor, setEditingLedColor] = React.useState(false);
  const [editingPaintColor, setEditingPaintColor] = React.useState(false);
  const [tempLedColor, setTempLedColor] = React.useState("");
  const [tempCustomLedColor, setTempCustomLedColor] = React.useState("#ff0000");
  const [tempPaintColor, setTempPaintColor] = React.useState("#808080");
  const [editingModIndex, setEditingModIndex] = React.useState<number | null>(null);
  const [tempModOptions, setTempModOptions] = React.useState<Record<string, any>>({});
  const [isVisualizerMaximized, setIsVisualizerMaximized] = React.useState(false);
  const [layoutsData, setLayoutsData] = React.useState<any[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = React.useState<string | null>(null);
  const [showPedalNameInVisualizer, setShowPedalNameInVisualizer] = React.useState(true);

  // Compute effective controls considering mods
  const effectiveControls = React.useMemo(() => {
    if (!config?.effect?.controls) return [];
    
    let controls = [...config.effect.controls];
    
    if (config.effectMods) {
      config.effectMods.forEach(({ mod }) => {
        // Remove controls specified in removes_controls
        if (mod.removes_controls) {
          controls = controls.filter((c: any) => !mod.removes_controls!.includes(c.label));
        }
        // Add new controls from adds_controls
        if (mod.adds_controls) {
          controls = [...controls, ...mod.adds_controls];
        }
      });
    }
    
    return controls;
  }, [config?.effect, config?.effectMods]);

  // Select appropriate layout based on control count (must be before early return)
  const selectedLayout = React.useMemo(() => {
    if (!config || !config.effect || layoutsData.length === 0) return null;
    
    const enclosureType = config.enclosureSize?.name || "125B";
    
    // Count effective controls
    let potCount = effectiveControls.filter((c: any) => c.type === "Pot").length;
    let switchCount = effectiveControls.filter((c: any) => c.type === "Switch" && c.label !== "Bypass").length;
    let faderCount = effectiveControls.filter((c: any) => c.type === "Fader").length;
    
    // Find all matching layouts
    const matchingLayouts = layoutsData.filter((layout: any) => 
      layout.enclosure_type === enclosureType &&
      layout.potentiometer_count === potCount &&
      layout.switch_count === switchCount &&
      layout.fader_count === faderCount
    );
    
    // If user selected a specific layout and it's still valid, use it
    if (selectedLayoutId) {
      const userSelected = matchingLayouts.find((l: any) => l.id === selectedLayoutId);
      if (userSelected) return userSelected;
    }
    
    // Otherwise use first matching layout
    if (matchingLayouts.length > 0) return matchingLayouts[0];
    
    // Fallback: find closest match by enclosure type and pot count
    let bestMatch = layoutsData.find((layout: any) => 
      layout.enclosure_type === enclosureType &&
      layout.potentiometer_count >= potCount
    );
    
    // Final fallback: just get first layout for the enclosure type
    if (!bestMatch) {
      bestMatch = layoutsData.find((layout: any) => 
        layout.enclosure_type === enclosureType
      );
    }
    
    return bestMatch || layoutsData[0];
  }, [config, effectiveControls, layoutsData, selectedLayoutId]);
  
  // Get all available layouts for current configuration
  const availableLayouts = React.useMemo(() => {
    if (!config || !config.effect || layoutsData.length === 0) return [];
    
    const enclosureType = config.enclosureSize?.name || "125B";
    let potCount = effectiveControls.filter((c: any) => c.type === "Pot").length;
    let switchCount = effectiveControls.filter((c: any) => c.type === "Switch" && c.label !== "Bypass").length;
    let faderCount = effectiveControls.filter((c: any) => c.type === "Fader").length;
    
    return layoutsData.filter((layout: any) => 
      layout.enclosure_type === enclosureType &&
      layout.potentiometer_count === potCount &&
      layout.switch_count === switchCount &&
      layout.fader_count === faderCount
    );
  }, [config, effectiveControls, layoutsData]);
  
  // Get paint color (must be before early return)
  const paintColor = React.useMemo(() => {
    if (!config?.paint) return "#808080";
    if (config.paint.is_custom_color && config.paint.rgb) {
      return config.paint.rgb;
    }
    return config.paint.color_info?.hex || "#808080";
  }, [config?.paint]);
  
  // Get finish type (must be before early return)
  const finishType = React.useMemo(() => {
    return config?.paint?.finish_info?.finish_type || "";
  }, [config?.paint]);

  React.useEffect(() => {
    // Load layouts data
    fetch("/api/data/layouts")
      .then(res => res.json())
      .then(data => setLayoutsData(data))
      .catch(err => console.error("Failed to load layouts:", err));
    
    const storedConfig = sessionStorage.getItem("pedalConfiguration");
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      setConfig(parsed);
      
      // Initialize control labels with their default values (the label itself)
      if (parsed.effect?.controls) {
        const initialLabels: Record<string, string> = {};
        
        // Start with base controls
        let controls = [...parsed.effect.controls];
        
        // Apply mod changes
        if (parsed.effectMods) {
          parsed.effectMods.forEach((modWithOpts: SelectedModWithOptions) => {
            // Remove controls
            if (modWithOpts.mod.removes_controls) {
              controls = controls.filter((c: any) => !modWithOpts.mod.removes_controls!.includes(c.label));
            }
            // Add new controls
            if (modWithOpts.mod.adds_controls) {
              controls = [...controls, ...modWithOpts.mod.adds_controls];
            }
          });
        }
        
        // Set default labels
        controls.forEach((control: any) => {
          initialLabels[control.label] = control.label;
        });
        
        setControlLabels(initialLabels);
      }
      
      // Parse the old labelText format if it exists
      const labelText = parsed.labelText || "";
      setPedalName(labelText);
    }
  }, []);

  if (!config) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>No Configuration Found</h2>
          <Link href="/customize" style={{ color: "#fff", textDecoration: "underline" }}>
            Return to Customizer
          </Link>
        </div>
      </div>
    );
  }
  
  const warnings: string[] = [];
  
  // Check for incompatibilities
  if (config.design && config.design.name === "Relic") {
    if (config.paint && config.paint.finish?.includes("Metallic")) {
      warnings.push("Relic finish may not combine well with certain metallic powder coatings. Manual review recommended.");
    }
  }

  const handleDownloadJSON = () => {
    const payload = {
      createdAt: new Date().toISOString(),
      ...config,
      pedalName,
      controlLabels,
      labelText: pedalName, // Keep backward compatibility
      customer: {
        name: customerName,
        email: customerEmail,
        notes: customerNotes,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedal-order-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleSubmitOrder = async () => {
    if (!customerName || !customerEmail) {
      alert("Please provide your name and email address");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate order submission (in real implementation, this would send to backend/email)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    alert("Order submitted successfully! You will receive a confirmation email shortly.");
    setIsSubmitting(false);
    
    // Download JSON as backup
    handleDownloadJSON();
  };

  const handleEditLedColor = () => {
    if (config) {
      setTempLedColor(config.ledColor || "Red");
      setTempCustomLedColor(config.ledColor?.startsWith("#") ? config.ledColor : "#ff0000");
      setEditingLedColor(true);
    }
  };

  const handleSaveLedColor = () => {
    if (config) {
      const newColor = tempLedColor === "Custom" ? tempCustomLedColor : tempLedColor;
      setConfig({ ...config, ledColor: newColor });
      sessionStorage.setItem("pedalConfiguration", JSON.stringify({ ...config, ledColor: newColor }));
      setEditingLedColor(false);
    }
  };

  const handleEditPaintColor = () => {
    if (config && config.paint.is_custom_color) {
      setTempPaintColor(config.paint.rgb || "#808080");
      setEditingPaintColor(true);
    }
  };

  const handleSavePaintColor = () => {
    if (config) {
      const updatedPaint = { ...config.paint, rgb: tempPaintColor };
      setConfig({ ...config, paint: updatedPaint });
      sessionStorage.setItem("pedalConfiguration", JSON.stringify({ ...config, paint: updatedPaint }));
      setEditingPaintColor(false);
    }
  };

  const handleEditModOptions = (modIndex: number) => {
    if (config?.effectMods && config.effectMods[modIndex]) {
      setTempModOptions(config.effectMods[modIndex].options || {});
      setEditingModIndex(modIndex);
    }
  };

  const handleSaveModOptions = () => {
    if (editingModIndex !== null && config?.effectMods) {
      const updatedMods = [...config.effectMods];
      updatedMods[editingModIndex] = {
        ...updatedMods[editingModIndex],
        options: { ...tempModOptions },
      };
      const updatedConfig = { ...config, effectMods: updatedMods };
      setConfig(updatedConfig);
      sessionStorage.setItem("pedalConfiguration", JSON.stringify(updatedConfig));
      setEditingModIndex(null);
      setTempModOptions({});
    }
  };

  const handleCancelModEdit = () => {
    setEditingModIndex(null);
    setTempModOptions({});
  };

  const handleModOptionChange = (optionLabel: string, value: any) => {
    setTempModOptions(prev => ({
      ...prev,
      [optionLabel]: value,
    }));
  };

  return (
    <div data-section="summary-page" style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e0e0e0", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* Header */}
      <div data-section="summary-header" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", color: "white", padding: "1rem 2rem", borderBottom: "2px solid #333" }}>
        <div data-section="header-container" style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/customize" data-section="back-link" style={{ color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
              <ChevronLeft size={20} />
              Back to Customizer
            </Link>
          </div>
          <h1 data-section="page-title" style={{ fontSize: "1.5rem", margin: 0 }}>Order Summary</h1>
          <div style={{ width: "150px" }} />
        </div>
      </div>

      <div data-section="summary-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* Warnings */}
        {warnings.length > 0 && (
          <div data-section="warnings-panel" style={{ background: "#2d1a00", border: "2px solid #ff9500", borderRadius: "10px", padding: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "start" }}>
              <AlertTriangle size={24} color="#ff9500" style={{ flexShrink: 0, marginTop: "0.25rem" }} />
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#ff9500" }}>Compatibility Warnings</h3>
                <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#ffcc80" }}>
                  {warnings.map((warning, i) => (
                    <li key={i} style={{ marginBottom: "0.5rem" }}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div data-section="main-layout" style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
          {/* Configuration Details */}
          <div data-section="configuration-details">
            <h2 data-section="configuration-title" style={{ fontSize: "1.75rem", marginBottom: "1.5rem", color: "#fff" }}>Configuration Details</h2>

            {/* Effect Pedal */}
            {config.effect && (
              <ConfigSection
                title="Effect Pedal Circuit"
                name={config.effect.name}
                price={config.effect.customer_price_eur}
                shortDesc={`${config.effect.category} • Inspired by ${config.effect.inspired_by}`}
                longDesc={config.effect.description}
                details={[
                  { label: "Circuit Type", value: config.effect.category },
                  { label: "Inspired By", value: config.effect.inspired_by },
                  { label: "Complexity", value: config.effect.technical_specs?.complexity || "N/A" },
                  { label: "Sound", value: config.effect.sound_characters?.slice(0, 3).join(", ") || "N/A" },
                ]}
              />
            )}

            {/* Selected Mods */}
            {config.effectMods && config.effectMods.length > 0 && (
              <div data-section="selected-mods" style={{ background: "#1a1a1a", padding: "1.5rem", borderRadius: "10px", marginBottom: "1.5rem", border: "1px solid #333" }}>
                <h3 data-section="mods-title" style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#fff" }}>
                  Effect Modifications
                  <span style={{ fontSize: "1rem", fontWeight: 600, color: "#4ade80", marginLeft: "0.75rem" }}>
                    (+€{config.effectMods.reduce((sum, { mod }) => sum + mod.customer_price_eur, 0).toFixed(2)})
                  </span>
                </h3>
                {config.effectMods.map((modWithOpts, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      marginBottom: idx < config.effectMods!.length - 1 ? "1.5rem" : 0,
                      paddingBottom: idx < config.effectMods!.length - 1 ? "1.5rem" : 0,
                      borderBottom: idx < config.effectMods!.length - 1 ? "1px solid #2d2d2d" : "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>{modWithOpts.mod.name}</span>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#4ade80" }}>+€{modWithOpts.mod.customer_price_eur.toFixed(2)}</span>
                        {modWithOpts.mod.additional_options && modWithOpts.mod.additional_options.length > 0 && (
                          <button
                            onClick={() => handleEditModOptions(idx)}
                            style={{
                              background: "#2d2d2d",
                              color: "#fff",
                              border: "1px solid #666",
                              borderRadius: "5px",
                              padding: "0.4rem 0.8rem",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#3d3d3d";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#2d2d2d";
                            }}
                          >
                            ✏️ Edit Options
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: modWithOpts.options && Object.keys(modWithOpts.options).length > 0 ? "0.75rem" : 0 }}>
                      {modWithOpts.mod.description}
                    </p>
                    
                    {/* Display additional options if any */}
                    {modWithOpts.options && Object.keys(modWithOpts.options).length > 0 && (
                      <div style={{ 
                        background: "#0f0f0f", 
                        padding: "0.75rem", 
                        borderRadius: "6px",
                        border: "1px solid #2d2d2d",
                      }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#888", marginBottom: "0.5rem" }}>
                          Selected Options:
                        </div>
                        {Object.entries(modWithOpts.options).map(([key, value], optIdx) => (
                          <div key={optIdx} style={{ fontSize: "0.8rem", color: "#ccc", marginBottom: "0.25rem" }}>
                            <span style={{ color: "#888" }}>{key}:</span>{" "}
                            <span style={{ color: "#fff", fontWeight: 600 }}>
                              {Array.isArray(value) ? value.join(", ") : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Enclosure Size */}
            {config.enclosureSize && (
              <ConfigSection
                title="Enclosure Size"
                name={config.enclosureSize.name}
                price={0}
                shortDesc={config.enclosureSize.dimensions}
                longDesc={config.enclosureSize.description}
                details={[
                  { label: "Dimensions", value: config.enclosureSize.dimensions },
                  { label: "Capacity", value: config.enclosureSize.capacity },
                ]}
              />
            )}

            {/* Paint/Finish */}
            {config.paint && (
              <div style={{ position: "relative" }}>
                {config.paint.is_custom_color && (
                  <button
                    onClick={handleEditPaintColor}
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: "#2d2d2d",
                      color: "#fff",
                      border: "1px solid #666",
                      borderRadius: "5px",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      transition: "all 0.2s ease",
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#3d3d3d";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#2d2d2d";
                    }}
                  >
                    ✏️ Edit Color
                  </button>
                )}
                <ConfigSection
                  title="Enclosure Finish"
                  name={config.paint.displayed_name}
                  price={config.paint.customer_price_eur}
                  shortDesc={config.paint.short_description}
                  longDesc={config.paint.long_description}
                  details={[
                    { label: "Product ID", value: config.paint.internal_product_id },
                    { label: "Color", value: config.paint.color },
                    { label: "Finish", value: config.paint.finish },
                  ]}
                />
              </div>
            )}

            {/* Design/Labeling */}
            {config.design && (
              <ConfigSection
                title="Design & Labeling"
                name={config.design.name}
                price={config.design.customer_price_eur}
                shortDesc={config.design.short_description}
                longDesc={config.design.long_description}
              />
            )}

            {/* Custom Label Text - Only show if design is selected and not "No Labeling / No Design" */}
            {config.design && config.design.name !== "No Labeling / No Design" && (
              <div style={{ background: "#1a1a1a", padding: "0.1rem 1.5rem 1.5rem 1.5rem", borderRadius: "10px", marginBottom: "1.5rem", border: "1px solid #333" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "#fff" }}>Custom Labeling</h3>
                
                {/* Show Pedal Name Toggle */}
                <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      checked={showPedalNameInVisualizer}
                      onChange={(e) => setShowPedalNameInVisualizer(e.target.checked)}
                      style={{ 
                        width: "18px", 
                        height: "18px", 
                        cursor: "pointer",
                        accentColor: "#4ade80"
                      }}
                    />
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>
                      Show Pedal Name in Visualization
                    </span>
                  </label>
                </div>
                
                {showPedalNameInVisualizer && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>
                      Custom Pedal Name
                    </label>
                    <input
                      type="text"
                      value={pedalName}
                      onChange={(e) => setPedalName(e.target.value)}
                      placeholder="e.g. Aurora Drive"
                      style={{ width: "100%", padding: "0.75rem", background: "#0f0f0f", border: "2px solid #2d2d2d", borderRadius: "5px", color: "#e0e0e0", fontSize: "1rem", boxSizing: "border-box" }}
                    />
                    <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.5rem", marginBottom: 0 }}>
                      Leave empty if you'd like us to create a unique name for your pedal
                    </p>
                  </div>
                )}

                {/* Control Labels */}
                {effectiveControls.length > 0 && (
                  <div>
                    <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "#ccc" }}>
                      Control Labels
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {effectiveControls.map((control: any, idx: number) => (
                        <div key={idx}>
                          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", color: "#aaa" }}>
                            {control.type} {idx + 1} - {control.label}
                          </label>
                          <input
                            type="text"
                            value={controlLabels[control.label] || control.label}
                            onChange={(e) => setControlLabels(prev => ({ ...prev, [control.label]: e.target.value }))}
                            placeholder={control.label}
                            style={{ 
                              width: "100%", 
                              padding: "0.5rem", 
                              background: "#0f0f0f", 
                              border: "1px solid #2d2d2d", 
                              borderRadius: "4px", 
                              color: "#e0e0e0", 
                              fontSize: "0.9rem", 
                              boxSizing: "border-box" 
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.75rem", marginBottom: 0 }}>
                      Customize the label for each control. The default value is the control's original name.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* LED */}
            {config.led && (
              <div style={{ position: "relative" }}>
                {config.ledColor && !config.led.name.includes("No LED") && (
                  <button
                    onClick={handleEditLedColor}
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: "#2d2d2d",
                      color: "#fff",
                      border: "1px solid #666",
                      borderRadius: "5px",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      transition: "all 0.2s ease",
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#3d3d3d";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#2d2d2d";
                    }}
                  >
                    ✏️ Edit Color
                  </button>
                )}
                <div style={{ position: "relative" }}>
                  <ConfigSection
                    title="LED Style"
                    name={config.led.name}
                    price={config.led.customer_price_eur}
                    shortDesc={config.led.short_description}
                    longDesc={config.led.long_description}
                    details={
                      config.ledColor && !config.led.name.includes("No LED") 
                        ? [
                            { 
                              label: "LED Color", 
                              value: (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <div style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    background: getLedColorHex(config.ledColor),
                                    boxShadow: `0 0 10px ${getLedColorHex(config.ledColor)}`,
                                    border: config.ledColor === "White" ? "1px solid #666" : "none"
                                  }} />
                                  <span>{config.ledColor.startsWith("#") ? `Custom (${config.ledColor})` : config.ledColor}</span>
                                </div>
                              ) as any
                            }
                          ]
                        : undefined
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Order Form */}
          <div data-section="order-form-sidebar">
            {/* Enclosure Visualizer */}
            {selectedLayout && (
              <div data-section="enclosure-visualizer" style={{ marginBottom: "2rem" }}>
                <EnclosureVisualizer
                  layout={selectedLayout}
                  availableLayouts={availableLayouts}
                  onLayoutChange={(newLayout) => setSelectedLayoutId(newLayout.id)}
                  enclosureColor={paintColor}
                  finishType={finishType}
                  ledColor={config.ledColor || "#ff0000"}
                  ledType={config.led?.name}
                  pedalName={showPedalNameInVisualizer ? (pedalName || "Custom Pedal") : ""}
                  controlLabels={controlLabels}
                  controls={effectiveControls}
                  isMaximized={isVisualizerMaximized}
                  onToggleMaximize={() => setIsVisualizerMaximized(!isVisualizerMaximized)}
                  onLabelChange={(controlLabel, newValue) => {
                    setControlLabels(prev => ({ ...prev, [controlLabel]: newValue }));
                  }}
                  onPedalNameChange={(newValue) => {
                    setPedalName(newValue);
                  }}
                  labeledLettering={config.design?.name === "Labeled Lettering"}
                />
              </div>
            )}
            
            <div data-section="order-form-card" style={{ background: "#1a1a1a", padding: "2rem", borderRadius: "10px", border: "1px solid #333", position: "sticky", top: "2rem" }}>
              <h3 data-section="form-title" style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "#fff" }}>Your Information</h3>
              
              <div data-section="name-field" style={{ marginBottom: "1.5rem" }}>
                <label data-section="name-label" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>
                  Name *
                </label>
                <input
                  data-section="name-input"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  style={{ width: "100%", padding: "0.75rem", background: "#0f0f0f", border: "2px solid #2d2d2d", borderRadius: "5px", color: "#e0e0e0", fontSize: "1rem" }}
                />
              </div>

              <div data-section="email-field" style={{ marginBottom: "1.5rem" }}>
                <label data-section="email-label" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>
                  Email *
                </label>
                <input
                  data-section="email-input"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  style={{ width: "100%", padding: "0.75rem", background: "#0f0f0f", border: "2px solid #2d2d2d", borderRadius: "5px", color: "#e0e0e0", fontSize: "1rem" }}
                />
              </div>

              <div data-section="notes-field" style={{ marginBottom: "2rem" }}>
                <label data-section="notes-label" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>
                  Additional Notes
                </label>
                <textarea
                  data-section="notes-textarea"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special requests or questions..."
                  rows={4}
                  style={{ width: "100%", padding: "0.75rem", background: "#0f0f0f", border: "2px solid #2d2d2d", borderRadius: "5px", color: "#e0e0e0", fontSize: "1rem", resize: "vertical" }}
                />
              </div>

              <div data-section="order-summary-totals" style={{ background: "#0f0f0f", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem", border: "2px solid #fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "#999" }}>Configuration Total:</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{formatPrice(config.totalPrice)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "1px solid #2d2d2d" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>Total:</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff" }}>{formatPrice(config.totalPrice)}</span>
                </div>
              </div>

              <button
                data-section="submit-order-button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: "#fff",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                <Mail size={18} />
                {isSubmitting ? "Submitting..." : "Submit Order"}
              </button>

              <button
                data-section="download-config-button"
                onClick={handleDownloadJSON}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "transparent",
                  color: "#fff",
                  border: "2px solid #fff",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <Download size={16} />
                Download Configuration
              </button>
            </div>
          </div>
        </div>

        {/* LED Color Edit Modal */}
        {editingLedColor && (
          <div
            onClick={() => setEditingLedColor(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#1a1a1a",
                borderRadius: "15px",
                padding: "2rem",
                maxWidth: "600px",
                width: "90%",
                border: "2px solid #fff",
                boxShadow: "0 10px 50px rgba(0,0,0,0.5)",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#fff" }}>
                Edit LED Color
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                {["Red", "Blue", "Green", "Yellow", "White", "Amber", "UV", "Custom"].map((color) => {
                  const colorMap: Record<string, string> = {
                    Red: "#ff0000",
                    Blue: "#0066ff",
                    Green: "#00ff00",
                    Yellow: "#ffff00",
                    White: "#ffffff",
                    Amber: "#ffbf00",
                    UV: "#bf00ff",
                  };

                  return (
                    <div
                      key={color}
                      onClick={() => setTempLedColor(color)}
                      style={{
                        background: "#0f0f0f",
                        borderRadius: "8px",
                        padding: "0.75rem",
                        cursor: "pointer",
                        border: tempLedColor === color ? "2px solid #fff" : "2px solid #333",
                        transition: "all 0.2s ease",
                        textAlign: "center",
                      }}
                    >
                      {color === "Custom" ? (
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, #ff0000 0%, #00ff00 33%, #0000ff 66%, #ff00ff 100%)`,
                            margin: "0 auto 0.5rem",
                            border: "2px solid #666",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: colorMap[color],
                            margin: "0 auto 0.5rem",
                            boxShadow: `0 0 15px ${colorMap[color]}`,
                            border: color === "White" ? "1px solid #666" : "none",
                          }}
                        />
                      )}
                      <div style={{ fontSize: "0.8rem", color: "#e0e0e0" }}>{color}</div>
                    </div>
                  );
                })}
              </div>

              {tempLedColor === "Custom" && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "#0f0f0f",
                    borderRadius: "8px",
                    border: "1px solid #333",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.85rem",
                      color: "#e0e0e0",
                      display: "block",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Custom RGB Color:
                  </label>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <input
                      type="color"
                      value={tempCustomLedColor}
                      onChange={(e) => setTempCustomLedColor(e.target.value)}
                      style={{
                        width: "60px",
                        height: "60px",
                        border: "2px solid #666",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    />
                    <input
                      type="text"
                      value={tempCustomLedColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                          setTempCustomLedColor(val);
                        }
                      }}
                      placeholder="#ff0000"
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        background: "#0a0a0a",
                        border: "1px solid #666",
                        borderRadius: "5px",
                        color: "#e0e0e0",
                        fontSize: "0.9rem",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button
                  onClick={() => setEditingLedColor(false)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "#2d2d2d",
                    color: "#fff",
                    border: "1px solid #666",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLedColor}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paint Color Edit Modal */}
        {editingPaintColor && (
          <div
            onClick={() => setEditingPaintColor(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#1a1a1a",
                borderRadius: "15px",
                padding: "2rem",
                maxWidth: "500px",
                width: "90%",
                border: "2px solid #fff",
                boxShadow: "0 10px 50px rgba(0,0,0,0.5)",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#fff" }}>
                Edit Custom Paint Color
              </h2>

              <div
                style={{
                  padding: "1.5rem",
                  background: "#0f0f0f",
                  borderRadius: "8px",
                  border: "1px solid #333",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    color: "#e0e0e0",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Custom RGB Color:
                </label>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <input
                    type="color"
                    value={tempPaintColor}
                    onChange={(e) => setTempPaintColor(e.target.value)}
                    style={{
                      width: "80px",
                      height: "80px",
                      border: "2px solid #666",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={tempPaintColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                          setTempPaintColor(val);
                        }
                      }}
                      placeholder="#808080"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "#0a0a0a",
                        border: "1px solid #666",
                        borderRadius: "5px",
                        color: "#e0e0e0",
                        fontSize: "0.9rem",
                        fontFamily: "monospace",
                      }}
                    />
                    <div style={{ fontSize: "0.75rem", color: "#777", marginTop: "0.5rem" }}>
                      Enter hex color code (e.g., #808080)
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button
                  onClick={() => setEditingPaintColor(false)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "#2d2d2d",
                    color: "#fff",
                    border: "1px solid #666",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePaintColor}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mod Options Edit Modal */}
        {editingModIndex !== null && config?.effectMods && config.effectMods[editingModIndex] && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "2rem",
            }}
            onClick={handleCancelModEdit}
          >
            <div
              style={{
                background: "#1a1a1a",
                borderRadius: "12px",
                padding: "2rem",
                maxWidth: "600px",
                width: "100%",
                border: "2px solid #333",
                maxHeight: "80vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#fff" }}>
                Edit Mod Options
              </h3>
              <p style={{ fontSize: "1rem", color: "#aaa", marginBottom: "1.5rem" }}>
                {config.effectMods[editingModIndex].mod.name}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {config.effectMods[editingModIndex].mod.additional_options?.map((option, optIdx) => (
                  <div key={optIdx} style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                    {/* Left: Label and Description */}
                    <div style={{ flex: "0 0 220px" }}>
                      <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#fff", marginBottom: "0.25rem" }}>
                        {option.label}
                      </label>
                      <p style={{ fontSize: "0.8rem", color: "#aaa", lineHeight: 1.4 }}>
                        {option.description}
                      </p>
                    </div>
                    
                    {/* Right: Input and Info */}
                    <div style={{ flex: 1 }}>
                      {option.type === "NumberRange" && option.range && (
                        <div>
                          <input
                            type="number"
                            min={option.range[0]}
                            max={option.range[1]}
                            value={tempModOptions[option.label] ?? option.default ?? option.range[0]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val >= option.range![0] && val <= option.range![1]) {
                                handleModOptionChange(option.label, val);
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "0.6rem",
                              background: "#0a0a0a",
                              border: "1px solid #666",
                              borderRadius: "5px",
                              color: "#e0e0e0",
                              fontSize: "0.9rem",
                            }}
                          />
                          <div style={{ fontSize: "0.7rem", color: "#777", marginTop: "0.4rem" }}>
                            Range: {option.range[0]} - {option.range[1]}
                          </div>
                        </div>
                      )}
                      
                      {option.type === "MultiSelect" && option.options && (
                        <div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            {option.options.map((choice, choiceIdx) => {
                              const currentSelections = tempModOptions[option.label] ?? option.default ?? [];
                              const isSelected = currentSelections.includes(choice);
                              const canSelect = !isSelected || currentSelections.length > 0;
                              const canAdd = !isSelected && (!option.max_selections || currentSelections.length < option.max_selections);
                              
                              return (
                                <label
                                  key={choiceIdx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "0.5rem 0.75rem",
                                    background: isSelected ? "#2d2d2d" : "#0a0a0a",
                                    border: isSelected ? "1px solid #4ade80" : "1px solid #666",
                                    borderRadius: "5px",
                                    cursor: (isSelected || canAdd) ? "pointer" : "not-allowed",
                                    opacity: (isSelected || canAdd) ? 1 : 0.5,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={!isSelected && !canAdd}
                                    onChange={(e) => {
                                      const newSelections = e.target.checked
                                        ? [...currentSelections, choice]
                                        : currentSelections.filter((c: string) => c !== choice);
                                      handleModOptionChange(option.label, newSelections);
                                    }}
                                    style={{ cursor: "pointer" }}
                                  />
                                  <span style={{ color: "#fff", fontSize: "0.85rem" }}>{choice}</span>
                                </label>
                              );
                            })}
                          </div>
                          {option.max_selections && (
                            <div style={{ fontSize: "0.7rem", color: "#777", marginTop: "0.4rem" }}>
                              Select up to {option.max_selections} options
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button
                  onClick={handleCancelModEdit}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "#2d2d2d",
                    color: "#fff",
                    border: "1px solid #666",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModOptions}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigSection({
  title,
  name,
  price,
  shortDesc,
  longDesc,
  details,
  extra,
}: {
  title: string;
  name: string;
  price?: number;
  shortDesc?: string;
  longDesc?: string;
  details?: { label: string; value?: string | React.ReactNode }[];
  extra?: { label: string; value: string }[];
}) {
  return (
    <div style={{ background: "#1a1a1a", padding: "0.1rem 1.5rem 1.5rem 1.5rem", borderRadius: "10px", marginBottom: "1.5rem", border: "1px solid #333" }}>
      <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "#fff" }}>{title}</h3>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>{name}</span>
        <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>{formatPrice(price)}</span>
      </div>
      {shortDesc && (
        <p style={{ fontSize: "0.9rem", color: "#999", marginBottom: "1rem" }}>{shortDesc}</p>
      )}
      {longDesc && (
        <p style={{ fontSize: "0.9rem", color: "#aaa", lineHeight: 1.6, marginBottom: details || extra ? "1rem" : 0 }}>{longDesc}</p>
      )}
      {details && details.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #2d2d2d" }}>
          {details.map((detail, i) => (
            <div key={i}>
              <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "0.25rem" }}>{detail.label}</div>
              <div style={{ fontSize: "0.9rem", color: "#ccc" }}>{detail.value || "—"}</div>
            </div>
          ))}
        </div>
      )}
      {extra && extra.length > 0 && (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #2d2d2d" }}>
          {extra.map((item, i) => (
            <div key={i} style={{ marginBottom: i < extra.length - 1 ? "0.5rem" : 0 }}>
              <span style={{ fontSize: "0.85rem", color: "#888", marginRight: "0.5rem" }}>{item.label}:</span>
              <span style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
