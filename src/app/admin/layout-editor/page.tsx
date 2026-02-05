"use client";

import * as React from "react";
import { EnclosureVisualizer } from "@/components/EnclosureVisualizer";
import { ChevronLeft, Save, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

type Position = { x: number; y: number };
type PositionWithLabel = Position & { label_offset: Position };

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
  footswitch_position?: Position;
  footswitch_positions?: Position[];
  led_position?: Position;
  led_positions?: Position[];
  input_jack_position: Position;
  output_jack_position: Position;
  pedal_name_position: Position;
};

export default function LayoutEditorPage() {
  const [layouts, setLayouts] = React.useState<LayoutData[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = React.useState<string>("");
  const [editedLayout, setEditedLayout] = React.useState<LayoutData | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "success" | "error">("idle");
  const [filterEnclosureType, setFilterEnclosureType] = React.useState<string>("");
  const [filterPotCount, setFilterPotCount] = React.useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load layouts on mount
  React.useEffect(() => {
    fetch("/api/admin/layouts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLayouts(data.layouts);
          if (data.layouts.length > 0) {
            setSelectedLayoutId(data.layouts[0].id);
            setEditedLayout(JSON.parse(JSON.stringify(data.layouts[0])));
          }
        }
      })
      .catch(console.error);
  }, []);

  // Update edited layout when selection changes
  React.useEffect(() => {
    if (selectedLayoutId) {
      const layout = layouts.find((l) => l.id === selectedLayoutId);
      if (layout) {
        setHasUnsavedChanges(false);
      }
    }
  }, [selectedLayoutId, layouts]);

  // Auto-save when editedLayout changes (with debounce)
  React.useEffect(() => {
    if (!editedLayout || !hasUnsavedChanges) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (500ms debounce)
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editedLayout, hasUnsavedChange
    }
  }, [selectedLayoutId, layouts]);

  const handleSave = async () => {
    if (!editedLayout) return;

    // Normalize footswitch and LED positions before saving
    const layoutToSave = JSON.parse(JSON.stringify(editedLayout));
    
    // Convert footswitch_positions array to singular if only one
    if (layoutToSave.footswitch_positions && layoutToSave.footswitch_positions.length === 1) {
      layoutToSave.footswitch_position = layoutToSave.footswitch_positions[0];
      delete layoutToSave.footswitch_positions;
    } else if (layoutToSave.footswitch_positions && layoutToSave.footswitch_positions.length === 0) {
      delete layoutToSave.footswitch_positions;
    }setHasUnsavedChanges(false);
        
    
    // Convert led_positions array to singular if only one
    if (layoutToSave.led_positions && layoutToSave.led_positions.length === 1) {
      layoutToSave.led_position = layoutToSave.led_positions[0];
      delete layoutToSave.led_positions;
    } else if (layoutToSave.led_positions && layoutToSave.led_positions.length === 0) {
      delete layoutToSave.led_positions;
    }

    setSaveStatus("saving");
    try {
      const response = await fetch("/api/admin/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutId: layoutToSave.id,
          updatedLayout: layoutToSave,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSaveStatus("success");
        // Update local layouts array
        setLayouts((prev) =>
          prev.map((l) => (l.id === layoutToSave.id ? layoutToSave : l))
        );
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const updatePosition = (path: string[], value: number) => {
    if (!editedLayout) return;

    const newLayout = JSON.parse(JSON.stringify(editedLayout));
    let current: any = newLayout;

    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) {
        console.error(`Path ${path[i]} is undefined in`, current);
        return;
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;

    setEditedLayout(newLayout);
  };

  const addPosition = (type: "potentiometer" | "switch" | "fader" | "footswitch" | "led") => {
    if (!editedLayout) return;

    const newLayout = JSON.parse(JSON.stringify(editedLayout));

    switch (type) {
      case "potentiometer":
        newLayout.potentiometer_positions.push({ x: 0, y: 0, label_offset: { x: 0, y: 15 } });
        newLayout.potentiometer_count++;
        break;
      case "switch":
    setHasUnsavedChanges(true);
        newLayout.switch_positions.push({ x: 0, y: 0, label_offset: { x: 0, y: 15 } });
        newLayout.switch_count++;
        break;
      case "fader":
        newLayout.fader_positions.push({ x: 0, y: 0, label_offset: { x: 0, y: 15 } });
        newLayout.fader_count++;
        break;
      case "footswitch":
        if (!newLayout.footswitch_positions) {
          newLayout.footswitch_positions = [];
        }
        newLayout.footswitch_positions.push({ x: 0, y: 0 });
        delete newLayout.footswitch_position;
        break;
      case "led":
        if (!newLayout.led_positions) {
          newLayout.led_positions = [];
        }
        newLayout.led_positions.push({ x: 0, y: 0 });
        delete newLayout.led_position;
        break;
    }

    setEditedLayout(newLayout);
  };

  const removePosition = (type: "potentiometer" | "switch" | "fader" | "footswitch" | "led", index: number) => {
    if (!editedLayout) return;

    const newLayout = JSON.parse(JSON.stringify(editedLayout));

    switch (type) {
      case "potentiometer":
        newLayout.potentiometer_positions.splice(index, 1);
        newLayout.potentiometer_count = newLayout.potentiometer_positions.length;
        break;
      case "switch":
        newLayout.switch_positions.splice(index, 1);
    setHasUnsavedChanges(true);
        newLayout.switch_count = newLayout.switch_positions.length;
        break;
      case "fader":
        newLayout.fader_positions.splice(index, 1);
        newLayout.fader_count = newLayout.fader_positions.length;
        break;
      case "footswitch":
        if (newLayout.footswitch_positions) {
          newLayout.footswitch_positions.splice(index, 1);
          if (newLayout.footswitch_positions.length === 0) {
            delete newLayout.footswitch_positions;
          }
        }
        break;
      case "led":
        if (newLayout.led_positions) {
          newLayout.led_positions.splice(index, 1);
          if (newLayout.led_positions.length === 0) {
            delete newLayout.led_positions;
          }
        }
        break;
    }

    setEditedLayout(newLayout);
  };

  const enclosureTypes = Array.from(new Set(layouts.map((l) => l.enclosure_type))).sort();
  const filteredLayouts = layouts.filter((l) => {
    if (filterEnclosureType && l.enclosure_type !== filterEnclosureType) return false;
    if (filterPotCount && l.potentiometer_count !== parseInt(filterPotCount)) return false;
    return true;
  });

  if (!editedLayout) {
    return (
      <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#e0e0e0", padding: "2rem" }}>
        <p>Loading...</p>
      </ddiv style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "0.9rem", color: "#aaa" }}>
            {saveStatus === "success" ? (
              <span style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle size={16} /> Auto-saved
              </span>
            ) : saveStatus === "saving" ? (
              <span style={{ color: "#3b82f6" }}>Saving...</span>
            ) : saveStatus === "error" ? (
              <span style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} /> Save failed
              </span>
            ) : hasUnsavedChanges ? (
              <span style={{ color: "#fbbf24" }}>Unsaved changes</span>
            ) : (
              <span style={{ color: "#666" }}>All changes saved</span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            style={{
              padding: "0.75rem 1.5rem",
              background: saveStatus === "success" ? "#22c55e" : saveStatus === "error" ? "#ef4444" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: saveStatus === "saving" ? "wait" : "pointer",
              fontSize: "1rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s",
              opacity: saveStatus === "saving" ? 0.7 : 1,
            }}
          >
            <Save size={20} /> {saveStatus === "saving" ? "Saving..." : "Save Now"}
          </button>
        </divground: saveStatus === "success" ? "#22c55e" : saveStatus === "error" ? "#ef4444" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: saveStatus === "saving" ? "wait" : "pointer",
            fontSize: "1rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
          }}
        >
          {saveStatus === "success" ? (
            <>
              <CheckCircle size={20} /> Saved!
            </>
          ) : saveStatus === "error" ? (
            <>
              <AlertCircle size={20} /> Error
            </>
          ) : (
            <>
              <Save size={20} /> {saveStatus === "saving" ? "Saving..." : "Save Changes"}
            </>
          )}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 400px", gap: "1rem", padding: "1rem" }}>
        {/* Left: Layout Selector */}
        <div style={{ background: "#1a1a1a", padding: "1rem", borderRadius: "8px", height: "calc(100vh - 100px)", overflowY: "auto" }}>
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>Layouts</h2>
          
          {/* Filters */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#aaa" }}>
              Enclosure Type
            </label>
            <select
              value={filterEnclosureType}
              onChange={(e) => setFilterEnclosureType(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                background: "#0a0a0a",
                border: "1px solid #333",
                borderRadius: "4px",
                color: "#e0e0e0",
                marginBottom: "0.5rem",
              }}
            >
              <option value="">All Types</option>
              {enclosureTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#aaa" }}>
              Pot Count
            </label>
            <input
              type="number"
              value={filterPotCount}
              onChange={(e) => setFilterPotCount(e.target.value)}
              placeholder="Any"
              style={{
                width: "100%",
                padding: "0.5rem",
                background: "#0a0a0a",
                border: "1px solid #333",
                borderRadius: "4px",
                color: "#e0e0e0",
              }}
            />
          </div>

          <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>
            {filteredLayouts.length} layouts
          </div>

          {filteredLayouts.map((layout) => (
            <div
              key={layout.id}
              onClick={() => setSelectedLayoutId(layout.id)}
              style={{
                padding: "0.75rem",
                background: selectedLayoutId === layout.id ? "#3b82f6" : "#0a0a0a",
                borderRadius: "6px",
                marginBottom: "0.5rem",
                cursor: "pointer",
                border: `1px solid ${selectedLayoutId === layout.id ? "#3b82f6" : "#333"}`,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{layout.id}</div>
              <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
                {layout.enclosure_type} | {layout.potentiometer_count}P {layout.switch_count}S {layout.fader_count}F
              </div>
            </div>
          ))}
        </div>

        {/* Center: Visualizer */}
        <div style={{ background: "#1a1a1a", padding: "2rem", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: "scale(1.5)", transformOrigin: "center" }}>
            <EnclosureVisualizer
              layout={editedLayout}
              enclosureColor="#808080"
              ledColor="#ff0000"
              pedalName="Preview"
              controlLabels={{}}
            />
          </div>
        </div>

        {/* Right: Position Editor */}
        <div style={{ background: "#1a1a1a", padding: "1rem", borderRadius: "8px", height: "calc(100vh - 100px)", overflowY: "auto" }}>
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>Edit Positions</h2>

          {/* Basic Info */}
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#0a0a0a", borderRadius: "6px" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{editedLayout.id}</div>
            <div style={{ fontSize: "0.85rem", color: "#aaa" }}>
              Type: {editedLayout.enclosure_type} | Dimensions: {editedLayout.dimensions_mm.width}×
              {editedLayout.dimensions_mm.length}mm
            </div>
          </div>

          {/* Potentiometers */}
          <PositionSection
            title="Potentiometers"
            positions={editedLayout.potentiometer_positions}
            type="potentiometer"
            hasLabelOffset
            onUpdate={updatePosition}
            onAdd={() => addPosition("potentiometer")}
            onRemove={(i) => removePosition("potentiometer", i)}
          />

          {/* Switches */}
          <PositionSection
            title="Switches"
            positions={editedLayout.switch_positions}
            type="switch"
            hasLabelOffset
            onUpdate={updatePosition}
            onAdd={() => addPosition("switch")}
            onRemove={(i) => removePosition("switch", i)}
          />

          {/* Faders */}
          <PositionSection
            title="Faders"
            positions={editedLayout.fader_positions}
            type="fader"
            hasLabelOffset
            onUpdate={updatePosition}
            onAdd={() => addPosition("fader")}
            onRemove={(i) => removePosition("fader", i)}
          />

          {/* Footswitches */}
          <PositionSection
            title="Footswitches"
              setHasUnsavedChanges(true);
            }}
            onAdd={() => addPosition("footswitch")}
            onRemove={(i) => removePosition("footswitch", i)}
          />

          {/* LEDs */}
          <PositionSection
            title="LEDs"
            positions={editedLayout.led_positions || (editedLayout.led_position ? [editedLayout.led_position] : [])}
            type="led"
            hasLabelOffset={false}
            onUpdate={(path, value) => {
              // Special handling for LEDs - convert to array format if needed
              if (!editedLayout) return;
              const newLayout = JSON.parse(JSON.stringify(editedLayout));
              
              // Ensure we're working with led_positions array
              if (!newLayout.led_positions) {
                if (newLayout.led_position) {
                  newLayout.led_positions = [newLayout.led_position];
                  delete newLayout.led_position;
                } else {
                  newLayout.led_positions = [{ x: 0, y: 0 }];
                }
              }
              
              const index = parseInt(path[1]);
              if (path[2] === "x") {
                newLayout.led_positions[index].x = value;
              } else if (path[2] === "y") {
                newLayout.led_positions[index].y = value;
              }
              
              setEditedLayout(newLayout);
              setHasUnsavedChanges(true
            positions={editedLayout.led_positions || (editedLayout.led_position ? [editedLayout.led_position] : [])}
            type="led"
            hasLabelOffset={false}
            onUpdate={(path, value) => {
              // Special handling for LEDs - convert to array format if needed
              if (!editedLayout) return;
              const newLayout = JSON.parse(JSON.stringify(editedLayout));
              
              // Ensure we're working with led_positions array
              if (!newLayout.led_positions) {
                if (newLayout.led_position) {
                  newLayout.led_positions = [newLayout.led_position];
                  delete newLayout.led_position;
                } else {
                  newLayout.led_positions = [{ x: 0, y: 0 }];
                }
              }
              
              const index = parseInt(path[1]);
              if (path[2] === "x") {
                newLayout.led_positions[index].x = value;
              } else if (path[2] === "y") {
                newLayout.led_positions[index].y = value;
              }
              
              setEditedLayout(newLayout);
            }}
            onAdd={() => addPosition("led")}
            onRemove={(i) => removePosition("led", i)}
          />

          {/* Jacks */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#aaa" }}>Input Jack</h3>
            <PositionInputs
              position={editedLayout.input_jack_position}
              path={["input_jack_position"]}
              onUpdate={updatePosition}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#aaa" }}>Output Jack</h3>
            <PositionInputs
              position={editedLayout.output_jack_position}
              path={["output_jack_position"]}
              onUpdate={updatePosition}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#aaa" }}>Pedal Name Position</h3>
            <PositionInputs
              position={editedLayout.pedal_name_position}
              path={["pedal_name_position"]}
              onUpdate={updatePosition}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PositionSection({
  title,
  positions,
  type,
  hasLabelOffset,
  onUpdate,
  onAdd,
  onRemove,
}: {
  title: string;
  positions: any[];
  type: string;
  hasLabelOffset: boolean;
  onUpdate: (path: string[], value: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", color: "#aaa" }}>
          {title} ({positions.length})
        </h3>
        <button
          onClick={onAdd}
          style={{
            padding: "0.25rem 0.75rem",
            background: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          + Add
        </button>
      </div>
      {positions.map((pos, i) => (
        <div key={i} style={{ marginBottom: "1rem", padding: "0.75rem", background: "#0a0a0a", borderRadius: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>#{i + 1}</span>
            <button
              onClick={() => onRemove(i)}
              style={{
                padding: "0.25rem 0.5rem",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              Remove
            </button>
          </div>
          <PositionInputs position={pos} path={[`${type}_positions`, i.toString()]} onUpdate={onUpdate} />
          {hasLabelOffset && pos.label_offset && (
            <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #333" }}>
              <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>Label Offset</div>
              <PositionInputs position={pos.label_offset} path={[`${type}_positions`, i.toString(), "label_offset"]} onUpdate={onUpdate} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PositionInputs({ position, path, onUpdate }: { position: Position; path: string[]; onUpdate: (path: string[], value: number) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
      <div>
        <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem", color: "#666" }}>X</label>
        <input
          type="number"
          value={position.x}
          onChange={(e) => onUpdate([...path, "x"], parseFloat(e.target.value) || 0)}
          style={{
            width: "100%",
            padding: "0.5rem",
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "#e0e0e0",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem", color: "#666" }}>Y</label>
        <input
          type="number"
          value={position.y}
          onChange={(e) => onUpdate([...path, "y"], parseFloat(e.target.value) || 0)}
          style={{
            width: "100%",
            padding: "0.5rem",
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "#e0e0e0",
          }}
        />
      </div>
    </div>
  );
}
