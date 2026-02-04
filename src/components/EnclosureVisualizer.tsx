"use client";

import * as React from "react";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from "lucide-react";

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
  footswitch_position: Position;
  led_position: Position;
  input_jack_position: Position;
  output_jack_position: Position;
  pedal_name_position: Position;
};

type EnclosureVisualizerProps = {
  layout: LayoutData;
  availableLayouts?: LayoutData[];
  onLayoutChange?: (layout: LayoutData) => void;
  enclosureColor?: string;
  finishType?: string;
  ledColor?: string;
  pedalName?: string;
  controlLabels?: Record<string, string>;
  controls?: Array<{ label: string; type: string }>;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
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

export function EnclosureVisualizer({
  layout,
  availableLayouts = [],
  onLayoutChange,
  enclosureColor = "#808080",
  finishType,
  ledColor = "#ff0000",
  pedalName = "Custom Pedal",
  controlLabels = {},
  controls = [],
  isMaximized = false,
  onToggleMaximize,
}: EnclosureVisualizerProps) {
  const viewBoxWidth = 140;
  const viewBoxHeight = 160;
  
  const scale = 0.8;
  
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
          viewBox={`${-viewBoxWidth / 2} ${-viewBoxHeight / 2} ${viewBoxWidth} ${viewBoxHeight}`}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: isMaximized ? "80vh" : "300px",
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
            <text
              x={layout.pedal_name_position.x}
              y={layout.pedal_name_position.y}
              textAnchor="middle"
              style={{
                fontSize: "6px",
                fontWeight: "bold",
                fill: "#fff",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {pedalName}
            </text>

            {/* Potentiometers */}
            {layout.potentiometer_positions.map((pos, idx) => {
              const control = controls.filter((c) => c.type === "Pot")[idx];
              const label = control ? controlLabels[control.label] || control.label : `Pot ${idx + 1}`;
              
              return (
                <g key={`pot-${idx}`}>
                  {/* Knob shadow */}
                  <circle cx={pos.x} cy={pos.y + 0.5} r="5.5" fill="#000" opacity="0.3" />
                  {/* Knob body */}
                  <circle cx={pos.x} cy={pos.y} r="5" fill="url(#metal-knob)" stroke="#2a2a2a" strokeWidth="0.3" />
                  {/* Knob indicator line */}
                  <line
                    x1={pos.x}
                    y1={pos.y - 4}
                    x2={pos.x}
                    y2={pos.y - 1}
                    stroke="#fff"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                  />
                  {/* Label */}
                  <text
                    x={pos.x + pos.label_offset.x}
                    y={pos.y + pos.label_offset.y}
                    textAnchor="middle"
                    style={{
                      fontSize: "3.5px",
                      fontWeight: 600,
                      fill: "#fff",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Switches */}
            {layout.switch_positions.map((pos, idx) => {
              const control = controls.filter((c) => c.type === "Switch" && c.label !== "Bypass")[idx];
              const label = control ? controlLabels[control.label] || control.label : `SW ${idx + 1}`;
              
              return (
                <g key={`switch-${idx}`}>
                  {/* Switch base */}
                  <rect
                    x={pos.x - 2.5}
                    y={pos.y - 4}
                    width="5"
                    height="8"
                    fill="#2a2a2a"
                    stroke="#1a1a1a"
                    strokeWidth="0.3"
                    rx="1"
                  />
                  {/* Switch toggle */}
                  <rect
                    x={pos.x - 1.5}
                    y={pos.y - 2}
                    width="3"
                    height="4"
                    fill="url(#metal-knob)"
                    stroke="#1a1a1a"
                    strokeWidth="0.2"
                    rx="0.5"
                  />
                  {/* Label */}
                  <text
                    x={pos.x + pos.label_offset.x}
                    y={pos.y + pos.label_offset.y}
                    textAnchor="middle"
                    style={{
                      fontSize: "3px",
                      fontWeight: 600,
                      fill: "#fff",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Faders */}
            {layout.fader_positions.map((pos, idx) => {
              const control = controls.filter((c) => c.type === "Fader")[idx];
              const label = control ? controlLabels[control.label] || control.label : `Fader ${idx + 1}`;
              
              return (
                <g key={`fader-${idx}`}>
                  {/* Fader track */}
                  <rect
                    x={pos.x - 1}
                    y={pos.y - 10}
                    width="2"
                    height="20"
                    fill="#1a1a1a"
                    stroke="#000"
                    strokeWidth="0.3"
                    rx="1"
                  />
                  {/* Fader handle */}
                  <rect
                    x={pos.x - 2.5}
                    y={pos.y - 2}
                    width="5"
                    height="4"
                    fill="url(#metal-knob)"
                    stroke="#1a1a1a"
                    strokeWidth="0.3"
                    rx="0.5"
                  />
                  {/* Label */}
                  <text
                    x={pos.x + pos.label_offset.x}
                    y={pos.y + pos.label_offset.y}
                    textAnchor="middle"
                    style={{
                      fontSize: "3.5px",
                      fontWeight: 600,
                      fill: "#fff",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* LED with glow */}
            <g>
              <circle
                cx={layout.led_position.x}
                cy={layout.led_position.y}
                r="2.5"
                fill={ledColor}
                filter="url(#led-glow)"
                opacity="0.9"
              />
              <circle
                cx={layout.led_position.x}
                cy={layout.led_position.y}
                r="1.5"
                fill="#fff"
                opacity="0.6"
              />
            </g>

            {/* Footswitch */}
            <g>
              <circle
                cx={layout.footswitch_position.x}
                cy={layout.footswitch_position.y}
                r="9"
                fill="url(#footswitch-grad)"
                stroke="#0a0a0a"
                strokeWidth="0.5"
              />
              <circle
                cx={layout.footswitch_position.x}
                cy={layout.footswitch_position.y}
                r="6"
                fill="#2a2a2a"
                stroke="#1a1a1a"
                strokeWidth="0.3"
              />
            </g>

            {/* Input Jack */}
            <g>
              <rect
                x={layout.input_jack_position.x - 2}
                y={layout.input_jack_position.y - 5}
                width="4"
                height="10"
                fill="#888"
                stroke="#555"
                strokeWidth="0.5"
                rx="0.5"
              />
              <text
                x={layout.input_jack_position.x}
                y={layout.input_jack_position.y + 11}
                textAnchor="middle"
                style={{
                  fontSize: "3px",
                  fontWeight: 600,
                  fill: "#fff",
                }}
              >
                IN
              </text>
            </g>

            {/* Output Jack */}
            <g>
              <rect
                x={layout.output_jack_position.x - 2}
                y={layout.output_jack_position.y - 5}
                width="4"
                height="10"
                fill="#888"
                stroke="#555"
                strokeWidth="0.5"
                rx="0.5"
              />
              <text
                x={layout.output_jack_position.x}
                y={layout.output_jack_position.y + 11}
                textAnchor="middle"
                style={{
                  fontSize: "3px",
                  fontWeight: 600,
                  fill: "#fff",
                }}
              >
                OUT
              </text>
            </g>
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
