"use client";

import * as React from "react";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, Move, Shuffle } from "lucide-react";

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
  controls?: Array<{ label: string; type: string }>;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onLabelChange?: (controlLabel: string, newValue: string) => void;
  onPedalNameChange?: (newValue: string) => void;
  labeledLettering?: boolean;
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
  controls = [],
  isMaximized = false,
  onToggleMaximize,
  onLabelChange,
  onPedalNameChange,
  labeledLettering = false,
}: EnclosureVisualizerProps) {
  console.log('🎲 [Randomize] EnclosureVisualizer rendering, layout ID:', layout.id);
  
  const viewBoxWidth = 140;
  const viewBoxHeight = 160;
  
  const scale = 0.8;
  
  // Calculate text color based on enclosure color
  const textColor = getContrastingTextColor(enclosureColor);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isEditLabelsMode, setIsEditLabelsMode] = React.useState(false);
  const [editingLabel, setEditingLabel] = React.useState<{ type: string; index: number; value: string } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedItem, setDraggedItem] = React.useState<{ type: string; index: number } | null>(null);
  
  // Position overrides for draggable items
  const [positionOverrides, setPositionOverrides] = React.useState<{
    potentiometers: Position[];
    switches: Position[];
    faders: Position[];
    leds: Position[];
    footswitches: Position[];
    pedalName: Position | null;
  }>({
    potentiometers: [],
    switches: [],
    faders: [],
    leds: [],
    footswitches: [],
    pedalName: null,
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
      positionOverrides.pedalName
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
  const getScaledMousePosition = (event: MouseEvent | React.MouseEvent): Position | null => {
    if (!svgRef.current) return null;
    
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    
    const transformed = point.matrixTransform(ctm.inverse());
    return { x: transformed.x / scale, y: transformed.y / scale };
  };
  
  const handleMouseDown = (type: string, index: number) => (event: React.MouseEvent) => {
    if (!isEditMode) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
    setDraggedItem({ type, index });
  };
  
  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging || !draggedItem) return;
    
    const pos = getScaledMousePosition(event);
    if (!pos) return;
    
    // Convert from SVG coordinates (+y=down) to data coordinates (+y=up)
    const dataPos = { x: pos.x, y: -pos.y };
    
    setPositionOverrides(prev => {
      const newOverrides = { ...prev };
      
      if (draggedItem.type === 'potentiometer') {
        const newPots = [...prev.potentiometers];
        newPots[draggedItem.index] = dataPos;
        newOverrides.potentiometers = newPots;
      } else if (draggedItem.type === 'switch') {
        const newSwitches = [...prev.switches];
        newSwitches[draggedItem.index] = dataPos;
        newOverrides.switches = newSwitches;
      } else if (draggedItem.type === 'fader') {
        const newFaders = [...prev.faders];
        newFaders[draggedItem.index] = dataPos;
        newOverrides.faders = newFaders;
      } else if (draggedItem.type === 'led') {
        const newLEDs = [...prev.leds];
        newLEDs[draggedItem.index] = dataPos;
        newOverrides.leds = newLEDs;
      } else if (draggedItem.type === 'footswitch') {
        const newFootswitches = [...prev.footswitches];
        newFootswitches[draggedItem.index] = dataPos;
        newOverrides.footswitches = newFootswitches;
      } else if (draggedItem.type === 'pedalName') {
        newOverrides.pedalName = dataPos;
      }
      
      return newOverrides;
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedItem(null);
  };
  
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, draggedItem]);
  
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
            {onRandomizeLayout && (
              <button
                onClick={onRandomizeLayout}
                style={{
                  background: "transparent",
                  border: "1px solid #333",
                  color: "#fff",
                  cursor: "pointer",
                  padding: "0.25rem 0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#222";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                title="Generate a completely new random layout (feeling lucky?)"
              >
                <Shuffle size={14} />
                <span>Randomize</span>
              </button>
            )}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                background: isEditMode ? "#333" : "transparent",
                border: "1px solid " + (isEditMode ? "#666" : "#333"),
                color: isEditMode ? "#4ade80" : "#fff",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (!isEditMode) e.currentTarget.style.background = "#222";
              }}
              onMouseLeave={(e) => {
                if (!isEditMode) e.currentTarget.style.background = "transparent";
              }}
              title="Toggle edit mode to drag and reposition components"
            >
              <Move size={14} />
              <span>Edit Layout</span>
            </button>
            <button
              onClick={() => setIsEditLabelsMode(!isEditLabelsMode)}
              style={{
                background: isEditLabelsMode ? "#333" : "transparent",
                border: "1px solid " + (isEditLabelsMode ? "#666" : "#333"),
                color: isEditLabelsMode ? "#4ade80" : "#fff",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (!isEditLabelsMode) e.currentTarget.style.background = "#222";
              }}
              onMouseLeave={(e) => {
                if (!isEditLabelsMode) e.currentTarget.style.background = "transparent";
              }}
              title="Toggle edit mode to click and edit label text"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit Labels</span>
            </button>
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
      <div style={{ position: "relative", padding: isMaximized ? "2rem" : "1rem" }}>
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
          style={{
            width: "100%",
            height: "auto",
            maxHeight: isMaximized ? "80vh" : "300px",
            cursor: "default",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
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
          <g transform={`scale(${scale})`}>
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
                style={{ cursor: isEditMode ? 'move' : (isEditLabelsMode ? 'pointer' : 'default') }}
              >
                {editingLabel?.type === 'pedalName' ? (
                  <foreignObject
                    x={getPosition('pedalName', 0, layout.pedal_name_position).x - 30}
                    y={getPosition('pedalName', 0, layout.pedal_name_position).y - 5}
                    width="60"
                    height="10"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={editingLabel.value}
                      onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                      onBlur={() => {
                        if (editingLabel.value.trim() !== '' && onPedalNameChange) {
                          onPedalNameChange(editingLabel.value.trim());
                        }
                        setEditingLabel(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editingLabel.value.trim() !== '' && onPedalNameChange) {
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
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: 'transparent',
                        border: 'none',
                        color: textColor,
                        outline: 'none',
                        padding: '0',
                      }}
                    />
                  </foreignObject>
                ) : (
                  <>
                    {labeledLettering && pedalName && (
                      <rect
                        x={getPosition('pedalName', 0, layout.pedal_name_position).x - (pedalName.length * 2.25) - 1.35}
                        y={getPosition('pedalName', 0, layout.pedal_name_position).y - 6.5}
                        width={(pedalName.length * 4.5) + 2.7}
                        height="10.5"
                        fill="#000"
                        rx="0.5"
                      />
                    )}
                    <text
                      x={getPosition('pedalName', 0, layout.pedal_name_position).x}
                      y={getPosition('pedalName', 0, layout.pedal_name_position).y - 1.25}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontSize: "6px",
                        fontWeight: "bold",
                        fill: labeledLettering ? "#fff" : textColor,
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
                  </>
                )}
              </g>
            )}

            {/* Potentiometers */}
            {layout.potentiometer_positions.map((pos, idx) => {
              const control = controls.filter((c) => c.type === "Pot")[idx];
              const label = control ? controlLabels[control.label] || control.label : `Pot ${idx + 1}`;
              const effectivePos = getPosition('potentiometer', idx, pos);
              
              return (
                <g 
                  key={`pot-${idx}`}
                  onMouseDown={handleMouseDown('potentiometer', idx)}
                  style={{ cursor: isEditMode ? 'move' : 'default' }}
                >
                  {/* Label (rendered first, behind knob) */}
                  {editingLabel?.type === 'potentiometer' && editingLabel?.index === idx ? (
                    <foreignObject
                      x={effectivePos.x + pos.label_offset.x - 15}
                      y={effectivePos.y - pos.label_offset.y - 4}
                      width="30"
                      height="8"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={editingLabel.value}
                        onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                        onBlur={() => {
                          if (editingLabel.value.trim() !== '' && onLabelChange && control) {
                            onLabelChange(control.label, editingLabel.value.trim());
                          }
                          setEditingLabel(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingLabel.value.trim() !== '' && onLabelChange && control) {
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
                          fontSize: '3.5px',
                          fontWeight: 600,
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          background: 'transparent',
                          border: 'none',
                          color: textColor,
                          outline: 'none',
                          padding: '0',
                        }}
                      />
                    </foreignObject>
                  ) : (
                    <>
                      {labeledLettering && (
                        <rect
                          x={effectivePos.x + pos.label_offset.x - (label.length * 2.5) - 1.2}
                          y={effectivePos.y - pos.label_offset.y - 8}
                          width={(label.length * 5) + 2.4}
                          height="10.5"
                          fill="#000"
                          rx="0.5"
                        />
                      )}
                      <text
                        x={effectivePos.x + pos.label_offset.x}
                        y={effectivePos.y - pos.label_offset.y}
                        textAnchor="middle"
                        style={{
                          fontSize: labeledLettering ? "8px" : "3.5px",
                          fontWeight: 600,
                          fill: labeledLettering ? "#fff" : textColor,
                          textTransform: "uppercase",
                          pointerEvents: isEditLabelsMode ? 'auto' : 'none',
                          cursor: isEditLabelsMode ? 'pointer' : 'default',
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
                  )}
                  {/* Knob shadow */}
                  <circle cx={effectivePos.x} cy={effectivePos.y + 0.75} r="8.25" fill="#000" opacity="0.3" />
                  {/* Knob body */}
                  <circle cx={effectivePos.x} cy={effectivePos.y} r="7.5" fill="url(#metal-knob)" stroke="#2a2a2a" strokeWidth="0.3" />
                  {/* Knob indicator line */}
                  <line
                    x1={effectivePos.x}
                    y1={effectivePos.y - 6}
                    x2={effectivePos.x}
                    y2={effectivePos.y - 1.5}
                    stroke="#fff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {/* Switches */}
            {layout.switch_positions.map((pos, idx) => {
              const control = controls.filter((c) => c.type === "Switch" && c.label !== "Bypass")[idx];
              const label = control ? controlLabels[control.label] || control.label : `SW ${idx + 1}`;
              const effectivePos = getPosition('switch', idx, pos);
              
              return (
                <g 
                  key={`switch-${idx}`}
                  onMouseDown={handleMouseDown('switch', idx)}
                  style={{ cursor: isEditMode ? 'move' : 'default' }}
                >
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
                    <foreignObject
                      x={effectivePos.x + pos.label_offset.x - 12}
                      y={effectivePos.y - pos.label_offset.y - 3.5}
                      width="24"
                      height="7"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={editingLabel.value}
                        onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                        onBlur={() => {
                          if (editingLabel.value.trim() !== '' && onLabelChange && control) {
                            onLabelChange(control.label, editingLabel.value.trim());
                          }
                          setEditingLabel(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingLabel.value.trim() !== '' && onLabelChange && control) {
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
                          fontSize: '3px',
                          fontWeight: 600,
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          background: 'transparent',
                          border: 'none',
                          color: textColor,
                          outline: 'none',
                          padding: '0',
                        }}
                      />
                    </foreignObject>
                  ) : (
                    <>
                      {labeledLettering && (
                        <rect
                          x={effectivePos.x + pos.label_offset.x - (label.length * 2) - 1.2}
                          y={effectivePos.y - pos.label_offset.y - 7.5}
                          width={(label.length * 4) + 2.4}
                          height="10.5"
                          fill="#000"
                          rx="0.5"
                        />
                      )}
                      <text
                        x={effectivePos.x + pos.label_offset.x}
                        y={effectivePos.y - pos.label_offset.y}
                        textAnchor="middle"
                        style={{
                          fontSize: labeledLettering ? "8px" : "3px",
                          fontWeight: 600,
                          fill: labeledLettering ? "#fff" : textColor,
                          textTransform: "uppercase",
                          pointerEvents: isEditLabelsMode ? 'auto' : 'none',
                          cursor: isEditLabelsMode ? 'pointer' : 'default',
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
                  )}
                </g>
              );
            })}

            {/* Faders */}
            {(() => {
              console.log('🎚️ [EnclosureVisualizer] Rendering faders:', {
                layoutFaderPositions: layout.fader_positions?.length || 0,
                faderPositionsData: layout.fader_positions,
                controlsFaders: controls.filter(c => c.type === 'Fader').map(c => c.label)
              });
              
              return layout.fader_positions?.map((pos, idx) => {
                const control = controls.filter((c) => c.type === "Fader")[idx];
                const label = control ? controlLabels[control.label] || control.label : `Fader ${idx + 1}`;
                const effectivePos = getPosition('fader', idx, pos);
                
                return (
                <g 
                  key={`fader-${idx}`}
                  onMouseDown={handleMouseDown('fader', idx)}
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
                    <foreignObject
                      x={effectivePos.x + pos.label_offset.x - 15}
                      y={effectivePos.y - pos.label_offset.y - 4}
                      width="30"
                      height="8"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={editingLabel.value}
                        onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                        onBlur={() => {
                          if (editingLabel.value.trim() !== '' && onLabelChange && control) {
                            onLabelChange(control.label, editingLabel.value.trim());
                          }
                          setEditingLabel(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingLabel.value.trim() !== '' && onLabelChange && control) {
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
                          fontSize: '3.5px',
                          fontWeight: 600,
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          background: 'transparent',
                          border: 'none',
                          color: textColor,
                          outline: 'none',
                          padding: '0',
                        }}
                      />
                    </foreignObject>
                  ) : (
                    <>
                      {labeledLettering && (
                        <rect
                          x={effectivePos.x + pos.label_offset.x - (label.length * 2.5) - 1.2}
                          y={effectivePos.y - pos.label_offset.y - 8}
                          width={(label.length * 5) + 2.4}
                          height="10.5"
                          fill="#000"
                          rx="0.5"
                        />
                      )}
                      <text
                        x={effectivePos.x + pos.label_offset.x}
                        y={effectivePos.y - pos.label_offset.y}
                        textAnchor="middle"
                        style={{
                          fontSize: labeledLettering ? "8px" : "3.5px",
                          fontWeight: 600,
                          fill: labeledLettering ? "#fff" : textColor,
                          textTransform: "uppercase",
                          pointerEvents: isEditLabelsMode ? 'auto' : 'none',
                          cursor: isEditLabelsMode ? 'pointer' : 'default',
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
                  )}
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
              return footswitchPositions.map((fsPos, index) => (
                <g 
                  key={`footswitch-${index}`}
                  onMouseDown={handleMouseDown('footswitch', index)}
                  style={{ cursor: isEditMode ? 'move' : 'default' }}
                >
                  {ledType === "Illuminated Footswitch" && (
                    <>
                      {/* Blurred colored ring behind footswitch */}
                      <circle
                        cx={getPosition('footswitch', index, fsPos).x}
                        cy={getPosition('footswitch', index, fsPos).y}
                        r="12"
                        fill={ledColor}
                        opacity="0.6"
                        filter="url(#led-glow)"
                      />
                      <circle
                        cx={getPosition('footswitch', index, fsPos).x}
                        cy={getPosition('footswitch', index, fsPos).y}
                        r="10"
                        fill={ledColor}
                        opacity="0.4"
                        filter="url(#led-glow)"
                      />
                    </>
                  )}
                  <circle
                    cx={getPosition('footswitch', index, fsPos).x}
                    cy={getPosition('footswitch', index, fsPos).y}
                    r="9"
                    fill="url(#footswitch-grad)"
                    stroke="#0a0a0a"
                    strokeWidth="0.5"
                  />
                  <circle
                    cx={getPosition('footswitch', index, fsPos).x}
                    cy={getPosition('footswitch', index, fsPos).y}
                    r="6"
                    fill="#2a2a2a"
                    stroke="#1a1a1a"
                    strokeWidth="0.3"
                  />
                </g>
              ));
            })()}
          </g>
        </svg>
      </div>

      {/* Enclosure info footer */}
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
