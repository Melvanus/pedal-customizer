import path from "path";
import fs from "fs/promises";

import { LandingPage } from "./landing-page";

export default async function HomePage() {
  const dataPath = path.join(process.cwd(), "Enclosures", "enclosures_data.json");
  const designPath = path.join(process.cwd(), "Enclosures", "design_labeling.json");
  const ledPath = path.join(process.cwd(), "Enclosures", "led.json");
  const otherPath = path.join(process.cwd(), "Enclosures", "other.json");

  const [rawData, rawDesign, rawLed, rawOther] = await Promise.all([
    fs.readFile(dataPath, "utf-8"),
    fs.readFile(designPath, "utf-8"),
    fs.readFile(ledPath, "utf-8"),
    fs.readFile(otherPath, "utf-8"),
  ]);

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
  const otherOptions = JSON.parse(rawOther).length;

  return (
    <LandingPage
      availableFinishes={availableProducts.length}
      uniqueColors={uniqueColors}
      uniqueFinishes={uniqueFinishes}
      designOptions={designOptions}
      ledOptions={ledOptions}
      otherOptions={otherOptions}
    />
  );
}
