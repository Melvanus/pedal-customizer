# Read the JSON file
$json = Get-Content "Enclosures\enclosures_data.json" -Raw | ConvertFrom-Json

# Find the base price (bare metal enclosure)
$baseProduct = $json.products | Where-Object { $_.name -eq "125B Style Aluminum Diecast Enclosure" }
$basePrice = [decimal]($baseProduct.price -replace '[\$,]', '')

Write-Host "Base price found: $basePrice USD"

# Process each product
foreach ($product in $json.products) {
    # Calculate supplier price
    $supplierPrice = [decimal]($product.price -replace '[\$,]', '')
    
    # Calculate customer price in EUR (difference rounded up, minimum 0)
    $priceDiff = $supplierPrice - $basePrice
    $customerPrice = [Math]::Ceiling([Math]::Max(0, $priceDiff))
    
    # Create displayed name
    $displayName = $product.name -replace '^125B Style Aluminum Diecast Enclosure\s*', 'Aluminium Enclosure '
    
    # Add new properties
    $product | Add-Member -MemberType NoteProperty -Name "displayedName" -Value $displayName -Force
    $product | Add-Member -MemberType NoteProperty -Name "supplierPriceUSD" -Value $product.price -Force
    $product | Add-Member -MemberType NoteProperty -Name "customerPriceEUR" -Value $customerPrice -Force
}

Write-Host "Processing complete. Saving to updated file..."

# Save to new file
$json | ConvertTo-Json -Depth 20 | Set-Content "Enclosures\enclosures_data_updated.json"

Write-Host "Done! File saved as enclosures_data_updated.json"
