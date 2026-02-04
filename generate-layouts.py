#!/usr/bin/env python3
"""
Generate additional enclosure layouts with dual footswitches for 125B, 1590BB, and 1590BS
"""

import json

# Load existing layouts
with open('data/enclosure_layouts.json', 'r') as f:
    layouts = json.load(f)

# Track IDs we have
existing_ids = {layout['id'] for layout in layouts}

def create_dual_footswitch_layout(base_layout, new_enclosure_type=None):
    """Create a layout with 2 footswitches and 2 LEDs from a single footswitch layout"""
    new_layout = json.loads(json.dumps(base_layout))  # Deep copy
    
    # Update enclosure type if specified
    if new_enclosure_type:
        new_layout['enclosure_type'] = new_enclosure_type
        new_layout['id'] = new_layout['id'].replace(base_layout['enclosure_type'], new_enclosure_type)
        
        # Scale dimensions
        scale_factor = 1.0
        if new_enclosure_type == '1590BB':
            scale_factor = 95 / 67  # 1590BB is wider than 125B
        elif new_enclosure_type == '1590BS':
            scale_factor = 119 / 67  # 1590BS is even wider
        
        # Scale positions
        for pot in new_layout.get('potentiometer_positions', []):
            pot['x'] = int(pot['x'] * scale_factor)
        for sw in new_layout.get('switch_positions', []):
            sw['x'] = int(sw['x'] * scale_factor)
        for fader in new_layout.get('fader_positions', []):
            fader['x'] = int(fader['x'] * scale_factor)
            
        # Update dimensions
        if new_enclosure_type == '1590BB':
            new_layout['dimensions_mm'] = {"width": 95, "length": 119}
        elif new_enclosure_type == '1590BS':
            new_layout['dimensions_mm'] = {"width": 119, "length": 94}
    
    # Add -2fs suffix to ID
    if '-2fs' not in new_layout['id']:
        new_layout['id'] += '-2fs'
    
    # Create two footswitch positions
    fs_x_offset = 15  # 15mm apart horizontally
    fs_y = new_layout['footswitch_position']['y']
    
    new_layout['footswitch_positions'] = [
        {"x": -fs_x_offset, "y": fs_y},
        {"x": fs_x_offset, "y": fs_y}
    ]
    del new_layout['footswitch_position']
    
    # Create two LED positions
    led_y = new_layout['led_position']['y']
    new_layout['led_positions'] = [
        {"x": -fs_x_offset, "y": led_y},
        {"x": fs_x_offset, "y": led_y}
    ]
    del new_layout['led_position']
    
    # Update input/output jack positions if needed
    if new_enclosure_type == '1590BB':
        new_layout['input_jack_position']['x'] = 44
        new_layout['output_jack_position']['x'] = -44
    elif new_enclosure_type == '1590BS':
        new_layout['input_jack_position']['x'] = 56
        new_layout['output_jack_position']['x'] = -56
    
    return new_layout

def create_triple_footswitch_layout(base_layout, new_enclosure_type='1590BS'):
    """Create a layout with 3 footswitches and 3 LEDs"""
    new_layout = json.loads(json.dumps(base_layout))
    
    # Update enclosure type
    new_layout['enclosure_type'] = new_enclosure_type
    new_layout['id'] = new_layout['id'].replace(base_layout['enclosure_type'], new_enclosure_type) + '-3fs'
    
    # Scale for 1590BS
    scale_factor = 119 / 67
    for pot in new_layout.get('potentiometer_positions', []):
        pot['x'] = int(pot['x'] * scale_factor)
    for sw in new_layout.get('switch_positions', []):
        sw['x'] = int(sw['x'] * scale_factor)
    
    new_layout['dimensions_mm'] = {"width": 119, "length": 94}
    
    # Create three footswitch positions
    fs_x_offset = 22  # 22mm between switches
    fs_y = new_layout['footswitch_position']['y']
    
    new_layout['footswitch_positions'] = [
        {"x": -fs_x_offset, "y": fs_y},
        {"x": 0, "y": fs_y},
        {"x": fs_x_offset, "y": fs_y}
    ]
    del new_layout['footswitch_position']
    
    # Create three LED positions
    led_y = new_layout['led_position']['y']
    new_layout['led_positions'] = [
        {"x": -fs_x_offset, "y": led_y},
        {"x": 0, "y": led_y},
        {"x": fs_x_offset, "y": led_y}
    ]
    del new_layout['led_position']
    
    # Update jacks
    new_layout['input_jack_position']['x'] = 56
    new_layout['output_jack_position']['x'] = -56
    
    return new_layout

# Generate new layouts
new_layouts = []

# Get all 125B single-footswitch layouts
single_fs_125b = [l for l in layouts if l['enclosure_type'] == '125B' and 'footswitch_position' in l]

print(f"Found {len(single_fs_125b)} 125B layouts to duplicate")

# Create dual-footswitch versions for 125B
for base in single_fs_125b:
    if '-2fs' not in base['id']:  # Don't duplicate if already dual
        new_layout = create_dual_footswitch_layout(base)
        if new_layout['id'] not in existing_ids:
            new_layouts.append(new_layout)
            existing_ids.add(new_layout['id'])
            print(f"Created: {new_layout['id']}")

# Create scaled versions for 1590BB (with single and dual footswitches)
for base in single_fs_125b:
    # Single footswitch 1590BB version
    scaled = json.loads(json.dumps(base))
    scaled['enclosure_type'] = '1590BB'
    scaled['id'] = base['id'].replace('125B', '1590BB')
    scaled['dimensions_mm'] = {"width": 95, "length": 119}
    
    scale_factor = 95 / 67
    for pot in scaled.get('potentiometer_positions', []):
        pot['x'] = int(pot['x'] * scale_factor)
    for sw in scaled.get('switch_positions', []):
        sw['x'] = int(sw['x'] * scale_factor)
    
    scaled['input_jack_position']['x'] = int(scaled['input_jack_position']['x'] * scale_factor)
    scaled['output_jack_position']['x'] = int(scaled['output_jack_position']['x'] * scale_factor)
    
    if scaled['id'] not in existing_ids:
        new_layouts.append(scaled)
        existing_ids.add(scaled['id'])
        print(f"Created: {scaled['id']}")
    
    # Dual footswitch 1590BB version
    dual_scaled = create_dual_footswitch_layout(base, '1590BB')
    if dual_scaled['id'] not in existing_ids:
        new_layouts.append(dual_scaled)
        existing_ids.add(dual_scaled['id'])
        print(f"Created: {dual_scaled['id']}")

# Create 1590BS versions with 2 and 3 footswitches
for base in single_fs_125b[:6]:  # Use first 6 layouts for 1590BS to avoid overcrowding
    # Dual footswitch
    dual = create_dual_footswitch_layout(base, '1590BS')
    if dual['id'] not in existing_ids:
        new_layouts.append(dual)
        existing_ids.add(dual['id'])
        print(f"Created: {dual['id']}")
    
    # Triple footswitch
    triple = create_triple_footswitch_layout(base, '1590BS')
    if triple['id'] not in existing_ids:
        new_layouts.append(triple)
        existing_ids.add(triple['id'])
        print(f"Created: {triple['id']}")

# Merge and save
all_layouts = layouts + new_layouts
print(f"\nTotal layouts: {len(all_layouts)} ({len(new_layouts)} new)")

with open('data/enclosure_layouts.json', 'w') as f:
    json.dump(all_layouts, f, indent=2)

print("✓ Updated enclosure_layouts.json")
