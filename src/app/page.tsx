import path from "path";
import fs from "fs/promises";

import { LandingPage } from "./landing-page";

export default async function HomePage() {
  const effectPedalsPath = path.join(process.cwd(), "data", "effect_pedals.json");
  const enclosureSizesPath = path.join(process.cwd(), "data", "enclosure_sizes.json");
  const dataPath = path.join(process.cwd(), "data", "enclosures_data.json");
  const designPath = path.join(process.cwd(), "data", "design_labeling.json");
  const ledPath = path.join(process.cwd(), "data", "led.json");

  const [rawEffectPedals, rawEnclosureSizes, rawData, rawDesign, rawLed] = await Promise.all([
    fs.readFile(effectPedalsPath, "utf-8"),
    fs.readFile(enclosureSizesPath, "utf-8"),
    fs.readFile(dataPath, "utf-8"),
    fs.readFile(designPath, "utf-8"),
    fs.readFile(ledPath, "utf-8"),
  ]);

  const effectPedals = JSON.parse(rawEffectPedals).length;
  const enclosureSizes = JSON.parse(rawEnclosureSizes).length;
  
  const data = JSON.parse(rawData) as {
    products: Array<{
      available: boolean;
      finish_info?: { finish_type?: string };
      color_info?: { primary_color?: string };
    }>;
  };

  const availableProducts = data.products.filter((p) => p.available);
  const uniqueColors = new Set(
    availableProducts.map((p) => p.color_info?.primary_color).filter(Boolean)
  ).size;
  const uniqueFinishes = new Set(
    availableProducts.map((p) => p.finish_info?.finish_type).filter(Boolean)
  ).size;

  const designOptions = JSON.parse(rawDesign).length;
  const ledOptions = JSON.parse(rawLed).length;

  return (
    <LandingPage
      effectPedals={effectPedals}
      enclosureSizes={enclosureSizes}
      availableFinishes={availableProducts.length}
      uniqueColors={uniqueColors}
      uniqueFinishes={uniqueFinishes}
      designOptions={designOptions}
      ledOptions={ledOptions}
    />
  );
}
