# PowerShell script to add short and long descriptions to enclosures_data.json

$jsonPath = "Enclosures/enclosures_data.json"
$jsonContent = Get-Content $jsonPath -Raw | ConvertFrom-Json

# Function to generate descriptions based on color and finish
function Get-Descriptions {
    param($product)
    
    $color = $product.color_info.primary_color
    $finish = $product.finish_info.finish_type
    $displayName = $product.displayedName
    
    # Short description (1-2 lines for product grid)
    $shortDesc = "Professional $finish finish"
    if ($color) {
        $shortDesc += " in $color"
    }
    
    # Long description (detailed for final summary)
    $longDesc = "This $displayName features a premium $finish powder coating"
    if ($color) {
        $longDesc += " in $color"
    }
    $longDesc += ". The 125B enclosure measures 120mm × 94mm × 34mm (L×W×H) and is constructed from durable aluminum diecast. Includes 4 steel mounting screws. "
    
    # Add finish-specific notes
    if ($finish -match "Metallic") {
        $longDesc += "The metallic finish provides a shimmering, professional appearance with excellent durability. "
    }
    elseif ($finish -match "Textured") {
        $longDesc += "The textured finish offers enhanced grip and a unique tactile feel, ideal for vintage-style builds. "
    }
    elseif ($finish -match "Gloss") {
        $longDesc += "The high-gloss finish delivers a smooth, reflective surface perfect for modern pedal designs. "
    }
    else {
        $longDesc += "This powder-coated finish provides excellent protection against wear and scratches. "
    }
    
    $longDesc += "Production may require 3-4 business days."
    
    return @{
        short = $shortDesc
        long = $longDesc
    }
}

# Add descriptions to each product
foreach ($product in $jsonContent.products) {
    if ($product.available) {
        $descriptions = Get-Descriptions -product $product
        $product | Add-Member -MemberType NoteProperty -Name "shortDescription" -Value $descriptions.short -Force
        $product | Add-Member -MemberType NoteProperty -Name "longDescription" -Value $descriptions.long -Force
    }
}

# Save updated JSON
$jsonContent | ConvertTo-Json -Depth 20 | Set-Content "${jsonPath}.tmp" -Encoding UTF8

Write-Host "Descriptions added successfully!"
Write-Host "Output saved to: ${jsonPath}.tmp"
Write-Host "Review the file, then rename it to replace the original if satisfied."
