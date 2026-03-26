"use client";

import * as React from "react";

let knobInstanceCounter = 0;

/** Make all SVG IDs unique by appending a suffix, and update all references (url(#...), xlink:href="#...") */
function uniquifyIds(svgText: string, suffix: string): string {
  // Collect all defined IDs
  const idSet = new Set<string>();
  svgText.replace(/\bid="([^"]+)"/g, (_m, id) => { idSet.add(id); return _m; });
  if (idSet.size === 0) return svgText;

  let result = svgText;
  for (const id of idSet) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Replace id definitions
    result = result.replace(new RegExp(`\\bid="${escaped}"`, "g"), `id="${id}_${suffix}"`);
    // Replace url(#id) references (in style attributes and fill/clip-path attributes)
    result = result.replace(new RegExp(`url\\(#${escaped}\\)`, "g"), `url(#${id}_${suffix})`);
    // Replace xlink:href="#id" references (gradient inheritance)
    result = result.replace(new RegExp(`xlink:href="#${escaped}"`, "g"), `xlink:href="#${id}_${suffix}"`);
    // Replace href="#id" (SVG2 style)
    result = result.replace(new RegExp(`href="#${escaped}"`, "g"), `href="#${id}_${suffix}"`);
  }
  return result;
}

export type KnobSvgProps = {
  /** URL to the SVG template (e.g., /api/data/knobs/Types/Boss%20Style/Boss_Style_template.svg) */
  svgUrl: string;
  /** Target diameter in mm for scaling (template is normalized to 10mm) */
  diameterMm?: number;
  /** Primary color hex to apply (e.g., "#050505") */
  primaryColor?: string;
  /** Secondary color hex to apply */
  secondaryColor?: string;
  /** Dark shade of primary (auto-derived if not provided) */
  primaryDarkColor?: string;
  /** Light shade of primary (auto-derived if not provided) */
  primaryLightColor?: string;
  /** CSS width override (defaults to "100%") */
  width?: string | number;
  /** CSS height override (defaults to "100%") */
  height?: string | number;
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
};

/** Darken a hex color by a given amount (0-1) */
function darkenColor(hex: string, amount: number = 0.3): string {
  const clean = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(clean.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(clean.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(clean.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Lighten a hex color by a given amount (0-1) */
function lightenColor(hex: string, amount: number = 0.3): string {
  const clean = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(clean.substring(0, 2), 16) + (255 - parseInt(clean.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(clean.substring(2, 4), 16) + (255 - parseInt(clean.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(clean.substring(4, 6), 16) + (255 - parseInt(clean.substring(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Build a color map from primary/secondary/dark/light colors */
function buildColorMap(
  primaryColor: string,
  secondaryColor: string,
  primaryDarkColor?: string,
  primaryLightColor?: string,
): Record<string, string> {
  return {
    primary: primaryColor,
    primaryDark: primaryDarkColor || darkenColor(primaryColor, 0.3),
    primaryLight: primaryLightColor || lightenColor(primaryColor, 0.3),
    secondary: secondaryColor,
    secondaryDark: darkenColor(secondaryColor, 0.3),
    secondaryLight: lightenColor(secondaryColor, 0.3),
  };
}

/** Extract the color reference from an inkscape:label value.
 *  Label format: <part>_color:<colorRef>[_modifiers...]
 *  e.g. "body_color:primary_gradient:hdl_shadow" → "primary"
 *       "face_color:primaryDark_blur" → "primaryDark"
 *       "face_color;primary" → "primary"
 */
function extractColorRef(label: string): { colorRef: string; isGradient: boolean; gradientSpec: string } | null {
  // Match color: or color; followed by the camelCase color name
  const m = label.match(/color[;:](primary(?:Dark|Light)?|secondary(?:Dark|Light)?)/i);
  if (!m) return null;
  const isGradient = label.includes("_gradient:");
  let gradientSpec = "";
  if (isGradient) {
    const gm = label.match(/_gradient:([a-z]+)/i);
    if (gm) gradientSpec = gm[1].toLowerCase();
  }
  return { colorRef: m[1], isGradient, gradientSpec };
}

/** Resolve a color reference name to an actual hex color */
function resolveColorRef(colorRef: string, colorMap: Record<string, string>): string | undefined {
  const ref = colorRef.toLowerCase();
  if (ref === "primary") return colorMap.primary;
  if (ref === "primarydark") return colorMap.primaryDark;
  if (ref === "primarylight") return colorMap.primaryLight;
  if (ref === "secondary") return colorMap.secondary;
  if (ref === "secondarydark") return colorMap.secondaryDark;
  if (ref === "secondarylight") return colorMap.secondaryLight;
  return undefined;
}

/** Compute a shade of the base color based on a gradient stop letter:
 *  l = light (lighten 30%), m = mid (as-is), d = dark (darken 30%)
 */
function shadeForLetter(letter: string, baseColor: string): string {
  switch (letter) {
    case "l": return lightenColor(baseColor, 0.3);
    case "m": return baseColor;
    case "d": return darkenColor(baseColor, 0.3);
    default: return baseColor;
  }
}

/**
 * Recolor SVG content by finding elements with inkscape:label containing color references
 * and replacing their fill/stroke colors and gradient stop-colors accordingly.
 *
 * Handles:
 * - Direct fill:#hex and stroke:#hex on labeled elements
 * - Gradient fills (fill:url(#id)) where the gradient's stop-colors are recolored
 *   using the gradient spec. The first letter is the gradient direction
 *   (h=horizontal, v=vertical, r=radial) and the remaining letters are stop shades
 *   (l=light, m=mid, d=dark). E.g. "rlllld" → radial, stops: l,l,l,l,d
 */
function recolorSvg(svgText: string, colorMap: Record<string, string>): string {
  // Step 1: Find all element tags (multi-line) with inkscape:label containing a color ref.
  // For each, recolor direct fill/stroke or collect gradient IDs to recolor.
  const gradientRecolors: Array<{ gradientId: string; baseColor: string; spec: string }> = [];

  // Match opening/self-closing tags that span multiple lines
  let result = svgText.replace(
    /(<(?:path|circle|ellipse|rect|polygon|polyline|line|g)\b[\s\S]*?(?:\/>|>))/gi,
    (tagText) => {
      const labelMatch = tagText.match(/inkscape:label="([^"]*)"/i);
      if (!labelMatch) return tagText;

      const parsed = extractColorRef(labelMatch[1]);
      if (!parsed) return tagText;

      const newColor = resolveColorRef(parsed.colorRef, colorMap);
      if (!newColor) return tagText;

      if (parsed.isGradient) {
        // Element uses a gradient fill — collect the gradient ID for stop recoloring
        const gradRefMatch = tagText.match(/fill:url\(#([^)]+)\)/);
        if (gradRefMatch) {
          gradientRecolors.push({
            gradientId: gradRefMatch[1],
            baseColor: newColor,
            spec: parsed.gradientSpec,
          });
        }
        return tagText; // don't modify the element itself
      }

      // Direct coloring: replace fill:#hex and/or stroke:#hex in the style attribute
      let modified = tagText;

      // Replace fill color (but not fill:none or fill:url(...))
      modified = modified.replace(
        /(style="[^"]*)\bfill:#[0-9a-fA-F]{3,8}/gi,
        (m, pre) => `${pre}fill:${newColor}`
      );

      // Replace stroke color (but not stroke:none or stroke:url(...))
      modified = modified.replace(
        /(style="[^"]*)\bstroke:#[0-9a-fA-F]{3,8}/gi,
        (m, pre) => `${pre}stroke:${newColor}`
      );

      return modified;
    }
  );

  // Step 2: Recolor gradient stops for collected gradient IDs.
  // Gradients may reference other gradients via xlink:href — follow the chain.
  for (const { gradientId, baseColor, spec } of gradientRecolors) {
    result = recolorGradientStops(result, gradientId, baseColor, spec);
  }

  return result;
}

/** Recolor the stop-colors of a gradient (and any gradient it references via xlink:href).
 *  The spec's first letter is the gradient direction (h/v/r) — skip it.
 *  The remaining letters map 1:1 to gradient stops (l/m/d).
 */
function recolorGradientStops(svgText: string, gradientId: string, baseColor: string, spec: string): string {
  // Strip the first letter (direction) — remaining letters are stop shades
  const stopShades = spec.length > 1 ? spec.slice(1) : spec;
  // Check if this gradient has xlink:href to another gradient (common in Inkscape)
  const selfCloseRe = new RegExp(
    `<(?:linearGradient|radialGradient)[^>]*\\bid="${gradientId}"[^>]*/>`,
    "s"
  );
  const selfCloseMatch = svgText.match(selfCloseRe);
  if (selfCloseMatch) {
    const hrefMatch = selfCloseMatch[0].match(/xlink:href="#([^"]+)"/);
    if (hrefMatch) {
      // The actual stops are in the referenced gradient — recolor that one
      // Pass stopShades (already stripped of direction letter) by prefixing a dummy direction
      return recolorGradientStops(svgText, hrefMatch[1], baseColor, "r" + stopShades);
    }
  }

  // Find the full gradient element with stops
  const gradRe = new RegExp(
    `(<(?:linearGradient|radialGradient)[^>]*\\bid="${gradientId}"[\\s\\S]*?</(?:linearGradient|radialGradient)>)`,
    ""
  );
  const gradMatch = svgText.match(gradRe);
  if (!gradMatch) return svgText;

  const original = gradMatch[1];
  let stopIndex = 0;

  const recolored = original.replace(
    /stop-color:#[0-9a-fA-F]{3,8}/gi,
    (stopColorStr) => {
      const letter = stopShades[stopIndex] || stopShades[stopShades.length - 1] || "m";
      stopIndex++;
      return `stop-color:${shadeForLetter(letter, baseColor)}`;
    }
  );

  return svgText.replace(original, recolored);
}

/** Scale SVG dimensions: templates are normalized to 10mm */
function scaleSvg(svgText: string, targetDiameterMm: number): string {
  // Parse actual width/height from SVG to scale proportionally
  const wMatch = svgText.match(/width="([\d.]+)mm"/);
  const hMatch = svgText.match(/height="([\d.]+)mm"/);
  const origW = wMatch ? parseFloat(wMatch[1]) : 10;
  const origH = hMatch ? parseFloat(hMatch[1]) : 10;
  const scale = targetDiameterMm / Math.max(origW, origH);
  return svgText
    .replace(/width="[\d.]+mm"/, `width="${(origW * scale).toFixed(2)}mm"`)
    .replace(/height="[\d.]+mm"/, `height="${(origH * scale).toFixed(2)}mm"`);
}

// Simple SVG cache to avoid refetching
const svgCache = new Map<string, string>();

export function KnobSvg({
  svgUrl,
  diameterMm = 10,
  primaryColor = "#888888",
  secondaryColor = "#888888",
  primaryDarkColor,
  primaryLightColor,
  width = "100%",
  height = "100%",
  className,
  style,
}: KnobSvgProps) {
  const [svgContent, setSvgContent] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!svgUrl) return;

    const cached = svgCache.get(svgUrl);
    if (cached) {
      setSvgContent(cached);
      return;
    }

    let cancelled = false;
    fetch(svgUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load SVG: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          svgCache.set(svgUrl, text);
          setSvgContent(text);
        }
      })
      .catch((err) => {
        console.error("KnobSvg: failed to load", svgUrl, err);
      });

    return () => { cancelled = true; };
  }, [svgUrl]);

  const processedSvg = React.useMemo(() => {
    if (!svgContent) return null;

    const colorMap = buildColorMap(primaryColor, secondaryColor, primaryDarkColor, primaryLightColor);
    let processed = recolorSvg(svgContent, colorMap);
    processed = scaleSvg(processed, diameterMm);

    // Strip XML declaration for inline embedding
    processed = processed.replace(/<\?xml[^?]*\?>\s*/g, "");
    // Strip sodipodi:namedview (Inkscape metadata not needed at runtime)
    processed = processed.replace(/<sodipodi:namedview[^]*?\/>/g, "");

    return processed;
  }, [svgContent, primaryColor, secondaryColor, primaryDarkColor, primaryLightColor, diameterMm]);

  if (!processedSvg) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
      >
        <div style={{ 
          width: "70%", 
          height: "70%", 
          borderRadius: "50%", 
          background: "radial-gradient(circle at 35% 35%, #666, #333)",
          border: "1px solid #444",
        }} />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: processedSvg }}
    />
  );
}

/**
 * Inline version for use inside SVG elements (e.g., EnclosureVisualizer).
 * Renders a <g> element with the knob SVG contents.
 */
export function KnobSvgInline({
  svgUrl,
  diameterMm = 10,
  primaryColor = "#888888",
  secondaryColor = "#888888",
  primaryDarkColor,
  primaryLightColor,
  x = 0,
  y = 0,
}: {
  svgUrl: string;
  diameterMm?: number;
  primaryColor?: string;
  secondaryColor?: string;
  primaryDarkColor?: string;
  primaryLightColor?: string;
  x?: number;
  y?: number;
}) {
  // Stable unique ID per component instance to prevent SVG ID conflicts between knobs
  const instanceId = React.useRef(`k${++knobInstanceCounter}`).current;
  const [svgContent, setSvgContent] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!svgUrl) return;

    const cached = svgCache.get(svgUrl);
    if (cached) {
      setSvgContent(cached);
      return;
    }

    let cancelled = false;
    fetch(svgUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load SVG: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          svgCache.set(svgUrl, text);
          setSvgContent(text);
        }
      })
      .catch((err) => {
        console.error("KnobSvgInline: failed to load", svgUrl, err);
      });

    return () => { cancelled = true; };
  }, [svgUrl]);

  const inlineData = React.useMemo(() => {
    if (!svgContent) return null;

    const colorMap = buildColorMap(primaryColor, secondaryColor, primaryDarkColor, primaryLightColor);
    let processed = recolorSvg(svgContent, colorMap);

    // Make all SVG IDs unique to this instance so multiple knobs don't clash
    processed = uniquifyIds(processed, instanceId);

    // Extract viewBox from SVG
    const viewBoxMatch = processed.match(/viewBox="([^"]*)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 10 10";

    // Extract inner content (everything between <svg> and </svg>), stripping defs that might conflict
    const innerMatch = processed.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    const innerContent = innerMatch ? innerMatch[1] : "";

    // Parse viewBox to get dimensions
    const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number);

    return { innerContent, vx, vy, vw, vh };
  }, [svgContent, primaryColor, secondaryColor, primaryDarkColor, primaryLightColor]);

  if (!inlineData) {
    // Fallback: simple circle placeholder
    return (
      <circle cx={x} cy={y} r={diameterMm / 2} fill="url(#metal-knob)" stroke="#2a2a2a" strokeWidth="0.3" />
    );
  }

  // Scale: map the SVG's viewBox width to the desired real-world diameter in mm
  // The enclosure coordinate system is 1 unit = 1mm, so scale = targetMm / viewBoxWidth
  const { innerContent, vx, vy, vw, vh } = inlineData;
  const scale = diameterMm / Math.max(vw, vh);

  return (
    <g transform={`translate(${x - (vw * scale) / 2}, ${y - (vh * scale) / 2}) scale(${scale})`} pointerEvents="none">
      <g transform={`translate(${-vx}, ${-vy})`} dangerouslySetInnerHTML={{ __html: innerContent }} />
    </g>
  );
}
