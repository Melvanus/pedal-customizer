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



### 6. **Save & Load Configurations**
**Problem:** Users can't save their work and come back to it
**Solution:**
- Save configurations to browser localStorage / download function
- Load previously saved configurations
- Option to Name/label saved configurations
- Share configurations via URL parameters


## High Priority Features 🔴


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

### 3. **Effect-Specific Mods Integration** ⭐⭐⭐
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
