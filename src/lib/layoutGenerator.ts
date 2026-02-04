/**
 * Random Layout Generator
 * Generates random but sensible control layouts when no matching layout exists.
 * Because sometimes chaos is the only design philosophy that makes sense. 🎲
 */

export interface Position {
  x: number;
  y: number;
  label_offset?: {
    x: number;
    y: number;
  };
}

export interface LayoutDimensions {
  width: number;
  length: number;
}

export interface GeneratedLayout {
  id: string;
  enclosure_type: string;
  potentiometer_count: number;
  switch_count: number;
  fader_count: number;
  dimensions_mm: LayoutDimensions;
  potentiometer_positions: Position[];
  switch_positions: Position[];
  fader_positions: Position[];
  footswitch_position: Position;
  led_position: Position;
  input_jack_position: Position;
  output_jack_position: Position;
  pedal_name_position: Position;
}

interface EnclosureSpec {
  width: number;
  length: number;
  jackDistance: number;
  footswitchY: number;
  ledY: number;
  nameY: number;
}

// Enclosure specifications
const ENCLOSURE_SPECS: Record<string, EnclosureSpec> = {
  '125B': {
    width: 67,
    length: 122,
    jackDistance: 30,
    footswitchY: 45,
    ledY: 20,
    nameY: -55,
  },
  '1590BB': {
    width: 95,
    length: 119,
    jackDistance: 44,
    footswitchY: 48,
    ledY: 20,
    nameY: -58,
  },
  '1590BBS': {
    width: 115,
    length: 119,
    jackDistance: 52,
    footswitchY: 48,
    ledY: 20,
    nameY: -58,
  },
  '1590BB2': {
    width: 95,
    length: 119,
    jackDistance: 44,
    footswitchY: 48,
    ledY: 20,
    nameY: -58,
  },
};

/**
 * Generates a random layout for the given control configuration.
 * Uses semi-intelligent positioning to avoid overlaps and keep things usable.
 */
export function generateRandomLayout(
  enclosureType: string,
  potCount: number,
  switchCount: number,
  faderCount: number
): GeneratedLayout {
  const spec = ENCLOSURE_SPECS[enclosureType] || ENCLOSURE_SPECS['125B'];
  
  // Calculate usable area (avoiding fixed elements)
  const usableWidth = spec.width - 20; // Leave margins
  const topY = -spec.nameY - 15; // Below pedal name
  const bottomY = spec.ledY + 10; // Above LED
  const usableHeight = Math.abs(topY - bottomY);

  // Generate positions for each control type
  const potPositions = generateControlPositions(
    potCount,
    usableWidth,
    topY,
    usableHeight,
    'pot'
  );
  
  const switchPositions = generateControlPositions(
    switchCount,
    usableWidth,
    topY,
    usableHeight,
    'switch',
    potPositions
  );
  
  const faderPositions = generateControlPositions(
    faderCount,
    usableWidth,
    topY,
    usableHeight,
    'fader',
    [...potPositions, ...switchPositions]
  );

  return {
    id: `${enclosureType}-${potCount}pot-${switchCount}sw-${faderCount}fader-random`,
    enclosure_type: enclosureType,
    potentiometer_count: potCount,
    switch_count: switchCount,
    fader_count: faderCount,
    dimensions_mm: {
      width: spec.width,
      length: spec.length,
    },
    potentiometer_positions: potPositions,
    switch_positions: switchPositions,
    fader_positions: faderPositions,
    footswitch_position: { x: 0, y: spec.footswitchY },
    led_position: { x: 0, y: spec.ledY },
    input_jack_position: { x: spec.jackDistance, y: 0 },
    output_jack_position: { x: -spec.jackDistance, y: 0 },
    pedal_name_position: { x: 0, y: spec.nameY },
  };
}

/**
 * Generates positions for a specific control type, avoiding collisions.
 */
function generateControlPositions(
  count: number,
  usableWidth: number,
  topY: number,
  usableHeight: number,
  type: 'pot' | 'switch' | 'fader',
  existingPositions: Position[] = []
): Position[] {
  if (count === 0) return [];

  const positions: Position[] = [];
  const minSpacing = type === 'fader' ? 14 : 16; // Faders can be closer together
  const labelOffsetY = type === 'fader' ? -25 : 15; // Labels above faders, below pots/switches
  
  // Try to arrange in rows if there are many controls
  const maxPerRow = Math.floor(usableWidth / minSpacing);
  const rows = Math.ceil(count / maxPerRow);
  const itemsPerRow = Math.ceil(count / rows);
  
  let itemIndex = 0;
  
  for (let row = 0; row < rows && itemIndex < count; row++) {
    const rowItems = Math.min(itemsPerRow, count - itemIndex);
    const rowSpacing = usableWidth / (rowItems + 1);
    const rowY = topY + (row * (usableHeight / (rows + 1)));
    
    for (let col = 0; col < rowItems; col++) {
      const x = -usableWidth / 2 + (col + 1) * rowSpacing;
      const y = rowY;
      
      // Check for collision with existing positions
      const tooClose = [...existingPositions, ...positions].some(
        pos => Math.abs(pos.x - x) < minSpacing && Math.abs(pos.y - y) < minSpacing
      );
      
      if (!tooClose) {
        positions.push({
          x: Math.round(x),
          y: Math.round(y),
          label_offset: {
            x: 0,
            y: labelOffsetY,
          },
        });
        itemIndex++;
      } else {
        // If collision, try with some random offset
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = (Math.random() - 0.5) * 10;
        positions.push({
          x: Math.round(x + offsetX),
          y: Math.round(y + offsetY),
          label_offset: {
            x: 0,
            y: labelOffsetY,
          },
        });
        itemIndex++;
      }
    }
  }
  
  return positions;
}

/**
 * Generates a completely new random layout by re-rolling all positions.
 * For when you're feeling particularly adventurous. 🎰
 */
export function regenerateRandomLayout(existingLayout: GeneratedLayout): GeneratedLayout {
  return generateRandomLayout(
    existingLayout.enclosure_type,
    existingLayout.potentiometer_count,
    existingLayout.switch_count,
    existingLayout.fader_count
  );
}
