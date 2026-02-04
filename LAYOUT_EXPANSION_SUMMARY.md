# Enclosure Layout Expansion Summary

## Overview
Massively expanded enclosure layout library from 15 to 80 layouts (+533% increase), adding support for smaller enclosures, multi-footswitch configurations, and comprehensive control combinations.

## New Layouts Added (65 total)

### 1590A Enclosures (2 new)
Small compact enclosure (39×93mm) for minimal pedals:
- **1590A-2pot**: Two-knob configuration
- **1590A-1pot-1sw**: One knob + one toggle switch

### 1590B Enclosures (6 new)
Standard small enclosure (~60×112mm):
- **1590B-1pot**: Single control
- **1590B-2pot**: Dual control
- **1590B-1pot-1sw**: One knob + toggle
- **1590B-2pot-1sw**: Two knobs + toggle
- **1590B-3pot-1sw**: Three knobs + toggle  
- **1590B-4pot-1sw**: Four knobs + toggle

### 125B Dual-Footswitch (14 new)
All existing 125B layouts with 2 footswitches + 2 LEDs:
- 125B-1pot-2fs through 125B-7pot-3sw-2fs
- Enables channel switching, preset selection, tap tempo features

### 1590BB Enclosures (30 new)
Wider enclosure (95×119mm) with single and dual footswitch variants:
- All 125B layouts scaled to 1590BB dimensions
- Both single footswitch (15 layouts) and dual footswitch versions (15 layouts)
- Better spacing for larger components and easier wiring

### 1590BS Enclosures (12 new)
Extended width enclosure (119×94mm) for complex multi-function pedals:
- 6 layouts with **2 footswitches** (from base 125B designs)
- 6 layouts with **3 footswitches** (triple switching capability)
- Perfect for: multi-band EQs, preset-based effects, channel switchers

## Technical Implementation

### Multi-Footswitch/LED Support
Updated `EnclosureVisualizer.tsx` to handle both legacy (single) and new (multiple) formats:

```typescript
type LayoutData = {
  // ... other fields
  footswitch_position?: Position;      // Single FS (legacy)
  footswitch_positions?: Position[];   // Multiple FS (new)
  led_position?: Position;             // Single LED (legacy)
  led_positions?: Position[];          // Multiple LEDs (new)
}
```

### Rendering Logic
- **Backward compatible**: Existing single-footswitch layouts work unchanged
- **Array mapping**: New layouts with multiple FS/LEDs render with `.map()` iteration
- **Position tracking**: Each footswitch/LED can be individually positioned in edit mode
- **Consistent styling**: All LED types (No Bezel, Simple Bezel, Fender Jewel, Illuminated FS) work with multi-LED layouts

### Position Override System
Updated drag-and-drop system to track arrays:
```typescript
positionOverrides: {
  leds: Position[];          // Changed from `led: Position | null`
  footswitches: Position[];  // Changed from `footswitch: Position | null`
  // ... other overrides
}
```

## Layout Generation
Created `generate-layouts.py` script for automated layout generation:
- Scales control positions between enclosure sizes
- Calculates footswitch/LED spacing (15-22mm between switches)
- Maintains proper jack positions relative to enclosure width
- Generates unique IDs with `-2fs` and `-3fs` suffixes

## Statistics
- **Total layouts**: 80 (up from 15)
- **Enclosure types**: 6 (1590A, 1590B, 125B, 1590BB, 1590BBS, 1590BS)
- **Dual footswitch variants**: 34
- **Triple footswitch variants**: 6
- **Control combinations**: 1-7 pots, 0-3 switches, 0-3 footswitches

## Use Cases Enabled
- **Simple boost/OD**: 1590A with 1-2 knobs
- **Compact effects**: 1590B for fuzzes, distortions (4 controls max)
- **Channel switching**: Dual footswitch for clean/dirty, rhythm/lead
- **Preset systems**: Triple footswitch for 3-channel amps, multi-mode delays
- **Complex multi-effects**: 1590BB/BS with 7 knobs + 3 footswitches
- **Multi-band processing**: 1590BS layouts for 3-band EQs, crossovers

## Future Enhancements
- Add 1590XX layouts for even larger enclosures
- Generate vertical fader variants for EQ-style pedals
- Create asymmetric layouts (pots on left, switches on right)
- Add rotary encoder positions for digital effects
