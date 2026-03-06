/**
 * Shared color utility for resolving dual color formats.
 * 
 * Supports three formats for `available_colors`:
 * 1. Simple strings: ["red", "blue", "green"] → resolved via generic color map
 * 2. Named RGB objects: [{"black": [5, 5, 5]}, {"neon green": [72, 251, 63]}] → exact colors
 * 3. Named hex objects: [{"black": "#050505"}, {"neon green": "#48fb3f"}] → exact colors
 */

export type ColorEntry = string | Record<string, number[] | string>;

export type ResolvedColor = {
  /** Internal key used for state/serialization (e.g. "black", "neon green", "red") */
  key: string;
  /** Display name for UI (e.g. "Black", "Neon Green", "Red") */
  displayName: string;
  /** Hex color string (e.g. "#050505") */
  hex: string;
};

/** Generic color map for simple string colors (LED bezels, etc.) */
const GENERIC_COLOR_MAP: Record<string, string> = {
  "red": "#f23535",
  "blue": "#2655d5",
  "green": "#28bb63",
  "yellow": "#eae31a",
  "amber": "#e28023",
  "purple": "#8c25d6",
  "clear": "#ffffff",
  "white": "#fcfcfc",
  "black": "#090909",
  "orange": "#e77116",
  "pink": "#d03790",
};

/**
 * Resolve a single color entry (string, {name: rgb[]} or {name: hex}) to a normalized color object.
 */
export function resolveColor(entry: ColorEntry): ResolvedColor {
  if (typeof entry === "string") {
    const key = entry.toLowerCase();
    return {
      key,
      displayName: entry.charAt(0).toUpperCase() + entry.slice(1),
      hex: GENERIC_COLOR_MAP[key] || "#888888",
    };
  }

  // Object format: { "color name": [r, g, b] } or { "color name": "#rrggbb" }
  const [name, value] = Object.entries(entry)[0];
  const hex = typeof value === "string"
    ? value
    : `#${value.map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")}`;
  return {
    key: name,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    hex,
  };
}

/**
 * Resolve an entire available_colors array to normalized color objects.
 */
export function resolveColors(colors: ColorEntry[]): ResolvedColor[] {
  return colors.map(resolveColor);
}

/**
 * Find a resolved color by its key from an available_colors array.
 */
export function findColorByKey(colors: ColorEntry[], key: string): ResolvedColor | undefined {
  return resolveColors(colors).find(c => c.key === key);
}

/**
 * Get contrasting text color (black or white) for a given hex background.
 */
export function getContrastingColor(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000" : "#fff";
}
