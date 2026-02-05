// Script to flip all y-coordinates in enclosure_layouts.json
// Changes coordinate system from -y=up to +y=up from center

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'data', 'enclosure_layouts.json');
const backupPath = path.join(__dirname, 'data', 'enclosure_layouts.backup.json');

console.log('Reading', jsonPath, '...');

// Read and parse JSON
const layouts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log(`Found ${layouts.length} layouts. Flipping y-coordinates...`);

let flippedCount = 0;

layouts.forEach((layout) => {
  console.log(`  Processing: ${layout.id}`);
  
  // Flip potentiometer positions
  layout.potentiometer_positions?.forEach(pos => {
    pos.y = -pos.y;
    if (pos.label_offset) {
      pos.label_offset.y = -pos.label_offset.y;
    }
    flippedCount += 2;
  });
  
  // Flip switch positions
  layout.switch_positions?.forEach(pos => {
    pos.y = -pos.y;
    if (pos.label_offset) {
      pos.label_offset.y = -pos.label_offset.y;
    }
    flippedCount += 2;
  });
  
  // Flip fader positions
  layout.fader_positions?.forEach(pos => {
    pos.y = -pos.y;
    if (pos.label_offset) {
      pos.label_offset.y = -pos.label_offset.y;
    }
    flippedCount += 2;
  });
  
  // Flip footswitch position(s)
  if (layout.footswitch_position) {
    layout.footswitch_position.y = -layout.footswitch_position.y;
    flippedCount++;
  }
  if (layout.footswitch_positions) {
    layout.footswitch_positions.forEach(pos => {
      pos.y = -pos.y;
      flippedCount++;
    });
  }
  
  // Flip LED position(s)
  if (layout.led_position) {
    layout.led_position.y = -layout.led_position.y;
    flippedCount++;
  }
  if (layout.led_positions) {
    layout.led_positions.forEach(pos => {
      pos.y = -pos.y;
      flippedCount++;
    });
  }
  
  // Flip jack positions
  layout.input_jack_position.y = -layout.input_jack_position.y;
  layout.output_jack_position.y = -layout.output_jack_position.y;
  flippedCount += 2;
  
  // Flip pedal name position
  layout.pedal_name_position.y = -layout.pedal_name_position.y;
  flippedCount++;
});

// Create backup
console.log('Creating backup at', backupPath, '...');
fs.copyFileSync(jsonPath, backupPath);

// Write back to file with proper formatting
console.log('Writing updated JSON...');
fs.writeFileSync(jsonPath, JSON.stringify(layouts, null, 2) + '\n', 'utf8');

console.log('');
console.log(`✓ Successfully flipped ${flippedCount} y-coordinates across ${layouts.length} layouts!`);
console.log('✓ Backup saved to:', backupPath);
console.log('');
console.log('Coordinate system changed:');
console.log('  OLD: -y = up from center, +y = down from center');
console.log('  NEW: +y = up from center, -y = down from center');
