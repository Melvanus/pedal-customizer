#!/usr/bin/env python3
"""
Script to refactor the SKU system in enclosures_data.json:
1. Rename 'sku' field to 'supplier_sku'
2. Add 'supplier_id' field (set to "tayda" for all products)
3. Generate internal product IDs in format "PED-ENC-###"
"""

import json
from pathlib import Path

def refactor_sku_system(json_file_path: str):
    """Refactor the SKU system in the enclosures data file."""
    
    # Read the JSON file
    print(f"Reading {json_file_path}...")
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Process each product
    products = data.get('products', [])
    print(f"Processing {len(products)} products...")
    
    for idx, product in enumerate(products, start=1):
        # Generate internal product ID with zero-padded number
        internal_id = f"PED-ENC-{idx:03d}"
        
        # Rename 'sku' to 'supplier_sku' if it exists
        if 'sku' in product:
            product['supplier_sku'] = product.pop('sku')
        
        # Add supplier_id
        product['supplier_id'] = 'tayda'
        
        # Add internal product_id (keep existing product_id field, add new internal_product_id)
        product['internal_product_id'] = internal_id
        
        print(f"  {idx:3d}. {internal_id} | Supplier: {product.get('supplier_sku', 'N/A')} | {product.get('name', 'Unknown')[:50]}")
    
    # Save the modified data back to the file
    print(f"\nWriting updated data back to {json_file_path}...")
    with open(json_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print(f"\n✅ Successfully processed {len(products)} products!")
    print(f"   - Renamed 'sku' → 'supplier_sku'")
    print(f"   - Added 'supplier_id' = 'tayda'")
    print(f"   - Added 'internal_product_id' (PED-ENC-001 to PED-ENC-{len(products):03d})")

if __name__ == "__main__":
    # Path to the enclosures data file
    enclosures_file = Path(__file__).parent / "Enclosures" / "enclosures_data.json"
    
    if not enclosures_file.exists():
        print(f"❌ Error: File not found: {enclosures_file}")
        exit(1)
    
    refactor_sku_system(str(enclosures_file))
