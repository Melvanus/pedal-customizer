# Pedal Customizer - Feature Roadmap

## Current Features ✅

**Overview:** A fully functional dark-themed pedal customizer with a 6-step workflow (Effect → Size → Paint/Finish → Design/Labeling → LED → Other). Users can select from various effect pedals, enclosure sizes, paint finishes, design options, LED configurations, and hardware upgrades. The system includes real-time 2D visualization, dynamic pricing, and a comprehensive summary page with order submission.

### Core Configuration System
- **Six-tab workflow:** Effect Pedal Selection → Enclosure Size → Paint/Finish → Design/Labeling → LED → Other Options
- Real-time price calculation in EUR with dynamic modifiers based on selections
- Configuration persistence using sessionStorage
- Download configuration as JSON for backup/sharing
- Fixed layout with scrollable selection areas and floating UI panels

### Effect Pedal Selection
- Search by name, circuit designation, or sound characteristics
- Category filters (Overdrive, Distortion, Fuzz, Boost, Modulation, Delay, Reverb, etc.)
- Sound character tag filtering (warm, bright, aggressive, vintage, modern, etc.)
- Multiple sort options: popularity, name, complexity, recommended enclosure size
- Detailed product modal with full specifications, available mods, and technical details

### Enclosure Size Selection
- Visual size comparison with accurate relative scaling
- Quirky, humorous size descriptions and real-world analogies
- Capacity metrics showing maximum component counts
- Smart size recommendations based on selected effect circuit
- "Best Fit" badge highlighting ideal enclosure for chosen effect

### Paint, Finish & Design Options
- Extensive color palette with finish type variations
- Search, filter, and sort capabilities for paint options
- Finish type indicators: ⭐ Glossy, 🔨 Hammered, 🏖️ Sand, ☢️ Glow, ✨ Metallic, 🎨 Matte
- Custom color support with RGB picker for specialty orders
- Design labeling options with visual preview integration

### LED Configuration
- Standard LED colors: Red, Blue, Green, Yellow, White, Amber, UV
- Custom RGB color input with visual color picker
- Multiple LED styles: No LED, No Bezel, Simple LED Bezel, Fender Style Jewel, Illuminated Footswitch
- Color picker available in both LED tab and product detail modal
- Editable LED color from summary page with full modal editor
- Default red LED when LED option selected

### 2D Enclosure Visualization
- Real-time interactive enclosure preview on summary page
- Accurate component positioning (potentiometers, switches, faders, LED, footswitch, jacks)
- Visual finish patterns (textured/wrinkle, metallic/sparkle, hammertone)
- LED rendering with appropriate bezel style and color-accurate glow effect
- **Edit Layout Mode:** Drag and reposition components with persistent positions
- **Edit Labels Mode:** Click to rename control labels inline
- Multiple layout navigation when control count varies (e.g., with mods)
- Maximize/minimize functionality for detailed inspection
- Labeled lettering option with black background rectangles
- Responsive to selected modifications (updates layout based on control requirements)

### Summary & Order Management
- Comprehensive order summary with all selections displayed
- Effect circuit and enclosure size details at top
- Long descriptions for all selected options
- Incompatibility warning detection and display system
- Customer details form (name, email, special notes)
- Order submission workflow ready for backend integration
- Edit options directly from summary (LED color, custom paint colors)
- Real-time configuration updates reflected immediately

### UI/UX Features
- Dark theme (#0a0a0a background, #1a1a1a cards, white accents)
- Floating translucent tabs & filters panel at top
- Floating translucent configuration summary panel at bottom-center (clickable for navigation)
- Multi-select support for "Other" category hardware upgrades
- Adequate bottom padding (250px) prevents content being hidden by summary panel
- Product descriptions (short & long) on all option cards
- Detailed product modals with expand/collapse functionality

### Landing Page
- Statistics dashboard showing total combinations available
- Effect pedal count and enclosure size variety metrics
- "How It Works" section explaining the 6-step workflow
- Engaging introduction to the customization process


## High Priority Features 🔴

### 0. **Support for Knobs** 🎛️⭐
**Problem:** Potentiometers currently have no visual representation beyond position markers. Users cannot select specific knob types, styles, or colors, which are important aesthetic and functional choices for guitar pedals.

**Solution Overview:**
Implement a comprehensive knob selection system allowing users to choose from various knob types (e.g., Davies 1900h clone, Chicken Head, Speed Knob, Boss-style, MXR-style) with multiple finish options (Glossy Black, Matte Black, Chrome, Gold, Brushed Aluminum, Cream, etc.). Each knob variant should be visualized in real-time on the enclosure preview.

---

#### **A) Data Structure & Management**

**Knobs Data JSON Structure** (`data/knobs.json`):
```json
{
  "knob_types": [
    {
      "id": "davies-1900h-clone",
      "name": "Davies 1900h Clone",
      "shortDescription": "Classic vintage-style knob with set screw",
      "longDescription": "Authentic reproduction of the iconic Davies 1900h knob...",
      "category": "vintage",
      "diameter_mm": 19,
      "height_mm": 15,
      "shaft_type": "6.35mm (1/4 inch) knurled",
      "set_screw": true,
      "popularity": 95,
      "vector_graphic": "davies-1900h.svg",
      "color_variants": [
        {
          "id": "davies-1900h-black",
          "color_name": "Glossy Black",
          "finish": "glossy",
          "hex_color": "#1a1a1a",
          "sku": "KNOB-DAV-BLK-01",
          "supplier": "Tayda",
          "supplierPriceEUR": 0.45,
          "customerPriceEUR": 1.20,
          "stock_status": "in_stock"
        },
        {
          "id": "davies-1900h-cream",
          "color_name": "Vintage Cream",
          "finish": "glossy",
          "hex_color": "#f5f5dc",
          "sku": "KNOB-DAV-CRM-01",
          "supplier": "Tayda",
          "supplierPriceEUR": 0.50,
          "customerPriceEUR": 1.30,
          "stock_status": "in_stock"
        }
      ]
    },
    {
      "id": "chicken-head",
      "name": "Chicken Head Pointer Knob",
      "shortDescription": "Classic pointer knob with clear indicator",
      "category": "vintage",
      "diameter_mm": 25,
      "height_mm": 18,
      "shaft_type": "6.35mm (1/4 inch) split shaft",
      "set_screw": false,
      "popularity": 88,
      "vector_graphic": "chicken-head.svg",
      "color_variants": [...]
    },
    {
      "id": "boss-style",
      "name": "Boss-Style Knob",
      "shortDescription": "Modern low-profile knob with rubber grip",
      "category": "modern",
      "diameter_mm": 16,
      "height_mm": 12,
      "shaft_type": "D-shaft 6mm",
      "set_screw": false,
      "popularity": 92,
      "vector_graphic": "boss-style.svg",
      "color_variants": [...]
    }
  ]
}
```

**Key Data Fields:**
- **Physical dimensions** (`diameter_mm`, `height_mm`) - Critical for collision detection
- **Shaft compatibility** - Ensures knob fits the potentiometer shaft type
- **Vector graphic reference** - Points to SVG file with color mask support
- **Color variants array** - Each color can have different SKU, pricing, availability
- **Category tags** - For filtering (vintage, modern, metal, plastic, extravagant, retro, etc.)

---

#### **B) UI/UX Integration**

**Workflow Position:**
Maybe add new tab **"Knobs"** between "Design/Labeling" and "LED" tabs
- Revised workflow: Effect → Size → Paint/Finish → **Design/Labeling → Knobs** → LED → Other
- Include knob selection in enclosure visualizer

**Selection Interface:**

**Option 1: Dedicated Knobs Tab** (Recommended)
- Grid view of all knob types with preview images
- Filter by category (Vintage, Modern, Metal Cap, Skirted, Pointer, etc.)
- Search functionality
- Sort by: Popularity, Price, Size, Name
- Click knob type → Opens color/finish selector modal
- Show all available colors as swatches with prices
- Display diameter and shaft compatibility info
- Maybe use some type of selection tree: “Knob Family → Size → Variant -> Color”

**Option 2: Inline Selection in Visualizer** (Complementary)
- Click any potentiometer in enclosure visualizer
- Dropdown appears to select knob type and color
- Quick selection without leaving summary page
- Links to full knob catalog for browsing

**Color/Finish Selection:**
- Color swatches displayed as circles with actual finish (glossy, matte, metallic sheen)
- Hover shows: Color name, finish type, price, SKU, availability
- Click to select
- Badge indicators: ⭐ Glossy, 🎨 Matte, ✨ Metallic, 🥇 Gold, 🥈 Chrome, 🪨 Textured

**Multi-Potentiometer Handling:**
- **Default behavior:** Select one knob type/color → Apply to ALL potentiometers
- **Advanced option:** Toggle "Customize individual knobs" checkbox
  - Enable per-potentiometer selection
  - Visual indicator on enclosure showing which knobs differ
  - Summary displays: "Main Knobs: 3x Davies Black, Bass Knob: 1x Davies Cream"

---

#### **C) Visualization in Enclosure Visualizer**

**SVG Vector Graphics with Color Masking:**

**Approach 1: SVG with CSS Color Variables** (Recommended)
- Each knob type has one SVG file with layered structure:
  ```svg
  <svg>
    <!-- Base shape (unchanging) -->
    <g id="knob-base">
      <circle cx="10" cy="10" r="9" fill="var(--knob-color)"/>
    </g>
    <!-- Highlight/shadow for glossy effect -->
    <g id="knob-highlight" opacity="var(--knob-gloss)">
      <ellipse fill="white" opacity="0.4"/>
    </g>
    <!-- Detail elements (indicator line, set screw) -->
    <g id="knob-details">
      <line stroke="#333" stroke-width="1.5"/>
    </g>
  </svg>
  ```
- Apply color dynamically via CSS custom properties:
  ```css
  .knob { 
    --knob-color: #1a1a1a; 
    --knob-gloss: 0.8; /* 0-1 for matte to glossy */
  }
  ```

**Approach 2: SVG Filters for Metallic Finishes**
- Use SVG `<filter>` elements for chrome/gold/brushed metal effects:
  ```svg
  <defs>
    <linearGradient id="chrome-gradient">
      <stop offset="0%" stop-color="#e8e8e8"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#c0c0c0"/>
    </linearGradient>
    <filter id="brushed-metal">
      <feTurbulence baseFrequency="0.9" numOctaves="1"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  ```

**Rendering in EnclosureVisualizer Component:**
- Load knob SVG as inline element or component
- Position at each `potentiometer_position` coordinate
- Scale based on `diameter_mm` relative to enclosure dimensions
- Apply selected color via CSS variables or inline style
- Render in correct z-order (behind labels, above enclosure surface)

**Example Integration:**
```tsx
{layout.potentiometer_positions.map((pos, index) => {
  const knob = selectedKnobs[index] || defaultKnob;
  return (
    <g key={index} transform={`translate(${pos.x}, ${pos.y})`}>
      <KnobSVG 
        type={knob.type}
        color={knob.color}
        diameter={knob.diameter_mm}
        finish={knob.finish}
      />
    </g>
  );
})}
```

---

#### **D) Collision Detection & Warnings**

**Proximity Warning System:**
- Calculate distance between all potentiometer centers
- If `distance < (knob1_diameter/2 + knob2_diameter/2 + min_clearance)`, flag as potential collision
- `min_clearance` = 2-3mm recommended for comfortable operation

**Visual Indicators:**
- **Warning level 1 (Tight fit):** Yellow outline on knobs that are close (0-2mm clearance)
  - Message: "⚠️ Knobs are close together - consider smaller knobs or repositioning"
- **Warning level 2 (Collision):** Red outline + pulsing animation
  - Message: "❌ Knobs overlap! Select smaller knobs or adjust layout"
- Show clearance measurement on hover between close knobs

**Smart Suggestions:**
- If collision detected, show "Suggested Alternatives" button
- Display compatible smaller knob types that would fit
- Example: "Try Boss-Style (16mm) or Mini Davies (13mm) instead"

**Implementation in EnclosureVisualizer:**
```tsx
const detectKnobCollisions = (knobs, positions) => {
  const warnings = [];
  for (let i = 0; i < positions.length - 1; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const distance = calculateDistance(positions[i], positions[j]);
      const required = (knobs[i].diameter + knobs[j].diameter) / 2 + 2; // 2mm clearance
      if (distance < required) {
        warnings.push({
          knobs: [i, j],
          severity: distance < (knobs[i].diameter + knobs[j].diameter) / 2 ? 'collision' : 'tight',
          clearance: distance - (knobs[i].diameter + knobs[j].diameter) / 2
        });
      }
    }
  }
  return warnings;
};
```

---

#### **E) Technical Implementation Details**

**State Management:**
```tsx
type KnobSelection = {
  knob_type_id: string;
  color_variant_id: string;
  diameter_mm: number;
  price: number;
};

const [selectedKnobs, setSelectedKnobs] = useState<{[potIndex: number]: KnobSelection}>({
  // Default: Same knob for all pots
  default: {
    knob_type_id: "davies-1900h-clone",
    color_variant_id: "davies-1900h-black",
    diameter_mm: 19,
    price: 1.20
  }
});
```

**Price Calculation:**
- Prices for all buttons should be always included to a ceratin degree
- If the price of a button exceeds a certain limit, the difference should be applied
- So if i choose a 5€ button, but only 2€ per button is included, an additional fee of 3€ should be applied

```tsx
const calculateKnobsCost = () => {
  const potCount = layout.potentiometer_count;
  const individualKnobs = Object.keys(selectedKnobs).filter(k => k !== 'default');
  
  if (individualKnobs.length === 0) {
    // All knobs same type
    return selectedKnobs.default.price * potCount;
  } else {
    // Mixed knob types
    return individualKnobs.reduce((sum, key) => sum + selectedKnobs[key].price, 0);
  }
};
```

**SVG Asset Organization:**
```
public/
  knobs/
    davies-1900h.svg
    chicken-head.svg
    boss-style.svg
    mxr-style.svg
    speed-knob.svg
    mini-davies.svg
    ...
```

**Component Structure:**
- `KnobSelector.tsx` - Main selection grid interface
- `KnobColorPicker.tsx` - Color variant selector modal
- `KnobVisualizer.tsx` - SVG rendering component with color application
- `KnobCollisionDetector.tsx` - Warning system component

---

#### **F) Summary Page Integration**

**Display in Configuration Summary:**
```
Selected Knobs:
  [Icon] 4x Davies 1900h Clone - Glossy Black
  Price: €4.80 (4 × €1.20)

  [Edit Button] → Opens knob selector
  [Customize Individual Knobs] → Enable per-pot selection
```

**If Individual Knobs Selected:**
```
Selected Knobs:
  [Icon] Volume/Gain/Tone: 3x Davies 1900h - Black (€3.60)
  [Icon] Master: 1x Chicken Head - Chrome (€1.80)
  Total: €5.40

  ⚠️ Warning: Volume and Gain knobs are very close (0.5mm clearance)
```

---

#### **G) Implementation Phases**

**Phase 1: Core Functionality** (Essential)
- Create knobs JSON data structure
- Build KnobSelector component (grid view, search, filter)
- Implement basic color variant selection
- Add knob visualization to EnclosureVisualizer (simple circles with colors)
- Integrate pricing into summary

**Phase 2: Visual Polish** (Important)
- Create SVG vector graphics for each knob type with color masking
- Implement proper rendering with finish effects (glossy, matte, metallic)
- Add collision detection and warning system
- Visual indicators in visualizer for tight fits

**Phase 3: Advanced Features** (Nice to have)
- Per-potentiometer individual knob selection
- Smart knob recommendations based on enclosure size
- 3D-style rendering with shadows and highlights
- Knob rotation animation on hover
- Export knob selections to order summary with per-item SKUs

---

#### **H) Data Examples & Knob Catalog**

**Suggested Knob Types to Include:**
- **Vintage:** Davies 1900h, Davies 1510, Chicken Head, Witch Hat
- **Modern:** Boss-style, MXR-style, Mini knobs, Speed knobs
- **Specialty:** Skirted knobs, Metal cap knobs, Soft-touch rubber, LED-illuminated knobs
- **Sizes:** Mini (10-13mm), Standard (16-19mm), Large (22-28mm)

**Color/Finish Combinations:**
- **Plastics:** Black (glossy/matte), White, Cream, Red, Blue, Green, Transparent
- **Metals:** Chrome, Gold, Brushed Aluminum, Copper, Black Oxide
- **Special:** Glow-in-the-dark, Custom colors (higher price tier)

---

#### **I) Compatibility & Validation**

**Shaft Type Validation:**
- Warn if selected knob shaft type doesn't match potentiometer specification
- Show compatible shaft adapters if mismatch detected
- Example: "⚠️ This knob requires D-shaft, but standard pots use round shaft. Add shaft adapter? (+€0.30)"

**Enclosure Size Constraints:**
- For ultra-compact enclosures, automatically filter out knobs >20mm diameter
- Show "Recommended for this enclosure" badge on appropriately-sized knobs

**Multi-Gang Potentiometer Support:**
- For concentric dual pots, ensure outer/inner knob compatibility
- Suggest appropriate knob sizes (e.g., large outer + mini inner)

---

#### **Benefits**
✅ Complete visual customization matching real-world builds  
✅ Accurate pricing with per-variant SKU tracking  
✅ Prevents physical incompatibilities (collision detection)  
✅ Enhances enclosure preview realism  
✅ Supports complex configurations (mixed knob types)  
✅ Scalable data structure for adding new knob types  
✅ Efficient SVG approach minimizes asset file count  

---

### 1. **Save & Load Configurations**
**Problem:** Users can't save their work and come back to it
**Solution:**
- Save configurations to browser localStorage / download function
- Load previously saved configurations
- Option to Name/label saved configurations
- Share configurations via URL parameters

### 2. **Responsive Detail Cards & Information Density** 📱⭐
**Problem:** Detail cards can exceed available screen space, especially on lower resolution devices, making navigation cumbersome and hiding important information
**Solution Approaches:**

**A) Layout & Positioning Optimizations:**
- **Overlay Mode:** Position detail card as transparent overlay on top of product image instead of separate area
  - Saves significant vertical space
  - Glassmorphism effect (backdrop-blur) for readability
  - Image dimmed/blurred in background
  - Close button clearly visible
- **Sidebar Mode:** Slide-in detail panel from right side (desktop) or bottom sheet (mobile)
  - Keeps product grid visible for context
  - Smooth animation transitions
  - Partial overlay allows background interaction
- **Inline Expansion:** Accordion-style expansion within product card itself
  - No modal needed for basic info
  - Full modal only for extensive details

**B) Content Density & Prioritization:**
- **Progressive Disclosure:** Show essential info first, expand for details
  - Initial view: Title, price, 1-line description, primary category
  - Click "More Details" to reveal: all categories, sound characters, mods, specs
- **Tag Limiting:** Display top 3-4 most relevant tags with "+X more" button
  - Prioritize by relevance score or popularity
  - Expandable inline without modal
- **Smart Truncation:** 
  - Descriptions: Show 2-3 lines, "Read more" inline expansion
  - Categories: Show primary category badge, hover/click for all
  - Specifications: Collapsible sections (Circuit, Dimensions, Compatibility)

**C) Responsive Breakpoints:**
- **Desktop (>1024px):** Two-column layout within modal, full information visible
- **Tablet (768-1024px):** Single column, scrollable, collapsible sections
- **Mobile (<768px):** Bottom sheet design, swipeable sections, minimal initial view
- **Small Mobile (<480px):** Ultra-compact mode with icon buttons for section navigation

**D) Information Architecture:**
- **Tabs within Modal:** Separate tabs for Overview / Specs / Mods / Reviews
  - Reduces visual clutter per screen
  - Users navigate to what they need
- **Icon-First Design:** Replace text labels with icons where possible
  - Category icons instead of text badges
  - Visual indicators for specs (size, complexity, compatibility)
- **Data Visualization:** 
  - Complexity as visual meter (1-5 dots/bars) instead of text
  - Compatibility matrix as simple icon grid
  - Price comparison chart if multiple variants

**E) Dynamic Content Adaptation:**
- **Screen Size Detection:** Automatically adjust content based on viewport
  - Hide less critical fields on small screens
  - Reorder elements (most important first)
- **Touch Optimization:** Larger tap targets, swipe gestures for mobile
- **Lazy Load Images:** Load detail images only when modal opens
- **Virtual Scrolling:** For long lists (mods, specs) only render visible items

**F) Alternative: Compact Card Design:**
- **Minimal Modal Approach:** Keep detail cards small and scannable
  - Maximum height: 70vh to prevent full-screen takeover
  - Grid layout: Image left (30%), Details right (70%)
  - Sticky header with title and price
  - Condensed typography with tighter line spacing

**Recommended Implementation Priority:**
1. **Immediate:** Overlay positioning + content truncation + tag limiting
2. **Phase 2:** Responsive breakpoints + collapsible sections
3. **Phase 3:** Tabbed interface + data visualization
4. **Future:** Bottom sheet design + advanced touch gestures


## Medium Priority Features 🟡

### 9. **Price Breakdown Display**
**Problem:** Users only see total, not individual item costs
**Solution:**
- Show itemized price breakdown in summary
- Highlight price changes when selecting options
- Show supplier cost vs customer price (admin view)

### 10. **Comparison Mode**
**Problem:** Hard to compare different configurations
**Solution:**
- Side-by-side comparison of 2-3 configurations
- Highlight differences
- Compare prices

### 12. **Favorites / Wishlist**
**Problem:** Can't mark interesting options for later
**Solution:**
- Heart/star icon to favorite items
- View all favorited items
- Create multiple wishlists

### 13. **Option Dependencies & Exclusions** ⚠️
**Problem:** Some options are incompatible or mutually exclusive with others
**Solution Options:**

**A) Rule-Based System (Simple)**
- Add `excludes` and `requires` fields to JSON data
- Example: `{"name": "Ultra Compact", "excludes": ["Standard LED Holder"], "requires": ["Paint"]}`
- Automatically disable/hide incompatible options when selection is made
- Show tooltip explaining why option is disabled

**B) Compatibility Matrix**
- Create compatibility table in separate JSON file
- Define which combinations are valid/invalid
- More maintainable for complex rules
- Example structure:
```json
{
  "rules": [
    {"if": "ultra-compact", "exclude": ["standard-led", "fancy-led"]},
    {"if": "fender-jewel", "requires": ["paint-metallic"]},
    {"if": "engraving", "exclude": ["relic"]}
  ]
}
```

**C) Category-Level Constraints**
- Define rules at category level (e.g., "Other" options can conflict with LED options)
- Simpler to manage but less granular
- Good for broad incompatibilities

**D) Visual Indicator System**
- Gray out incompatible options
- Show warning icon with explanation on hover
- Allow override with confirmation dialog ("Are you sure? This may require manual review")

**Recommended Approach:**
Start with **A + D**: Simple rule-based system with visual indicators. Can migrate to matrix system if rules become complex.
**NOTE:** Warnings system partially implemented

### 14. **Validation & Warnings**
**Problem:** No feedback if selections are incompatible
**Solution:**
- Warn about incompatible combinations
- Suggest alternatives
- Show lead time warnings (e.g., "3-4 business days")
- Validate before allowing download/order

---

## Low Priority / Nice-to-Have Features 🟢

### 15. **3D Enclosure Mockup Enhancement**
**Current State:** 2D visualization fully implemented and functional
**Future Enhancement:**
- Optional 3D render mode for more photorealistic preview
- Animated rotation and perspective views
- Export high-resolution preview images for marketing/sharing
- AR preview (view pedal in real environment via phone camera)

### 16. **Preconfigured Pedal Templates**
**Problem:** Users starting from scratch may feel overwhelmed by choices
**Solution:**
- Curated set of pre-configured "starter" pedal configurations
- Display templates in floating panel or dedicated section (possibly in Paint/Finish tab)
- Template categories:
  - **Classic Builds:** Traditional color/finish combinations (e.g., "Vintage Fuzz - Hammered Black")
  - **Popular Combos:** Most frequently ordered configurations
  - **Budget Builds:** Cost-effective combinations
  - **Premium Builds:** High-end finishes with all options
- Click template to instantly load all selections
- User can then modify any aspect of the loaded configuration
- Show preview image and price for each template
- "Start from Template" vs "Start from Scratch" options
- Benefits:
  - Reduces decision fatigue for new users
  - Showcases popular combinations
  - Speeds up ordering for returning customers
  - Educational - shows what works well together

**Implementation Ideas:**
- Store templates in separate JSON file with full configuration data
- Add "Templates" dropdown or button in top floating panel
- Modal/dropdown showing template cards with thumbnail, name, and price
- One-click load replaces current selections (with confirmation if user has selections)

### 17. **Stock Availability Indicator**
**Problem:** No visibility into actual stock levels
**Solution:**
- Real-time stock display
- "Low stock" warnings
- "Notify when available" option

### 18. **Customer Accounts**
**Problem:** No user history or repeat customer benefits
**Solution:**
- User registration/login
- Order history
- Saved addresses
- Loyalty/discount system

### 19. **Mobile Responsiveness Optimization**
**Problem:** Layout may not be optimal on small screens
**Solution:**
- Optimize grid for mobile (1-2 columns)
- Touch-friendly controls
- Swipe gestures for tabs

### 20. **Bulk/Batch Orders**
**Problem:** Can't order multiple pedals at once
**Solution:**
- "Add to cart" functionality
- Configure multiple pedals
- Bulk pricing discounts

### 21. **Tutorials / Help System**
**Problem:** First-time users may be confused
**Solution:**
- Interactive tour/walkthrough
- Tooltips explaining options
- FAQ section
- Video demonstrations

### 25. **Analytics Dashboard (Admin)**
**Problem:** No insights into user behavior
**Solution:**
- Track popular configurations
- Conversion rates
- Most viewed/selected options
- Price sensitivity analysis

---

## Technical Improvements 🔧

### 26. **Performance Optimization**
- Lazy load images
- Virtualize large lists
- Cache configurations
- Optimize bundle size

### 27. **Error Handling**
- Graceful fallbacks for missing images
- Network error recovery
- Form validation
- User-friendly error messages

### 28. **Accessibility**
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus indicators

### 29. **Internationalization**
- Multi-language support
- Currency conversion
- Regional pricing

### 30. **Testing & Quality**
- Unit tests for calculations
- E2E tests for user flows
- Visual regression testing
- Performance monitoring

---

## Questions to Consider 🤔

1. **What's the main pain point for your current manual process?**
   - Time spent creating quotes?
   - Communication back-and-forth?
   - Order errors/misunderstandings?

2. **What percentage of customers order multiple pedals?**
   - Impacts priority of cart/batch features

3. **Do you want customers to see supplier pricing?**
   - Currently exposed in JSON data structure

4. **What's your target customer technical skill level?**
   - Impacts complexity of UI/features

5. **Integration needs?**
   - Existing e-commerce platform?
   - Inventory management system?
   - Accounting software?

6. **What are the most common incompatible option combinations?** ⭐ NEW
   - Need examples to design exclusion system
   - Which incompatibilities are hard constraints vs warnings?
   - Are there any options that always require other options?

---

## Recommended Next Steps 📋

Based on typical user needs, I'd suggest prioritizing:

1. **Effect Pedal Selection Tab** - Complete workflow starting from circuit selection
2. **Enclosure Size Selection** - Proper size selection with user-friendly comparisons  
3. **Paint/Finish as Third Step** - Logical progression in configuration workflow
4. **Visual Color Representation & Custom Color Picker** - RGB values and Pantone codes for accurate color display; custom spray paint option
5. **Visual Preview / 3D Mockup** - Makes the biggest UX impact, shows configured pedal
6. **Option Dependencies/Exclusions** - Prevent invalid configurations proactively
7. **Image Gallery** - Replace placeholder images with actual product photos
8. **Save & Load Configurations** - Enable users to save work and share configs
9. **Preconfigured Templates** - Reduce decision fatigue with curated starter builds

Would you like me to start implementing any of these features?
