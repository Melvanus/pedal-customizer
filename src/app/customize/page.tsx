import path from "path";
import fs from "fs/promises";

import { PedalCustomizer, type OptionItem, type PaintOption } from "@/components/pedal-customizer";
import type { EffectPedal } from "@/components/EffectSelector";
import type { EnclosureSize } from "@/components/EnclosureSizeSelector";

const toNumber = (price: string | number | undefined) => {
  if (typeof price === "number") return price;
  if (!price) return 0;
  const normalized = price.replace(/[^0-9.]/g, "");
  return Number.parseFloat(normalized || "0");
};

const resolveImageUrl = (fileName: string) =>
  `/api/data/image/${encodeURIComponent(fileName)}`;

type RawOption = {
  name: string;
  price: number;
  image: string;
  images?: string[];
  customer_price_eur: number;
  short_description?: string;
  long_description?: string;
};

export default async function CustomizePage() {
  const effectPedalsPath = path.join(process.cwd(), "data", "effect_pedals.json");
  const enclosureSizesPath = path.join(process.cwd(), "data", "enclosure_sizes.json");
  const dataPath = path.join(process.cwd(), "data", "enclosures_data.json");
  const designPath = path.join(process.cwd(), "data", "design_labeling.json");
  const ledPath = path.join(process.cwd(), "data", "led.json");
  const favouritesPath = path.join(process.cwd(), "data", "favourites.json");
  const imageDir = path.join(process.cwd(), "data", "images");

  const [rawEffectPedals, rawEnclosureSizes, rawData, rawDesign, rawLed, rawFavourites, imageFiles] = await Promise.all([
    fs.readFile(effectPedalsPath, "utf-8"),
    fs.readFile(enclosureSizesPath, "utf-8"),
    fs.readFile(dataPath, "utf-8"),
    fs.readFile(designPath, "utf-8"),
    fs.readFile(ledPath, "utf-8"),
    fs.readFile(favouritesPath, "utf-8"),
    fs.readdir(imageDir),
  ]);

  const effectPedalsData = JSON.parse(rawEffectPedals) as { pedals: EffectPedal[] };
  const effectPedals = effectPedalsData.pedals.map(pedal => ({
    ...pedal,
    image: resolveImageUrl(pedal.image || "Logo.png"),
  }));

  const enclosureSizes = JSON.parse(rawEnclosureSizes) as EnclosureSize[];

  const data = JSON.parse(rawData) as {
    products: Array<{
      supplier_sku: string;
      supplier_id: string;
      internal_product_id: string;
      name: string;
      price: string;
      available: boolean;
      image_url?: string;
      image_urls?: string[];
      finish_info?: { finish_type?: string };
      color_info?: { primary_color?: string };
      displayed_name: string;
      customer_price_eur: number;
      short_description?: string;
      long_description?: string;
      rgb?: string;
      pantone?: string;
      is_custom_color?: boolean;
    }>;
  };

  const mapOptionImage = (imageName: string) => resolveImageUrl(imageName || "Logo.png");

  const paintOptions: PaintOption[] = data.products
    .filter((product) => product.available)
    .map((product) => {
      const image = resolveImageUrl(product.image_url || "Logo.png");
      const images = product.image_urls?.map(resolveImageUrl);

      return {
        id: product.supplier_sku,
        supplier_sku: product.supplier_sku,
        supplier_id: product.supplier_id,
        internal_product_id: product.internal_product_id,
        name: product.name,
        price: toNumber(product.price),
        image,
        images,
        finish: product.finish_info?.finish_type,
        color: product.color_info?.primary_color,
        available: product.available,
        displayed_name: product.displayed_name,
        customer_price_eur: product.customer_price_eur,
        short_description: product.short_description,
        long_description: product.long_description,
        rgb: product.rgb,
        pantone: product.pantone,
        is_custom_color: product.is_custom_color,
      };
    });

  const designOptions = (JSON.parse(rawDesign) as RawOption[]).map((item) => ({
    ...item,
    id: item.name.toLowerCase().replace(/\s+/g, "-"),
    image: mapOptionImage(item.image),
    images: item.images?.map(mapOptionImage),
  }));

  const ledOptions = (JSON.parse(rawLed) as RawOption[]).map((item) => ({
    ...item,
    id: item.name.toLowerCase().replace(/\s+/g, "-"),
    image: mapOptionImage(item.image),
    images: item.images?.map(mapOptionImage),
  }));

  const favourites = JSON.parse(rawFavourites) as { paintFinishFavourites: string[] };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <PedalCustomizer
        effectPedals={effectPedals}
        enclosureSizes={enclosureSizes}
        paintOptions={paintOptions}
        designOptions={designOptions}
        ledOptions={ledOptions}
        favouritePaintIds={favourites.paintFinishFavourites}
      />
    </main>
  );
}
