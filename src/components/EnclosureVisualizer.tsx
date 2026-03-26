"use client";

import * as React from "react";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, Move, Shuffle, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, Magnet } from "lucide-react";
import { KnobSvgInline } from "./KnobSvg";

type Position = {
  x: number;
  y: number;
};

type PositionWithLabel = Position & {
  label_offset: Position;
};

type LayoutData = {
  id: string;
  enclosure_type: string;
  potentiometer_count: number;
  switch_count: number;
  fader_count: number;
  dimensions_mm: { width: number; length: number };
  potentiometer_positions: PositionWithLabel[];
  switch_positions: PositionWithLabel[];
  fader_positions: PositionWithLabel[];
  footswitch_position?: Position; // Optional - for single footswitch layouts
  footswitch_positions?: Position[]; // Optional - for multi footswitch layouts
  led_position?: Position; // Optional - for single LED layouts
  led_positions?: Position[]; // Optional - for multi LED layouts
  input_jack_position: Position;
  output_jack_position: Position;
  pedal_name_position: Position;
};

export type KnobConfig = {
  svgUrl: string;
  diameterMm: number;
  primaryColor: string;
  secondaryColor: string;
  primaryDarkColor?: string;
  primaryLightColor?: string;
};

type EnclosureVisualizerProps = {
  layout: LayoutData;
  availableLayouts?: LayoutData[];
  onLayoutChange?: (layout: LayoutData) => void;
  onRandomizeLayout?: () => void;
  enclosureColor?: string;
  finishType?: string;
  ledColor?: string;
  ledType?: string;
  pedalName?: string;
  controlLabels?: Record<string, string>;
  disabledLabels?: Record<string, boolean>;
  controls?: Array<{ label: string; type: string }>;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onLabelChange?: (controlLabel: string, newValue: string) => void;
  onPedalNameChange?: (newValue: string) => void;
  labeledLettering?: boolean;
  labelColor?: string;
  compact?: boolean;
  knobSvgUrl?: string;
  knobDiameterMm?: number;
  knobPrimaryColor?: string;
  knobSecondaryColor?: string;
  knobPrimaryDarkColor?: string;
  knobPrimaryLightColor?: string;
  knobConfigsPerPot?: (KnobConfig | null)[];
};

const getFinishPattern = (finishType: string | undefined, color: string) => {
  if (!finishType) return color;
  
  const type = finishType.toLowerCase();
  
  if (type.includes("textured") || type.includes("wrinkle")) {
    return `url(#texture-${color})`;
  }
  if (type.includes("metallic") || type.includes("sparkle")) {
    return `url(#metallic-${color})`;
  }
  if (type.includes("hammertone") || type.includes("hammer")) {
    return `url(#hammer-${color})`;
  }
  
  return color;
};

// Calculate contrasting text color based on background luminance
const getContrastingTextColor = (backgroundColor: string): string => {
  // Convert hex to RGB
  let r = 0, g = 0, b = 0;
  
  if (backgroundColor.startsWith('#')) {
    const hex = backgroundColor.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (backgroundColor.startsWith('rgb')) {
    const matches = backgroundColor.match(/\d+/g);
    if (matches) {
      r = parseInt(matches[0]);
      g = parseInt(matches[1]);
      b = parseInt(matches[2]);
    }
  } else {
    // Default to white text for unknown formats
    return '#fff';
  }
  
  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.5 ? '#000' : '#fff';
};

// Calculate 

export function EnclosureVisualizer({
  layout,
  availableLayouts = [],
  onLayoutChange,
  onRandomizeLayout,
  enclosureColor = "#808080",
  finishType,
  ledColor = "#ff0000",
  ledType = "No Bezel",
  pedalName = "Custom Pedal",
  controlLabels = {},
  disabledLabels = {},
  controls = [],
  isMaximized = false,
  onToggleMaximize,
  onLabelChange,
  onPedalNameChange,
  labeledLettering = false,
  labelColor,
  compact = false,
  knobSvgUrl,
  knobDiameterMm,
  knobPrimaryColor,
  knobSecondaryColor,
  knobPrimaryDarkColor,
  knobPrimaryLightColor,
  knobConfigsPerPot,
}: EnclosureVisualizerProps) {
  console.log('ðŸŽ² [Randomize] EnclosureVisualizer rendering, layout ID:', layout.id);
  
  // Dynamic viewBox based on enclosure dimensions — 1 SVG unit = 1mm
  const viewBoxPadding = 30;
  const viewBoxWidth = layout.dimensions_mm.width + viewBoxPadding * 2;
  const viewBoxHeight = layout.dimensions_mm.length + viewBoxPadding * 2;
  
  const scale = 1;
  
  // Calculate text color based on enclosure color
  const textColor = getContrastingTextColor(enclosureColor);
  
  // Calculate label tape colors
  const effectiveLabelBg = labelColor || "#000";
  const labelTextColor = getContrastingTextColor(effectiveLabelBg);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isEditLabelsMode, setIsEditLabelsMode] = React.useState(false);
  const [editingLabel, setEditingLabel] = React.useState<{ type: string; index: number; value: string } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedItem, setDraggedItem] = React.useState<{ type: string; index: number } | null>(null);
  
  // Multi-select state
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [boxSelectStart, setBoxSelectStart] = React.useState<Position | null>(null);
  const [boxSelectEnd, setBoxSelectEnd] = React.useState<Position | null>(null);
  const boxSelectStartRef = React.useRef<Position | null>(null);
  const boxSelectEndRef = React.useRef<Position | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = React.useState(false);
  const [snapEnabled, setSnapEnabled] = React.useState(true);
  const [snapLines, setSnapLines] = React.useState<{ x?: number; y?: number }[]>([]);
  const [dragStartPositions, setDragStartPositions] = React.useState<Map<string, Position>>(new Map());
  const [dragAnchor, setDragAnchor] = React.useState<Position | null>(null);

  // Helper to create an item key
  const itemKey = (type: string, index: number) => `${type}-${index}`;
  
  // Position overrides for draggable items
  const [positionOverrides, setPositionOverrides] = React.useState<{
    potentiometers: Position[];
    switches: Position[];
    faders: Position[];
    leds: Position[];
    footswitches: Position[];
    pedalName: Position | null;
    potentiometerLabelOffsets: Position[];
    switchLabelOffsets: Position[];
    faderLabelOffsets: Position[];
  }>({
    potentiometers: [],
    switches: [],
    faders: [],
    leds: [],
    footswitches: [],
    pedalName: null,
    potentiometerLabelOffsets: [],
    switchLabelOffsets: [],
    faderLabelOffsets: [],
  });
  
  const svgRef = React.useRef<SVGSVGElement>(null);
  
  // Load saved positions from sessionStorage on mount
  React.useEffect(() => {
    const savedKey = `enclosure_positions_${layout.id}`;
    const saved = sessionStorage.getItem(savedKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPositionOverrides(parsed);
      } catch (e) {
        console.error('Failed to parse saved positions:', e);
      }
    }
  }, [layout.id]);
  
  // Save positions to sessionStorage when edit mode is disabled
  React.useEffect(() => {
    if (!isEditMode && (
      positionOverrides.potentiometers.length > 0 ||
      positionOverrides.switches.length > 0 ||
      positionOverrides.faders.length > 0 ||
      positionOverrides.leds.length > 0 ||
      positionOverrides.footswitches.length > 0 ||
      positionOverrides.pedalName ||
      positionOverrides.potentiometerLabelOffsets.length > 0 ||
      positionOverrides.switchLabelOffsets.length > 0 ||
      positionOverrides.faderLabelOffsets.length > 0
    )) {
      const savedKey = `enclosure_positions_${layout.id}`;
      sessionStorage.setItem(savedKey, JSON.stringify(positionOverrides));
    }
  }, [isEditMode, positionOverrides, layout.id]);
  
  // Calculate current layout index and handle navigation
  const currentIndex = availableLayouts.findIndex(l => l.id === layout.id);
  const hasMultipleLayouts = availableLayouts.length > 1;
  
  const handlePrevLayout = () => {
    if (hasMultipleLayouts && onLayoutChange) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : availableLayouts.length - 1;
      onLayoutChange(availableLayouts[newIndex]);
    }
  };
  
  const handleNextLayout = () => {
    if (hasMultipleLayouts && onLayoutChange) {
      const newIndex = currentIndex < availableLayouts.length - 1 ? currentIndex + 1 : 0;
      onLayoutChange(availableLayouts[newIndex]);
    }
  };
  
  // Drag handlers
  const getScaledMousePosition = (event: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent): Position | null => {
    if (!svgRef.current) return null;
    
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    // Support both mouse and touch events
    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      if (!touch) return null;
      point.x = touch.clientX;
      point.y = touch.clientY;
    } else {
      point.x = event.clientX;
      point.y = event.clientY;
    }
    
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    
    const transformed = point.matrixTransform(ctm.inverse());
    return { x: transformed.x / scale, y: transformed.y / scale };
  };

  // Get data-space position for an item (not flipped for SVG)
  const getDataPosition = (type: string, index: number): Position => {
    const overrides = positionOverrides;
    if (type === 'potentiometer' && overrides.potentiometers[index]) return overrides.potentiometers[index];
    if (type === 'switch' && overrides.switches[index]) return overrides.switches[index];
    if (type === 'fader' && overrides.faders[index]) return overrides.faders[index];
    if (type === 'led' && overrides.leds[index]) return overrides.leds[index];
    if (type === 'footswitch' && overrides.footswitches[index]) return overrides.footswitches[index];
    if (type === 'pedalName' && overrides.pedalName) return overrides.pedalName;
    // Default positions from layout (already in data space)
    if (type === 'potentiometer') return layout.potentiometer_positions[index];
    if (type === 'switch') return layout.switch_positions[index];
    if (type === 'fader' && layout.fader_positions) return layout.fader_positions[index];
    if (type === 'led') {
      const leds = layout.led_positions || (layout.led_position ? [layout.led_position] : []);
      return leds[index] || { x: 0, y: 0 };
    }
    if (type === 'footswitch') {
      const fs = layout.footswitch_positions || (layout.footswitch_position ? [layout.footswitch_position] : []);
      return fs[index] || { x: 0, y: 0 };
    }
    if (type === 'pedalName') return layout.pedal_name_position;
    return { x: 0, y: 0 };
  };

  // Collect all item positions for snap alignment (including labels)
  // Label snap positions are at the vertical center of the text/tape
  const labelCenterOffsetY = labeledLettering ? 2.75 : 2.5;
  const getAllItemPositions = (): { key: string; pos: Position }[] => {
    const items: { key: string; pos: Position }[] = [];
    layout.potentiometer_positions.forEach((p, idx) => {
      items.push({ key: itemKey('potentiometer', idx), pos: getDataPosition('potentiometer', idx) });
      const parentPos = getDataPosition('potentiometer', idx);
      const offset = positionOverrides.potentiometerLabelOffsets[idx] || p.label_offset;
      items.push({ key: itemKey('potentiometer-label', idx), pos: { x: parentPos.x + offset.x, y: parentPos.y + offset.y + labelCenterOffsetY } });
    });
    layout.switch_positions.forEach((p, idx) => {
      items.push({ key: itemKey('switch', idx), pos: getDataPosition('switch', idx) });
      const parentPos = getDataPosition('switch', idx);
      const offset = positionOverrides.switchLabelOffsets[idx] || p.label_offset;
      items.push({ key: itemKey('switch-label', idx), pos: { x: parentPos.x + offset.x, y: parentPos.y + offset.y + labelCenterOffsetY } });
    });
    (layout.fader_positions || []).forEach((p, idx) => {
      items.push({ key: itemKey('fader', idx), pos: getDataPosition('fader', idx) });
      const parentPos = getDataPosition('fader', idx);
      const offset = positionOverrides.faderLabelOffsets[idx] || p.label_offset;
      items.push({ key: itemKey('fader-label', idx), pos: { x: parentPos.x + offset.x, y: parentPos.y + offset.y + labelCenterOffsetY } });
    });
    const ledPositions = layout.led_positions || (layout.led_position ? [layout.led_position] : []);
    ledPositions.forEach((_, idx) => items.push({ key: itemKey('led', idx), pos: getDataPosition('led', idx) }));
    const fsPositions = layout.footswitch_positions || (layout.footswitch_position ? [layout.footswitch_position] : []);
    fsPositions.forEach((_, idx) => items.push({ key: itemKey('footswitch', idx), pos: getDataPosition('footswitch', idx) }));
    items.push({ key: itemKey('pedalName', 0), pos: getDataPosition('pedalName', 0) });
    return items;
  };

  // Apply snap: check if position is near other items and snap if within threshold
  const SNAP_THRESHOLD = 3; // mm
  const applySnap = (pos: Position, movingKeys: Set<string>): { snapped: Position; lines: { x?: number; y?: number }[] } => {
    if (!snapEnabled) return { snapped: pos, lines: [] };
    const allItems = getAllItemPositions().filter(item => !movingKeys.has(item.key));
    let snapX: number | undefined;
    let snapY: number | undefined;
    const lines: { x?: number; y?: number }[] = [];
    for (const item of allItems) {
      if (snapX === undefined && Math.abs(pos.x - item.pos.x) < SNAP_THRESHOLD) {
        snapX = item.pos.x;
        lines.push({ x: snapX });
      }
      if (snapY === undefined && Math.abs(pos.y - item.pos.y) < SNAP_THRESHOLD) {
        snapY = item.pos.y;
        lines.push({ y: snapY });
      }
      if (snapX !== undefined && snapY !== undefined) break;
    }
    return {
      snapped: { x: snapX ?? pos.x, y: snapY ?? pos.y },
      lines,
    };
  };

  // Set a single item's position in overrides
  const setItemPosition = (overrides: typeof positionOverrides, type: string, index: number, pos: Position): typeof positionOverrides => {
    const newOverrides = { ...overrides };
    if (type === 'potentiometer') { const arr = [...overrides.potentiometers]; arr[index] = pos; newOverrides.potentiometers = arr; }
    else if (type === 'switch') { const arr = [...overrides.switches]; arr[index] = pos; newOverrides.switches = arr; }
    else if (type === 'fader') { const arr = [...overrides.faders]; arr[index] = pos; newOverrides.faders = arr; }
    else if (type === 'led') { const arr = [...overrides.leds]; arr[index] = pos; newOverrides.leds = arr; }
    else if (type === 'footswitch') { const arr = [...overrides.footswitches]; arr[index] = pos; newOverrides.footswitches = arr; }
    else if (type === 'pedalName') { newOverrides.pedalName = pos; }
    return newOverrides;
  };

  const startDrag = (type: string, index: number, event: React.MouseEvent | React.TouchEvent) => {
    if (!isEditMode) return;
    event.preventDefault();
    event.stopPropagation();
    
    const key = itemKey(type, index);
    const shiftHeld = 'shiftKey' in event && event.shiftKey;
    
    if (shiftHeld) {
      // Toggle selection
      setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
      });
      return;
    }
    
    // If clicking an unselected item without shift, select only it
    if (!selectedItems.has(key)) {
      setSelectedItems(new Set([key]));
    }
    
    // Start drag — capture starting positions of all selected items (or just this one)
    const itemsToMove = selectedItems.has(key) ? selectedItems : new Set([key]);
    const startPositions = new Map<string, Position>();
    itemsToMove.forEach(k => {
      const [t, i] = k.split('-');
      const idx = t === 'pedalName' ? 0 : parseInt(i);
      startPositions.set(k, getDataPosition(t, idx));
    });
    
    // Store SVG-space mouse position as anchor
    const svgPos = getScaledMousePosition(event);
    if (svgPos) {
      setDragAnchor({ x: svgPos.x, y: -svgPos.y }); // Convert to data space
    }
    setDragStartPositions(startPositions);
    setIsDragging(true);
    setDraggedItem({ type, index });
  };

  const handleMouseDown = (type: string, index: number) => (event: React.MouseEvent) => {
    startDrag(type, index, event);
  };

  const handleTouchStart = (type: string, index: number) => (event: React.TouchEvent) => {
    startDrag(type, index, event);
  };
  
  const handlePointerMove = (event: MouseEvent | TouchEvent) => {
    if ('touches' in event) event.preventDefault(); // prevent scroll while dragging
    
    if (isBoxSelecting) {
      const pos = getScaledMousePosition(event);
      if (pos) {
        setBoxSelectEnd(pos);
        boxSelectEndRef.current = pos;
      }
      return;
    }
    
    if (!isDragging || !draggedItem) return;
    
    const pos = getScaledMousePosition(event);
    if (!pos || !dragAnchor) return;
    
    // Convert to data space
    const dataPos = { x: pos.x, y: -pos.y };
    const dx = dataPos.x - dragAnchor.x;
    const dy = dataPos.y - dragAnchor.y;
    
    const itemsToMove = selectedItems.has(itemKey(draggedItem.type, draggedItem.index))
      ? selectedItems
      : new Set([itemKey(draggedItem.type, draggedItem.index)]);
    
    // For label-type drags, fall back to single-item logic
    if (draggedItem.type.endsWith('-label')) {
      const parentType = draggedItem.type.replace('-label', '');
      // Apply snap at the label's vertical center (offset by labelCenterOffsetY)
      const snapPos = { x: dataPos.x, y: dataPos.y + labelCenterOffsetY };
      const { snapped: snappedLabel, lines: labelLines } = applySnap(snapPos, new Set([itemKey(parentType, draggedItem.index)]));
      setSnapLines(labelLines);
      // Convert snap result back to anchor position
      const anchorPos = { x: snappedLabel.x, y: snappedLabel.y - labelCenterOffsetY };
      setPositionOverrides(prev => {
        const newOverrides = { ...prev };
        let parentPos: Position;
        if (parentType === 'potentiometer') parentPos = prev.potentiometers[draggedItem.index] || layout.potentiometer_positions[draggedItem.index];
        else if (parentType === 'switch') parentPos = prev.switches[draggedItem.index] || layout.switch_positions[draggedItem.index];
        else parentPos = prev.faders[draggedItem.index] || (layout.fader_positions || [])[draggedItem.index];
        const offset = { x: anchorPos.x - parentPos.x, y: anchorPos.y - parentPos.y };
        if (parentType === 'potentiometer') { const arr = [...prev.potentiometerLabelOffsets]; arr[draggedItem.index] = offset; newOverrides.potentiometerLabelOffsets = arr; }
        else if (parentType === 'switch') { const arr = [...prev.switchLabelOffsets]; arr[draggedItem.index] = offset; newOverrides.switchLabelOffsets = arr; }
        else { const arr = [...prev.faderLabelOffsets]; arr[draggedItem.index] = offset; newOverrides.faderLabelOffsets = arr; }
        return newOverrides;
      });
      return;
    }
    
    // Apply snap based on the dragged item's new position
    const draggedKey = itemKey(draggedItem.type, draggedItem.index);
    const draggedStart = dragStartPositions.get(draggedKey) || getDataPosition(draggedItem.type, draggedItem.index);
    const proposedPos = { x: draggedStart.x + dx, y: draggedStart.y + dy };
    const { snapped, lines } = applySnap(proposedPos, itemsToMove);
    setSnapLines(lines);
    
    // Calculate actual delta (with snap applied)
    const snapDx = snapped.x - draggedStart.x;
    const snapDy = snapped.y - draggedStart.y;
    
    setPositionOverrides(prev => {
      let newOverrides = { ...prev };
      itemsToMove.forEach(key => {
        const [type, indexStr] = key.split('-');
        const idx = type === 'pedalName' ? 0 : parseInt(indexStr);
        const startPos = dragStartPositions.get(key) || getDataPosition(type, idx);
        const newPos = { x: startPos.x + snapDx, y: startPos.y + snapDy };
        newOverrides = setItemPosition(newOverrides, type, idx, newPos);
      });
      return newOverrides;
    });
  };
  
  const handlePointerUp = () => {
    if (isBoxSelecting) {
      // Resolve box selection — use refs for latest values
      const bStart = boxSelectStartRef.current;
      const bEnd = boxSelectEndRef.current;
      if (bStart && bEnd) {
        const x1 = Math.min(bStart.x, bEnd.x);
        const x2 = Math.max(bStart.x, bEnd.x);
        const y1 = Math.min(bStart.y, bEnd.y);
        const y2 = Math.max(bStart.y, bEnd.y);
        
        const allItems = getAllItemPositions();
        const newSelection = new Set<string>();
        allItems.forEach(item => {
          // Convert to SVG coords for comparison (flip y)
          const svgY = -item.pos.y;
          if (item.pos.x >= x1 && item.pos.x <= x2 && svgY >= y1 && svgY <= y2) {
            newSelection.add(item.key);
          }
        });
        setSelectedItems(newSelection);
      }
      setIsBoxSelecting(false);
      setBoxSelectStart(null);
      setBoxSelectEnd(null);
      boxSelectStartRef.current = null;
      boxSelectEndRef.current = null;
      return;
    }
    setIsDragging(false);
    setDraggedItem(null);
    setDragAnchor(null);
    setDragStartPositions(new Map());
    setSnapLines([]);
  };

  // SVG background click: start box select or clear selection
  const handleSvgMouseDown = (event: React.MouseEvent) => {
    if (!isEditMode) return;
    // Only handle clicks on the SVG background (not on items)
    if (event.target !== svgRef.current && (event.target as Element)?.tagName !== 'rect') return;
    
    const pos = getScaledMousePosition(event);
    if (!pos) return;
    
    if (!event.shiftKey) {
      setSelectedItems(new Set());
    }
    setIsBoxSelecting(true);
    setBoxSelectStart(pos);
    setBoxSelectEnd(pos);
    boxSelectStartRef.current = pos;
    boxSelectEndRef.current = pos;
  };

  // Alignment handlers
  const handleAlignHorizontal = () => {
    if (selectedItems.size < 2) return;
    let sumX = 0;
    let count = 0;
    selectedItems.forEach(key => {
      const [type, indexStr] = key.split('-');
      const idx = type === 'pedalName' ? 0 : parseInt(indexStr);
      const pos = getDataPosition(type, idx);
      sumX += pos.x;
      count++;
    });
    const avgX = sumX / count;
    setPositionOverrides(prev => {
      let newOverrides = { ...prev };
      selectedItems.forEach(key => {
        const [type, indexStr] = key.split('-');
        const idx = type === 'pedalName' ? 0 : parseInt(indexStr);
        const pos = getDataPosition(type, idx);
        newOverrides = setItemPosition(newOverrides, type, idx, { x: avgX, y: pos.y });
      });
      return newOverrides;
    });
  };

  const handleAlignVertical = () => {
    if (selectedItems.size < 2) return;
    let sumY = 0;
    let count = 0;
    selectedItems.forEach(key => {
      const [type, indexStr] = key.split('-');
      const idx = type === 'pedalName' ? 0 : parseInt(indexStr);
      const pos = getDataPosition(type, idx);
      sumY += pos.y;
      count++;
    });
    const avgY = sumY / count;
    setPositionOverrides(prev => {
      let newOverrides = { ...prev };
      selectedItems.forEach(key => {
        const [type, indexStr] = key.split('-');
        const idx = type === 'pedalName' ? 0 : parseInt(indexStr);
        const pos = getDataPosition(type, idx);
        newOverrides = setItemPosition(newOverrides, type, idx, { x: pos.x, y: avgY });
      });
      return newOverrides;
    });
  };

  // Get info about the selected element(s)
  const selectedItemInfo = React.useMemo(() => {
    if (selectedItems.size === 0) return null;
    if (selectedItems.size > 1) return { type: 'group', count: selectedItems.size };
    const key = Array.from(selectedItems)[0];
    const [type, indexStr] = key.split('-');
    const idx = type === 'pedalName' ? 0 : parseInt(indexStr);
    const pos = getDataPosition(type, idx);
    if (!pos) return null;
    let name = type;
    if (type === 'potentiometer') {
      const control = controls.filter(c => c.type === 'Pot')[idx];
      name = control ? control.label : `Pot ${idx + 1}`;
    } else if (type === 'switch') {
      const control = controls.filter(c => c.type === 'Switch' && c.label !== 'Bypass')[idx];
      name = control ? control.label : `Switch ${idx + 1}`;
    } else if (type === 'fader') {
      const control = controls.filter(c => c.type === 'Fader')[idx];
      name = control ? control.label : `Fader ${idx + 1}`;
    } else if (type === 'led') name = `LED ${idx + 1}`;
    else if (type === 'footswitch') name = `Footswitch ${idx + 1}`;
    else if (type === 'pedalName') name = 'Pedal Name';
    return { type, name, pos: { x: Math.round(pos.x * 10) / 10, y: Math.round(pos.y * 10) / 10 } };
  }, [selectedItems, positionOverrides, controls]);
  
  React.useEffect(() => {
    if (isDragging || isBoxSelecting) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
      window.addEventListener('touchcancel', handlePointerUp);
      
      return () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
        window.removeEventListener('touchcancel', handlePointerUp);
      };
    }
  }, [isDragging, isBoxSelecting, draggedItem, dragAnchor, dragStartPositions, selectedItems, snapEnabled]);
  
  // Helper to get effective position (always uses override if exists)
  // Note: We flip y-coordinate for SVG rendering since our data uses +y=up but SVG uses +y=down
  const getPosition = (type: string, index: number, defaultPos: Position): Position => {
    let pos: Position;
    
    if (type === 'potentiometer' && positionOverrides.potentiometers[index]) {
      pos = positionOverrides.potentiometers[index];
    } else if (type === 'switch' && positionOverrides.switches[index]) {
      pos = positionOverrides.switches[index];
    } else if (type === 'fader' && positionOverrides.faders[index]) {
      pos = positionOverrides.faders[index];
    } else if (type === 'led' && positionOverrides.leds[index]) {
      pos = positionOverrides.leds[index];
    } else if (type === 'footswitch' && positionOverrides.footswitches[index]) {
      pos = positionOverrides.footswitches[index];
    } else if (type === 'pedalName' && positionOverrides.pedalName) {
      pos = positionOverrides.pedalName;
    } else {
      pos = defaultPos;
    }
    
    // Flip y-coordinate for SVG (data uses +y=up, SVG uses +y=down)
    return { x: pos.x, y: -pos.y };
  };
  
  // Helper to get effective label offset (with overrides applied)
  // For potentiometers without user overrides, auto-adjusts based on knob diameter
  const DEFAULT_KNOB_RADIUS = 7.5; // default fallback knob radius in mm
  
  const getEffectiveKnobDiameter = (potIndex: number): number => {
    const potKnob = knobConfigsPerPot?.[potIndex];
    if (potKnob) return potKnob.diameterMm;
    if (knobDiameterMm) return knobDiameterMm;
    return DEFAULT_KNOB_RADIUS * 2; // 15mm default
  };
  
  const getLabelOffset = (type: string, index: number, defaultOffset: Position): Position => {
    // If user has manually repositioned this label, always use that
    if (type === 'potentiometer' && positionOverrides.potentiometerLabelOffsets[index]) {
      return positionOverrides.potentiometerLabelOffsets[index];
    } else if (type === 'switch' && positionOverrides.switchLabelOffsets[index]) {
      return positionOverrides.switchLabelOffsets[index];
    } else if (type === 'fader' && positionOverrides.faderLabelOffsets[index]) {
      return positionOverrides.faderLabelOffsets[index];
    }
    
    // For potentiometers, auto-adjust label offset based on knob diameter
    if (type === 'potentiometer') {
      const knobRadius = getEffectiveKnobDiameter(index) / 2;
      const radiusDiff = knobRadius - DEFAULT_KNOB_RADIUS;
      if (Math.abs(radiusDiff) > 0.5) {
        // Push the label further away along its offset direction
        const dist = Math.sqrt(defaultOffset.x * defaultOffset.x + defaultOffset.y * defaultOffset.y);
        if (dist > 0) {
          const nx = defaultOffset.x / dist;
          const ny = defaultOffset.y / dist;
          return { x: defaultOffset.x + nx * radiusDiff, y: defaultOffset.y + ny * radiusDiff };
        }
      }
    }
    
    return defaultOffset;
  };
  
  // Knob collision detection — find pairs of pots whose knobs overlap
  const collidingPots = React.useMemo(() => {
    const colliding = new Set<number>();
    const pots = layout.potentiometer_positions;
    for (let i = 0; i < pots.length; i++) {
      for (let j = i + 1; j < pots.length; j++) {
        const posI = getDataPosition('potentiometer', i);
        const posJ = getDataPosition('potentiometer', j);
        const rI = getEffectiveKnobDiameter(i) / 2;
        const rJ = getEffectiveKnobDiameter(j) / 2;
        const dx = posI.x - posJ.x;
        const dy = posI.y - posJ.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < rI + rJ - 0.5) { // 0.5mm tolerance
          colliding.add(i);
          colliding.add(j);
        }
      }
    }
    return colliding;
  }, [layout.potentiometer_positions, positionOverrides.potentiometers, knobConfigsPerPot, knobDiameterMm]);
  
  const visualizerContent = (
    <div
      style={{
        position: "relative",
        background: "#1a1a1a",
        borderRadius: "12px",
        border: "2px solid #333",
        overflow: "hidden",
      }}
    >
      {/* Header with title and maximize button */}
      {onToggleMaximize && (
        <div
          data-section="visualization-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
            background: "#0a0a0a",
            borderBottom: "1px solid #333",
          }}
        >
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e0e0e0" }}>
            Enclosure Preview
          </span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {hasMultipleLayouts && (
              <span style={{ fontSize: "0.75rem", color: "#888" }}>
                Layout {currentIndex + 1}/{availableLayouts.length}
              </span>
            )}
            <button
              onClick={onToggleMaximize}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* SVG Visualization with navigation */}
      <div data-section="visualization-window" style={{ position: "relative", padding: isMaximized ? "2rem" : (compact ? "0.5rem" : "1rem") }}>
        {/* Floating action buttons — compact mode only shows layout nav + maximize */}
        {(!compact || isMaximized) && (
        <div 
          data-section="visualization-toolbar"
          style={{ 
            position: "absolute", 
            top: "0.2rem", 
            width: "95%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex", 
            flexDirection: "row",
            justifyContent: "center",
            gap: "0.25rem", 
            zIndex: 10,
            flexWrap: "wrap",
          }}>
          {onRandomizeLayout && (
            <button
              onClick={onRandomizeLayout}
              style={{
          background: "rgba(0, 0, 0, 0.7)",
          border: "1px solid #666",
          color: "#fff",
          cursor: "pointer",
          padding: "0.25rem 0.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          borderRadius: "6px",
          fontSize: "0.8rem",
          fontWeight: 500,
              }}
              onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
              }}
              title="Generate a completely new random layout (feeling lucky?)"
            >
              <Shuffle size={16} />
              <span>Randomize</span>
            </button>
          )}
          <button
            onClick={() => { setIsEditMode(!isEditMode); if (isEditMode) { setSelectedItems(new Set()); setSnapLines([]); } }}
            style={{
              background: isEditMode ? "rgba(74, 222, 128, 0.2)" : "rgba(0, 0, 0, 0.7)",
              border: "1px solid " + (isEditMode ? "#4ade80" : "#666"),
              color: isEditMode ? "#4ade80" : "#fff",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              if (!isEditMode) e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              if (!isEditMode) e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
            }}
            title="Toggle edit mode to drag and reposition components"
          >
            <Move size={16} />
            <span>Edit Layout</span>
          </button>
          <button
            onClick={() => setIsEditLabelsMode(!isEditLabelsMode)}
            style={{
              background: isEditLabelsMode ? "rgba(74, 222, 128, 0.2)" : "rgba(0, 0, 0, 0.7)",
              border: "1px solid " + (isEditLabelsMode ? "#4ade80" : "#666"),
              color: isEditLabelsMode ? "#4ade80" : "#fff",
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              if (!isEditLabelsMode) e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              if (!isEditLabelsMode) e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
            }}
            title="Toggle edit mode to click and edit label text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Edit Labels</span>
          </button>
          {/* Snap toggle — only visible in maximized edit mode */}
          {isMaximized && isEditMode && (
            <button
              onClick={() => setSnapEnabled(!snapEnabled)}
              style={{
                background: snapEnabled ? "rgba(96, 165, 250, 0.2)" : "rgba(0, 0, 0, 0.7)",
                border: "1px solid " + (snapEnabled ? "#60a5fa" : "#666"),
                color: snapEnabled ? "#60a5fa" : "#fff",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 500,
              }}
              title={snapEnabled ? "Snap alignment ON — click to disable" : "Snap alignment OFF — click to enable"}
            >
              <Magnet size={16} />
              <span>Snap</span>
            </button>
          )}
          {/* Alignment tools — only in maximized edit mode with multiple selected */}
          {isMaximized && isEditMode && selectedItems.size >= 2 && (
            <>
              <button
                onClick={handleAlignHorizontal}
                style={{
                  background: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid #f59e0b",
                  color: "#f59e0b",
                  cursor: "pointer",
                  padding: "0.25rem 0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
                title="Align selected elements vertically (same X position)"
              >
                <AlignHorizontalDistributeCenter size={16} />
                <span>Align X</span>
              </button>
              <button
                onClick={handleAlignVertical}
                style={{
                  background: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid #f59e0b",
                  color: "#f59e0b",
                  cursor: "pointer",
                  padding: "0.25rem 0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
                title="Align selected elements horizontally (same Y position)"
              >
                <AlignVerticalDistributeCenter size={16} />
                <span>Align Y</span>
              </button>
            </>
          )}
        </div>
        )}
        
        {/* Previous Layout Button */}
        {hasMultipleLayouts && (
          <button
            onClick={handlePrevLayout}
            style={{
              position: "absolute",
              left: "0.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0, 0, 0, 0.7)",
              border: "1px solid #666",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              zIndex: 10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)")}
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        {/* Next Layout Button */}
        {hasMultipleLayouts && (
          <button
            onClick={handleNextLayout}
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0, 0, 0, 0.7)",
              border: "1px solid #666",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              zIndex: 10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)")}
          >
            <ChevronRight size={24} />
          </button>
        )}
        
        <svg
          ref={svgRef}
          viewBox={`${-viewBoxWidth / 2} ${-viewBoxHeight / 2} ${viewBoxWidth} ${viewBoxHeight}`}
          onMouseDown={handleSvgMouseDown}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: isMaximized ? "80vh" : (compact ? "250px" : "450px"),
            cursor: isEditMode ? (isBoxSelecting ? "crosshair" : "default") : "default",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            touchAction: isEditMode ? "none" : "auto",
          }}
        >
          <defs>
            {/* LED Glow Effect */}
            <filter id="led-glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Metallic Pattern */}
            <linearGradient id={`metallic-${enclosureColor}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: enclosureColor, stopOpacity: 1 }} />
              <stop offset="30%" style={{ stopColor: "#ffffff", stopOpacity: 0.3 }} />
              <stop offset="60%" style={{ stopColor: enclosureColor, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#000000", stopOpacity: 0.3 }} />
            </linearGradient>

            {/* Texture Pattern */}
            <pattern id={`texture-${enclosureColor}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill={enclosureColor} />
              <circle cx="1" cy="1" r="0.5" fill="#000" opacity="0.2" />
              <circle cx="3" cy="3" r="0.5" fill="#fff" opacity="0.1" />
            </pattern>

            {/* Hammertone Pattern */}
            <pattern id={`hammer-${enclosureColor}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill={enclosureColor} />
              <circle cx="2" cy="2" r="1.5" fill="#000" opacity="0.15" />
              <circle cx="5" cy="5" r="1.2" fill="#fff" opacity="0.1" />
            </pattern>

            {/* Metal gradient for controls */}
            <radialGradient id="metal-knob">
              <stop offset="0%" style={{ stopColor: "#e0e0e0", stopOpacity: 1 }} />
              <stop offset="70%" style={{ stopColor: "#a0a0a0", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#606060", stopOpacity: 1 }} />
            </radialGradient>

            {/* Footswitch gradient */}
            <radialGradient id="footswitch-grad">
              <stop offset="0%" style={{ stopColor: "#3a3a3a", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#1a1a1a", stopOpacity: 1 }} />
            </radialGradient>
          </defs>

          {/* Main Enclosure Body */}
          <g>
            {/* Input Jack (behind enclosure) */}
            <g>
              <rect
                x={layout.input_jack_position.x + 4 - 2}
                y={layout.input_jack_position.y - 7.5}
                width="4"
                height="15"
                fill="#888"
                stroke="#555"
                strokeWidth="0.5"
                rx="0.5"
              />
            </g>

            {/* Output Jack (behind enclosure) */}
            <g>
              <rect
                x={layout.output_jack_position.x - 4 - 2}
                y={layout.output_jack_position.y - 7.5}
                width="4"
                height="15"
                fill="#888"
                stroke="#555"
                strokeWidth="0.5"
                rx="0.5"
              />
            </g>

            {/* Enclosure background with shadow */}
            <rect
              x={-layout.dimensions_mm.width / 2}
              y={-layout.dimensions_mm.length / 2}
              width={layout.dimensions_mm.width}
              height={layout.dimensions_mm.length}
              fill={getFinishPattern(finishType, enclosureColor)}
              stroke="#000"
              strokeWidth="0.5"
              rx="4"
              ry="4"
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
            />

            {/* Enclosure highlight/shine */}
            <rect
              x={-layout.dimensions_mm.width / 2}
              y={-layout.dimensions_mm.length / 2}
              width={layout.dimensions_mm.width}
              height={layout.dimensions_mm.length / 3}
              fill="url(#shine)"
              opacity="0.15"
              rx="4"
              ry="4"
            />
            <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
            </linearGradient>

            {/* Pedal Name */}
            {pedalName && (
              <g
                onMouseDown={handleMouseDown('pedalName', 0)}
                onTouchStart={handleTouchStart('pedalName', 0)}
                style={{ cursor: isEditMode ? 'move' : (isEditLabelsMode ? 'pointer' : 'default') }}
              >
                {editingLabel?.type === 'pedalName' ? (
                  <foreignObject
                    x={getPosition('pedalName', 0, layout.pedal_name_position).x - 30}
                    y={getPosition('pedalName', 0, layout.pedal_name_position).y - 6.25}
                    width="60"
                    height="10"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={editingLabel.value}
                      onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                      onBlur={() => {
                        if (onPedalNameChange) {
                          onPedalNameChange(editingLabel.value.trim());
                        }
                        setEditingLabel(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (onPedalNameChange) {
                            onPedalNameChange(editingLabel.value.trim());
                          }
                          setEditingLabel(null);
                        } else if (e.key === 'Escape') {
                          setEditingLabel(null);
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        fontSize: '6px',
                        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: 'transparent',
                        border: 'none',
                        color: textColor,
                        outline: 'none',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    />
                  </foreignObject>
                ) : (
                  <>
                    {labeledLettering && !!pedalName && (
                      <rect
                        x={getPosition('pedalName', 0, layout.pedal_name_position).x - (pedalName.length * 2.5) - 1.2}
                        y={getPosition('pedalName', 0, layout.pedal_name_position).y - 7.25}
                        width={(pedalName.length * 5) + 2.4}
                        height="9"
                        fill={effectiveLabelBg}
                        rx="0.5"
                      />
                    )}
                    {pedalName ? (
                      <text
                        x={getPosition('pedalName', 0, layout.pedal_name_position).x}
                        y={getPosition('pedalName', 0, layout.pedal_name_position).y}
                        textAnchor="middle"
                        style={{
                          fontSize: labeledLettering ? "8px" : "3.5px",
                          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                          fontWeight: 600,
                          fill: labeledLettering ? labelTextColor : textColor,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          pointerEvents: isEditLabelsMode ? 'auto' : (isEditMode ? 'auto' : 'none'),
                          cursor: isEditLabelsMode ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (isEditLabelsMode) {
                            setEditingLabel({ type: 'pedalName', index: 0, value: pedalName });
                          }
                        }}
                      >
                        {pedalName}
                      </text>
                    ) : isEditLabelsMode ? (
                      <text
                        x={getPosition('pedalName', 0, layout.pedal_name_position).x}
                        y={getPosition('pedalName', 0, layout.pedal_name_position).y}
                        textAnchor="middle"
                        style={{
                          fontSize: labeledLettering ? "8px" : "3.5px",
                          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                          fontWeight: 600,
                          fill: "#555",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          pointerEvents: 'auto',
                          cursor: 'pointer',
                          fontStyle: 'italic',
                        }}
                        onClick={() => setEditingLabel({ type: 'pedalName', index: 0, value: '' })}
                      >
                        Click to add name
                      </text>
                    ) : null}
                  </>
                )}
              </g>
            )}

            {/* Potentiometers */}
            {layout.potentiometer_positions.map((pos, idx) => {
              const control = controls.filter((c) => c.type === "Pot")[idx];
              const label = control && !disabledLabels[control.label] ? (controlLabels[control.label] ?? control.label) : (control && disabledLabels[control.label] ? '' : `Pot ${idx + 1}`);
              const effectivePos = getPosition('potentiometer', idx, pos);
              const labelOffset = getLabelOffset('potentiometer', idx, pos.label_offset);
              
              return (
                <g 
                  key={`pot-${idx}`}
                  onMouseDown={handleMouseDown('potentiometer', idx)}
                  onTouchStart={handleTouchStart('potentiometer', idx)}
                  style={{ cursor: isEditMode ? 'move' : 'default' }}
                >
                  {/* Invisible hit area for better clickability */}
                  <circle
                    cx={effectivePos.x}
                    cy={effectivePos.y}
                    r={getEffectiveKnobDiameter(idx) / 2 + 1}
                    fill="transparent"
                    stroke="none"
                  />
                  {/* Label (rendered first, behind knob) */}
                  {editingLabel?.type === 'potentiometer' && editingLabel?.index === idx ? (
                    <>
                      {labeledLettering && (
                        <rect
                          x={effectivePos.x + labelOffset.x - 25}
                          y={effectivePos.y - labelOffset.y - 7.25}
                          width="50"
                          height="9"
                          fill={effectiveLabelBg}
                          rx="0.5"
                        />
                      )}
                      <foreignObject
                        x={effectivePos.x + labelOffset.x - (labeledLettering ? 25 : 15)}
                        y={effectivePos.y - labelOffset.y - (labeledLettering ? 7.25 : 4.5)}
                        width={labeledLettering ? "50" : "30"}
                        height={labeledLettering ? "9" : "7"}
                      >
                        <input
                          autoFocus
                          type="text"
                          value={editingLabel.value}
                          onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                          onBlur={() => {
                            if (onLabelChange && control) {
                              onLabelChange(control.label, editingLabel.value.trim());
                            }
                            setEditingLabel(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (onLabelChange && control) {
                                onLabelChange(control.label, editingLabel.value.trim());
                              }
                              setEditingLabel(null);
                            } else if (e.key === 'Escape') {
                              setEditingLabel(null);
                            }
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            fontSize: labeledLettering ? '8px' : '3.5px',
                            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                            fontWeight: 600,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '0px',
                            background: 'transparent',
                            border: 'none',
                            color: labeledLettering ? labelTextColor : textColor,
                            outline: 'none',
                            padding: '0',
                            lineHeight: labeledLettering ? '9px' : '7px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        />
                      </foreignObject>
                    </>
                  ) : label ? (
                    <>
                      {labeledLettering && (
                        <rect
                          x={effectivePos.x + labelOffset.x - (label.length * 2.5) - 1.2}
                          y={effectivePos.y - labelOffset.y - 7.25}
                          width={(label.length * 5) + 2.4}
                          height="9"
                          fill={effectiveLabelBg}
                          rx="0.5"
                        />
                      )}
                      <text
                        x={effectivePos.x + labelOffset.x}
                        y={effectivePos.y - labelOffset.y}
                        textAnchor="middle"
                        style={{
                          fontSize: labeledLettering ? "8px" : "3.5px",
                          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                          fontWeight: 600,
                          fill: labeledLettering ? labelTextColor : textColor,
                          textTransform: "uppercase",
                          pointerEvents: isEditLabelsMode ? 'auto' : (isEditMode ? 'auto' : 'none'),
                          cursor: isEditLabelsMode ? 'pointer' : (isEditMode ? 'move' : 'default'),
                        }}
                        onMouseDown={(e) => {
                          if (isEditMode && !isEditLabelsMode) {
                            e.stopPropagation();
                            handleMouseDown('potentiometer-label', idx)(e);
                          }
                        }}
                        onTouchStart={(e) => {
                          if (isEditMode && !isEditLabelsMode) {
                            e.stopPropagation();
                            handleTouchStart('potentiometer-label', idx)(e);
                          }
                        }}
                        onClick={() => {
                          if (isEditLabelsMode && control) {
                            setEditingLabel({ type: 'potentiometer', index: idx, value: label });
                          }
                        }}
                      >
                        {label}
                      </text>
                    </>
                  ) : isEditLabelsMode && control ? (
                    <text
                      x={effectivePos.x + labelOffset.x}
                      y={effectivePos.y - labelOffset.y}
                      textAnchor="middle"
                      style={{
                        fontSize: "3.5px",
                        fill: "#555",
                        fontStyle: 'italic',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                      }}
                      onClick={() => setEditingLabel({ type: 'potentiometer', index: idx, value: '' })}
                    >
                      +
                    </text>
                  ) : null}
                  {/* Knob shadow & body - resolve per-pot config */}
                  {(() => {
                    const potKnob = knobConfigsPerPot?.[idx] ?? (knobSvgUrl ? {
                      svgUrl: knobSvgUrl,
                      diameterMm: knobDiameterMm || 15,
                      primaryColor: knobPrimaryColor || "#888888",
                      secondaryColor: knobSecondaryColor || "#888888",
                      primaryDarkColor: knobPrimaryDarkColor,
                      primaryLightColor: knobPrimaryLightColor,
                    } : null);
                    const shadowR = potKnob ? potKnob.diameterMm / 2 + 0.75 : 8.25;
                    return (
                      <>
                        <circle cx={effectivePos.x} cy={effectivePos.y + 0.75} r={shadowR} fill="#000" opacity="0.3" />
                        {potKnob ? (
                          <KnobSvgInline
                            svgUrl={potKnob.svgUrl}
                            diameterMm={potKnob.diameterMm}
                            primaryColor={potKnob.primaryColor}
                            secondaryColor={potKnob.secondaryColor}
                            primaryDarkColor={potKnob.primaryDarkColor}
                            primaryLightColor={potKnob.primaryLightColor}
                            x={effectivePos.x}
                            y={effectivePos.y}
                          />
                        ) : (
                          <>
                            <circle cx={effectivePos.x} cy={effectivePos.y} r="7.5" fill="url(#metal-knob)" stroke="#2a2a2a" strokeWidth="0.3" />
                            <line
                              x1={effectivePos.x}
                              y1={effectivePos.y - 6}
                              x2={effectivePos.x}
                              y2={effectivePos.y - 1.5}
                              stroke="#fff"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                            />
                          </>
                        )}
                      </>
                    );
                  })()}
                  {/* Collision warning ring */}
                  {collidingPots.has(idx) && (
                    <circle
                      cx={effectivePos.x}
                      cy={effectivePos.y}
                      r={getEffectiveKnobDiameter(idx) / 2 + 1}
                      fill="none"
                      stroke="#ff4444"
                      strokeWidth="0.8"
                      strokeDasharray="2 1.5"
                      opacity="0.85"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                </g>
              );
            })}

            {/* Switches */}
            {layout.switch_positions.map((pos, idx) => {
              const control = controls.filter((c) => c.type === "Switch" && c.label !== "Bypass")[idx];
              const label = control && !disabledLabels[control.label] ? (controlLabels[control.label] ?? control.label) : (control && disabledLabels[control.label] ? '' : `SW ${idx + 1}`);
              const effectivePos = getPosition('switch', idx, pos);
              const labelOffset = getLabelOffset('switch', idx, pos.label_offset);
              
              return (
                <g 
                  key={`switch-${idx}`}
                  onMouseDown={handleMouseDown('switch', idx)}
                  onTouchStart={handleTouchStart('switch', idx)}
                  style={{ cursor: isEditMode ? 'move' : 'default' }}
                >
                  {/* Invisible hit area for better clickability */}
                  <rect
                    x={effectivePos.x - 12}
                    y={effectivePos.y - 12}
                    width="24"
                    height="24"
                    fill="transparent"
                    stroke="none"
                  />
                  {/* Switch base */}
                  <rect
                    x={effectivePos.x - 2.5}
                    y={effectivePos.y - 4}
                    width="5"
                    height="8"
                    fill="#2a2a2a"
                    stroke="#1a1a1a"
                    strokeWidth="0.3"
                    rx="1"
                  />
                  {/* Switch toggle */}
                  <rect
                    x={effectivePos.x - 1.5}
                    y={effectivePos.y - 2}
                    width="3"
                    height="4"
                    fill="url(#metal-knob)"
                    stroke="#1a1a1a"
                    strokeWidth="0.2"
                    rx="0.5"
                  />
                  {/* Label */}
                  {editingLabel?.type === 'switch' && editingLabel?.index === idx ? (
                    <>
                      {labeledLettering && (
                        <rect
                          x={effectivePos.x + labelOffset.x - 25}
                          y={effectivePos.y - labelOffset.y - 7.25}
                          width="50"
                          height="9"
                          fill={effectiveLabelBg}
                          rx="0.5"
                        />
                      )}
                      <foreignObject
                        x={effectivePos.x + labelOffset.x - (labeledLettering ? 25 : 12)}
                        y={effectivePos.y - labelOffset.y - (labeledLettering ? 7.25 : 4)}
                        width={labeledLettering ? "50" : "24"}
                        height={labeledLettering ? "9" : "6"}
                      >
                        <input
                          autoFocus
                          type="text"
                          value={editingLabel.value}
                          onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                          onBlur={() => {
                            if (onLabelChange && control) {
                              onLabelChange(control.label, editingLabel.value.trim());
                            }
                            setEditingLabel(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (onLabelChange && control) {
                                onLabelChange(control.label, editingLabel.value.trim());
                              }
                              setEditingLabel(null);
                            } else if (e.key === 'Escape') {
                              setEditingLabel(null);
                            }
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            fontSize: labeledLettering ? '8px' : '3px',
                            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                            fontWeight: 600,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '0px',
                            background: 'transparent',
                            border: 'none',
                            color: labeledLettering ? labelTextColor : textColor,
                            outline: 'none',
                            padding: '0',
                            lineHeight: labeledLettering ? '9px' : '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        />
                      </foreignObject>
                    </>
                  ) : label ? (
                    <>
                      {labeledLettering && (
                        <rect
                          x={effectivePos.x + labelOffset.x - (label.length * 2.5) - 1.2}
                          y={effectivePos.y - labelOffset.y - 7.25}
                          width={(label.length * 5) + 2.4}
                          height="9"
                          fill={effectiveLabelBg}
                          rx="0.5"
                        />
                      )}
                      <text
                        x={effectivePos.x + labelOffset.x}
                        y={effectivePos.y - labelOffset.y}
                        textAnchor="middle"
                        style={{
                          fontSize: labeledLettering ? "8px" : "3px",
                          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                          fontWeight: 600,
                          fill: labeledLettering ? labelTextColor : textColor,
                          textTransform: "uppercase",
                          pointerEvents: isEditLabelsMode ? 'auto' : (isEditMode ? 'auto' : 'none'),
                          cursor: isEditLabelsMode ? 'pointer' : (isEditMode ? 'move' : 'default'),
                        }}
                        onMouseDown={(e) => {
                          if (isEditMode && !isEditLabelsMode) {
                            e.stopPropagation();
                            handleMouseDown('switch-label', idx)(e);
                          }
                        }}
                        onTouchStart={(e) => {
                          if (isEditMode && !isEditLabelsMode) {
                            e.stopPropagation();
                            handleTouchStart('switch-label', idx)(e);
                          }
                        }}
                        onClick={() => {
                          if (isEditLabelsMode && control) {
                            setEditingLabel({ type: 'switch', index: idx, value: label });
                          }
                        }}
                      >
                        {label}
                      </text>
                    </>
                  ) : isEditLabelsMode && control ? (
                    <text
                      x={effectivePos.x + labelOffset.x}
                      y={effectivePos.y - labelOffset.y}
                      textAnchor="middle"
                      style={{
                        fontSize: "3px",
                        fill: "#555",
                        fontStyle: 'italic',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                      }}
                      onClick={() => setEditingLabel({ type: 'switch', index: idx, value: '' })}
                    >
                      +
                    </text>
                  ) : null}
                </g>
              );
            })}

            {/* Faders */}
            {(() => {
              console.log('ðŸŽšï¸ [EnclosureVisualizer] Rendering faders:', {
                layoutFaderPositions: layout.fader_positions?.length || 0,
                faderPositionsData: layout.fader_positions,
                controlsFaders: controls.filter(c => c.type === 'Fader').map(c => c.label)
              });
              
              return layout.fader_positions?.map((pos, idx) => {
                const control = controls.filter((c) => c.type === "Fader")[idx];
                const label = control && !disabledLabels[control.label] ? (controlLabels[control.label] ?? control.label) : (control && disabledLabels[control.label] ? '' : `Fader ${idx + 1}`);
                const effectivePos = getPosition('fader', idx, pos);
                const labelOffset = getLabelOffset('fader', idx, pos.label_offset);
                
                return (
                <g 
                  key={`fader-${idx}`}
                  onMouseDown={handleMouseDown('fader', idx)}
                  onTouchStart={handleTouchStart('fader', idx)}
                  style={{ cursor: isEditMode ? 'move' : 'default' }}
                >
                  {/* Fader track */}
                  <rect
                    x={effectivePos.x - 1}
                    y={effectivePos.y - (35 / 2.0)}
                    width="2"
                    height="35"
                    fill="#1a1a1a"
                    stroke="#000"
                    strokeWidth="0.3"
                    rx="1"
                  />
                  {/* Fader handle */}
                  <rect
                    x={effectivePos.x - 2.5}
                    y={effectivePos.y - 3}
                    width="5"
                    height="6"
                    fill="url(#metal-knob)"
                    stroke="#1a1a1a"
                    strokeWidth="0.3"
                    rx="0.5"
                  />
                  {/* Fader Screws */}
                  <circle cx={effectivePos.x} cy={effectivePos.y - 20.5} r="0.7" fill="#555" />
                  <circle cx={effectivePos.x} cy={effectivePos.y + 20.5} r="0.7" fill="#555" />
                  {/* Label */}
                  {editingLabel?.type === 'fader' && editingLabel?.index === idx ? (
                    <>
                      {labeledLettering && (
                        <rect
                          x={effectivePos.x + labelOffset.x - 25}
                          y={effectivePos.y - labelOffset.y - 7.25}
                          width="50"
                          height="9"
                          fill={effectiveLabelBg}
                          rx="0.5"
                        />
                      )}
                      <foreignObject
                        x={effectivePos.x + labelOffset.x - (labeledLettering ? 25 : 15)}
                        y={effectivePos.y - labelOffset.y - (labeledLettering ? 7.25 : 4.5)}
                        width={labeledLettering ? "50" : "30"}
                        height={labeledLettering ? "9" : "7"}
                      >
                        <input
                          autoFocus
                          type="text"
                          value={editingLabel.value}
                          onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                          onBlur={() => {
                            if (onLabelChange && control) {
                              onLabelChange(control.label, editingLabel.value.trim());
                            }
                            setEditingLabel(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (onLabelChange && control) {
                                onLabelChange(control.label, editingLabel.value.trim());
                              }
                              setEditingLabel(null);
                            } else if (e.key === 'Escape') {
                              setEditingLabel(null);
                            }
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            fontSize: labeledLettering ? '8px' : '3.5px',
                            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                            fontWeight: 600,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '0px',
                            background: 'transparent',
                            border: 'none',
                            color: labeledLettering ? labelTextColor : textColor,
                            outline: 'none',
                            padding: '0',
                            lineHeight: labeledLettering ? '9px' : '7px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        />
                      </foreignObject>
                    </>
                  ) : label ? (
                    <>
                      {labeledLettering && (
                        <rect
                          x={effectivePos.x + labelOffset.x - (label.length * 2.5) - 1.2}
                          y={effectivePos.y - labelOffset.y - 7.25}
                          width={(label.length * 5) + 2.4}
                          height="9"
                          fill={effectiveLabelBg}
                          rx="0.5"
                        />
                      )}
                      <text
                        x={effectivePos.x + labelOffset.x}
                        y={effectivePos.y - labelOffset.y}
                        textAnchor="middle"
                        style={{
                          fontSize: labeledLettering ? "8px" : "3.5px",
                          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                          fontWeight: 600,
                          fill: labeledLettering ? labelTextColor : textColor,
                          textTransform: "uppercase",
                          pointerEvents: isEditLabelsMode ? 'auto' : (isEditMode ? 'auto' : 'none'),
                          cursor: isEditLabelsMode ? 'pointer' : (isEditMode ? 'move' : 'default'),
                        }}
                        onMouseDown={(e) => {
                          if (isEditMode && !isEditLabelsMode) {
                            e.stopPropagation();
                            handleMouseDown('fader-label', idx)(e);
                          }
                        }}
                        onTouchStart={(e) => {
                          if (isEditMode && !isEditLabelsMode) {
                            e.stopPropagation();
                            handleTouchStart('fader-label', idx)(e);
                          }
                        }}
                        onClick={() => {
                          if (isEditLabelsMode && control) {
                            setEditingLabel({ type: 'fader', index: idx, value: label });
                          }
                        }}
                      >
                        {label}
                      </text>
                    </>
                  ) : isEditLabelsMode && control ? (
                    <text
                      x={effectivePos.x + labelOffset.x}
                      y={effectivePos.y - labelOffset.y}
                      textAnchor="middle"
                      style={{
                        fontSize: "3.5px",
                        fill: "#555",
                        fontStyle: 'italic',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                      }}
                      onClick={() => setEditingLabel({ type: 'fader', index: idx, value: '' })}
                    >
                      +
                    </text>
                  ) : null}
                </g>
              );
              }) || [];
            })()}

            {/* LED with glow - support both single and multiple LEDs */}
            {ledType !== "No LED" && ledType !== "Illuminated Footswitch" && (() => {
              const ledPositions = layout.led_positions || (layout.led_position ? [layout.led_position] : []);
              return ledPositions.map((ledPos, index) => (
                <g 
                  key={`led-${index}`}
                  onMouseDown={handleMouseDown('led', index)}
                  onTouchStart={handleTouchStart('led', index)}
                  style={{ cursor: isEditMode ? 'move' : 'default' }}
                >
                  {/* Invisible hit area for better clickability and to prevent glow cutoff */}
                  <circle
                    cx={getPosition('led', index, ledPos).x}
                    cy={getPosition('led', index, ledPos).y}
                    r="18"
                    fill="transparent"
                    stroke="none"
                  />
                  
                  {ledType === "Fender Style Jewel" ? (
                    <>
                      {/* Jewel base (16mm diameter) */}
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="9.35"
                        fill={ledColor}
                        opacity="0.3"
                        filter="url(#led-glow)"
                      />
                      {/* Jewel dome effect - gradient layers */}
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="9.35"
                        fill={ledColor}
                        opacity="0.6"
                      />
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="7"
                        fill={ledColor}
                        opacity="0.8"
                      />
                      {/* Bright center */}
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="4"
                        fill="#fff"
                        opacity="0.9"
                      />
                      {/* Chrome ring */}
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="9.35"
                        fill="none"
                        stroke="#c0c0c0"
                        strokeWidth="0.8"
                      />
                    </>
                  ) : ledType === "Simple LED Bezel" ? (
                    <>
                      {/* LED itself */}
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="2.5"
                        fill={ledColor}
                        filter="url(#led-glow)"
                        opacity="0.9"
                      />
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="1.5"
                        fill="#fff"
                        opacity="0.6"
                      />
                      {/* Silver bezel */}
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="4"
                        fill="none"
                        stroke="#c0c0c0"
                        strokeWidth="1"
                      />
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="3.2"
                        fill="none"
                        stroke="#888"
                        strokeWidth="0.3"
                      />
                    </>
                  ) : (
                    <>
                      {/* Standard LED (No Bezel) */}
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="2.5"
                        fill={ledColor}
                        filter="url(#led-glow)"
                        opacity="0.9"
                      />
                      <circle
                        cx={getPosition('led', index, ledPos).x}
                        cy={getPosition('led', index, ledPos).y}
                        r="1.5"
                        fill="#fff"
                        opacity="0.6"
                      />
                    </>
                  )}
                </g>
              ));
            })()}

            {/* Footswitch - support both single and multiple footswitches */}
            {(() => {
              const footswitchPositions = layout.footswitch_positions || (layout.footswitch_position ? [layout.footswitch_position] : []);
              const bypassControls = controls.filter((c) => c.type === "Switch" && c.label === "Bypass");
              return footswitchPositions.map((fsPos, index) => {
                const control = bypassControls[index];
                const label = control && !disabledLabels[control.label] ? (controlLabels[control.label] ?? control.label) : '';
                const fsPosition = getPosition('footswitch', index, fsPos);
                return (
                <g 
                  key={`footswitch-${index}`}
                  onMouseDown={handleMouseDown('footswitch', index)}
                  onTouchStart={handleTouchStart('footswitch', index)}
                  style={{ cursor: isEditMode ? 'move' : 'default' }}
                >
                  {ledType === "Illuminated Footswitch" && (
                    <>
                      {/* Blurred colored ring behind footswitch */}
                      <circle
                        cx={fsPosition.x}
                        cy={fsPosition.y}
                        r="12"
                        fill={ledColor}
                        opacity="0.6"
                        filter="url(#led-glow)"
                      />
                      <circle
                        cx={fsPosition.x}
                        cy={fsPosition.y}
                        r="10"
                        fill={ledColor}
                        opacity="0.4"
                        filter="url(#led-glow)"
                      />
                    </>
                  )}
                  <circle
                    cx={fsPosition.x}
                    cy={fsPosition.y}
                    r="9"
                    fill="url(#footswitch-grad)"
                    stroke="#0a0a0a"
                    strokeWidth="0.5"
                  />
                  <circle
                    cx={fsPosition.x}
                    cy={fsPosition.y}
                    r="6"
                    fill="#2a2a2a"
                    stroke="#1a1a1a"
                    strokeWidth="0.3"
                  />
                  {/* Footswitch label */}
                  {label && (
                    <>
                      {labeledLettering && (
                        <rect
                          x={fsPosition.x - (label.length * 2.5) - 1.2}
                          y={fsPosition.y + 11}
                          width={(label.length * 5) + 2.4}
                          height="9"
                          fill={effectiveLabelBg}
                          rx="0.5"
                        />
                      )}
                      <text
                        x={fsPosition.x}
                        y={fsPosition.y + 18.25}
                        textAnchor="middle"
                        style={{
                          fontSize: labeledLettering ? "8px" : "3px",
                          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                          fontWeight: 600,
                          fill: labeledLettering ? labelTextColor : textColor,
                          textTransform: "uppercase",
                        }}
                      >
                        {label}
                      </text>
                    </>
                  )}
                </g>
                );
              });
            })()}

            {/* Selection highlights */}
            {isEditMode && selectedItems.size > 0 && (() => {
              const highlights: React.ReactNode[] = [];
              selectedItems.forEach(key => {
                const [type, indexStr] = key.split('-');
                const idx = type === 'pedalName' ? 0 : parseInt(indexStr);
                const dataPos = getDataPosition(type, idx);
                if (!dataPos) return;
                const svgPos = { x: dataPos.x, y: -dataPos.y };
                if (type === 'potentiometer') {
                  highlights.push(<circle key={`sel-${key}`} cx={svgPos.x} cy={svgPos.y} r="9" fill="none" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="2 1" opacity="0.9" />);
                } else if (type === 'switch') {
                  highlights.push(<rect key={`sel-${key}`} x={svgPos.x - 10} y={svgPos.y - 10} width="20" height="20" fill="none" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="2 1" rx="2" opacity="0.9" />);
                } else if (type === 'fader') {
                  highlights.push(<rect key={`sel-${key}`} x={svgPos.x - 5} y={svgPos.y - 20} width="10" height="40" fill="none" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="2 1" rx="2" opacity="0.9" />);
                } else if (type === 'led') {
                  highlights.push(<circle key={`sel-${key}`} cx={svgPos.x} cy={svgPos.y} r="5" fill="none" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="2 1" opacity="0.9" />);
                } else if (type === 'footswitch') {
                  highlights.push(<circle key={`sel-${key}`} cx={svgPos.x} cy={svgPos.y} r="9" fill="none" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="2 1" opacity="0.9" />);
                } else if (type === 'pedalName') {
                  highlights.push(<rect key={`sel-${key}`} x={svgPos.x - 20} y={svgPos.y - 6} width="40" height="10" fill="none" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="2 1" rx="2" opacity="0.9" />);
                }
              });
              return highlights;
            })()}

            {/* Snap alignment lines */}
            {snapLines.map((line, i) => (
              <React.Fragment key={`snap-${i}`}>
                {line.x !== undefined && (
                  <line
                    x1={line.x} y1={-viewBoxHeight / 2}
                    x2={line.x} y2={viewBoxHeight / 2}
                    stroke="#22d3ee" strokeWidth="0.4" strokeDasharray="3 2" opacity="0.6"
                  />
                )}
                {line.y !== undefined && (
                  <line
                    x1={-viewBoxWidth / 2} y1={-line.y}
                    x2={viewBoxWidth / 2} y2={-line.y}
                    stroke="#22d3ee" strokeWidth="0.4" strokeDasharray="3 2" opacity="0.6"
                  />
                )}
              </React.Fragment>
            ))}

            {/* Box select rectangle */}
            {isBoxSelecting && boxSelectStart && boxSelectEnd && (
              <rect
                x={Math.min(boxSelectStart.x, boxSelectEnd.x)}
                y={Math.min(boxSelectStart.y, boxSelectEnd.y)}
                width={Math.abs(boxSelectEnd.x - boxSelectStart.x)}
                height={Math.abs(boxSelectEnd.y - boxSelectStart.y)}
                fill="rgba(34, 211, 238, 0.1)"
                stroke="#22d3ee"
                strokeWidth="0.5"
                strokeDasharray="3 2"
              />
            )}
          </g>
        </svg>

        {/* Infobox overlay for selected element */}
        {isMaximized && isEditMode && selectedItemInfo && (
          <div
            style={{
              position: "absolute",
              bottom: "0.5rem",
              right: "0.5rem",
              background: "rgba(15, 15, 15, 0.92)",
              border: "1px solid #22d3ee44",
              borderRadius: "6px",
              padding: "0.4rem 0.7rem",
              fontSize: "0.7rem",
              color: "#ccc",
              pointerEvents: "none",
              minWidth: "100px",
            }}
          >
            {selectedItemInfo.type === 'group' ? (
              <span style={{ color: "#22d3ee" }}>{selectedItemInfo.count} elements selected</span>
            ) : (
              <>
                <div style={{ color: "#22d3ee", fontWeight: 600, marginBottom: "2px" }}>
                  {selectedItemInfo.name}
                </div>
                <div style={{ color: "#888" }}>
                  x: {selectedItemInfo.pos?.x} &nbsp; y: {selectedItemInfo.pos?.y}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Enclosure info footer */}
      {(!compact || isMaximized) && (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "#0a0a0a",
            borderTop: "1px solid #333",
            fontSize: "0.75rem",
            color: "#999",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{layout.enclosure_type}</span>
          <span>
            {layout.dimensions_mm.length}×{layout.dimensions_mm.width}mm
          </span>
        </div>
      )}
    </div>
  );
  
  // Wrap in modal if maximized
  if (isMaximized) {
    return (
      <div
        onClick={onToggleMaximize}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: "2rem",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "900px",
            width: "100%",
          }}
        >
          {visualizerContent}
        </div>
      </div>
    );
  }
  
  return visualizerContent;
}
