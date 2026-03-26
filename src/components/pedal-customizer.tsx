"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Download, ChevronRight, Star, Hammer, Mountain, Sparkles, Palette, Radiation, Cat, Sun, LucideCircleSlash2, Circle } from "lucide-react";
import { EffectSelector, type EffectPedal } from "./EffectSelector";
import { EnclosureSizeSelector, type EnclosureSize } from "./EnclosureSizeSelector";
import { PaintSelector, type PaintOption as PaintSelectorOption } from "./PaintSelector";
import { DesignSelector, type DesignOption } from "./DesignSelector";
import { LedSelector, type LedOption } from "./LedSelector";
import { KnobSelector, type KnobType } from "./KnobSelector";
import { checkSizeCompatibility } from "@/lib/sizeCompatibility";
import { ProductDetailModal, type ProductModalData, type SelectedModWithOptions } from "./ProductDetailModal";
import { IMAGE_CONFIG } from "@/lib/imageConfig";
import { resolveColors, findColorByKey, type ColorEntry } from "@/lib/colorUtils";
import { EnclosureVisualizer } from "./EnclosureVisualizer";
import { generateRandomLayout } from "@/lib/layoutGenerator";

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
  paintOptions: PaintSelectorOption[];
  designOptions: DesignOption[];
  ledOptions: LedOption[];
  knobTypes: KnobType[];
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
  knobTypes,
  favouritePaintIds,
}: PedalCustomizerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"effect" | "size" | "paint" | "design" | "knobs" | "led">("effect");
  const [selectedEffectId, setSelectedEffectId] = React.useState(effectPedals[0]?.id ?? "");
  const [selectedEnclosureSizeId, setSelectedEnclosureSizeId] = React.useState(enclosureSizes[0]?.name ?? "");
  const [selectedPaintId, setSelectedPaintId] = React.useState(paintOptions[0]?.id ?? "");
  const [selectedDesignId, setSelectedDesignId] = React.useState(designOptions[0]?.id ?? "");
  const [selectedLedId, setSelectedLedId] = React.useState(ledOptions[0]?.id ?? "");
  const [selectedLedColor, setSelectedLedColor] = React.useState<string>("Red");
  const [customLedColor, setCustomLedColor] = React.useState<string>("#ff0000");
  const [selectedLedBezelColor, setSelectedLedBezelColor] = React.useState<string | null>(null);
  const [selectedLabelColor, setSelectedLabelColor] = React.useState<string | null>(null);
  const [selectedKnobTypeId, setSelectedKnobTypeId] = React.useState(knobTypes[0]?.knob_type ?? "");
  const [selectedKnobSize, setSelectedKnobSize] = React.useState<number | null>(null);
  const [selectedKnobColorKey, setSelectedKnobColorKey] = React.useState<string | null>(null);
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
  const isRestoringRef = React.useRef<boolean>(false);

  // Mini visualizer state
  const [layoutsData, setLayoutsData] = React.useState<any[]>([]);
  const [isVisualizerMaximized, setIsVisualizerMaximized] = React.useState(false);
  const [selectedLayoutId, setSelectedLayoutId] = React.useState<string | null>(null);
  const [randomLayoutKey, setRandomLayoutKey] = React.useState(0);

  const selectedEffect = effectPedals.find((item) => item.id === selectedEffectId);
  const selectedSize = enclosureSizes.find((item) => item.name === selectedEnclosureSizeId);
  const selectedPaint = paintOptions.find((item) => item.id === selectedPaintId);
  const selectedDesign = designOptions.find((item) => item.id === selectedDesignId);
  const selectedLed = ledOptions.find((item) => item.id === selectedLedId);
  const selectedKnobType = knobTypes.find((kt) => kt.knob_type === selectedKnobTypeId);

  // Restore configuration from sessionStorage on mount
  React.useEffect(() => {
    const storedConfig = sessionStorage.getItem("pedalConfiguration");
    if (storedConfig) {
      try {
        isRestoringRef.current = true;
        const config = JSON.parse(storedConfig);
        
        // Restore effect selection
        if (config.effect?.id && effectPedals.find(e => e.id === config.effect.id)) {
          setSelectedEffectId(config.effect.id);
        }
        
        // Restore effect mods
        if (config.effectMods && Array.isArray(config.effectMods)) {
          setSelectedEffectMods(config.effectMods);
        }
        
        // Restore enclosure size
        if (config.enclosureSize?.name && enclosureSizes.find(s => s.name === config.enclosureSize.name)) {
          setSelectedEnclosureSizeId(config.enclosureSize.name);
        }
        
        // Restore paint selection
        if (config.paint?.id) {
          const paintExists = paintOptions.find(p => p.id === config.paint.id);
          if (paintExists) {
            setSelectedPaintId(config.paint.id);
            // Restore custom color if it was a custom paint
            if (config.paint.is_custom_color && config.paint.rgb) {
              setCustomColor(config.paint.rgb);
              setHasInteractedWithCustomPaint(true);
            }
          }
        }
        
        // Restore design selection
        if (config.design?.id && designOptions.find(d => d.id === config.design.id)) {
          setSelectedDesignId(config.design.id);
        }
        
        // Restore LED selection
        if (config.led?.id && ledOptions.find(l => l.id === config.led.id)) {
          setSelectedLedId(config.led.id);
        }
        
        // Restore LED color
        if (config.ledColor) {
          if (config.ledColor.startsWith('#')) {
            setSelectedLedColor("Custom");
            setCustomLedColor(config.ledColor);
          } else {
            setSelectedLedColor(config.ledColor);
          }
        }
        
        // Restore LED bezel color
        if (config.ledBezelColor !== undefined) {
          setSelectedLedBezelColor(config.ledBezelColor);
        }
        
        // Restore label color
        if (config.labelColor !== undefined) {
          setSelectedLabelColor(config.labelColor);
        }
        
        // Restore label text
        if (config.labelText) {
          setLabelText(config.labelText);
        }
        
        // Mark restoration as complete after a short delay
        setTimeout(() => {
          isRestoringRef.current = false;
          
          // After restoration, ensure LED bezel color is valid
          const restoredLed = ledOptions.find(l => l.id === config.led?.id);
          if (restoredLed?.available_colors && restoredLed.available_colors.length > 0) {
            const restoredBezelColor = config.ledBezelColor;
            const resolved = resolveColors(restoredLed.available_colors);
            if (!restoredBezelColor || !resolved.some(c => c.key === restoredBezelColor)) {
              setSelectedLedBezelColor(resolved[0].key);
            }
          }
        }, 100);
      } catch (error) {
        console.error("Failed to restore configuration from sessionStorage:", error);
        isRestoringRef.current = false;
      }
    }
  }, []); // Run only once on mount

  // Auto-select recommended enclosure size when effect changes (but not during restoration)
  React.useEffect(() => {
    if (!isRestoringRef.current && selectedEffect?.recommended_enclosure) {
      setSelectedEnclosureSizeId(selectedEffect.recommended_enclosure);
    }
  }, [selectedEffectId, selectedEffect]);

  // Store previous effect ID to detect actual changes
  const prevEffectIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!isRestoringRef.current && prevEffectIdRef.current !== null && prevEffectIdRef.current !== selectedEffectId) {
      // Effect actually changed - reset mods
      setSelectedEffectMods([]);
    }
    prevEffectIdRef.current = selectedEffectId;
  }, [selectedEffectId]);

  // Auto-default bezel color to first available color when LED changes
  const prevLedIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const ledChanged = prevLedIdRef.current !== selectedLedId;
    
    if (selectedLed && (ledChanged || prevLedIdRef.current === null)) {
      // Only auto-set if not currently restoring from sessionStorage
      if (!isRestoringRef.current) {
        if (selectedLed.available_colors && selectedLed.available_colors.length > 0) {
          const resolved = resolveColors(selectedLed.available_colors);
          const isCurrentValid = selectedLedBezelColor && resolved.some(c => c.key === selectedLedBezelColor);
          if (!isCurrentValid) {
            setSelectedLedBezelColor(resolved[0].key);
          }
        } else {
          setSelectedLedBezelColor(null);
        }
      }
      prevLedIdRef.current = selectedLedId;
    }
  }, [selectedLedId, selectedLed, selectedLedBezelColor]);

  // Auto-default label tape color when design changes
  const prevDesignIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const designChanged = prevDesignIdRef.current !== selectedDesignId;
    
    if (selectedDesign && (designChanged || prevDesignIdRef.current === null)) {
      if (!isRestoringRef.current) {
        const designData = selectedDesign as DesignOption & { available_colors?: ColorEntry[] };
        if (designData.available_colors && designData.available_colors.length > 0) {
          const resolved = resolveColors(designData.available_colors);
          const isCurrentValid = selectedLabelColor && resolved.some(c => c.key === selectedLabelColor);
          if (!isCurrentValid) {
            setSelectedLabelColor(resolved[0].key);
          }
        } else {
          setSelectedLabelColor(null);
        }
      }
      prevDesignIdRef.current = selectedDesignId;
    }
  }, [selectedDesignId, selectedDesign, selectedLabelColor]);

  // Auto-default knob size and color when knob type changes
  React.useEffect(() => {
    if (selectedKnobType) {
      if (!selectedKnobSize || !selectedKnobType.available_sizes_mm.includes(selectedKnobSize)) {
        setSelectedKnobSize(selectedKnobType.available_sizes_mm[0] ?? null);
      }
      if (selectedKnobType.available_colors.length > 0) {
        const resolved = resolveColors(selectedKnobType.available_colors);
        if (!selectedKnobColorKey || !resolved.some(c => c.key === selectedKnobColorKey)) {
          setSelectedKnobColorKey(resolved[0].key);
        }
      }
    }
  }, [selectedKnobTypeId, selectedKnobType]);

  // Helper to build knob modal sections (reused on open and on state changes)
  const buildKnobModalSections = React.useCallback((
    knobType: KnobType,
    currentSize: number | null,
    currentColorKey: string | null,
  ) => {
    const resolvedColors = resolveColors(knobType.available_colors);
    return [
      {
        title: "🎛️ Size Selection",
        content: (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {knobType.available_sizes_mm.map((size) => (
              <button
                key={size}
                onClick={() => {
                  setSelectedKnobSize(size);
                  setModalProduct(prev => prev ? { ...prev, price: knobType.variants.find(v => v.diameter_mm === size)?.price_eur ?? prev.price } : null);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: currentSize === size ? "2px solid #fff" : "2px solid #444",
                  background: currentSize === size ? "#fff" : "#1a1a1a",
                  color: currentSize === size ? "#000" : "#e0e0e0",
                  cursor: "pointer",
                  fontWeight: currentSize === size ? 600 : 400,
                  fontSize: "0.85rem",
                  transition: "all 0.2s ease",
                }}
              >
                {size}mm
              </button>
            ))}
          </div>
        ),
      },
      {
        title: "🎨 Color Selection",
        content: (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {resolvedColors.map((color) => (
              <button
                key={color.key}
                onClick={() => {
                  setSelectedKnobColorKey(color.key);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  border: currentColorKey === color.key ? "2px solid #fff" : "2px solid #444",
                  background: currentColorKey === color.key ? "#333" : "#1a1a1a",
                  color: "#e0e0e0",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: color.hex,
                  border: "1px solid #666",
                  flexShrink: 0,
                }} />
                {color.displayName}
              </button>
            ))}
          </div>
        ),
      },
    ];
  }, []);

  // Keep knob modal sections in sync with size/color selection changes
  React.useEffect(() => {
    if (!modalProduct || !selectedKnobType) return;
    // Only update if the modal is showing the current knob type
    if (modalProduct.title !== selectedKnobType.knob_type) return;

    setModalProduct(prev => {
      if (!prev) return null;
      const matchingVariant = selectedKnobType.variants.find(v => v.diameter_mm === selectedKnobSize);
      return {
        ...prev,
        price: matchingVariant?.price_eur ?? prev.price,
        additionalSections: buildKnobModalSections(selectedKnobType, selectedKnobSize, selectedKnobColorKey),
      };
    });
  }, [selectedKnobSize, selectedKnobColorKey, selectedKnobType, buildKnobModalSections]);

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

  // Close modal when tab changes
  React.useEffect(() => {
    setModalProduct(null);
  }, [activeTab]);

  // Fetch layouts data for mini visualizer
  React.useEffect(() => {
    fetch("/api/data/layouts")
      .then(res => res.json())
      .then(data => setLayoutsData(data))
      .catch(err => console.error("Failed to load layouts:", err));
  }, []);

  // Compute effective controls considering mods
  const effectiveControls = React.useMemo(() => {
    if (!selectedEffect?.controls) return [];
    let controls = [...selectedEffect.controls];
    if (selectedEffectMods && Array.isArray(selectedEffectMods)) {
      selectedEffectMods.forEach(({ mod }: any) => {
        if (mod.removes_controls && Array.isArray(mod.removes_controls)) {
          controls = controls.filter((c: any) => !mod.removes_controls!.includes(c.label));
        }
        if (mod.adds_controls && Array.isArray(mod.adds_controls)) {
          controls = [...controls, ...mod.adds_controls];
        }
      });
    }
    return controls;
  }, [selectedEffect, selectedEffectMods]);

  // Compute required footswitch/LED counts
  const requiredCounts = React.useMemo(() => {
    if (!selectedEffect) return { footswitches: 1, leds: 1 };
    let footswitches = 1;
    let leds = selectedEffect.technical_specs?.led_count || 1;
    if (selectedEffectMods && Array.isArray(selectedEffectMods)) {
      selectedEffectMods.forEach(({ mod }: any) => {
        if (mod.adds_technical_specs) {
          if (mod.adds_technical_specs.footswitches) footswitches += mod.adds_technical_specs.footswitches;
          if (mod.adds_technical_specs.led_count) leds += mod.adds_technical_specs.led_count;
        }
      });
    }
    return { footswitches, leds };
  }, [selectedEffect, selectedEffectMods]);

  // Select appropriate layout based on current config
  const previewLayout = React.useMemo(() => {
    if (!selectedEffect || !selectedSize || layoutsData.length === 0) return null;
    const enclosureType = selectedSize.name;
    const potCount = effectiveControls.filter((c: any) => c.type === "Pot").length;
    const switchCount = effectiveControls.filter((c: any) => c.type === "Switch" && c.label !== "Bypass").length;
    const faderCount = effectiveControls.filter((c: any) => c.type === "Fader").length;
    const { footswitches: requiredFootswitches, leds: requiredLeds } = requiredCounts;

    const getLayoutCounts = (layout: any) => ({
      footswitchCount: layout.footswitch_positions?.length || (layout.footswitch_position ? 1 : 0),
      ledCount: layout.led_positions?.length || (layout.led_position ? 1 : 0),
    });

    if (randomLayoutKey > 0) {
      return generateRandomLayout(enclosureType, potCount, switchCount, faderCount);
    }

    const matchingLayouts = layoutsData.filter((layout: any) => {
      const { footswitchCount, ledCount } = getLayoutCounts(layout);
      return layout.enclosure_type === enclosureType &&
        layout.potentiometer_count === potCount &&
        layout.switch_count === switchCount &&
        layout.fader_count === faderCount &&
        footswitchCount === requiredFootswitches &&
        ledCount === requiredLeds;
    });

    if (selectedLayoutId) {
      const userSelected = matchingLayouts.find((l: any) => l.id === selectedLayoutId);
      if (userSelected) return userSelected;
    }
    if (matchingLayouts.length > 0) return matchingLayouts[0];

    // Fallback: closest match
    const fallback = layoutsData.find((layout: any) => {
      const { footswitchCount, ledCount } = getLayoutCounts(layout);
      return layout.enclosure_type === enclosureType &&
        footswitchCount === requiredFootswitches &&
        ledCount === requiredLeds;
    }) || layoutsData.find((l: any) => l.enclosure_type === enclosureType);

    if (fallback) return fallback;
    return generateRandomLayout(enclosureType, potCount, switchCount, faderCount);
  }, [selectedEffect, selectedSize, effectiveControls, layoutsData, selectedLayoutId, randomLayoutKey, requiredCounts]);

  // Get all available layouts for current configuration
  const previewAvailableLayouts = React.useMemo(() => {
    if (!selectedEffect || !selectedSize || layoutsData.length === 0) return [];
    const enclosureType = selectedSize.name;
    const potCount = effectiveControls.filter((c: any) => c.type === "Pot").length;
    const switchCount = effectiveControls.filter((c: any) => c.type === "Switch" && c.label !== "Bypass").length;
    const faderCount = effectiveControls.filter((c: any) => c.type === "Fader").length;
    const { footswitches: requiredFootswitches, leds: requiredLeds } = requiredCounts;
    const getLayoutCounts = (layout: any) => ({
      footswitchCount: layout.footswitch_positions?.length || (layout.footswitch_position ? 1 : 0),
      ledCount: layout.led_positions?.length || (layout.led_position ? 1 : 0),
    });
    return layoutsData.filter((layout: any) => {
      const { footswitchCount, ledCount } = getLayoutCounts(layout);
      return layout.enclosure_type === enclosureType &&
        layout.potentiometer_count === potCount &&
        layout.switch_count === switchCount &&
        layout.fader_count === faderCount &&
        footswitchCount === requiredFootswitches &&
        ledCount === requiredLeds;
    });
  }, [selectedEffect, selectedSize, effectiveControls, layoutsData, requiredCounts]);

  // Compute paint color for preview
  const previewPaintColor = React.useMemo(() => {
    if (!selectedPaint) return "#808080";
    if (selectedPaint.is_custom_color && customColor) return customColor;
    if (selectedPaint.rgb) {
      const rgb = selectedPaint.rgb;
      if (rgb.startsWith('rgb(')) {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const [, r, g, b] = match;
          const toHex = (n: string) => parseInt(n).toString(16).padStart(2, '0');
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }
      }
      return rgb;
    }
    return "#808080";
  }, [selectedPaint, customColor]);

  // Compute LED color for preview
  const previewLedColor = React.useMemo(() => {
    if (selectedLedColor === "Custom") return customLedColor;
    const colorMap: Record<string, string> = { Red: "#ff0000", Blue: "#0066ff", Green: "#00ff00", Yellow: "#ffff00", White: "#ffffff", Amber: "#ffbf00", UV: "#8b00ff" };
    return colorMap[selectedLedColor] || "#ff0000";
  }, [selectedLedColor, customLedColor]);

  // Compute selected knob variant for the visualizer
  const selectedKnobVariant = React.useMemo(() => {
    if (!selectedKnobType) return null;
    // Find variant matching the selected size and color
    const colorMatched = selectedKnobType.variants.find(
      (v) => v.diameter_mm === selectedKnobSize && v.color.toLowerCase() === (selectedKnobColorKey || "").toLowerCase()
    );
    if (colorMatched) return colorMatched;
    // Fall back to just matching size
    const sizeMatched = selectedKnobType.variants.find((v) => v.diameter_mm === selectedKnobSize);
    if (sizeMatched) return sizeMatched;
    // Fall back to first variant
    return selectedKnobType.variants[0] ?? null;
  }, [selectedKnobType, selectedKnobSize, selectedKnobColorKey]);

  // Compute knob SVG URL and colors for the visualizer
  const knobPreviewData = React.useMemo(() => {
    if (!selectedKnobType || !selectedKnobVariant) return null;
    // Always prefer template_svg_path — variant-specific SVGs don't exist on disk
    const svgPath = selectedKnobType.template_svg_path || selectedKnobVariant.template_svg_path;
    if (!svgPath) return null;
    
    // Find color hex from the selected color key
    let primaryColor = selectedKnobVariant.primaryColor || "#888888";
    if (selectedKnobColorKey && selectedKnobType.available_colors.length > 0) {
      const found = findColorByKey(selectedKnobType.available_colors, selectedKnobColorKey);
      if (found) primaryColor = found.hex;
    }
    
    return {
      svgUrl: `/api/data/knobs/${svgPath.split("/").map(s => encodeURIComponent(s)).join("/")}`,
      diameterMm: selectedKnobVariant.diameter_mm,
      primaryColor,
      secondaryColor: selectedKnobVariant.secondaryColor || "#888888",
      primaryDarkColor: selectedKnobVariant.primaryDarkColor,
      primaryLightColor: selectedKnobVariant.primaryLightColor,
    };
  }, [selectedKnobType, selectedKnobVariant, selectedKnobColorKey]);

  // Compute label color hex for preview
  const previewLabelColorHex = React.useMemo(() => {
    if (!selectedLabelColor || !selectedDesign) return undefined;
    const designData = selectedDesign as DesignOption & { available_colors?: ColorEntry[] };
    if (!designData.available_colors) return undefined;
    const found = findColorByKey(designData.available_colors, selectedLabelColor);
    return found?.hex;
  }, [selectedLabelColor, selectedDesign]);

  // Calculate mod costs
  const modsTotalPrice = React.useMemo(() => {
    return selectedEffectMods.reduce((sum, { mod }) => sum + mod.customer_price_eur, 0);
  }, [selectedEffectMods]);

  // Calculate size compatibility surcharge
  const sizeSurcharge = React.useMemo(() => {
    if (!selectedEffect || !selectedSize) return 0;
    const result = checkSizeCompatibility(
      selectedEffect.id,
      selectedEffect.recommended_enclosure,
      selectedSize.name,
      selectedEffectMods
    );
    return result.surcharge;
  }, [selectedEffect, selectedSize, selectedEffectMods]);

  const totalPrice =
    (selectedEffect?.customer_price_eur ?? 0) +
    modsTotalPrice +
    sizeSurcharge +
    (selectedPaint?.customer_price_eur ?? 0) +
    (selectedDesign?.customer_price_eur ?? 0) +
    (selectedLed?.customer_price_eur ?? 0);

  // Tab navigation helper
  const advanceToNextTab = () => {
    const tabOrder: Array<typeof activeTab> = ["effect", "size", "paint", "design", "knobs", "led"];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    } else if (activeTab === "led") {
      // LED is the last tab, go to summary
      handleProceedToSummary();
    }
  };

  const getNextTabName = (): string | undefined => {
    const tabNames = {
      effect: "Size",
      size: "Paint",
      paint: "Design",
      design: "Knobs",
      knobs: "LED",
      led: "Summary",
      other: undefined,
    };
    return tabNames[activeTab];
  };

  // Modal handler for select & continue
  const handleModalSelectAndContinue = () => {
    console.log('✨ [PedalCustomizer] Select & Continue clicked. Modal type:', modalProduct?.type);
    console.log('  Current selectedEffectMods:', selectedEffectMods.map(m => m.mod.name));
    
    let shouldAdvanceTab = true;
    let ledOptionForSummary: LedOption | undefined;
    
    // Handle selection based on modal type
    if (modalProduct) {
      switch (modalProduct.type) {
        case "effect":
          // Effect was already selected when modal opened, no need to change it
          console.log('  ✅ Effect already selected when modal opened');
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
            // Store LED option to pass directly to summary (avoids state timing issue)
            ledOptionForSummary = ledOption;
            shouldAdvanceTab = false; // We'll handle navigation manually
          }
          break;
      }
    }
    
    console.log('  🚪 Closing modal');
    setModalProduct(null);
    
    // For LED tab, go directly to summary with the selected LED option
    if (ledOptionForSummary) {
      console.log('  ➡️ Going directly to summary with LED:', ledOptionForSummary.name);
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
        led: ledOptionForSummary, // Use the directly captured LED option
        ledColor: selectedLedColor === "Custom" ? customLedColor : selectedLedColor,
        ledBezelColor: selectedLedBezelColor,
        labelColor: selectedLabelColor,
        knob: selectedKnobType ? {
          knobType: selectedKnobType.knob_type,
          size: selectedKnobSize,
          colorKey: selectedKnobColorKey,
          variant: selectedKnobVariant,
          templateSvgPath: selectedKnobType.template_svg_path,
          availableSizes: selectedKnobType.available_sizes_mm,
          availableColors: selectedKnobType.available_colors,
        } : null,
        totalPrice,
      };
      
      // Store configuration in sessionStorage
      sessionStorage.setItem("pedalConfiguration", JSON.stringify(configData));
      
      // Navigate to summary page
      router.push("/customize/summary");
    } else if (shouldAdvanceTab) {
      console.log('  ➡️ Advancing to next tab');
      advanceToNextTab();
    }
    
    console.log('  📊 Final selectedEffectMods:', selectedEffectMods.map(m => m.mod.name));
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
      ledBezelColor: selectedLedBezelColor,
      labelColor: selectedLabelColor,
      knob: selectedKnobType ? {
        knobType: selectedKnobType.knob_type,
        size: selectedKnobSize,
        colorKey: selectedKnobColorKey,
        variant: selectedKnobVariant,
        templateSvgPath: selectedKnobType.template_svg_path,
        availableSizes: selectedKnobType.available_sizes_mm,
        availableColors: selectedKnobType.available_colors,
      } : null,
      totalPrice,
    };
    
    // Store configuration in sessionStorage
    sessionStorage.setItem("pedalConfiguration", JSON.stringify(configData));
    
    // Navigate to summary page
    router.push("/customize/summary");
  };

  return (
    <div data-section="pedal-customizer-main" style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#e0e0e0", background: "#0a0a0a" }}>
      {/* Floating Admin Button - Top Right (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
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
      )}
      
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
        {/* Configuration Summary Tabs - Fixed at top */}
        <div
          ref={summaryRef}
          data-section="configuration-summary"
          style={{
            position: "absolute",
            top: "1rem",
            left: "1.5rem",
            right: "3rem",
            marginLeft: "auto",
            marginRight: "auto",
            maxWidth: "800px",
            background: "rgba(26, 26, 26, 0.85)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "10px",
            zIndex: 100,
            padding: "0.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "0.5rem",
            overflow: "hidden",
          }}
        >
                {/* Effect Selection Tab */}
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
                    minWidth: 0,
                    overflow: "hidden",
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
                  <span style={{ fontSize: "0.8rem", color: activeTab === "effect" ? "#000" : "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedEffect ? selectedEffect.name : "—"}
                  </span>
                </button>
                {/* Enclosure Size Tab */}
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
                    minWidth: 0,
                    overflow: "hidden",
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
                  <span style={{ fontSize: "0.8rem", color: activeTab === "size" ? "#000" : "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedSize ? selectedSize.name : "—"}
                  </span>
                </button>
                {/* Paint/Finish Tab */}
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
                    minWidth: 0,
                    overflow: "hidden",
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
                  <span style={{ fontSize: "0.8rem", color: activeTab === "paint" ? "#000" : "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedPaint ? selectedPaint.displayed_name : "—"}
                  </span>
                </button>
                {/* Design Tab */}
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
                    minWidth: 0,
                    overflow: "hidden",
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
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: activeTab === "design" ? "#000" : "#888", marginBottom: "0.25rem" }}>Design/Label</span>
                  <span style={{ fontSize: "0.8rem", color: activeTab === "design" ? "#000" : "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedDesign?.name || "—"}</span>
                </button>
                {/* Knobs Tab */}
                <button
                  data-section="tab-knobs"
                  onClick={() => setActiveTab("knobs")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "0.5rem",
                    background: activeTab === "knobs" ? "#fff" : "#0f0f0f",
                    borderRadius: "5px",
                    textAlign: "center",
                    border: activeTab === "knobs" ? "2px solid #fff" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "knobs") {
                      e.currentTarget.style.background = "#1a1a1a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "knobs") {
                      e.currentTarget.style.background = "#0f0f0f";
                    }
                  }}
                >
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: activeTab === "knobs" ? "#000" : "#888", marginBottom: "0.25rem" }}>Knobs</span>
                  <span style={{ fontSize: "0.8rem", color: activeTab === "knobs" ? "#000" : "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedKnobType?.knob_type || "—"}</span>
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
                    minWidth: 0,
                    overflow: "hidden",
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
                  <span style={{ fontSize: "0.8rem", color: activeTab === "led" ? "#000" : "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedLed?.name || "—"}</span>
                </button>
        </div>

        {/* Scrollable Content */}
        <div data-section="tab-content-scrollable" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <div style={{ padding: "1.5rem", paddingRight: "2rem", paddingTop: `${summaryHeight || 130}px`, paddingBottom: "250px", maxWidth: "1400px", marginLeft: "auto", marginRight: "auto" }}>
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
                    <option value="favourites">Fuzzy&apos;s Favourites</option>
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
                console.log('🪟 [PedalCustomizer] Opening modal for effect:', pedal.name, {
                  currentSelectedEffectId: selectedEffectId,
                  newEffectId: pedal.id,
                  currentSelectedEffectMods: selectedEffectMods.map(m => m.mod.name),
                  modsCount: selectedEffectMods.length
                });
                
                // Select this effect FIRST, before opening the modal
                // This way mods won't be reset when clicking "Select & Continue"
                if (selectedEffectId !== pedal.id) {
                  console.log('  ⚡ Selecting effect before opening modal:', pedal.id);
                  setSelectedEffectId(pedal.id);
                }
                
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
              effectId={selectedEffect?.id}
              selectedMods={selectedEffectMods}
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
                          Non-standard size for this effect. Additional charge applies.
                        </div>
                      ),
                    }] : []),
                    {
                      title: "Description",
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
            <PaintSelector
              paintOptions={filteredPaintOptions}
              selectedPaintId={selectedPaintId}
              onSelectPaint={(id) => {
                setSelectedPaintId(id);
                const selectedOption = paintOptions.find(p => p.id === id);
                if (selectedOption?.is_custom_color) {
                  setShowColorPicker(true);
                }
              }}
              onShowDetails={(option) => {
                setModalProduct({
                  type: "paint",
                  title: option.displayed_name || option.name,
                  subtitle: `${option.color || ""} ${option.finish || ""}`.trim(),
                  price: option.customer_price_eur,
                  image: (option.images && option.images.length > 0 ? option.images[currentImageIndex[option.supplier_sku] || 0] : option.image),
                  images: option.images && option.images.length > 0 ? option.images : [option.image],
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
              }}
              customColor={customColor}
              customFinish={customFinish}
              adminMode={adminMode}
              dragOverSku={dragOverSku}
              currentImageIndex={currentImageIndex}
              onImageIndexChange={(sku, index) => {
                setCurrentImageIndex(prev => ({ ...prev, [sku]: index }));
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDeleteImage={handleDeleteImage}
              onShowColorPicker={() => setShowColorPicker(true)}
            />
          )}

          {/* Design/Labeling Tab */}
          {activeTab === "design" && (
            <DesignSelector
              designOptions={designOptions}
              selectedDesignId={selectedDesignId}
              onSelectDesign={setSelectedDesignId}
              onShowDetails={(option) => {
                const designData = option as DesignOption & { available_colors?: ColorEntry[] };
                setModalProduct({
                  type: "design",
                  title: option.name,
                  price: option.customer_price_eur,
                  image: (option.images && option.images.length > 0 ? option.images[currentImageIndex[option.id] || 0] : option.image),
                  images: option.images || [option.image],
                  description: option.long_description || option.short_description || option.description,
                  details: [],
                  availableLabelColors: designData.available_colors,
                  selectedLabelColor: selectedLabelColor,
                  onLabelColorChange: (colorKey: string) => {
                    setSelectedLabelColor(colorKey);
                    setModalProduct((prev) => prev ? { ...prev, selectedLabelColor: colorKey } : null);
                  },
                });
              }}
              adminMode={adminMode}
              dragOverSku={dragOverSku}
              currentImageIndex={currentImageIndex}
              onImageIndexChange={(id, index) => {
                setCurrentImageIndex(prev => ({ ...prev, [id]: index }));
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDeleteImage={handleDeleteImage}
            />
          )}

          {/* Knobs Tab */}
          {activeTab === "knobs" && (
            <KnobSelector
              knobTypes={knobTypes}
              selectedKnobTypeId={selectedKnobTypeId}
              onSelectKnobType={setSelectedKnobTypeId}
              onShowDetails={(knobType) => {
                // Select knob type before opening modal
                if (selectedKnobTypeId !== knobType.knob_type) {
                  setSelectedKnobTypeId(knobType.knob_type);
                }

                const firstVariant = knobType.variants[0];
                const resolvedColors = resolveColors(knobType.available_colors);
                
                // Use external image URL for preview (local paths have directory name mismatches)
                const previewImage = firstVariant?.image_url || undefined;

                setModalProduct({
                  type: "other",
                  title: knobType.knob_type,
                  subtitle: knobType.canonical_type ? `Style: ${knobType.canonical_type}` : undefined,
                  price: firstVariant?.price_eur ?? 0,
                  image: previewImage,
                  description: `Available in ${knobType.available_sizes_mm.length} size${knobType.available_sizes_mm.length > 1 ? "s" : ""} and ${resolvedColors.length} color${resolvedColors.length > 1 ? "s" : ""}. ${knobType.variants.length} total variant${knobType.variants.length > 1 ? "s" : ""} to tweak your tone controls just right.`,
                  details: [
                    { label: "Sizes", value: knobType.available_sizes_mm.map(s => `${s}mm`).join(", ") },
                    { label: "Colors", value: resolvedColors.map(c => c.displayName).join(", ") },
                    { label: "Variants", value: `${knobType.variants.length}` },
                    ...(firstVariant ? [{ label: "Shaft Type", value: firstVariant.shaft_type }] : []),
                  ],
                  additionalSections: buildKnobModalSections(knobType, selectedKnobSize, selectedKnobColorKey),
                });
              }}
            />
          )}

          {/* LED Tab */}
          {activeTab === "led" && (
            <>
            <LedSelector
              ledOptions={ledOptions}
              selectedLedId={selectedLedId}
              onSelectLed={setSelectedLedId}
              onShowDetails={(option) => {
                setModalProduct({
                  type: "led",
                  title: option.name,
                  price: option.customer_price_eur,
                  image: (option.images && option.images.length > 0 ? option.images[currentImageIndex[option.id] || 0] : option.image),
                  images: option.images || [option.image],
                  description: option.long_description || option.short_description || option.description,
                  details: [],
                  ledColor: selectedLedColor,
                  customLedColor: customLedColor,
                  availableBezelColors: option.available_colors,
                  selectedBezelColor: selectedLedBezelColor,
                  onLedColorChange: (color: string) => {
                    setSelectedLedColor(color);
                    setModalProduct((prev) => prev ? { ...prev, ledColor: color } : null);
                  },
                  onCustomLedColorChange: (color: string) => {
                    setCustomLedColor(color);
                    setModalProduct((prev) => prev ? { ...prev, customLedColor: color } : null);
                  },
                  onBezelColorChange: (color: string) => {
                    setSelectedLedBezelColor(color);
                    setModalProduct((prev) => prev ? { ...prev, selectedBezelColor: color } : null);
                  },
                });
              }}
              adminMode={adminMode}
              dragOverSku={dragOverSku}
              currentImageIndex={currentImageIndex}
              onImageIndexChange={(id, index) => {
                setCurrentImageIndex(prev => ({ ...prev, [id]: index }));
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDeleteImage={handleDeleteImage}
            />
            
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

          {/* Mini Enclosure Visualizer — visible after effect+size selected, on non-effect tabs */}
          {activeTab !== "effect" && previewLayout && selectedEffect && selectedSize && (
            <div style={{ marginTop: "1.5rem", borderTop: "1px solid #333", paddingTop: "1rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Layout Preview
              </div>
              <EnclosureVisualizer
                key={`preview-${previewLayout.id}-${randomLayoutKey}`}
                layout={previewLayout}
                availableLayouts={previewAvailableLayouts}
                onLayoutChange={(newLayout) => setSelectedLayoutId(newLayout.id)}
                onRandomizeLayout={() => setRandomLayoutKey(prev => prev + 1)}
                enclosureColor={previewPaintColor}
                finishType={selectedPaint?.finish || ""}
                ledColor={previewLedColor}
                ledType={selectedLed?.name}
                pedalName=""
                controls={effectiveControls}
                disabledLabels={Object.fromEntries(effectiveControls.filter((c: any) => c.type === 'Switch').map((c: any) => [c.label, true]))}
                isMaximized={isVisualizerMaximized}
                onToggleMaximize={() => setIsVisualizerMaximized(!isVisualizerMaximized)}
                labeledLettering={selectedDesign?.name === "Labeled Lettering"}
                labelColor={previewLabelColorHex}
                compact={true}
                knobSvgUrl={knobPreviewData?.svgUrl}
                knobDiameterMm={knobPreviewData?.diameterMm}
                knobPrimaryColor={knobPreviewData?.primaryColor}
                knobSecondaryColor={knobPreviewData?.secondaryColor}
                knobPrimaryDarkColor={knobPreviewData?.primaryDarkColor}
                knobPrimaryLightColor={knobPreviewData?.primaryLightColor}
              />
            </div>
          )}

          </div>
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
        imageSize={modalProduct?.type ? IMAGE_CONFIG.modalSizes[modalProduct.type] : undefined}
      />
    </div>
  );
}