"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle, Download, Mail } from "lucide-react";
import { EnclosureVisualizer, type KnobConfig } from "@/components/EnclosureVisualizer";
import { generateRandomLayout, type GeneratedLayout } from "@/lib/layoutGenerator";
import { resolveColors, findColorByKey, getContrastingColor, type ColorEntry } from "@/lib/colorUtils";
import { KnobSvg } from "@/components/KnobSvg";
import type { KnobType, KnobVariant } from "@/components/KnobSelector";

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

type KnobConfigData = {
  knobType: string;
  size: number | null;
  colorKey: string | null;
  variant: any;
  templateSvgPath?: string;
  availableSizes: number[];
  availableColors: ColorEntry[];
};

type PerPotKnobAssignment = {
  knobType: string;
  size: number;
  colorKey: string;
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
  ledBezelColor?: string | null;
  labelColor?: string | null;
  knob?: KnobConfigData | null;
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

const getBezelColorHex = (color: string): string => {
  const colorMap: Record<string, string> = {
    "red": "#ff0000",
    "blue": "#0066ff",
    "green": "#00ff00",
    "yellow": "#ffff00",
    "amber": "#ffbf00",
    "purple": "#bf00ff",
    "clear": "#ffffff"
  };
  return colorMap[color.toLowerCase()] || "#ffffff";
};

export function SummaryContent() {
  const [config, setConfig] = React.useState<ConfigData | null>(null);
  const [customerName, setCustomerName] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [customerNotes, setCustomerNotes] = React.useState("");
  const [pedalName, setPedalName] = React.useState("");
  const [controlLabels, setControlLabels] = React.useState<Record<string, string>>({});
  const [disabledLabels, setDisabledLabels] = React.useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingLedColor, setEditingLedColor] = React.useState(false);
  const [editingLedBezelColor, setEditingLedBezelColor] = React.useState(false);
  const [editingPaintColor, setEditingPaintColor] = React.useState(false);
  const [editingLabelColor, setEditingLabelColor] = React.useState(false);
  const [tempLabelColor, setTempLabelColor] = React.useState<string | null>(null);
  const [tempLedColor, setTempLedColor] = React.useState("");
  const [tempLedBezelColor, setTempLedBezelColor] = React.useState<string | null>(null);
  const [tempCustomLedColor, setTempCustomLedColor] = React.useState("#ff0000");
  const [tempPaintColor, setTempPaintColor] = React.useState("#808080");
  const [isVisualizerMaximized, setIsVisualizerMaximized] = React.useState(false);
  const [layoutsData, setLayoutsData] = React.useState<any[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = React.useState<string | null>(null);
  const [showPedalNameInVisualizer, setShowPedalNameInVisualizer] = React.useState(true);
  const [randomLayoutKey, setRandomLayoutKey] = React.useState(0);

  // Knob state
  const [knobTypesData, setKnobTypesData] = React.useState<KnobType[]>([]);
  const [knobAssignments, setKnobAssignments] = React.useState<Record<number, PerPotKnobAssignment>>({});
  const [editingKnobIndex, setEditingKnobIndex] = React.useState<number | null>(null);

  // Compute effective controls considering mods
  const effectiveControls = React.useMemo(() => {
    if (!config?.effect?.controls) {
      return [];
    }
    
    let controls = [...config.effect.controls];
    
    if (config.effectMods && Array.isArray(config.effectMods)) {
      config.effectMods.forEach(({ mod }: any) => {
        // Remove controls specified in removes_controls
        if (mod.removes_controls && Array.isArray(mod.removes_controls)) {
          controls = controls.filter((c: any) => !mod.removes_controls!.includes(c.label));
        }
        
        // Add new controls from adds_controls
        if (mod.adds_controls && Array.isArray(mod.adds_controls)) {
          controls = [...controls, ...mod.adds_controls];
        }
      });
    }
    
    return controls;
  }, [config?.effect, config?.effectMods]);

  // Calculate required footswitch and LED counts
  const requiredCounts = React.useMemo(() => {
    if (!config?.effect) {
      return { footswitches: 1, leds: 1 };
    }

    // Start with base counts from effect (footswitches default to 1, LEDs from technical_specs)
    let footswitches = 1; // Most pedals have 1 bypass footswitch
    let leds = config.effect.technical_specs?.led_count || 1;

    // Add counts from mods
    if (config.effectMods && Array.isArray(config.effectMods)) {
      config.effectMods.forEach(({ mod }: any) => {
        if (mod.adds_technical_specs) {
          if (mod.adds_technical_specs.footswitches) {
            footswitches += mod.adds_technical_specs.footswitches;
          }
          if (mod.adds_technical_specs.led_count) {
            leds += mod.adds_technical_specs.led_count;
          }
        }
      });
    }

    return { footswitches, leds };
  }, [config?.effect, config?.effectMods]);

  // Select appropriate layout based on control count (must be before early return)
  const selectedLayout = React.useMemo(() => {
    console.log('🎲 [Randomize] Layout useMemo triggered, randomLayoutKey:', randomLayoutKey);
    
    if (!config || !config.effect || layoutsData.length === 0) {
      return null;
    }
    
    const enclosureType = config.enclosureSize?.name || "125B";
    
    // Count effective controls
    let potCount = effectiveControls.filter((c: any) => c.type === "Pot").length;
    let switchCount = effectiveControls.filter((c: any) => c.type === "Switch" && c.label !== "Bypass").length;
    let faderCount = effectiveControls.filter((c: any) => c.type === "Fader").length;
    
    // Get required footswitch and LED counts
    const { footswitches: requiredFootswitches, leds: requiredLeds } = requiredCounts;
    
    // Helper to count footswitches and LEDs in a layout
    const getLayoutCounts = (layout: any) => {
      const footswitchCount = layout.footswitch_positions?.length || (layout.footswitch_position ? 1 : 0);
      const ledCount = layout.led_positions?.length || (layout.led_position ? 1 : 0);
      return { footswitchCount, ledCount };
    };
    
    // If randomLayoutKey > 0, force random generation
    if (randomLayoutKey > 0) {
      console.log('🎲 [Randomize] Forcing random layout generation!');
      const randomLayout = generateRandomLayout(enclosureType, potCount, switchCount, faderCount);
      console.log('🎲 [Randomize] Generated layout:', randomLayout.id);
      return randomLayout;
    }
    
    // Find all matching layouts (including footswitch and LED counts)
    const matchingLayouts = layoutsData.filter((layout: any) => {
      const { footswitchCount, ledCount } = getLayoutCounts(layout);
      return layout.enclosure_type === enclosureType &&
        layout.potentiometer_count === potCount &&
        layout.switch_count === switchCount &&
        layout.fader_count === faderCount &&
        footswitchCount === requiredFootswitches &&
        ledCount === requiredLeds;
    });
    
    // If user selected a specific layout and it's still valid, use it
    if (selectedLayoutId) {
      const userSelected = matchingLayouts.find((l: any) => l.id === selectedLayoutId);
      if (userSelected) {
        return userSelected;
      }
    }
    
    // Otherwise use first matching layout
    if (matchingLayouts.length > 0) {
      return matchingLayouts[0];
    }
    
    // Fallback: find closest match considering all control types (prioritize footswitch/LED match)
    let bestMatch = layoutsData.find((layout: any) => {
      const { footswitchCount, ledCount } = getLayoutCounts(layout);
      return layout.enclosure_type === enclosureType &&
        footswitchCount === requiredFootswitches &&
        ledCount === requiredLeds &&
        (layout.potentiometer_count >= potCount || potCount === 0) &&
        (layout.fader_count >= faderCount || faderCount === 0);
    });
    
    if (bestMatch) {
      return bestMatch;
    }
    
    // Final fallback: just get first layout for the enclosure type
    if (!bestMatch) {
      bestMatch = layoutsData.find((layout: any) => 
        layout.enclosure_type === enclosureType
      );
      if (bestMatch) {
        return bestMatch;
      }
    }
    
    if (!bestMatch && layoutsData.length > 0) {
      bestMatch = layoutsData[0];
    }
    
    // Ultimate fallback: generate a random layout
    if (!bestMatch) {
      console.log('🎲 [Randomize] Generating random layout:', { enclosureType, potCount, switchCount, faderCount });
      const randomLayout = generateRandomLayout(enclosureType, potCount, switchCount, faderCount);
      console.log('🎲 [Randomize] Generated layout:', randomLayout.id);
      return randomLayout;
    }
    
    return bestMatch;
  }, [config, effectiveControls, layoutsData, selectedLayoutId, randomLayoutKey, requiredCounts]);
  
  // Get all available layouts for current configuration
  const availableLayouts = React.useMemo(() => {
    if (!config || !config.effect || layoutsData.length === 0) return [];
    
    const enclosureType = config.enclosureSize?.name || "125B";
    let potCount = effectiveControls.filter((c: any) => c.type === "Pot").length;
    let switchCount = effectiveControls.filter((c: any) => c.type === "Switch" && c.label !== "Bypass").length;
    let faderCount = effectiveControls.filter((c: any) => c.type === "Fader").length;
    
    const { footswitches: requiredFootswitches, leds: requiredLeds } = requiredCounts;
    
    return layoutsData.filter((layout: any) => {
      const footswitchCount = layout.footswitch_positions?.length || (layout.footswitch_position ? 1 : 0);
      const ledCount = layout.led_positions?.length || (layout.led_position ? 1 : 0);
      
      return layout.enclosure_type === enclosureType &&
        layout.potentiometer_count === potCount &&
        layout.switch_count === switchCount &&
        layout.fader_count === faderCount &&
        footswitchCount === requiredFootswitches &&
        ledCount === requiredLeds;
    });
  }, [config, effectiveControls, layoutsData, requiredCounts]);
  
  // Handler to generate a new random layout
  const handleRandomizeLayout = React.useCallback(() => {
    console.log('🎲 [Randomize] Button clicked!');
    console.log('🎲 [Randomize] Current randomLayoutKey:', randomLayoutKey);
    console.log('🎲 [Randomize] Current selectedLayout:', selectedLayout?.id);
    // Increment the key to force layout regeneration
    setRandomLayoutKey(prev => {
      const newKey = prev + 1;
      console.log('🎲 [Randomize] Setting new randomLayoutKey:', newKey);
      return newKey;
    });
  }, [randomLayoutKey, selectedLayout]);
  
  // Helper function to convert rgb(r, g, b) to hex
  const rgbToHex = (rgb: string): string => {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return rgb; // Return as-is if not in rgb() format
    const [, r, g, b] = match;
    const toHex = (n: string) => parseInt(n).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Get paint color (must be before early return)
  const paintColor = React.useMemo(() => {
    if (!config?.paint) return "#808080";
    
    // For custom color products, check if user has selected a custom color
    if (config.paint.is_custom_color && config.paint.rgb) {
      const rgbValue = config.paint.rgb;
      // If it starts with 'rgb(', convert to hex
      if (rgbValue.startsWith('rgb(')) {
        return rgbToHex(rgbValue);
      }
      // If it's already in hex format (user selected color), return as-is
      return rgbValue;
    }
    
    // For standard products, use the RGB field from the product data
    if (config.paint.rgb) {
      const rgbValue = config.paint.rgb;
      // Convert rgb(r,g,b) format to hex
      if (rgbValue.startsWith('rgb(')) {
        return rgbToHex(rgbValue);
      }
      return rgbValue;
    }
    
    // Fallback to color_info hex or default gray
    return config.paint.color_info?.hex || "#808080";
  }, [config?.paint]);
  
  // Get finish type (must be before early return)
  const finishType = React.useMemo(() => {
    return config?.paint?.finish_info?.finish_type || "";
  }, [config?.paint]);

  // Get label color hex (must be before early return)
  const labelColorHex = React.useMemo(() => {
    if (!config?.labelColor || !config?.design?.available_colors) return undefined;
    const found = findColorByKey(config.design.available_colors, config.labelColor);
    return found?.hex;
  }, [config?.labelColor, config?.design]);

  // Compute per-pot knob configs for the EnclosureVisualizer
  const knobConfigsPerPot = React.useMemo((): (KnobConfig | null)[] => {
    if (!config?.knob || Object.keys(knobAssignments).length === 0) return [];
    const potIndices = Object.keys(knobAssignments).map(Number).sort((a, b) => a - b);
    return potIndices.map(idx => {
      const assignment = knobAssignments[idx];
      if (!assignment) return null;
      // Find the knob type data
      const knobType = knobTypesData.find(kt => kt.knob_type === assignment.knobType);
      const templateSvgPath = knobType?.template_svg_path || config.knob?.templateSvgPath;
      if (!templateSvgPath) return null;
      // Find matching variant for color info
      const variant = knobType?.variants.find(
        v => v.diameter_mm === assignment.size && v.color.toLowerCase() === (assignment.colorKey || "").toLowerCase()
      ) || knobType?.variants.find(v => v.diameter_mm === assignment.size) || knobType?.variants[0];
      // Resolve color hex
      let primaryColor = variant?.primaryColor || "#888888";
      const colors = knobType?.available_colors || config.knob?.availableColors || [];
      if (assignment.colorKey && colors.length > 0) {
        const found = findColorByKey(colors, assignment.colorKey);
        if (found) primaryColor = found.hex;
      }
      return {
        svgUrl: `/api/data/knobs/${templateSvgPath.split("/").map(s => encodeURIComponent(s)).join("/")}`,
        diameterMm: assignment.size,
        primaryColor,
        secondaryColor: variant?.secondaryColor || "#888888",
        primaryDarkColor: variant?.primaryDarkColor,
        primaryLightColor: variant?.primaryLightColor,
      };
    });
  }, [config?.knob, knobAssignments, knobTypesData]);

  // Pot controls list for the knob assignment UI
  const potControls = React.useMemo(() => {
    return effectiveControls.filter((c: any) => c.type === "Pot");
  }, [effectiveControls]);

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
        
        // Set default labels and disable switches by default
        const initialDisabled: Record<string, boolean> = {};
        controls.forEach((control: any) => {
          initialLabels[control.label] = control.label;
          if (control.type === 'Switch') {
            initialDisabled[control.label] = true;
          }
        });
        
        setControlLabels(initialLabels);
        setDisabledLabels(initialDisabled);
      }
      
      // Parse the old labelText format if it exists, or use effect pedal name as default
      const labelText = parsed.labelText || parsed.effect?.name || "";
      setPedalName(labelText);

      // Initialize per-pot knob assignments from knob config
      if (parsed.knob) {
        const potCount = (() => {
          let ctrls = parsed.effect?.controls ? [...parsed.effect.controls] : [];
          if (parsed.effectMods) {
            parsed.effectMods.forEach((m: SelectedModWithOptions) => {
              if (m.mod.removes_controls) ctrls = ctrls.filter((c: any) => !m.mod.removes_controls!.includes(c.label));
              if (m.mod.adds_controls) ctrls = [...ctrls, ...m.mod.adds_controls];
            });
          }
          return ctrls.filter((c: any) => c.type === "Pot").length;
        })();
        const defaultAssignment: PerPotKnobAssignment = {
          knobType: parsed.knob.knobType,
          size: parsed.knob.size ?? parsed.knob.availableSizes?.[0] ?? 10,
          colorKey: parsed.knob.colorKey ?? "black",
        };
        const assignments: Record<number, PerPotKnobAssignment> = {};
        for (let i = 0; i < potCount; i++) {
          assignments[i] = { ...defaultAssignment };
        }
        setKnobAssignments(assignments);
      }
    }
  }, []);

  // Fetch knob types for the per-pot knob editor
  React.useEffect(() => {
    fetch("/api/data/knobs/knobs.json")
      .then(res => res.json())
      .then((data: { knob_types: KnobType[] }) => setKnobTypesData(data.knob_types || []))
      .catch(err => console.error("Failed to load knob types:", err));
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
      ...config,
      customerName,
      customerEmail,
      customerNotes,
      pedalName,
      controlLabels,
      disabledLabels,
      submittedAt: new Date().toISOString(),
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
    // Validation disabled for testing
    // if (!customerName || !customerEmail) {
    //   alert("Please provide your name and email address");
    //   return;
    // }

    // Basic email validation
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(customerEmail)) {
    //   alert("Please provide a valid email address");
    //   return;
    // }

    setIsSubmitting(true);
    
    try {
      // Prepare order data with customer information
      const orderData = {
        ...config,
        customerName,
        customerEmail,
        customerNotes,
        pedalName,
        controlLabels,
        disabledLabels,
        submittedAt: new Date().toISOString(),
      };

      // Submit order to API
      const response = await fetch("/api/submit-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit order");
      }

      // Success!
      alert("🎉 Order submitted successfully!\n\nYou will receive a confirmation email shortly with your order details.\n\nThank you for your order!");
      
      // Download JSON as backup
      handleDownloadJSON();
      
      // Clear the configuration after successful submission
      sessionStorage.removeItem("pedalConfiguration");
      
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("❌ Failed to submit order. Please try again or download the configuration and contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
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

  const handleEditLedBezelColor = () => {
    if (config && config.led?.available_colors) {
      setTempLedBezelColor(config.ledBezelColor || null);
      setEditingLedBezelColor(true);
    }
  };

  const handleSaveLedBezelColor = () => {
    if (config) {
      setConfig({ ...config, ledBezelColor: tempLedBezelColor });
      sessionStorage.setItem("pedalConfiguration", JSON.stringify({ ...config, ledBezelColor: tempLedBezelColor }));
      setEditingLedBezelColor(false);
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

  const handleEditLabelColor = () => {
    if (config && config.design?.available_colors) {
      setTempLabelColor(config.labelColor || null);
      setEditingLabelColor(true);
    }
  };

  const handleSaveLabelColor = () => {
    if (config) {
      setConfig({ ...config, labelColor: tempLabelColor });
      sessionStorage.setItem("pedalConfiguration", JSON.stringify({ ...config, labelColor: tempLabelColor }));
      setEditingLabelColor(false);
    }
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
                shortDesc={`Inspired by ${config.effect.inspired_by}`}
                longDesc={config.effect.description}
                details={[
                  { 
                    label: "Categories", 
                    value: (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {(config.effect.categories || [config.effect.category]).map((cat: string) => (
                          <div
                            key={cat}
                            style={{
                              display: "inline-block",
                              background: "#333",
                              color: "#fff",
                              padding: "0.25rem 0.6rem",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                            }}
                          >
                            {cat}
                          </div>
                        ))}
                      </div>
                    ) as any
                  },
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
                price={config.enclosureSize.customer_price_eur}
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
              <ConfigSection
                title="Enclosure Finish"
                name={config.paint.displayed_name}
                price={config.paint.customer_price_eur}
                shortDesc={config.paint.short_description}
                longDesc={config.paint.long_description}
                details={[
                  { label: "Product ID", value: config.paint.internal_product_id },
                  { label: "Color", value: config.paint.is_custom_color ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        background: config.paint.rgb || "#808080",
                        border: "1px solid #666",
                      }} />
                      <span>{config.paint.rgb || "Custom"}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPaintColor();
                        }}
                        style={{
                          background: "transparent",
                          color: "#999",
                          border: "1px solid #666",
                          borderRadius: "3px",
                          padding: "0.25rem 0.5rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          marginLeft: "0.5rem"
                        }}
                      >
                        ✏️
                      </button>
                    </div>
                  ) as any : config.paint.color },
                  { label: "Finish", value: config.paint.finish },
                ]}
              />
            )}

            {/* Design/Labeling */}
            {config.design && (
              <div>
                <ConfigSection
                  title="Design & Labeling"
                  name={config.design.name}
                  price={config.design.customer_price_eur}
                  shortDesc={config.design.short_description}
                  longDesc={config.design.long_description}
                  details={(() => {
                    const details: any[] = [];
                    if (config.labelColor && config.design.available_colors) {
                      const found = findColorByKey(config.design.available_colors, config.labelColor);
                      if (found) {
                        details.push({
                          label: "Label Tape Color",
                          value: (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{
                                width: "36px",
                                height: "16px",
                                borderRadius: "3px",
                                background: found.hex,
                                border: "1px solid #666",
                              }} />
                              <span>{found.displayName}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditLabelColor();
                                }}
                                style={{
                                  background: "transparent",
                                  color: "#999",
                                  border: "1px solid #666",
                                  borderRadius: "3px",
                                  padding: "0.25rem 0.5rem",
                                  cursor: "pointer",
                                  fontSize: "0.75rem",
                                  marginLeft: "0.5rem"
                                }}
                              >
                                ✏️
                              </button>
                            </div>
                          ) as any
                        });
                      }
                    }
                    return details.length > 0 ? details : undefined;
                  })()}
                />
              </div>
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
                      Leave empty if you&apos;d like us to create a unique name for your pedal
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
                      {effectiveControls.map((control: any, idx: number) => {
                        const isDisabled = !!disabledLabels[control.label];
                        return (
                          <div key={idx} style={{ opacity: isDisabled ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                              <label style={{ fontSize: "0.8rem", color: "#aaa" }}>
                                {control.type} - {control.label}
                              </label>
                              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none", gap: "0.35rem" }}>
                                <span style={{ fontSize: "0.75rem", color: isDisabled ? "#666" : "#4ade80" }}>
                                  {isDisabled ? "Hidden" : "Visible"}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={!isDisabled}
                                  onChange={(e) => setDisabledLabels(prev => ({ ...prev, [control.label]: !e.target.checked }))}
                                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#4ade80" }}
                                />
                              </label>
                            </div>
                            <input
                              type="text"
                              value={controlLabels[control.label] ?? control.label}
                              onChange={(e) => setControlLabels(prev => ({ ...prev, [control.label]: e.target.value }))}
                              placeholder={control.label}
                              disabled={isDisabled}
                              style={{ 
                                width: "100%", 
                                padding: "0.5rem", 
                                background: isDisabled ? "#080808" : "#0f0f0f", 
                                border: `1px solid ${isDisabled ? "#1a1a1a" : "#2d2d2d"}`, 
                                borderRadius: "4px", 
                                color: isDisabled ? "#555" : "#e0e0e0", 
                                fontSize: "0.9rem", 
                                boxSizing: "border-box" 
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.75rem", marginBottom: 0 }}>
                      Toggle visibility and customize the label for each control. Switches are hidden by default.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* LED */}
            {config.led && (
              <div style={{ position: "relative" }}>
                <ConfigSection
                  title="LED Style"
                  name={config.led.name}
                  price={config.led.customer_price_eur}
                  shortDesc={config.led.short_description}
                  longDesc={config.led.long_description}
                  details={(() => {
                    const details: any[] = [];
                    
                    // LED Color
                    if (config.ledColor && !config.led.name.includes("No LED")) {
                      details.push({
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLedColor();
                              }}
                              style={{
                                background: "transparent",
                                color: "#999",
                                border: "1px solid #666",
                                borderRadius: "3px",
                                padding: "0.25rem 0.5rem",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                marginLeft: "0.5rem"
                              }}
                            >
                              ✏️
                            </button>
                          </div>
                        ) as any
                      });
                    }
                      
                      // Bezel/Lens Color
                      if (config.led?.available_colors && config.led.available_colors.length > 0) {
                        details.push({
                          label: "Bezel/Lens Color",
                          value: config.ledBezelColor ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: getBezelColorHex(config.ledBezelColor),
                                boxShadow: config.ledBezelColor !== "clear" ? `0 0 8px ${getBezelColorHex(config.ledBezelColor)}` : "none",
                                border: "1px solid #666",
                                opacity: config.ledBezelColor === "clear" ? 0.3 : 1
                              }} />
                              <span style={{ textTransform: "capitalize" }}>{config.ledBezelColor}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditLedBezelColor();
                                }}
                                style={{
                                  background: "transparent",
                                  color: "#999",
                                  border: "1px solid #666",
                                  borderRadius: "3px",
                                  padding: "0.25rem 0.5rem",
                                  cursor: "pointer",
                                  fontSize: "0.75rem",
                                  marginLeft: "0.5rem"
                                }}
                              >
                                ✏️
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={handleEditLedBezelColor}
                              style={{
                                background: "#2d2d2d",
                                color: "#fff",
                                border: "1px solid #666",
                                borderRadius: "5px",
                                padding: "0.5rem 1rem",
                                cursor: "pointer",
                                fontSize: "0.85rem"
                              }}
                            >
                              Select Color
                            </button>
                          ) as any
                        });
                      }
                      
                      return details.length > 0 ? details : undefined;
                    })()}
                  />
              </div>
            )}

            {/* Knobs */}
            {config.knob && (
              <div style={{ background: "#1a1a1a", padding: "0.1rem 1.5rem 1.5rem 1.5rem", borderRadius: "10px", marginBottom: "1.5rem", border: "1px solid #333" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem", color: "#fff" }}>Knob Configuration</h3>
                <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "1rem" }}>
                  Default: <span style={{ color: "#fff", fontWeight: 600 }}>{config.knob.knobType}</span>
                  {config.knob.size && <> — {config.knob.size}mm</>}
                  {config.knob.variant?.price_eur != null && (
                    <span style={{ color: "#4ade80", marginLeft: "0.5rem" }}>
                      €{config.knob.variant.price_eur.toFixed(2)} each
                    </span>
                  )}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#666", marginBottom: "1rem" }}>
                  Because one knob to rule them all is boring — customize each pot individually. Or don&apos;t. We won&apos;t judge. (Okay, maybe a little.)
                </p>
                {potControls.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {potControls.map((control: any, potIdx: number) => {
                      const assignment = knobAssignments[potIdx];
                      if (!assignment) return null;
                      const knobType = knobTypesData.find(kt => kt.knob_type === assignment.knobType);
                      const resolvedColors = knobType ? resolveColors(knobType.available_colors) : (config.knob?.availableColors ? resolveColors(config.knob.availableColors) : []);
                      const selectedColorInfo = resolvedColors.find(c => c.key === assignment.colorKey);
                      const isEditing = editingKnobIndex === potIdx;
                      const templateSvgPath = knobType?.template_svg_path || config.knob?.templateSvgPath;
                      const svgUrl = templateSvgPath ? `/api/data/knobs/${templateSvgPath.split("/").map(s => encodeURIComponent(s)).join("/")}` : null;

                      return (
                        <div key={potIdx} style={{ background: "#0f0f0f", borderRadius: "8px", border: isEditing ? "1px solid #555" : "1px solid #2d2d2d", overflow: "hidden" }}>
                          {/* Pot header row */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              padding: "0.75rem",
                              cursor: "pointer",
                            }}
                            onClick={() => setEditingKnobIndex(isEditing ? null : potIdx)}
                          >
                            {/* Mini knob SVG preview */}
                            {svgUrl && (
                              <div style={{ width: "32px", height: "32px", flexShrink: 0 }}>
                                <KnobSvg
                                  svgUrl={svgUrl}
                                  diameterMm={assignment.size || 10}
                                  primaryColor={selectedColorInfo?.hex || "#888"}
                                  secondaryColor="#888"
                                  width="32px"
                                  height="32px"
                                />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e0e0e0" }}>
                                {controlLabels[control.label] || control.label}
                              </div>
                              <div style={{ fontSize: "0.7rem", color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {assignment.knobType} — {assignment.size}mm
                                {selectedColorInfo && ` — ${selectedColorInfo.displayName}`}
                              </div>
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#666" }}>
                              {isEditing ? "▲" : "▼"}
                            </div>
                          </div>

                          {/* Expanded editor */}
                          {isEditing && (
                            <div style={{ padding: "0 0.75rem 0.75rem", borderTop: "1px solid #2d2d2d" }}>
                              {/* Knob type selector */}
                              {knobTypesData.length > 0 && (
                                <div style={{ marginTop: "0.75rem" }}>
                                  <label style={{ fontSize: "0.75rem", color: "#888", display: "block", marginBottom: "0.35rem" }}>Type</label>
                                  <select
                                    value={assignment.knobType}
                                    onChange={(e) => {
                                      const newType = knobTypesData.find(kt => kt.knob_type === e.target.value);
                                      if (newType) {
                                        const newColors = resolveColors(newType.available_colors);
                                        setKnobAssignments(prev => ({
                                          ...prev,
                                          [potIdx]: {
                                            knobType: newType.knob_type,
                                            size: newType.available_sizes_mm[0] ?? 10,
                                            colorKey: newColors[0]?.key ?? "black",
                                          },
                                        }));
                                      }
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      background: "#1a1a1a",
                                      border: "1px solid #444",
                                      borderRadius: "5px",
                                      color: "#e0e0e0",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    {knobTypesData.map(kt => (
                                      <option key={kt.knob_type} value={kt.knob_type}>{kt.knob_type}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Size buttons */}
                              <div style={{ marginTop: "0.75rem" }}>
                                <label style={{ fontSize: "0.75rem", color: "#888", display: "block", marginBottom: "0.35rem" }}>Size</label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                                  {(knobType?.available_sizes_mm || config.knob?.availableSizes || []).map(size => (
                                    <button
                                      key={size}
                                      onClick={() => setKnobAssignments(prev => ({ ...prev, [potIdx]: { ...prev[potIdx], size } }))}
                                      style={{
                                        padding: "0.3rem 0.6rem",
                                        borderRadius: "4px",
                                        border: assignment.size === size ? "2px solid #fff" : "1px solid #444",
                                        background: assignment.size === size ? "#fff" : "#1a1a1a",
                                        color: assignment.size === size ? "#000" : "#ccc",
                                        cursor: "pointer",
                                        fontWeight: assignment.size === size ? 600 : 400,
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {size}mm
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Color buttons */}
                              {resolvedColors.length > 0 && (
                                <div style={{ marginTop: "0.75rem" }}>
                                  <label style={{ fontSize: "0.75rem", color: "#888", display: "block", marginBottom: "0.35rem" }}>Color</label>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                                    {resolvedColors.map(color => (
                                      <button
                                        key={color.key}
                                        onClick={() => setKnobAssignments(prev => ({ ...prev, [potIdx]: { ...prev[potIdx], colorKey: color.key } }))}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.3rem",
                                          padding: "0.25rem 0.5rem",
                                          borderRadius: "4px",
                                          border: assignment.colorKey === color.key ? "2px solid #fff" : "1px solid #444",
                                          background: assignment.colorKey === color.key ? "#333" : "#1a1a1a",
                                          color: "#ccc",
                                          cursor: "pointer",
                                          fontSize: "0.7rem",
                                        }}
                                      >
                                        <div style={{
                                          width: "14px",
                                          height: "14px",
                                          borderRadius: "50%",
                                          background: color.hex,
                                          border: "1px solid #555",
                                          flexShrink: 0,
                                        }} />
                                        {color.displayName}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Apply to all button */}
                              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                                <button
                                  onClick={() => {
                                    const current = knobAssignments[potIdx];
                                    if (!current) return;
                                    setKnobAssignments(prev => {
                                      const updated = { ...prev };
                                      Object.keys(updated).forEach(k => {
                                        updated[Number(k)] = { ...current };
                                      });
                                      return updated;
                                    });
                                  }}
                                  style={{
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: "4px",
                                    border: "1px solid #555",
                                    background: "#2d2d2d",
                                    color: "#ccc",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  Apply to all pots
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Form */}
          <div data-section="order-form-sidebar">
            {/* Enclosure Visualizer */}
            {selectedLayout && (() => {
              console.log('🎨 [Summary] Rendering EnclosureVisualizer with:', {
                layout: selectedLayout.id,
                layoutFaderCount: selectedLayout.fader_count,
                layoutFaderPositions: selectedLayout.fader_positions?.length || 0,
                controls: effectiveControls.map((c: any) => `${c.label} (${c.type})`),
                controlsCount: effectiveControls.length,
                faderControls: effectiveControls.filter((c: any) => c.type === 'Fader').map((c: any) => c.label)
              });
              return (
              <div data-section="enclosure-visualizer" style={{ marginBottom: "2rem" }}>
                <EnclosureVisualizer
                  key={`visualizer-${selectedLayout.id}-${randomLayoutKey}`}
                  layout={selectedLayout}
                  availableLayouts={availableLayouts}
                  onLayoutChange={(newLayout) => setSelectedLayoutId(newLayout.id)}
                  onRandomizeLayout={handleRandomizeLayout}
                  enclosureColor={paintColor}
                  finishType={finishType}
                  ledColor={config.ledColor || "#ff0000"}
                  ledType={config.led?.name}
                  pedalName={showPedalNameInVisualizer ? pedalName : ""}
                  controlLabels={controlLabels}
                  disabledLabels={disabledLabels}
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
                  labelColor={labelColorHex}
                  knobConfigsPerPot={knobConfigsPerPot.length > 0 ? knobConfigsPerPot : undefined}
                />
              </div>
              );
            })()}
            
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
                {isSubmitting ? "Submitting..." : "Submit Build Request"}
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

        {/* Bezel/Lens Color Edit Modal */}
        {editingLedBezelColor && config?.led?.available_colors && (
          <div
            onClick={() => setEditingLedBezelColor(false)}
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
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#fff" }}>
                Select Bezel/Lens Color
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#999", marginBottom: "1.5rem" }}>
                The bezel/lens color affects the appearance of the LED indicator on your pedal enclosure.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                {resolveColors(config.led.available_colors).map((resolved) => {
                  const isSelected = tempLedBezelColor === resolved.key;
                  const isClear = resolved.key === "clear";

                  return (
                    <div
                      key={resolved.key}
                      onClick={() => setTempLedBezelColor(resolved.key)}
                      style={{
                        background: "#0f0f0f",
                        borderRadius: "8px",
                        padding: "0.75rem",
                        cursor: "pointer",
                        border: isSelected ? "2px solid #fff" : "2px solid #333",
                        transition: "all 0.2s ease",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: resolved.hex,
                          margin: "0 auto 0.5rem",
                          boxShadow: !isClear ? `0 0 12px ${resolved.hex}` : "none",
                          border: "1px solid #666",
                          opacity: isClear ? 0.3 : 1,
                        }}
                      />
                      <div style={{ fontSize: "0.8rem", color: "#e0e0e0", textTransform: "capitalize" }}>
                        {resolved.displayName}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setEditingLedBezelColor(false)}
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
                  onClick={handleSaveLedBezelColor}
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

        {/* Label Tape Color Edit Modal */}
        {editingLabelColor && config?.design?.available_colors && (
          <div
            onClick={() => setEditingLabelColor(false)}
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
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#fff" }}>
                🏷️ Select Label Tape Color
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#999", marginBottom: "1.5rem" }}>
                Choose the color of your embossed label tape — the little strips that identify your controls.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                {resolveColors(config.design.available_colors).map((resolved) => {
                  const isSelected = tempLabelColor === resolved.key;
                  const textOnSwatch = getContrastingColor(resolved.hex);

                  return (
                    <div
                      key={resolved.key}
                      onClick={() => setTempLabelColor(resolved.key)}
                      style={{
                        background: "#0f0f0f",
                        borderRadius: "8px",
                        padding: "0.75rem",
                        cursor: "pointer",
                        border: isSelected ? "2px solid #fff" : "2px solid #333",
                        transition: "all 0.2s ease",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "20px",
                          borderRadius: "3px",
                          background: resolved.hex,
                          margin: "0 auto 0.5rem",
                          border: "1px solid #555",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "5px",
                          fontWeight: 700,
                          color: textOnSwatch,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          fontFamily: "monospace",
                        }}
                      >
                        LABEL
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#e0e0e0" }}>
                        {resolved.displayName}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setEditingLabelColor(false)}
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
                  onClick={handleSaveLabelColor}
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
