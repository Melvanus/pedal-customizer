"use client";

import * as React from "react";

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

/**
 * Recolor SVG content by finding elements with inkscape:label containing color references
 * and replacing their fill colors accordingly.
 */
function recolorSvg(svgText: string, colorMap: Record<string, string>): string {
  // Match elements with inkscape:label containing "color:<ref>"
  // The label format is: <part>_color:<colorRef>_<modifiers>
  // e.g., "body_color:primary_shadow", "face_color:primaryDark", "face_color;primary"
  return svgText.replace(
    /(<[^>]*inkscape:label="[^"]*color[;:](\w+)[^"]*"[^>]*style="[^"]*)(fill:#[0-9a-fA-F]{3,8})/gi,
    (match, prefix, colorRef, fillPart) => {
      const ref = colorRef.toLowerCase();
      let newColor: string | undefined;

      if (ref === "primary") newColor = colorMap.primary;
      else if (ref === "primarydark") newColor = colorMap.primaryDark;
      else if (ref === "primarylight") newColor = colorMap.primaryLight;
      else if (ref === "secondary") newColor = colorMap.secondary;
      else if (ref === "secondarydark") newColor = colorMap.secondaryDark;
      else if (ref === "secondarylight") newColor = colorMap.secondaryLight;

      if (newColor) {
        return `${prefix}fill:${newColor}`;
      }
      return match;
    }
  );
}

/** Also handle cases where style and inkscape:label are in different order */
function recolorSvgReverse(svgText: string, colorMap: Record<string, string>): string {
  return svgText.replace(
    /(<[^>]*style="[^"]*)(fill:#[0-9a-fA-F]{3,8})([^"]*"[^>]*inkscape:label="[^"]*color[;:](\w+)[^"]*")/gi,
    (match, prefix, fillPart, suffix, colorRef) => {
      const ref = colorRef.toLowerCase();
      let newColor: string | undefined;

      if (ref === "primary") newColor = colorMap.primary;
      else if (ref === "primarydark") newColor = colorMap.primaryDark;
      else if (ref === "primarylight") newColor = colorMap.primaryLight;
      else if (ref === "secondary") newColor = colorMap.secondary;
      else if (ref === "secondarydark") newColor = colorMap.secondaryDark;
      else if (ref === "secondarylight") newColor = colorMap.secondaryLight;

      if (newColor) {
        return `${prefix}fill:${newColor}${suffix}`;
      }
      return match;
    }
  );
}

/** Scale SVG dimensions: templates are normalized to 10mm */
function scaleSvg(svgText: string, targetDiameterMm: number): string {
  const scale = targetDiameterMm / 10;
  // Replace width="10.0mm" with scaled value (handles slight variations)
  return svgText
    .replace(/width="[\d.]+mm"/, `width="${(10 * scale).toFixed(2)}mm"`)
    .replace(/height="[\d.]+mm"/, `height="${(10 * scale).toFixed(2)}mm"`);
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
    processed = recolorSvgReverse(processed, colorMap);
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
    processed = recolorSvgReverse(processed, colorMap);

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

  // Scale: the SVG is designed for 10mm, we scale to diameterMm
  const scale = diameterMm / 10;
  const { innerContent, vx, vy, vw, vh } = inlineData;

  return (
    <g transform={`translate(${x - (vw * scale) / 2}, ${y - (vh * scale) / 2}) scale(${scale})`}>
      <g transform={`translate(${-vx}, ${-vy})`} dangerouslySetInnerHTML={{ __html: innerContent }} />
    </g>
  );
}
