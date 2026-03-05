(async function scrapeTaydaKnobsComplete() {
  console.log('🎛️ Tayda Knobs Scraper v2 - Loading ALL products...');
  
  // Step 1: Scroll to bottom to trigger lazy loading
  console.log('📜 Scrolling to load all products...');
  
  async function scrollToBottom() {
    const scrollDelay = 500; // ms between scrolls
    let lastHeight = document.body.scrollHeight;
    let scrollAttempts = 0;
    const maxAttempts = 20;
    
    while (scrollAttempts < maxAttempts) {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, scrollDelay));
      
      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) {
        scrollAttempts++;
      } else {
        scrollAttempts = 0; // Reset if page grew
        console.log(`📏 Page height: ${newHeight}px`);
      }
      lastHeight = newHeight;
    }
    
    console.log('✅ Finished scrolling');
  }
  
  await scrollToBottom();
  
  // Step 2: Wait a bit for final images to load
  console.log('⏳ Waiting for images to load...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 3: Scrape all products
  console.log('🔍 Scraping products...');
  
  const knobs = [];
  const products = document.querySelectorAll('.product-item, .item.product, .product.item, li.item');
  
  console.log(`🎯 Found ${products.length} product elements`);
  
  products.forEach((product, index) => {
    try {
      // Try multiple selector patterns for product name
      let name = null;
      let url = null;
      // 1. Try anchor tags inside product
      const anchors = product.querySelectorAll('a');
      for (const a of anchors) {
        if (a.textContent && a.textContent.trim().length > 3) {
          name = a.textContent.trim();
          url = a.href;
          break;
        }
      }
      // 2. Try product name class
      if (!name) {
        const nameEl = product.querySelector('.product-item-link, .product-name, .product-title, .item-title');
        if (nameEl && nameEl.textContent && nameEl.textContent.trim().length > 3) {
          name = nameEl.textContent.trim();
        }
      }
      // 3. Try alt/title attributes
      if (!name) {
        const imgEl = product.querySelector('img');
        if (imgEl) {
          name = imgEl.getAttribute('alt') || imgEl.getAttribute('title');
        }
      }
      // 4. Try data attributes
      if (!name) {
        name = product.getAttribute('data-name') || product.getAttribute('title');
      }
      // 5. Fallback: log innerHTML for debugging
      if (!name) {
        if (index < 5) {
          console.log(`🕵️‍♂️ Debug: Product ${index} innerHTML:`, product.innerHTML);
        }
        console.log(`⚠️  Skipping item ${index} - no name found`);
        return;
      }
      // Image - try multiple selectors
      const imgEl = product.querySelector('.product-image-photo, img.product-image-photo, .product-image img, img');
      let imageUrl = imgEl ? (imgEl.getAttribute('data-src') || imgEl.src) : null;
      // Clean up lazy-load placeholder images
      if (imageUrl && imageUrl.includes('placeholder')) {
        const dataSrc = imgEl.getAttribute('data-src');
        if (dataSrc) imageUrl = dataSrc;
      }
      // Price - try multiple selectors
      const priceEl = product.querySelector('.price, .price-wrapper .price, span[data-price-type="finalPrice"] .price');
      let price = null;
      if (priceEl) {
        const priceText = priceEl.textContent.trim();
        price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      }
      // SKU - check multiple locations
      let sku = product.getAttribute('data-sku') || 
                product.getAttribute('data-product-sku');
      if (!sku) {
        const skuEl = product.querySelector('.sku, [class*="sku"]');
        if (skuEl) {
          sku = skuEl.textContent.trim().replace(/SKU:?\s*/i, '');
        }
      }
      // If still no SKU, try to extract from URL
      if (!sku && url) {
        const urlMatch = url.match(/\/([^\/]+)\.html/);
        if (urlMatch) sku = urlMatch[1];
      }
      // Extract dimensions from product name
      let diameter = null;
      const diameterMatch = name.match(/(\d+)\s*mm/i);
      if (diameterMatch) {
        diameter = parseInt(diameterMatch[1]);
      }
      // Detect shaft type
      let shaftType = null;
      const nameLower = name.toLowerCase();
      if (nameLower.includes('knurled')) shaftType = 'Knurled';
      else if (nameLower.includes('smooth') || nameLower.includes('round')) shaftType = 'Smooth Round';
      else if (nameLower.includes('d-shaft') || nameLower.includes('d shaft')) shaftType = 'D-Shaft';
      else if (nameLower.includes('split')) shaftType = 'Split Shaft';
      else if (nameLower.includes('spline')) shaftType = 'Spline';
      // Detect color with expanded keywords
      let color = null;
      const colorKeywords = {
        'black': 'Black',
        'white': 'White',
        'cream': 'Cream',
        'ivory': 'Cream',
        'red': 'Red',
        'blue': 'Blue',
        'green': 'Green',
        'yellow': 'Yellow',
        'orange': 'Orange',
        'silver': 'Silver',
        'gold': 'Gold',
        'chrome': 'Chrome',
        'gray': 'Gray',
        'grey': 'Gray',
        'brown': 'Brown',
        'clear': 'Clear',
        'transparent': 'Clear',
        'purple': 'Purple',
        'pink': 'Pink'
      };
      for (const [keyword, colorName] of Object.entries(colorKeywords)) {
        if (nameLower.includes(keyword)) {
          color = colorName;
          break;
        }
      }
      // Detect knob type/style with more patterns
      let knobType = 'Generic Knob';
      if (nameLower.includes('davies') || nameLower.includes('1900')) knobType = 'Davies 1900h Clone';
      else if (nameLower.includes('chicken head')) knobType = 'Chicken Head';
      else if (nameLower.includes('speed knob')) knobType = 'Speed Knob';
      else if (nameLower.includes('boss')) knobType = 'Boss Style';
      else if (nameLower.includes('mxr')) knobType = 'MXR Style';
      else if (nameLower.includes('pointer')) knobType = 'Pointer Knob';
      else if (nameLower.includes('skirted')) knobType = 'Skirted Knob';
      else if (nameLower.includes('mini')) knobType = 'Mini Knob';
      else if (nameLower.includes('large')) knobType = 'Large Knob';
      else if (nameLower.includes('vintage')) knobType = 'Vintage Style';
      else if (nameLower.includes('modern')) knobType = 'Modern Style';
      else if (nameLower.includes('set screw')) knobType = 'Set Screw Knob';
      else if (nameLower.includes('push on')) knobType = 'Push-On Knob';
      // Detect finish type
      let finishType = 'Matte';
      if (nameLower.includes('gloss') || nameLower.includes('glossy')) finishType = 'Glossy';
      else if (nameLower.includes('metal') || nameLower.includes('aluminum') || nameLower.includes('aluminium')) finishType = 'Metallic';
      else if (nameLower.includes('chrome')) finishType = 'Chrome';
      else if (nameLower.includes('brushed')) finishType = 'Brushed Metal';
      const knob = {
        name,
        sku: sku || `TAYDA-KNOB-${index + 1}`,
        price,
        imageUrl,
        productUrl: url,
        diameter_mm: diameter,
        shaft_type: shaftType,
        color,
        finish_type: finishType,
        knob_type: knobType,
        supplier: 'Tayda Electronics',
        scrapedAt: new Date().toISOString(),
        _index: index // For debugging
      };
      knobs.push(knob);
    } catch (error) {
      console.error(`❌ Error parsing product ${index}:`, error);
    }
  });
  
  console.log(`✅ Successfully scraped ${knobs.length} knobs`);
  
  // Display summary with humor 🎸
  const summary = {
    total: knobs.length,
    withPrice: knobs.filter(k => k.price).length,
    withImage: knobs.filter(k => k.imageUrl && !k.imageUrl.includes('placeholder')).length,
    withDimensions: knobs.filter(k => k.diameter_mm).length,
    uniqueTypes: [...new Set(knobs.map(k => k.knob_type))].sort(),
    uniqueColors: [...new Set(knobs.map(k => k.color).filter(Boolean))].sort(),
    shaftTypes: [...new Set(knobs.map(k => k.shaft_type).filter(Boolean))].sort(),
    priceRange: {
      min: Math.min(...knobs.filter(k => k.price).map(k => k.price)),
      max: Math.max(...knobs.filter(k => k.price).map(k => k.price))
    }
  };
  
  console.log('📊 Summary:');
  console.log(`  🎛️  Total knobs found: ${summary.total}`);
  console.log(`  💰 With prices: ${summary.withPrice} (${(summary.withPrice/summary.total*100).toFixed(1)}%)`);
  console.log(`  🖼️  With images: ${summary.withImage} (${(summary.withImage/summary.total*100).toFixed(1)}%)`);
  console.log(`  📏 With dimensions: ${summary.withDimensions} (${(summary.withDimensions/summary.total*100).toFixed(1)}%)`);
  console.log(`  💵 Price range: $${summary.priceRange.min.toFixed(2)} - $${summary.priceRange.max.toFixed(2)}`);
  console.log(`  🎨 Colors: ${summary.uniqueColors.join(', ')}`);
  console.log(`  🔧 Shaft types: ${summary.shaftTypes.join(', ')}`);
  console.log(`  🎭 Knob types: ${summary.uniqueTypes.join(', ')}`);
  
  // Download as JSON
  const jsonStr = JSON.stringify(knobs, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().split('T')[0];
  a.download = `tayda-knobs-complete-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('💾 JSON file downloaded! Check your Downloads folder.');
  
  // Also copy to clipboard
  try {
    await navigator.clipboard.writeText(jsonStr);
    console.log('📋 Data also copied to clipboard!');
  } catch (e) {
    console.log('⚠️  Could not copy to clipboard (might be too large)');
  }
  
  // Scroll back to top for your convenience
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  return knobs;
})();