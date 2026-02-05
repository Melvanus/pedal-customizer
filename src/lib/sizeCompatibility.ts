// Enclosure Size Compatibility System
// Handles size validation, warnings, and pricing for enclosure selections

export interface SizeInfo {
  name: string;
  order: number;
  basePrice: number;
}

export const SIZE_CONFIG: SizeInfo[] = [
  { name: "1590A", order: 0, basePrice: 4 },
  { name: "1590B", order: 1, basePrice: 5 },
  { name: "125B", order: 2, basePrice: 6 },
  { name: "1590BB", order: 3, basePrice: 10 },
  { name: "1590BS", order: 4, basePrice: 12 },
  { name: "1590XX", order: 5, basePrice: 15 }
];

// Exception list: effectId -> allowed smaller sizes that bypass blocking rules
export const SIZE_EXCEPTIONS: Record<string, string[]> = {
  "BOOSTER": ["1590A"],   // Simple booster fits in 1590A
  "FUZZFACE": ["1590A"],  // Fuzz Face originally came in small enclosure
};

export interface SizeCheckResult {
  blocked: boolean;
  warning: string | null;
  surcharge: number;
  tooltip?: string;
}

export interface EffectMod {
  mod: {
    name: string;
    changes_reccommended_enclosure?: string;
  };
}

/**
 * Checks if a selected enclosure size is compatible with the effect and mods
 * Returns blocking status, warnings, and pricing surcharges
 */
export function checkSizeCompatibility(
  effectId: string,
  baseRecommendedSize: string,
  selectedSize: string,
  selectedMods: EffectMod[]
): SizeCheckResult {
  
  // 1. Check if mods change the recommended size
  let recommendedSize = baseRecommendedSize;
  for (const mod of selectedMods) {
    if (mod.mod.changes_reccommended_enclosure) {
      recommendedSize = mod.mod.changes_reccommended_enclosure;
      break; // Use first mod that changes size
    }
  }
  
  const recIdx = SIZE_CONFIG.findIndex(s => s.name === recommendedSize);
  const selIdx = SIZE_CONFIG.findIndex(s => s.name === selectedSize);
  
  // Handle unknown sizes gracefully
  if (recIdx === -1 || selIdx === -1) {
    return { blocked: false, warning: null, surcharge: 0 };
  }
  
  const diff = recIdx - selIdx;
  
  // 2. Same size or larger - just price difference
  if (diff <= 0) {
    return {
      blocked: false,
      warning: null,
      surcharge: SIZE_CONFIG[selIdx].basePrice - SIZE_CONFIG[recIdx].basePrice
    };
  }
  
  // 3. Check for exceptions (effect can fit in smaller size)
  // Exceptions bypass blocking but still show warnings based on size difference
  const allowedSmallerSizes = SIZE_EXCEPTIONS[effectId] || [];
  const isException = allowedSmallerSizes.includes(selectedSize);
  
  // 4. Hard block rules (skip if exception)
  if (!isException) {
    // Rule: 1590A blocked when 1590B+ recommended
    if (selectedSize === "1590A" && recIdx >= 1) {
      return {
        blocked: true,
        warning: "❌ Too small - will not fit",
        surcharge: 0,
        tooltip: "Component density too high for this enclosure"
      };
    }
    
    // Rule: 1590A/1590B/125B blocked when 1590BB+ recommended
    if (["1590A", "1590B", "125B"].includes(selectedSize) && recIdx >= 3) {
      return {
        blocked: true,
        warning: "❌ Too small - will not fit",
        surcharge: 0,
        tooltip: "This circuit requires a larger enclosure"
      };
    }
  }
  
  // 5. Warnings for going smaller (applies to all including exceptions)
  if (diff === 1) {
    return {
      blocked: false,
      warning: "⚠️ Smaller than recommended",
      surcharge: 10,
      tooltip: isException 
        ? "Verified fit but tight - minor modifications may be needed"
        : "Minor modifications may be needed - tight fit"
    };
  }
  
  if (diff >= 2) {
    return {
      blocked: false,
      warning: "⚠️ Much smaller - tight fit",
      surcharge: 25,
      tooltip: isException
        ? "Verified fit but very tight - extensive modifications required"
        : "Requires extensive modifications and custom layout"
    };
  }
  
  return { blocked: false, warning: null, surcharge: 0 };
}

/**
 * Gets size configuration info by name
 */
export function getSizeInfo(sizeName: string): SizeInfo | undefined {
  return SIZE_CONFIG.find(s => s.name === sizeName);
}

/**
 * Calculates the effective recommended size after accounting for mods
 */
export function getEffectiveRecommendedSize(
  baseSize: string,
  mods: EffectMod[]
): string {
  for (const mod of mods) {
    if (mod.mod.changes_reccommended_enclosure) {
      return mod.mod.changes_reccommended_enclosure;
    }
  }
  return baseSize;
}
