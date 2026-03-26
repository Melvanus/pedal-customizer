/**
 * Knob priority rankings & size-aware default selection.
 *
 * Priority map: lower number = higher priority (shown first, preferred as default).
 * Unlisted knob types get a default priority of 900.
 *
 * Default selection picks the highest-priority knob type whose smallest
 * available diameter fits the enclosure without causing collisions.
 */

/** Manual priority ranking — lower = better. Edit this to reorder the knob list. */
export const KNOB_PRIORITY: Record<string, number> = {
  "Boss Style":                10,
  "Davies 1900H Clone":        20,
  "Davies 1510 Clone":         30,
  "Davies 1400 Clone":         40,
  "MXR Style Fluted":          50,
  "Aluminum Control Knurled":  60,
  "Knurled Aluminum":          70,
  "Chicken Head":              80,
  "Rogan":                     90,
  "Moog":                     100,
  "Marshall":                 110,
  "Simple Knob":              120,
  "Black Body Knob":          130,
  "Control Black Knob":       140,
  "Gray":                     150,
  "Daka-Ware Pointer":        160,
  "Daka-Ware Skirted":        170,
  "Classic Knob":             180,
  "Bakelite Knob":            190,
  "Bakelite Triangle Knob":   200,
  "Black Knob":               210,
  "Black Dial Knob":          220,
  "Aluminum":                 230,
  "Aluminum Manley Black Knob": 240,
  "Ripple":                   250,
  "Serrated Round Pointer":   260,
  "Nose Knob":                270,
  "Plastic":                  280,
  "Control Knob":             290,
  "Rickenbacker":             300,
  "Black Knurled Aluminum":   310,
  "Russian BMP Classic Style": 320,
  "API Equalizer":            330,
  "UREI Mixer":               340,
  "KN1250 ABS Fluted":        350,
  "KN1360 ABS Fluted":        360,
  "KN1611 ABS":               370,
  "KN8C":                     380,
  "KN8D":                     390,
  "KN8E":                     400,
  "KN8F":                     410,
  "Aluminum Knob Delta":      500,
  "Aluminum Knob Number":     510,
  "Aluminum Knob Scale":      520,
  "Silver Aluminum Knob Delta": 530,
  "Silver Aluminum Knob Number": 540,
  "ABS Plastic Black Knob":   600,
  "Big Black Knob":           610,
  "EQP-1A":                   620,
};

const DEFAULT_PRIORITY = 900;

export function getKnobPriority(knobTypeName: string): number {
  return KNOB_PRIORITY[knobTypeName] ?? DEFAULT_PRIORITY;
}

/** Sort knob types by priority (lower number first). Stable sort within same priority. */
export function sortKnobsByPriority<T extends { knob_type: string }>(knobTypes: T[]): T[] {
  return [...knobTypes].sort((a, b) => getKnobPriority(a.knob_type) - getKnobPriority(b.knob_type));
}

/**
 * Estimate max safe knob diameter (mm) given enclosure dimensions and control count.
 *
 * Uses a simple heuristic: the usable area divided by the number of controls
 * gives a rough per-control area. The max knob diameter is derived from that
 * circle-packing estimate, with a safety margin.
 */
export function maxSafeKnobDiameter(
  enclosureWidthMm: number,
  enclosureHeightMm: number,
  controlCount: number,
): number {
  if (controlCount <= 0) return 40; // no controls → any size is fine

  // Usable area is ~60% of face area (margins, jacks, footswitch)
  const usableArea = enclosureWidthMm * enclosureHeightMm * 0.6;
  const areaPerControl = usableArea / controlCount;

  // Diameter from circular area: d = 2·sqrt(A/π), then apply safety margin
  const rawDiameter = 2 * Math.sqrt(areaPerControl / Math.PI);
  return Math.floor(rawDiameter * 0.85); // 15% safety margin
}

/**
 * Pick the best default knob type and size for a given enclosure + control count.
 *
 * Strategy:
 * 1. Compute max safe diameter for the enclosure.
 * 2. Walk knob types by priority (lowest number first).
 * 3. For each, find the largest available size that fits.
 * 4. Return the first match (highest priority with a fitting size).
 * 5. Fallback: if nothing fits, return the highest-priority type with its smallest size.
 */
export function pickDefaultKnob<T extends { knob_type: string; available_sizes_mm: number[] }>(
  knobTypes: T[],
  enclosureWidthMm: number,
  enclosureHeightMm: number,
  controlCount: number,
): { knobType: T; size: number } | null {
  if (knobTypes.length === 0) return null;

  const maxDiam = maxSafeKnobDiameter(enclosureWidthMm, enclosureHeightMm, controlCount);
  const sorted = sortKnobsByPriority(knobTypes);

  // Pass 1: find highest-priority knob with a size that fits
  for (const kt of sorted) {
    const fittingSizes = kt.available_sizes_mm.filter(s => s <= maxDiam).sort((a, b) => b - a);
    if (fittingSizes.length > 0) {
      return { knobType: kt, size: fittingSizes[0] };
    }
  }

  // Pass 2: nothing fits perfectly → pick highest-priority knob, smallest available size
  const fallback = sorted[0];
  const smallestSize = [...fallback.available_sizes_mm].sort((a, b) => a - b)[0];
  return { knobType: fallback, size: smallestSize };
}
