import path from "path";
import fs from "fs/promises";

import { PedalCustomizer, type OptionItem, type PaintOption } from "@/components/pedal-customizer";

const toNumber = (price: string | number | undefined) => {
  if (typeof price === "number") return price;
  if (!price) return 0;
  const normalized = price.replace(/[^0-9.]/g, "");
  return Number.parseFloat(normalized || "0");
};

const resolveImageUrl = (fileName: string) =>
  `/api/enclosures/image/${encodeURIComponent(fileName)}`;

type RawOption = {
  name: string;
  price: number;
  image: string;
  customerPriceEUR: number;
  shortDescription?: string;
  longDescription?: string;
};

export default async function CustomizePage() {
  const dataPath = path.join(process.cwd(), "Enclosures", "enclosures_data.json");
  const designPath = path.join(process.cwd(), "Enclosures", "design_labeling.json");
  const ledPath = path.join(process.cwd(), "Enclosures", "led.json");
  const otherPath = path.join(process.cwd(), "Enclosures", "other.json");
  const imageDir = path.join(process.cwd(), "Enclosures", "images");

  const [rawData, rawDesign, rawLed, rawOther, imageFiles] = await Promise.all([
    fs.readFile(dataPath, "utf-8"),
    fs.readFile(designPath, "utf-8"),
    fs.readFile(ledPath, "utf-8"),
    fs.readFile(otherPath, "utf-8"),
    fs.readdir(imageDir),
  ]);

  const data = JSON.parse(rawData) as {
    products: Array<{
      sku: string;
      name: string;
      price: string;
      available: boolean;
      finish_info?: { finish_type?: string };
      color_info?: { primary_color?: string };
      displayedName: string;
      customerPriceEUR: number;
      shortDescription?: string;
      longDescription?: string;
    }>;
  };

  const mapOptionImage = (imageName: string) => resolveImageUrl(imageName || "Logo.png");

  const paintOptions: PaintOption[] = data.products
    .filter((product) => product.available)
    .map((product) => {
      const matchedImage = imageFiles.find((file) =>
        file.toLowerCase().startsWith(product.sku.toLowerCase())
      );
      const image = resolveImageUrl(matchedImage ?? "Logo.png");

      return {
        id: product.sku,
        sku: product.sku,
        name: product.name,
        price: toNumber(product.price),
        image,
        finish: product.finish_info?.finish_type,
        color: product.color_info?.primary_color,
        available: product.available,
        displayedName: product.displayedName,
        customerPriceEUR: product.customerPriceEUR,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
      };
    });

  const designOptions = (JSON.parse(rawDesign) as RawOption[]).map((item) => ({
    ...item,
    id: item.name.toLowerCase().replace(/\s+/g, "-"),
    image: mapOptionImage(item.image),
  }));

  const ledOptions = (JSON.parse(rawLed) as RawOption[]).map((item) => ({
    ...item,
    id: item.name.toLowerCase().replace(/\s+/g, "-"),
    image: mapOptionImage(item.image),
  }));

  const otherOptions = (JSON.parse(rawOther) as RawOption[]).map((item) => ({
    ...item,
    id: item.name.toLowerCase().replace(/\s+/g, "-"),
    image: mapOptionImage(item.image),
  }));

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <PedalCustomizer
        paintOptions={paintOptions}
        designOptions={designOptions}
        ledOptions={ledOptions}
        otherOptions={otherOptions}
      />
    </main>
  );
}
