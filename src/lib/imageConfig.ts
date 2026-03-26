/**
 * Centralized image size configuration for all product categories
 * Adjust these values to control image sizes across the application
 */

export const IMAGE_CONFIG = {
  // Card image heights (for product grid items)
  cardHeights: {
    effect: 160,
    size: 200,
    paint: 160,
    design: 300,
    led: 280,
    knobs: 200,
  },
  
  // Modal image sizes (for ProductDetailModal)
  modalSizes: {
    effect: { width: 400, height: 250 },
    size: { width: 400, height: 250 },
    paint: { width: 400, height: 250 },
    design: { width: 400, height: 400 },
    led: { width: 400, height: 400 },
    knobs: { width: 400, height: 300 },
    other: { width: 400, height: 250 },
  },
} as const;

export type ProductCategory = keyof typeof IMAGE_CONFIG.cardHeights;
