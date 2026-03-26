/**
 * Knob pricing logic — shared across the app.
 *
 * Standard knobs (≤ FREE_THRESHOLD_EUR) are included at no extra cost.
 * Premium knobs are charged the difference above the threshold,
 * rounded UP to the nearest ROUNDING_STEP_EUR.
 */

const FREE_THRESHOLD_EUR = 2.0;
const ROUNDING_STEP_EUR = 0.5;

/**
 * Calculate the surcharge for a single knob based on its raw price.
 * Returns 0 for standard knobs (≤ €2.00).
 * For premium knobs, returns the difference rounded up to €0.50 steps.
 *
 * Examples:
 *   €1.50 → €0.00 (standard, included)
 *   €2.00 → €0.00 (standard, included)
 *   €2.20 → €0.50 (0.20 difference → rounded up to 0.50)
 *   €2.70 → €1.00 (0.70 difference → rounded up to 1.00)
 *   €3.50 → €1.50 (1.50 difference → exactly 1.50)
 */
export function knobSurcharge(priceEur: number): number {
  if (priceEur <= FREE_THRESHOLD_EUR) return 0;
  const diff = priceEur - FREE_THRESHOLD_EUR;
  return Math.ceil(diff / ROUNDING_STEP_EUR) * ROUNDING_STEP_EUR;
}

/**
 * Whether a knob is considered "standard" (free / included).
 */
export function isStandardKnob(priceEur: number): boolean {
  return priceEur <= FREE_THRESHOLD_EUR;
}

/**
 * Format a knob surcharge for display.
 * Returns "Included" for free knobs, or "+€X.XX" for premium ones.
 */
export function formatKnobSurcharge(priceEur: number): string {
  const surcharge = knobSurcharge(priceEur);
  if (surcharge === 0) return "Included";
  return `+€${surcharge.toFixed(2)}`;
}

/**
 * Calculate total knob surcharge for all pots given a per-pot price lookup.
 * `potPrices` is an array of raw knob prices (one per pot).
 */
export function totalKnobSurcharge(potPrices: number[]): number {
  return potPrices.reduce((sum, p) => sum + knobSurcharge(p), 0);
}
