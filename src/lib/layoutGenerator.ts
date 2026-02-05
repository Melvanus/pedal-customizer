/**
 * Random Layout Generator
 * Generates random but sensible control layouts when no matching layout exists.
 * Because sometimes chaos is the only design philosophy that makes sense. 🎲
 * 
 * Coordinate System: +y = up from center, -y = down from center (intuitive system)
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

// Enclosure specifications (using +y=up coordinate system)
const ENCLOSURE_SPECS: Record<string, EnclosureSpec> = {
  '125B': {
    width: 67,
    length: 122,
    jackDistance: 30,
    footswitchY: -45,  // Below center
    ledY: -20,         // Below center but above footswitch
    nameY: 55,         // Above center
  },
  '1590BB': {
    width: 95,
    length: 119,
    jackDistance: 44,
    footswitchY: -48,
    ledY: -20,
    nameY: 58,
  },
  '1590BBS': {
    width: 115,
    length: 119,
    jackDistance: 52,
    footswitchY: -48,
    ledY: -20,
    nameY: 58,
  },
  '1590BB2': {
    width: 95,
    length: 119,
    jackDistance: 44,
    footswitchY: -48,
    ledY: -20,
    nameY: 58,
  },
};

/**
 * Generates a random layout for the given control configuration.
 * Uses semi-intelligent positioning with organized patterns.
 * 
 * Design principles:
 * - Faders and switches in upper half, organized in groups/rows/diagonals
 * - Potentiometers arranged in structured patterns (rows, circles, diagonals)
 * - LED placement randomized (left/right/top of footswitch, or between knobs)
 * - ALWAYS generates new positions on each call (no caching)
 */
export function generateRandomLayout(
  enclosureType: string,
  potCount: number,
  switchCount: number,
  faderCount: number
): GeneratedLayout {
  const spec = ENCLOSURE_SPECS[enclosureType] || ENCLOSURE_SPECS['125B'];
  
  // Calculate usable areas
  const marginX = 5;
  const marginY = 5;
  const usableWidth = spec.width - (marginX * 2);
  
  // Upper half: for faders and switches (above center, below name)
  const upperTop = spec.nameY - 15; // Just below name
  const upperBottom = 5; // Just above center line
  
  // Full area: for potentiometers (much larger range!)
  const fullTop = spec.nameY - 10; // Just below name, almost to top
  const fullBottom = spec.ledY + 12; // Just above LED area
  
  // Generate LED position first (randomized)
  const ledPosition = generateRandomLEDPosition(spec, usableWidth);
  
  // Generate fader positions (upper half, organized)
  const faderPositions = generateFaderPositions(
    faderCount,
    usableWidth,
    upperTop,
    upperBottom,
    marginX
  );
  
  // Generate switch positions (upper half, organized, avoiding faders)
  const switchPositions = generateSwitchPositions(
    switchCount,
    usableWidth,
    upperTop,
    upperBottom,
    marginX,
    faderPositions
  );
  
  // Generate pot positions (full area, structured patterns, avoiding everything)
  const potPositions = generatePotPositions(
    potCount,
    usableWidth,
    fullTop,
    fullBottom,
    marginX,
    [...faderPositions, ...switchPositions],
    ledPosition,
    spec
  );

  // Add randomness to ID to ensure uniqueness on each generation
  const randomId = Math.random().toString(36).substring(7);
  
  return {
    id: `${enclosureType}-${potCount}pot-${switchCount}sw-${faderCount}fader-random-${randomId}`,
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
    led_position: ledPosition,
    input_jack_position: { x: spec.jackDistance, y: 0 },
    output_jack_position: { x: -spec.jackDistance, y: 0 },
    pedal_name_position: { x: 0, y: spec.nameY },
  };
}

/**
 * Generates randomized LED position relative to footswitch or between knobs.
 * Options: left/right of footswitch, above with varying distance, or at top between controls.
 */
function generateRandomLEDPosition(spec: EnclosureSpec, usableWidth: number): Position {
  const positions = [
    // Left of footswitch
    { x: -12, y: spec.footswitchY },
    { x: -15, y: spec.footswitchY },
    
    // Right of footswitch  
    { x: 12, y: spec.footswitchY },
    { x: 15, y: spec.footswitchY },
    
    // Above footswitch with varying distances
    { x: 0, y: spec.footswitchY + 18 },
    { x: 0, y: spec.footswitchY + 22 },
    { x: 0, y: spec.footswitchY + 26 },
    
    // At top (between where knobs would be)
    { x: -10, y: spec.nameY - 20 },
    { x: 10, y: spec.nameY - 20 },
    { x: 0, y: spec.nameY - 18 },
  ];
  
  return positions[Math.floor(Math.random() * positions.length)];
}

/**
 * Generates fader positions in the upper half with organized patterns.
 * Patterns: horizontal row, vertical column, or diagonal line.
 */
function generateFaderPositions(
  count: number,
  usableWidth: number,
  topY: number,
  bottomY: number,
  marginX: number
): Position[] {
  if (count === 0) return [];
  
  const positions: Position[] = [];
  const patterns = ['horizontal', 'vertical', 'diagonal'];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  
  const centerY = (topY + bottomY) / 2;
  const spacing = Math.min(18, usableWidth / (count + 1));
  
  switch (pattern) {
    case 'horizontal':
      // Single horizontal row
      for (let i = 0; i < count; i++) {
        const x = -usableWidth / 2 + (i + 1) * (usableWidth / (count + 1));
        positions.push({
          x: Math.round(x),
          y: Math.round(centerY + (Math.random() - 0.5) * 8), // Slight randomness
          label_offset: { x: 0, y: -35 }, // Labels above faders
        });
      }
      break;
      
    case 'vertical':
      // Vertical column(s)
      const cols = count <= 3 ? 1 : 2;
      const itemsPerCol = Math.ceil(count / cols);
      let idx = 0;
      for (let col = 0; col < cols && idx < count; col++) {
        const x = cols === 1 ? 0 : (col === 0 ? -15 : 15);
        const colItems = Math.min(itemsPerCol, count - idx);
        const vertSpacing = (topY - bottomY) / (colItems + 1);
        
        for (let row = 0; row < colItems; row++) {
          const y = topY - (row + 1) * vertSpacing;
          positions.push({
            x: Math.round(x + (Math.random() - 0.5) * 4),
            y: Math.round(y),
            label_offset: { x: 0, y: -35 },
          });
          idx++;
        }
      }
      break;
      
    case 'diagonal':
      // Diagonal line from top-left to top-right
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1 || 1); // 0 to 1
        const x = -usableWidth / 3 + t * (usableWidth * 2 / 3);
        const y = topY - t * (topY - bottomY) * 0.6;
        positions.push({
          x: Math.round(x),
          y: Math.round(y),
          label_offset: { x: 0, y: -35 },
        });
      }
      break;
  }
  
  return positions;
}

/**
 * Generates switch positions in the upper half, organized in groups or rows.
 * Avoids collision with faders.
 */
function generateSwitchPositions(
  count: number,
  usableWidth: number,
  topY: number,
  bottomY: number,
  marginX: number,
  existingPositions: Position[]
): Position[] {
  if (count === 0) return [];
  
  const positions: Position[] = [];
  const minSpacing = 16;
  
  // Decide on pattern: groups of 2-3, single row, or two rows
  const patterns = ['groups', 'single-row', 'two-rows'];
  const pattern = count === 1 ? 'single-row' : patterns[Math.floor(Math.random() * patterns.length)];
  
  const centerY = (topY + bottomY) / 2;
  
  switch (pattern) {
    case 'groups':
      // Split into 2-3 groups
      const groupSize = Math.min(3, Math.ceil(count / 2));
      const numGroups = Math.ceil(count / groupSize);
      const groupSpacing = usableWidth / (numGroups + 1);
      
      let idx = 0;
      for (let g = 0; g < numGroups && idx < count; g++) {
        const groupX = -usableWidth / 2 + marginX + (g + 1) * groupSpacing;
        const itemsInGroup = Math.min(groupSize, count - idx);
        
        for (let i = 0; i < itemsInGroup; i++) {
          const x = groupX + (i - (itemsInGroup - 1) / 2) * 12;
          const y = centerY + (Math.random() - 0.5) * 10;
          
          if (!isTooClose({ x, y }, existingPositions, minSpacing)) {
            positions.push({
              x: Math.round(x),
              y: Math.round(y),
              label_offset: { x: 0, y: -15 },
            });
          }
          idx++;
        }
      }
      break;
      
    case 'single-row':
      // All in one horizontal row
      for (let i = 0; i < count; i++) {
        const x = -usableWidth / 2 + (i + 1) * (usableWidth / (count + 1));
        const y = centerY + (Math.random() - 0.5) * 8;
        
        if (!isTooClose({ x, y }, existingPositions, minSpacing)) {
          positions.push({
            x: Math.round(x),
            y: Math.round(y),
            label_offset: { x: 0, y: -15 },
          });
        }
      }
      break;
      
    case 'two-rows':
      // Split into two rows
      const itemsPerRow = Math.ceil(count / 2);
      for (let row = 0; row < 2 && positions.length < count; row++) {
        const y = row === 0 ? topY - 10 : bottomY + 10;
        const rowItems = Math.min(itemsPerRow, count - positions.length);
        const rowSpacing = usableWidth / (rowItems + 1);
        
        for (let i = 0; i < rowItems; i++) {
          const x = -usableWidth / 2 + (i + 1) * rowSpacing;
          
          if (!isTooClose({ x, y }, existingPositions, minSpacing)) {
            positions.push({
              x: Math.round(x),
              y: Math.round(y),
              label_offset: { x: 0, y: -15 },
            });
          }
        }
      }
      break;
  }
  
  return positions;
}

/**
 * Generates potentiometer positions using structured patterns.
 * Patterns: rows, circle/arc, diagonal, grid.
 * Avoids collision with all existing elements.
 */
function generatePotPositions(
  count: number,
  usableWidth: number,
  topY: number,
  bottomY: number,
  marginX: number,
  existingPositions: Position[],
  ledPosition: Position,
  spec: EnclosureSpec
): Position[] {
  if (count === 0) return [];
  
  const positions: Position[] = [];
  const minSpacing = 14; // Reduced from 16 to allow tighter packing
  
  // Add LED to existing positions to avoid
  const avoidPositions = [...existingPositions, ledPosition];
  
  // Choose pattern based on count
  let pattern: string;
  if (count <= 2) {
    pattern = 'horizontal';
  } else if (count <= 4) {
    pattern = Math.random() > 0.5 ? 'horizontal' : 'arc';
  } else if (count <= 6) {
    pattern = ['rows', 'arc', 'grid'][Math.floor(Math.random() * 3)];
  } else {
    pattern = Math.random() > 0.5 ? 'rows' : 'grid';
  }
  
  const usableHeight = topY - bottomY;
  
  switch (pattern) {
    case 'horizontal':
      // Single or double horizontal row
      const rows = count <= 4 ? 1 : 2;
      const itemsPerRow = Math.ceil(count / rows);
      
      for (let row = 0; row < rows; row++) {
        const y = rows === 1 
          ? (topY + bottomY) / 2 + (Math.random() - 0.5) * 15
          : topY - (row + 1) * (usableHeight / (rows + 1));
        const rowItems = Math.min(itemsPerRow, count - positions.length);
        const spacing = usableWidth / (rowItems + 1);
        
        for (let i = 0; i < rowItems; i++) {
          const x = -usableWidth / 2 + (i + 1) * spacing;
          
          if (!isTooClose({ x, y }, avoidPositions, minSpacing)) {
            positions.push({
              x: Math.round(x + (Math.random() - 0.5) * 8),
              y: Math.round(y + (Math.random() - 0.5) * 8),
              label_offset: { x: 0, y: -15 },
            });
          }
        }
      }
      break;
      
    case 'arc':
      // Arc pattern (semi-circle at top)
      const radius = usableWidth / 3;
      const arcCenter = { x: 0, y: topY - radius * 0.7 };
      const angleSpan = Math.PI * 0.8; // 144 degrees
      const angleStart = Math.PI * 0.1; // Start from 18 degrees
      
      for (let i = 0; i < count; i++) {
        const angle = angleStart + (i / (count - 1 || 1)) * angleSpan;
        const x = arcCenter.x + Math.cos(angle) * radius;
        const y = arcCenter.y + Math.sin(angle) * radius;
        
        if (!isTooClose({ x, y }, avoidPositions, minSpacing)) {
          positions.push({
            x: Math.round(x),
            y: Math.round(y),
            label_offset: { x: 0, y: -15 },
          });
        }
      }
      break;
      
    case 'grid':
      // Grid pattern
      const cols = Math.min(4, Math.ceil(Math.sqrt(count * 1.5)));
      const gridRows = Math.ceil(count / cols);
      const colSpacing = usableWidth / (cols + 1);
      const rowSpacing = usableHeight / (gridRows + 1);
      
      let idx = 0;
      for (let row = 0; row < gridRows && idx < count; row++) {
        for (let col = 0; col < cols && idx < count; col++) {
          const x = -usableWidth / 2 + (col + 1) * colSpacing;
          const y = topY - (row + 1) * rowSpacing;
          
          if (!isTooClose({ x, y }, avoidPositions, minSpacing)) {
            positions.push({
              x: Math.round(x + (Math.random() - 0.5) * 10),
              y: Math.round(y + (Math.random() - 0.5) * 10),
              label_offset: { x: 0, y: -15 },
            });
            idx++;
          }
        }
      }
      break;
      
    case 'rows':
      // Multiple rows
      const numRows = Math.min(3, Math.ceil(count / 3));
      const rowItems = Math.ceil(count / numRows);
      
      idx = 0;
      for (let row = 0; row < numRows && idx < count; row++) {
        const y = topY - (row + 1) * (usableHeight / (numRows + 1));
        const items = Math.min(rowItems, count - idx);
        const spacing = usableWidth / (items + 1);
        
        for (let i = 0; i < items; i++) {
          const x = -usableWidth / 2 + (i + 1) * spacing;
          
          if (!isTooClose({ x, y }, avoidPositions, minSpacing)) {
            positions.push({
              x: Math.round(x + (Math.random() - 0.5) * 8),
              y: Math.round(y + (Math.random() - 0.5) * 8),
              label_offset: { x: 0, y: -15 },
            });
            idx++;
          }
        }
      }
      break;
  }
  
  // If we couldn't place all pots due to collisions, add them with fallback positions
  let attempts = 0;
  while (positions.length < count && attempts < count * 50) {
    const x = (Math.random() - 0.5) * usableWidth * 0.9;
    const y = bottomY + Math.random() * usableHeight;
    
    if (!isTooClose({ x, y }, [...avoidPositions, ...positions], minSpacing * 0.7)) {
      positions.push({
        x: Math.round(x),
        y: Math.round(y),
        label_offset: { x: 0, y: -15 },
      });
    }
    attempts++;
  }
  
  return positions;
}

/**
 * Checks if a position is too close to any existing positions.
 */
function isTooClose(pos: { x: number; y: number }, existingPositions: Position[], minSpacing: number): boolean {
  return existingPositions.some(existing => {
    const dx = existing.x - pos.x;
    const dy = existing.y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < minSpacing;
  });
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
