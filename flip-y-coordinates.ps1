# Script to flip all y-coordinates in enclosure_layouts.json
# Changes coordinate system from -y=up to +y=down from center

$jsonPath = "data\enclosure_layouts.json"

Write-Host "Reading $jsonPath..." -ForegroundColor Cyan

# Read and parse JSON
$layouts = Get-Content $jsonPath -Raw | ConvertFrom-Json

Write-Host "Found $($layouts.Count) layouts. Flipping y-coordinates..." -ForegroundColor Yellow

$flippedCount = 0

foreach ($layout in $layouts) {
    Write-Host "  Processing: $($layout.id)" -ForegroundColor Gray
    
    # Flip potentiometer positions
    foreach ($pos in $layout.potentiometer_positions) {
        $pos.y = -$pos.y
        $pos.label_offset.y = -$pos.label_offset.y
        $flippedCount += 2
    }
    
    # Flip switch positions
    foreach ($pos in $layout.switch_positions) {
        $pos.y = -$pos.y
        $pos.label_offset.y = -$pos.label_offset.y
        $flippedCount += 2
    }
    
    # Flip fader positions
    foreach ($pos in $layout.fader_positions) {
        $pos.y = -$pos.y
        $pos.label_offset.y = -$pos.label_offset.y
        $flippedCount += 2
    }
    
    # Flip footswitch position(s)
    if ($layout.footswitch_position) {
        $layout.footswitch_position.y = -$layout.footswitch_position.y
        $flippedCount++
    }
    if ($layout.footswitch_positions) {
        foreach ($pos in $layout.footswitch_positions) {
            $pos.y = -$pos.y
            $flippedCount++
        }
    }
    
    # Flip LED position(s)
    if ($layout.led_position) {
        $layout.led_position.y = -$layout.led_position.y
        $flippedCount++
    }
    if ($layout.led_positions) {
        foreach ($pos in $layout.led_positions) {
            $pos.y = -$pos.y
            $flippedCount++
        }
    }
    
    # Flip jack positions
    $layout.input_jack_position.y = -$layout.input_jack_position.y
    $layout.output_jack_position.y = -$layout.output_jack_position.y
    $flippedCount += 2
    
    # Flip pedal name position
    $layout.pedal_name_position.y = -$layout.pedal_name_position.y
    $flippedCount++
}

# Create backup
$backupPath = "data\enclosure_layouts.backup.json"
Write-Host "Creating backup at $backupPath..." -ForegroundColor Cyan
Copy-Item $jsonPath $backupPath -Force

# Write back to file with proper formatting
Write-Host "Writing updated JSON..." -ForegroundColor Cyan
$layouts | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8

Write-Host ""
Write-Host "✓ Successfully flipped $flippedCount y-coordinates across $($layouts.Count) layouts!" -ForegroundColor Green
Write-Host "✓ Backup saved to: $backupPath" -ForegroundColor Green
Write-Host ""
Write-Host "Coordinate system changed:" -ForegroundColor Yellow
Write-Host "  OLD: -y = up from center, +y = down from center" -ForegroundColor DarkGray
Write-Host "  NEW: +y = up from center, -y = down from center" -ForegroundColor White
