"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle, Download, Mail } from "lucide-react";

type ConfigData = {
  effect?: any;
  enclosureSize?: any;
  paint: any;
  design: any;
  labelText: string;
  led: any;
  ledColor?: string;
  other: any[];
  totalPrice: number;
};

const formatPrice = (value: number | undefined) => {
  if (value === undefined || value === null) return "€0.00";
  return `€${value.toFixed(2)}`;
};

export default function SummaryPage() {
  const [config, setConfig] = React.useState<ConfigData | null>(null);
  const [customerName, setCustomerName] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [customerNotes, setCustomerNotes] = React.useState("");
  const [pedalName, setPedalName] = React.useState("");
  const [knobLabels, setKnobLabels] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingLedColor, setEditingLedColor] = React.useState(false);
  const [editingPaintColor, setEditingPaintColor] = React.useState(false);
  const [tempLedColor, setTempLedColor] = React.useState("");
  const [tempCustomLedColor, setTempCustomLedColor] = React.useState("#ff0000");
  const [tempPaintColor, setTempPaintColor] = React.useState("#808080");

  React.useEffect(() => {
    const storedConfig = sessionStorage.getItem("pedalConfiguration");
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      setConfig(parsed);
      // Parse the old labelText format if it exists
      const labelText = parsed.labelText || "";
      setPedalName(labelText);
      setKnobLabels("");
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
  if (config.other.some((o) => o.name === "Make it Ultra Compact")) {
    if (config.led && (config.led.name.includes("Fender") || config.led.name.includes("Fancy"))) {
      warnings.push("Ultra Compact enclosure may not accommodate the selected LED holder. Manual review required.");
    }
  }

  if (config.design && config.design.name === "Relic") {
    if (config.paint && config.paint.finish?.includes("Metallic")) {
      warnings.push("Relic finish may not combine well with certain metallic powder coatings. Manual review recommended.");
    }
  }

  if (config.other.some((o) => o.name === "Buffered Bypass Mod")) {
    warnings.push("Buffered Bypass requires power connection even when pedal is bypassed.");
  }

  const handleDownloadJSON = () => {
    const payload = {
      createdAt: new Date().toISOString(),
      ...config,
      pedalName,
      knobLabels,
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

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e0e0e0", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", color: "white", padding: "1rem 2rem", borderBottom: "2px solid #333" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/customize" style={{ color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
              <ChevronLeft size={20} />
              Back to Customizer
            </Link>
          </div>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Order Summary</h1>
          <div style={{ width: "150px" }} />
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* Warnings */}
        {warnings.length > 0 && (
          <div style={{ background: "#2d1a00", border: "2px solid #ff9500", borderRadius: "10px", padding: "1.5rem", marginBottom: "2rem" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
          {/* Configuration Details */}
          <div>
            <h2 style={{ fontSize: "1.75rem", marginBottom: "1.5rem", color: "#fff" }}>Configuration Details</h2>

            {/* Effect Pedal */}
            {config.effect && (
              <ConfigSection
                title="Effect Pedal Circuit"
                name={config.effect.name}
                price={config.effect.price_modifier_eur}
                shortDesc={`${config.effect.category} • Inspired by ${config.effect.inspired_by}`}
                longDesc={config.effect.description}
                details={[
                  { label: "Circuit Type", value: config.effect.category },
                  { label: "Based On", value: config.effect.inspired_by },
                  { label: "Complexity", value: config.effect.technical_specs?.complexity || "N/A" },
                  { label: "Sound", value: config.effect.sound_characters?.slice(0, 3).join(", ") || "N/A" },
                ]}
              />
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

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>
                    Knob Labels
                  </label>
                  <input
                    type="text"
                    value={knobLabels}
                    onChange={(e) => setKnobLabels(e.target.value)}
                    placeholder="e.g. Volume, Drive, Tone, ..."
                    style={{ width: "100%", padding: "0.75rem", background: "#0f0f0f", border: "2px solid #2d2d2d", borderRadius: "5px", color: "#e0e0e0", fontSize: "1rem", boxSizing: "border-box" }}
                  />
                  <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.5rem", marginBottom: 0 }}>
                    List the names of your knobs/controls separated by commas. You can also leave this empty if you want to leave them with their original labels.
                  </p>
                </div>
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
                <ConfigSection
                  title="LED Style"
                  name={config.led.name}
                  price={config.led.customer_price_eur}
                  shortDesc={config.led.short_description}
                  longDesc={config.led.long_description}
                  details={
                    config.ledColor && !config.led.name.includes("No LED") 
                      ? [{ label: "LED Color", value: config.ledColor.startsWith("#") ? `Custom (${config.ledColor})` : config.ledColor }]
                      : undefined
                  }
                />
              </div>
            )}

            {/* Other Options */}
            {config.other.length > 0 && (
              <div style={{ background: "#1a1a1a", padding: "0.1rem 1.5rem 1.5rem 1.5rem", borderRadius: "10px", marginBottom: "1.5rem", border: "1px solid #333" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "#fff" }}>Additional Modifications</h3>
                {config.other.map((option, i) => (
                  <div key={i} style={{ marginBottom: i < config.other.length - 1 ? "2rem" : 0, paddingBottom: i < config.other.length - 1 ? "2rem" : 0, borderBottom: i < config.other.length - 1 ? "1px solid #2d2d2d" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>{option.name}</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>{formatPrice(option.customer_price_eur)}</span>
                    </div>
                    {option.short_description && (
                      <p style={{ fontSize: "0.9rem", color: "#999", marginBottom: "0.5rem" }}>{option.short_description}</p>
                    )}
                    {option.long_description && (
                      <p style={{ fontSize: "0.9rem", color: "#aaa", lineHeight: 1.6 }}>{option.long_description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Form */}
          <div>
            <div style={{ background: "#1a1a1a", padding: "2rem", borderRadius: "10px", border: "1px solid #333", position: "sticky", top: "2rem" }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "#fff" }}>Your Information</h3>
              
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  style={{ width: "100%", padding: "0.75rem", background: "#0f0f0f", border: "2px solid #2d2d2d", borderRadius: "5px", color: "#e0e0e0", fontSize: "1rem" }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  style={{ width: "100%", padding: "0.75rem", background: "#0f0f0f", border: "2px solid #2d2d2d", borderRadius: "5px", color: "#e0e0e0", fontSize: "1rem" }}
                />
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "#ccc" }}>
                  Additional Notes
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special requests or questions..."
                  rows={4}
                  style={{ width: "100%", padding: "0.75rem", background: "#0f0f0f", border: "2px solid #2d2d2d", borderRadius: "5px", color: "#e0e0e0", fontSize: "1rem", resize: "vertical" }}
                />
              </div>

              <div style={{ background: "#0f0f0f", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem", border: "2px solid #fff" }}>
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
  details?: { label: string; value?: string }[];
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
