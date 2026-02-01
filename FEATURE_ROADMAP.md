# Pedal Customizer - Feature Roadmap

## Current Features ✅
- Dark theme with black & white design elements
- **Six-tab configuration system: Effect → Size → Paint/Finish → Design/Labeling → LED → Other** ✨ NEW
- **Effect Pedal Selection Tab** with 12 classic circuits (TS808, RAT, Big Muff, Klon, etc.) ✨ NEW
  - Search by name, circuit, or sound characteristics
  - Category filters (Overdrive, Distortion, Fuzz, Boost, Modulation, etc.)
  - Sound character tag filtering (warm, bright, aggressive, vintage, etc.)
  - Sort by popularity, name, complexity, or size
  - Detailed modal showing full specs, mods, and technical info
- **Enclosure Size Selection Tab** with 6 standard sizes (1590A, 1590B, 125B, 1590BB, 1590BS, 1590XX) ✨ NEW
  - Visual size comparison with relative scaling
  - Funny, quirky size descriptions and analogies
  - Capacity information and component counts
  - Smart recommendations based on selected effect pedal
  - "Best Fit" badge for recommended sizes
- **Paint/Finish tab now as Step 3** (after Effect → Size workflow) ✨ NEW
- Search, filter, and sort for paint options
- Multi-select for "Other" category
- Real-time price calculation in EUR (includes effect circuit price modifier)
- Configuration summary display with interactive navigation (shows all 6 steps)
- Download configuration as JSON (includes effect and enclosure size data)
- Fixed layout with scrollable selection area
- Floating tabs & filters panel at top (translucent, responsive)
- Floating configuration summary panel at bottom-center (translucent, clickable)
- Finish type icons on paint cards (⭐ Glossy, 🔨 Hammered, 🏖️ Sand, ☢️ Glow, ✨ Metallic, 🎨 Matte)
- Product descriptions (short & long) on all options
- Landing page with statistics and total combinations calculation
  - Shows effect pedals and enclosure sizes in statistics
  - Updated "How It Works" section with 6-step workflow
- Final summary page with:
  - Effect circuit and enclosure size information display
  - Long descriptions for all selected options
  - Incompatibility warning detection and display
  - Customer details form (name, email, notes)
  - Order submission workflow
  - Configuration download as JSON backup

---


## Critical Bugs & UX Improvements 🔥 URGENT

### ~~1. **Effect Pedal Images Not Displaying** 🐛~~ ✅ RESOLVED
**Problem:** Effect pedals show missing image icons instead of actual product images
**Solution:**
- ✅ Updated all effect pedals to use "Enclosure_Placeholder.png" fallback image
- ✅ Images now load correctly through API route
- ✅ All 12 pedal circuits tested and confirmed working

### ~~2. **Trademark Compliance for Effect Names** ⚖️~~ ✅ RESOLVED
**Problem:** Direct effect naming could cause trademark issues
**Solution:**
- ✅ Changed label to "Inspired by: [Original Pedal Name]™/®"
- ✅ Added ™ and ® symbols to all effect_pedals.json entries
- ✅ Updated display to show "Inspired by:" prefix on cards and modal
- Examples now showing:
  - "Inspired by: Ibanez Tube Screamer TS808™"
  - "Inspired by: ProCo RAT®"
  - "Inspired by: Electro-Harmonix Big Muff Pi®"

### ~~3. **Product Selection Detail Modal with Navigation** 🎯~~ ✅ RESOLVED
**Problem:** Users can't see large product images or smoothly proceed through workflow
**Solution:**
- ✅ Implemented reusable ProductDetailModal component
- ✅ **Modal Content:**
  - Large product image display (250px height)
  - Product name, subtitle, and price prominently shown
  - Full descriptions and technical specifications
  - Additional sections for mods, funny descriptions, etc.
- ✅ **Navigation Buttons:**
  - "Back" button → closes modal, returns to grid
  - "Select & Continue to [Next Tab]" button → selects product AND advances to next tab
  - Close on: ESC key, click outside modal, X button
- ✅ **Implemented across all tabs:**
  - Effect tab: Shows pedal details, specs, mods, and recommendations
  - Size tab: Shows dimensions, capacity, best-for list, and funny descriptions
  - Paint tab: Shows color, finish, SKU, supplier info
  - Design tab: Shows graphic design details and format
  - LED tab: Shows LED specs and installation info
  - Other tab: Multi-select behavior with detail view
- ✅ **Benefits:**
  - Reduces clicks needed to proceed through workflow
  - Clear product view before selection
  - Consistent experience across all tabs
  - Smooth tab advancement with proper next-tab naming

### ~~4. **Auto-Select Recommended Enclosure Size** 🤖~~ ✅ RESOLVED
**Problem:** After selecting effect, user must manually choose size even when recommendation exists
**Solution:**
- ✅ Implemented React.useEffect hook watching selectedEffectId
- ✅ Automatically sets enclosure size to effect's recommended_enclosure value
- ✅ "Best Fit" badge already highlights recommended sizes
- ✅ User can still override selection if desired
- ✅ Smooth workflow: Effect → Auto-selected Size → Continue

### ~~5. **Add "Example" Watermark to Design/Labeling Images** 📸~~ ✅ RESOLVED
**Problem:** Design preview images may be mistaken for actual customer work
**Solution:**
- ✅ Added semi-transparent "EXAMPLE" text overlay to all design product images
- ✅ Position: Upper right corner, rotated 15° clockwise
- ✅ Style: White text (rgba 255,255,255,0.3) with text-shadow for visibility
- ✅ Implemented via CSS overlay with pointer-events: none
- ✅ Small and unobtrusive but clearly visible

### ~~6. **Rotate Enclosure Icons to Vertical Orientation** 🔄~~ ✅ RESOLVED
**Problem:** Enclosure size visualizations show horizontal orientation, not how pedals are typically viewed
**Solution:**
- ✅ Swapped width/height values in getSizeWidth and getSizeHeight helper functions
- ✅ Enclosures now display in portrait/vertical orientation (as they sit on pedalboard)
- ✅ Example: 1590A now shows 40px wide × 60px tall (was 60px × 40px)
- ✅ Makes size comparison more intuitive and realistic
- ✅ Added comment: "vertical orientation - as pedals sit on pedalboard"

---


## High Priority Features 🔴

### 1. **Standardize JSON Field Naming Convention (Snake Case)** 🔧 CRITICAL
**Problem:** Inconsistent field naming across JSON files (camelCase vs snake_case)
**Solution:**
- Convert all fields in all JSON files to snake_case format
- Fields to rename:
  - `customerPriceEUR` → `customer_price_eur`
  - `supplier_sku` (already correct)
  - `shortDescription` → `short_description`
  - `longDescription` → `long_description`
  - `displayedName` → `displayed_name`
  - `isCustomColor` → `is_custom_color`
  - Any other camelCase fields
- Update all TypeScript types and interfaces
- Update all component code that references these fields
- Test thoroughly to ensure no broken references
- **Benefits:**
  - Consistent code style across the project
  - Easier to maintain and debug
  - Follows Python/JSON naming conventions
  - Reduces confusion for future developers

### 2. **Consolidate Enclosure Style Data** 📦
**Problem:** Enclosure style data is duplicated across enclosures_data.json and enclosure_sizes.json
**Solution:**
- Move all enclosure style data from enclosures_data.json to enclosure_sizes.json
- Remove `enclosure_style_data` field from enclosures_data.json
- Each size in enclosure_sizes.json should include complete specifications:
  - Dimensions (mm and inches)
  - Internal cavity dimensions
  - Material specifications
  - Mounting hole patterns (if applicable)
  - Weight
  - Any other technical specifications
- Update components to read from unified source
- **Benefits:**
  - Single source of truth for enclosure specifications
  - Easier to maintain and update
  - Reduces data redundancy
  - Cleaner JSON structure

### 3. **Size Selection Warning System** ⚠️
**Problem:** Users can select enclosures smaller than recommended without warning
**Solution:**
- In the sizes tab, detect when selected size is smaller than recommended size
- Show warning badge/banner on undersized enclosures:
  - Visual indicator: Orange/yellow warning icon
  - Text: "⚠️ Smaller than recommended - Manual review required"
  - Explanation tooltip: "This size may require custom modifications like top-mounted jacks or illuminated footswitch for proper fit"
- Add price warning: "May incur additional costs for modifications"
- Recommended approach:
  - Size order: 1590A < 1590B = 125B < 1590BB < 1590BS < 1590XX
  - Compare selected size index with recommended size index
  - If selected < recommended, show warning
- Still allow selection (don't block), but make consequences clear
- **Benefits:**
  - Prevents build issues from undersized enclosures
  - Sets proper customer expectations for costs
  - Reduces customer service inquiries
  - Educational for users learning about enclosure requirements

### 4. **Effect-Specific Mods Integration** ⭐⭐⭐
**Problem:** Current "Other" mods are generic; should be context-aware based on selected effect
**Solution:**
- **Mod Selection Within Effect Details:**
  - Move compatible mods from "Other" tab into Effect detail modal
  - Show only mods that work with selected effect circuit
  - Mods listed with checkboxes in effect details view
  - Each mod shows: name, description, price modifier, complexity impact
- **Dynamic Size Recommendation:**
  - Recalculate recommended enclosure size based on selected mods
  - Example: "Tone Stack Mod" adds 2 potentiometers → recommend larger size
  - Update "Best Fit" badge dynamically when mods are added/removed
  - Show warning if mods make current size too small
- **Mod Categories:**
  - Circuit mods (clipping options, tone stacks, gain stages)
  - Bypass mods (buffered, true bypass, soft switching)
  - Control mods (expression pedal input, remote switching)
- **Benefits:**
  - Only show relevant mods for selected circuit
  - Helps users understand what's possible with their chosen effect
  - Automatic size adjustment prevents building errors
  - Educational - users learn about circuit modifications

### 5. **Improve "Other" Category UX & Multi-Select Clarity** ⚠️
**Problem:** Multi-select in "Other" tab is confusing; unclear which items can be combined
**Solution:**
- **Better Category Organization:**
  - Rename "Other" to "Hardware Upgrades" or "Additional Options"
  - Group items into subcategories:
    - **Enclosure Mods:** Top-mounted jacks, battery compartment, etc.
    - **Hardware Upgrades:** Premium switches, illuminated footswitch
    - **Extras:** Velcro, rubber feet, premium knobs
- **Visual Multi-Select Indicators:**
  - Add checkbox icon to cards that allow multi-select
  - Single-select items show radio button icon
  - Clear "X selected" counter at top of category
  - Selected items show checkmark badge
- **Compatibility Rules:**
  - Gray out incompatible combinations
  - Tooltip explanation: "Cannot combine with [Item]"
  - Show suggested alternatives
- **Help Text:**
  - "Select all that apply" instruction at top
  - Inline hints: "Popular combo: Top-mounted jacks + Illuminated switch"
- **Consider Rework:**
  - Move some items to other tabs (battery → during effect selection)
  - Some items may work better as add-ons during size selection

### 6. **Multi-Supplier SKU & Product Management System** ⭐⭐⭐
**Problem:** Current SKU system only references supplier SKUs directly without proper product identification
**Solution:**
- **SKU Structure Refactor:**
  - Rename current `sku` field to `supplier_sku` in enclosures_data.json
  - Add `supplier_id` field to each product (initially "tayda" for all enclosures)
  - Create internal product numbering system (e.g., "PED-ENC-001", "PED-LED-042")
  - Maintain mapping between internal IDs and supplier SKUs
- **Admin/Dev View:**
  - Display supplier SKU only in development/admin mode
  - Show internal product ID in admin interface
  - Toggle between views for inventory management
- **Benefits:**
  - Multi-supplier support for future expansion
  - Clear separation between internal product management and supplier ordering
  - Easier to switch suppliers or add alternative sources
  - Professional internal product catalog independent of supplier systems

### 7. **Visual Color Representation & Custom Color Picker** ⭐⭐⭐
**Problem:** Users can't see actual colors of paint options
**Solution:**
- **Color Data Fields:** Add to enclosures_data.json:
  - `pantone`: Pantone color code for professional color matching
  - `rgb`: RGB color values (e.g., "rgb(255, 100, 50)")
  - Display small color swatch on product cards using RGB value
  - Show color preview in each item in the product grid on a circle like the finish type
- **Custom Color Option:** New special paint option
  - Interactive color picker on one item of the item list.
  - Matte or Glossy can be selected on the item
  - The name of the item should be "Aluminium Enclosure Custom Paint"
  - Price: €4.00 (higher due to manual spray painting)
  - Marked as "Requires Manual Review" with warning indicator
  - Stores selected RGB value and finish type (matte/glossy) in configuration
  - Clear note: "Custom colors are hand-sprayed and require 5-7 business days"
  - Use the "A-5168 125B Style Aluminum Diecast Enclosure Custom Paint.jpg" as product image and multipy the image with the custom color
- **Benefits:**
  - Visual identification of finish characteristics at a glance
  - Accurate color representation reduces customer uncertainty
  - Custom color option expands product offerings
  - Professional color specification via Pantone codes


### 8. **Visual Preview / 3D Mockup**
**Problem:** Users can't see what their configured pedal will look like
**Solution:** 
- Generate a real-time visual preview of the pedal with selected options
- Show enclosure color, labeling position, LED placement
- Could be 2D illustration or simple 3D render

### 9. **Save & Load Configurations**
**Problem:** Users can't save their work and come back to it
**Solution:**
- Save configurations to browser localStorage
- Load previously saved configurations
- Name/label saved configurations
- Share configurations via URL parameters

### 10. **Image Gallery for Each Option**
**Problem:** All options show placeholder "Logo.png" image
**Solution:**
- Add actual product images for each finish, LED type, etc.
- Show hover/zoom on images
- Multiple angles where available

---

## Medium Priority Features 🟡

### 11. **Enclosure Dimensions Display**
**Problem:** Users can't see physical dimensions of enclosures before ordering
**Solution:**
- Add dimensions to enclosure product descriptions
- Extract dimension data from existing `enclosure_style_data` field in enclosures_data.json
- Match each enclosure's `style` field to corresponding entry in `enclosure_style_data`
- Display dimensions in metric and imperial (mm/inches)
- Show dimensions in product card hover state and full description
- Include internal cavity dimensions where applicable
- **Benefits:**
  - Helps users verify compatibility with their circuit boards
  - Reduces customer service inquiries about sizing
  - Professional product information presentation

### 12. **Price Breakdown Display**
**Problem:** Users only see total, not individual item costs
**Solution:**
- Show itemized price breakdown in summary
- Highlight price changes when selecting options
- Show supplier cost vs customer price (admin view)

### 13. **Comparison Mode**
**Problem:** Hard to compare different configurations
**Solution:**
- Side-by-side comparison of 2-3 configurations
- Highlight differences
- Compare prices

### 14. **Search Across All Categories**
**Problem:** Search only works on paint options
**Solution:**
- Global search across all tabs
- Search by feature, price range, color, etc.
- Filter results by category

### 15. **Favorites / Wishlist**
**Problem:** Can't mark interesting options for later
**Solution:**
- Heart/star icon to favorite items
- View all favorited items
- Create multiple wishlists

### 16. **Option Dependencies & Exclusions** ⚠️
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

### 17. **Validation & Warnings**
**Problem:** No feedback if selections are incompatible
**Solution:**
- Warn about incompatible combinations
- Suggest alternatives
- Show lead time warnings (e.g., "3-4 business days")
- Validate before allowing download/order

---

## Low Priority / Nice-to-Have Features 🟢

### 18. **Preconfigured Pedal Templates**
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

### 19. **Stock Availability Indicator**
**Problem:** No visibility into actual stock levels
**Solution:**
- Real-time stock display
- "Low stock" warnings
- "Notify when available" option

### 20. **Customer Accounts**
**Problem:** No user history or repeat customer benefits
**Solution:**
- User registration/login
- Order history
- Saved addresses
- Loyalty/discount system

### 21. **Mobile Responsiveness Optimization**
**Problem:** Layout may not be optimal on small screens
**Solution:**
- Optimize grid for mobile (1-2 columns)
- Touch-friendly controls
- Swipe gestures for tabs

### 22. **Bulk/Batch Orders**
**Problem:** Can't order multiple pedals at once
**Solution:**
- "Add to cart" functionality
- Configure multiple pedals
- Bulk pricing discounts

### 23. **Tutorials / Help System**
**Problem:** First-time users may be confused
**Solution:**
- Interactive tour/walkthrough
- Tooltips explaining options
- FAQ section
- Video demonstrations

### 22. **Analytics Dashboard (Admin)**
**Problem:** No insights into user behavior
**Solution:**
- Track popular configurations
- Conversion rates
- Most viewed/selected options
- Price sensitivity analysis

---

## Technical Improvements 🔧

### 23. **Performance Optimization**
- Lazy load images
- Virtualize large lists
- Cache configurations
- Optimize bundle size

### 24. **Error Handling**
- Graceful fallbacks for missing images
- Network error recovery
- Form validation
- User-friendly error messages

### 25. **Accessibility**
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus indicators

### 26. **Internationalization**
- Multi-language support
- Currency conversion
- Regional pricing

### 27. **Testing & Quality**
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
