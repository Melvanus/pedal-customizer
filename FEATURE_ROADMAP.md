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
- **LED Color Selection** with standard colors (Red, Blue, Green, Yellow, White, Amber, UV) and custom RGB input ✨ NEW
  - Color picker in customizer LED tab (appears after selecting LED option)
  - Color picker in LED product detail modal
  - Visual blooming color indicator in summary page
  - Editable LED color on summary page with modal editor
  - Default red LED color
- **Editable Options on Summary Page** ✨ NEW
  - Edit LED color from summary with full color picker modal
  - Edit custom paint colors from summary with RGB color picker
  - Real-time configuration updates
  - Changes persist in sessionStorage
- **Improved Tab Spacing** - adequate bottom padding (250px) prevents products from being hidden by floating summary panel ✨ NEW


## High Priority Features 🔴

### 1. **Size Selection Warning System** ⚠️
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

### 2. **Effect-Specific Mods Integration** ⭐⭐⭐
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

### 3. **Improve "Other" Category UX & Multi-Select Clarity** ⚠️
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

### 4. **Multi-Supplier SKU & Product Management System** ⭐⭐⭐
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

### 5. **Visual Color Representation & Custom Color Picker** ⭐⭐⭐
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


### 6. **Visual Preview / 3D Mockup**
**Problem:** Users can't see what their configured pedal will look like
**Solution:** 
- Generate a real-time visual preview of the pedal with selected options
- Show enclosure color, labeling position, LED placement
- Could be 2D illustration or simple 3D render

### 7. **Save & Load Configurations**
**Problem:** Users can't save their work and come back to it
**Solution:**
- Save configurations to browser localStorage
- Load previously saved configurations
- Name/label saved configurations
- Share configurations via URL parameters

### 8. **Image Gallery for Each Option**
**Problem:** All options show placeholder "Logo.png" image
**Solution:**
- Add actual product images for each finish, LED type, etc.
- Show hover/zoom on images
- Multiple angles where available

---

## Medium Priority Features 🟡

### 9. **Enclosure Dimensions Display**
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

### 13. **Price Breakdown Display**
**Problem:** Users only see total, not individual item costs
**Solution:**
- Show itemized price breakdown in summary
- Highlight price changes when selecting options
- Show supplier cost vs customer price (admin view)

### 14. **Comparison Mode**
**Problem:** Hard to compare different configurations
**Solution:**
- Side-by-side comparison of 2-3 configurations
- Highlight differences
- Compare prices

### 15. **Search Across All Categories**
**Problem:** Search only works on paint options
**Solution:**
- Global search across all tabs
- Search by feature, price range, color, etc.
- Filter results by category

### 16. **Favorites / Wishlist**
**Problem:** Can't mark interesting options for later
**Solution:**
- Heart/star icon to favorite items
- View all favorited items
- Create multiple wishlists

### 17. **Option Dependencies & Exclusions** ⚠️
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

### 18. **Validation & Warnings**
**Problem:** No feedback if selections are incompatible
**Solution:**
- Warn about incompatible combinations
- Suggest alternatives
- Show lead time warnings (e.g., "3-4 business days")
- Validate before allowing download/order

---

## Low Priority / Nice-to-Have Features 🟢

### 19. **Preconfigured Pedal Templates**
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

### 20. **Stock Availability Indicator**
**Problem:** No visibility into actual stock levels
**Solution:**
- Real-time stock display
- "Low stock" warnings
- "Notify when available" option

### 21. **Customer Accounts**
**Problem:** No user history or repeat customer benefits
**Solution:**
- User registration/login
- Order history
- Saved addresses
- Loyalty/discount system

### 22. **Mobile Responsiveness Optimization**
**Problem:** Layout may not be optimal on small screens
**Solution:**
- Optimize grid for mobile (1-2 columns)
- Touch-friendly controls
- Swipe gestures for tabs

### 23. **Bulk/Batch Orders**
**Problem:** Can't order multiple pedals at once
**Solution:**
- "Add to cart" functionality
- Configure multiple pedals
- Bulk pricing discounts

### 24. **Tutorials / Help System**
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
