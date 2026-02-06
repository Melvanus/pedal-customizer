import { NextResponse } from "next/server";

// Clean order data structure for production use
function createOrderDataStructure(orderData: any) {
  return {
    // Order metadata
    orderInfo: {
      submittedAt: new Date().toISOString(),
      orderDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
    },
    
    // Customer information
    customer: {
      name: orderData.customerName,
      email: orderData.customerEmail,
      notes: orderData.customerNotes || null,
    },
    
    // Effect pedal configuration
    effect: {
      id: orderData.effect?.id,
      name: orderData.effect?.name,
      inspiredBy: orderData.effect?.inspired_by,
      pcbSupplier: orderData.effect?.technical_specs?.pcb_reference || null,
      price: orderData.effect?.customer_price_eur,
      
      // Selected modifications
      mods: orderData.effectMods?.map((m: any) => ({
        id: m.mod.name, // Using name as ID
        name: m.mod.name,
        price: m.mod.customer_price_eur,
        selectedOptions: m.selectedOptions || null,
      })) || [],
    },
    
    // Enclosure configuration
    enclosure: {
      size: orderData.enclosureSize?.name || null,
      dimensions: orderData.enclosureSize?.dimensions || null,
      isNonStandard: orderData.enclosureSize?.name !== orderData.effect?.recommended_enclosure,
    },
    
    // Paint/finish configuration
    paint: {
      supplierSKU: orderData.paint?.supplier_sku || null,
      displayName: orderData.paint?.displayed_name || orderData.paint?.name,
      color: orderData.paint?.color || null,
      finish: orderData.paint?.finish || null,
      rgbHex: orderData.paint?.rgb || null,
      pantone: orderData.paint?.pantone || null,
      isCustomColor: orderData.paint?.is_custom_color || false,
      price: orderData.paint?.customer_price_eur,
    },
    
    // Design/labeling configuration
    design: {
      id: orderData.design?.id,
      name: orderData.design?.name,
      customLabelText: orderData.labelText || null,
      price: orderData.design?.customer_price_eur,
    },
    
    // LED configuration
    led: {
      id: orderData.led?.id,
      name: orderData.led?.name,
      color: orderData.ledColor || null,
      bezelColor: orderData.ledBezelColor || null,
      isCustomColor: orderData.ledColor?.startsWith('#') || false,
      price: orderData.led?.customer_price_eur,
    },
    
    // Layout configuration
    layout: {
      selectedLayoutId: orderData.selectedLayoutId || null,
      wasCustomized: orderData.layoutWasCustomized || false,
      customLayoutData: orderData.customLayoutData || null,
      
      // Layout editor usage metrics
      editorMetrics: {
        timeSpentSeconds: orderData.layoutEditorTimeSpent || 0,
        changesCount: orderData.layoutChangesCount || 0,
        wasOpened: orderData.layoutEditorWasOpened || false,
      },
    },
    
    // Pedal customization
    customization: {
      pedalName: orderData.pedalName || null,
      controlLabels: orderData.controlLabels || {},
      showPedalNameOnEnclosure: orderData.showPedalNameInVisualizer !== false,
    },
    
    // Pricing summary
    pricing: {
      effectBasePrice: orderData.effect?.customer_price_eur || 0,
      modsTotal: orderData.effectMods?.reduce((sum: number, m: any) => 
        sum + m.mod.customer_price_eur, 0) || 0,
      enclosureSurcharge: orderData.enclosureSize?.name !== orderData.effect?.recommended_enclosure ? 5 : 0,
      paintPrice: orderData.paint?.customer_price_eur || 0,
      designPrice: orderData.design?.customer_price_eur || 0,
      ledPrice: orderData.led?.customer_price_eur || 0,
      totalPrice: orderData.totalPrice,
      currency: "EUR",
    },
  };
}

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    
    // Validate that we have order data
    if (!orderData || !orderData.effect) {
      return NextResponse.json(
        { error: "Invalid order data" },
        { status: 400 }
      );
    }

    // Create clean order structure
    const cleanOrderData = createOrderDataStructure(orderData);

    // For development: just log the order
    if (process.env.NODE_ENV === 'development') {
      console.log('='.repeat(80));
      console.log('📦 NEW ORDER RECEIVED');
      console.log('='.repeat(80));
      console.log(JSON.stringify(cleanOrderData, null, 2));
      console.log('='.repeat(80));
      
      return NextResponse.json({ 
        success: true, 
        message: "Order logged to console (dev mode)" 
      });
    }

    // Production: Send to Discord
    if (!process.env.DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_WEBHOOK_URL not configured');
      return NextResponse.json(
        { error: "Order submission not configured" },
        { status: 500 }
      );
    }

    const formatPrice = (value: number) => `€${value.toFixed(2)}`;
    
    // Build Discord embed fields
    const fields = [
      {
        name: "👤 Customer",
        value: `**${cleanOrderData.customer.name}**\n${cleanOrderData.customer.email}`,
        inline: false
      },
      {
        name: "🎛️ Effect Pedal",
        value: `${cleanOrderData.effect.name}\n_${cleanOrderData.effect.inspiredBy}_`,
        inline: true
      },
      {
        name: "📦 Enclosure",
        value: `${cleanOrderData.enclosure.size}\n${cleanOrderData.enclosure.dimensions}${cleanOrderData.enclosure.isNonStandard ? ' ⚠️' : ''}`,
        inline: true
      },
      {
        name: "🎨 Paint/Finish",
        value: cleanOrderData.paint.isCustomColor 
          ? `Custom: ${cleanOrderData.paint.rgbHex}\n${cleanOrderData.paint.finish || 'Custom finish'}` 
          : `${cleanOrderData.paint.displayName}\n${cleanOrderData.paint.color} ${cleanOrderData.paint.finish}`.trim(),
        inline: true
      },
      {
        name: "🏷️ Design/Label",
        value: cleanOrderData.design.name + (cleanOrderData.design.customLabelText ? `\n"${cleanOrderData.design.customLabelText}"` : ''),
        inline: true
      },
      {
        name: "💡 LED",
        value: `${cleanOrderData.led.name}${cleanOrderData.led.color ? ` (${cleanOrderData.led.color})` : ''}${cleanOrderData.led.bezelColor ? `\nBezel: ${cleanOrderData.led.bezelColor}` : ''}`,
        inline: true
      },
      {
        name: "💰 Total Price",
        value: `**${formatPrice(cleanOrderData.pricing.totalPrice)}**`,
        inline: true
      }
    ];

    // Add effect mods if present
    if (cleanOrderData.effect.mods.length > 0) {
      const modsText = cleanOrderData.effect.mods
        .map((m: any) => `• ${m.name} (${formatPrice(m.price)})`)
        .join('\n');
      fields.push({
        name: "⚙️ Effect Modifications",
        value: modsText,
        inline: false
      });
    }

    // Add custom pedal name if provided
    if (cleanOrderData.customization.pedalName) {
      fields.push({
        name: "🎸 Custom Pedal Name",
        value: cleanOrderData.customization.pedalName,
        inline: false
      });
    }

    // Add layout info if customized
    if (cleanOrderData.layout.wasCustomized || cleanOrderData.layout.selectedLayoutId) {
      let layoutInfo = '';
      if (cleanOrderData.layout.wasCustomized) {
        layoutInfo = `✏️ Custom layout (${cleanOrderData.layout.editorMetrics.changesCount} changes, ${Math.round(cleanOrderData.layout.editorMetrics.timeSpentSeconds / 60)}min)`;
      } else if (cleanOrderData.layout.selectedLayoutId) {
        layoutInfo = `Layout ID: ${cleanOrderData.layout.selectedLayoutId}`;
      }
      if (layoutInfo) {
        fields.push({
          name: "🎨 Layout",
          value: layoutInfo,
          inline: false
        });
      }
    }

    // Add customer notes if provided
    if (cleanOrderData.customer.notes) {
      fields.push({
        name: "📝 Special Notes",
        value: cleanOrderData.customer.notes.length > 1000 
          ? cleanOrderData.customer.notes.substring(0, 1000) + "..." 
          : cleanOrderData.customer.notes,
        inline: false
      });
    }

    // Create JSON file with clean order structure
    const orderJson = JSON.stringify(cleanOrderData, null, 2);
    const fileName = `order-${cleanOrderData.customer.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    
    // Create FormData to send both embed and file
    const formData = new FormData();
    
    // Add the embed as payload_json
    const discordMessage = {
      embeds: [{
        title: "🎸 New Pedal Order!",
        color: 0x4ade80, // Green color
        fields: fields,
        timestamp: new Date().toISOString(),
        footer: {
          text: "Pedal Customizer Order System"
        }
      }]
    };
    formData.append('payload_json', JSON.stringify(discordMessage));
    
    // Add the JSON file as attachment
    const jsonBlob = new Blob([orderJson], { type: 'application/json' });
    formData.append('files[0]', jsonBlob, fileName);

    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord webhook failed:", response.status, errorText);
      throw new Error("Discord webhook failed");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Order submitted successfully! We'll contact you soon." 
    });
    
  } catch (error) {
    console.error("Error submitting order:", error);
    return NextResponse.json(
      { error: "Failed to submit order" },
      { status: 500 }
    );
  }
}
