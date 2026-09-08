/* ------------------------------------------------------------------ */
/*  Seed catalog — mirrored from the live deencommerce.com store.      */
/*  Acts as the data source until live WooCommerce keys are provided.  */
/* ৳ BDT prices. Payments: COD · bKash · Cards.                       */
/* ------------------------------------------------------------------ */

export type DeenCategory =
  | "JEANS"
  | "PANJABI"
  | "SHIRT"
  | "T-SHIRT"
  | "TROUSERS"
  | "POLO"
  | "ACCESSORIES"
  | "OTHER";

export interface DeenProduct {
  id: string;
  sku: string;
  name: string;
  category: DeenCategory;
  price: number;
  salePrice?: number;
  regularPrice?: number;
  salePct?: number;
  sizes: string[];
  images: [string, string];
  gallery: string[];
  /** Woo/WP-sized image variants (all Woo-sourced, never hosted by app).
      thumb = small (grid), single = medium (PDP), full = original (zoom). */
  thumb: string;
  single: string;
  full: string;
  fabric: string;
  fit?: string; // jeans fit from Woo attribute (Regular | Slim | Straight)
  stockStatus: "instock" | "outofstock" | "onbackorder";
  stockQuantity?: number;
  rating: number;
  ratingCount: number;
  blurb: string;
  isNew?: boolean;
}

export const DELIVERY_FEES = { dhaka: 50, outside: 90, store_pickup: 0 } as const;
export const FREE_TEE_THRESHOLD = 3500;
export const CDN = "https://image.deencommerce.com/wp-content/uploads";

function p(
  id: string,
  sku: string,
  name: string,
  category: DeenCategory,
  price: number,
  salePrice: number | undefined,
  sizes: string[],
  a: string,
  b: string,
  fabric: string,
  blurb: string,
  isNew = false
): DeenProduct {
  const hasSale = typeof salePrice === "number" && salePrice < price;
  const regularPrice = hasSale ? price : undefined;
  const salePct = hasSale ? Math.round(((price - salePrice) / price) * 100) : undefined;
  return {
    id,
    sku,
    name,
    category,
    price,
    salePrice,
    regularPrice,
    salePct,
    sizes,
    images: [`${CDN}/${a}`, `${CDN}/${b}`],
    gallery: [`${CDN}/${a}`, `${CDN}/${b}`],
    thumb: `${CDN}/${a}`,
    single: `${CDN}/${a}`,
    full: `${CDN}/${a}`,
    fabric,
    stockStatus: "instock",
    rating: 0,
    ratingCount: 0,
    blurb,
    isNew,
  };
}

export const SEED_PRODUCTS: DeenProduct[] = [
  p("j1", "101-0100-149", "High-End Raw Washed Jeans – Slim Fit", "JEANS", 2490, 1743, ["30", "32", "34", "36", "38"], "2026/07/101-0100-149-Front-760x1100.jpg", "2026/07/101-0100-149-Back-760x1100.jpg", "13.5 oz premium denim, raw wash", "The signature Blue Label jean. Rich raw wash, clean slim silhouette, built to fade with you.", true),
  p("j2", "101-0100-151", "High-End Vintage Wash Jeans – Slim Fit", "JEANS", 2590, 1813, ["32", "34", "36", "38"], "2026/07/101-0100-151-Front-760x1100.jpg", "2026/07/101-0100-151-Back-760x1100.jpg", "13 oz denim, vintage wash", "Broken-in vintage wash with a modern slim cut. Comfortable at the waist, versatile everywhere.", true),
  p("j3", "101-0100-150", "High-End Whisker Faded Jeans – Slim Fit", "JEANS", 2490, undefined, ["30", "32", "34", "36", "38"], "2026/07/101-0100-150-Front-760x1100.jpg", "2026/07/101-0100-150-Back-760x1100.jpg", "13 oz denim, whisker fade", "Hand-finished whisker fades over a durable slim frame. Casual to smart-casual in one pair.", true),
  p("j4", "101-0200-151", "High-End Whisker Faded Jeans – Regular Fit", "JEANS", 2490, undefined, ["32", "34", "36", "38"], "2026/02/101-0200-151-Front-flat-image-760x1100.jpg", "2026/02/101-0200-151-model-760x1100.jpg", "13 oz denim, whisker fade", "The same whisker fade in an easy regular fit — room where you want it.", true),

  p("s1", "102-0301-013", "White Microprint Casual Half Shirt", "SHIRT", 1325, 1060, ["M", "L", "XL", "2XL", "3XL"], "2026/06/102-0301-013-Flat-Front-760x1100.jpg", "2026/06/102-0301-013-Close-shot-760x1100.jpg", "Cotton microprint poplin", "Crisp white poplin with a fine microprint. Breathable, sharp, summer-ready.", true),
  p("s2", "102-0301-004", "White Casual Half Shirt", "SHIRT", 1180, 944, ["M", "L", "XL", "2XL", "3XL"], "2026/06/102-0301-004-Flat-Front-760x1100.jpg", "2026/06/102-0301-004-Close-shot-760x1100.jpg", "Soft cotton twill", "The everyday white half shirt — clean lines, easy drape.", true),
  p("s3", "102-0301-012", "Grey Blush Casual Half Shirt", "SHIRT", 1450, 1160, ["M", "L"], "2026/05/102-0301-012-Flat-Front-760x1100.jpg", "2026/05/102-0301-012-Close-shot-760x1100.jpg", "Brushed cotton", "A muted grey-blush tone that pairs with everything in your rotation."),
  p("s4", "102-0301-001", "Burgundy Floral Casual Half Shirt", "SHIRT", 1450, 1160, ["M", "L"], "2026/05/102-0301-001-flat-front-760x1100.jpg", "2026/05/102-0301-001-Close-shot-760x1100.jpg", "Cotton floral jacquard", "Deep burgundy floral for evenings that call for something more."),
  p("s5", "102-0302-005", "Tropical Cuban Collar Shirt", "SHIRT", 1180, 944, ["M", "L", "XL", "2XL", "3XL"], "2026/05/102-0302-005-Front-760x1100.jpg", "2026/05/102-0302-005-Model-Close-shot-760x1100.jpg", "Light viscose blend", "Summer Cuban Drop — open collar, tropical print, zero effort.", true),
  p("s6", "102-0302-008", "Floral Cuban Collar Shirt", "SHIRT", 1325, 1060, ["M", "L", "XL", "2XL", "3XL"], "2026/05/102-0302-008-Front-760x1100.jpg", "2026/05/102-0302-008-Model-Close-shot-760x1100.jpg", "Light viscose blend", "Bold floral over a relaxed camp collar. Built for heat.", true),
  p("s7", "102-0302-006", "Pinstripe Cuban Collar Shirt", "SHIRT", 1325, 1060, ["M", "L", "XL", "2XL", "3XL"], "2026/05/102-0302-006-Front-760x1100.jpg", "2026/05/102-0302-006-Model-Close-shot-760x1100.jpg", "Pinstripe cotton blend", "Tailoring energy, summer attitude. Pinstripe cuban that dresses up or down.", true),
  p("s8", "102-0302-001", "Paisley Cuban Collar Shirt", "SHIRT", 1450, 1160, ["M", "L", "XL", "2XL"], "2026/05/102-0302-001-Front-760x1100.jpg", "2026/05/102-0302-001-1-760x1100.webp", "Paisley jacquard cotton", "Classic paisley reworked on a camp collar silhouette."),
  p("s9", "102-0501-002", "Striped Executive Formal Shirt", "SHIRT", 1190, 952, ["M", "L", "XL", "2XL", "3XL"], "2026/04/102-0501-002-Flat-Front-n-760x1100.jpg", "2026/04/102-0501-002-close-shot-n-760x1100.jpg", "Easy-iron cotton blend", "Minimal design, maximum impact. Boardroom-grade stripe."),
  p("s10", "102-0501-001", "Striped Executive Formal Shirt", "SHIRT", 1190, 952, ["M", "L", "XL", "2XL", "3XL"], "2026/04/102-0501-001-Flat-Front-760x1100.jpg", "2026/04/102-0501-001-close-shot-760x1100.jpg", "Easy-iron cotton blend", "The second stripe of the Executive series — slightly deeper tone."),

  p("pn1", "106-0101-132", "Edward Embroidered Panjabi", "PANJABI", 2790, 1395, ["42", "44", "46"], "2026/08/106-0101-132-Flat-Front-image-760x1100.jpg", "2026/03/106-0101-132-Close-shot-760x1100.jpg", "Cotton jacquard, coconut buttons", "Fine embroidery on breathable cotton jacquard. Regular fit, elegant finish.", true),
  p("pn2", "106-0101-114", "Motif Printed Semi Formal Panjabi", "PANJABI", 2590, 1295, ["38", "40", "42", "44", "46"], "2026/03/106-0101-114-Front-Flat-image-760x1100.jpg", "2026/03/106-0101-114-Model-1-760x1100.jpg", "Printed cotton jacquard", "All-over motif print with coconut buttons — effortless charm."),
  p("pn3", "106-0101-120", "Paisley Printed Semi Formal Panjabi", "PANJABI", 2490, 1245, ["38", "40", "42", "44", "46"], "2026/03/106-0101-120-Front-Flat-image-760x1100.jpg", "2026/03/106-0101-120-Close-shot-1-760x1100.jpg", "Paisley cotton jacquard", "Timeless paisley, summer-weight weave."),
  p("pn4", "106-0101-134", "Arrowtown Embroidered Panjabi", "PANJABI", 3190, 1595, ["42", "44", "46"], "2026/08/106-0101-134-Flat-Front-image-760x1100.jpg", "2026/03/106-0101-134-close-shot-760x1100.jpg", "Premium embroidered jacquard", "The statement piece of the season — dense embroidery, clean drape.", true),
  p("pn5", "106-0101-111", "Grey Floral Semi Formal Panjabi", "PANJABI", 2490, 1245, ["38", "40", "42", "44", "46"], "2026/03/106-0101-111-Front-Flat-image-760x1100.jpg", "2026/03/106-0101-111-Model-1-760x1100.jpg", "Floral cotton jacquard", "Understated grey floral for daytime occasions."),
  p("pn6", "106-0101-133", "Mocha Embroidered Panjabi", "PANJABI", 2790, 1395, ["42", "44"], "2026/08/106-0101-133-Flat-Front-image-760x1100.jpg", "2026/03/106-0101-133-close-shot-760x1100.jpg", "Embroidered cotton jacquard", "Warm mocha base with tonal embroidery.", true),
  p("pn7", "106-0101-110", "Green Printed Semi Formal Panjabi", "PANJABI", 2490, 1245, ["38", "40", "42", "44", "46"], "2026/03/106-0101-110-Front-Flat-image-760x1100.jpg", "2026/03/106-0101-110-Model-1-760x1100.jpg", "Printed cotton jacquard", "Deep green print, all-day breathable comfort."),
  p("pn8", "106-0101-131", "Smooth Beige Embroidered Panjabi", "PANJABI", 2790, 1395, ["42", "44", "46"], "2026/08/106-0101-131-Flat-Front-image-760x1100.jpg", "2026/03/106-0101-131-Model-760x1100.jpg", "Embroidered cotton jacquard", "Soft beige canvas, precise embroidery."),
  p("pn9", "106-0101-135", "White Beige Embroidered Panjabi", "PANJABI", 3190, 1595, ["42", "44", "46"], "2026/03/106-0101-135-Flat-Front-image-760x1100.jpg", "2026/03/106-0101-135-1-760x1100.jpg", "Premium embroidered jacquard", "Ivory-white elegance for the biggest days.", true),

  p("t1", "105-0201-032", "Full Sleeve White Stripe T-shirt", "T-SHIRT", 728, 364, ["3XL"], "2025/12/105-0201-032-full-sleeve-t-shirt-Model-for-web-760x1100.jpg", "2025/12/105-0201-032-Front-760x1100.jpg", "Combed cotton jersey", "Nautical stripe, full sleeve, easy fit."),
  p("t2", "DCFST024", "Full Sleeve Brown T-shirt – Cotton Blend", "T-SHIRT", 599, 300, ["2XL"], "2024/11/DCFST024-Front-760x1100.webp", "2024/11/DCFST024-Close-760x1100.webp", "Cotton-poly blend", "Earthy brown staple with a soft hand-feel."),
  p("t3", "105-0101-375", "Earth Hemp T-shirt", "T-SHIRT", 590, 472, ["L", "XL", "2XL", "3XL"], "2026/02/105-0101-375-Earth-Hemp-T-shirt-Front-760x1100.jpg", "2026/02/105-0101-375-Earth-Hemp-T-shirt-Back-760x1100.jpg", "Hemp-cotton blend", "Sustainable hemp blend that gets softer every wash."),
  p("t4", "105-0301-005", "Urban Ride Print Drop Shoulder T-Shirt", "T-SHIRT", 790, 632, ["L"], "2026/03/105-0301-005-Front-760x1100.jpg", "2026/03/105-0301-005-Back-760x1100.jpg", "Heavy 220gsm cotton", "Boxy drop shoulder with an urban back print.", true),
  p("t5", "105-0301-009", "Deep Violet Drop Shoulder T-Shirt", "T-SHIRT", 790, 632, ["L", "XL", "3XL"], "2026/03/105-0301-009-product-760x1100.jpg", "2026/03/105-0301-009-Back-760x1100.jpg", "Heavy 220gsm cotton", "Deep violet, relaxed drape, clean finish.", true),
  p("t6", "105-0301-008", "Crew Graphic Drop Shoulder T-Shirt", "T-SHIRT", 790, 632, ["XL", "2XL", "3XL"], "2026/03/105-0301-008-Product-760x1100.jpg", "2026/03/105-0301-008-Back-760x1100.jpg", "Heavy 220gsm cotton", "Crew-neck graphic tee with a streetwear cut."),
  p("t7", "105-0401-005", "Sable Relaxed Graphic Tank Top", "T-SHIRT", 540, 432, ["L"], "2026/03/105-0401-005-web-760x1100.jpg", "2026/03/105-0401-005-model-760x1100.jpg", "Breathable cotton tank", "Sable-toned tank for the hottest months."),
  p("t8", "105-0401-004", "Orlando Relaxed Graphic Tank Top", "T-SHIRT", 640, 512, ["2XL"], "2026/03/105-0401-004-760x1100.jpg", "2026/03/105-0401-004-Model-Image-760x1100.jpg", "Breathable cotton tank", "Orlando graphic, easy summer layering."),
  p("t9", "105-0401-009", "Gravity Relaxed Graphic Tank Top", "T-SHIRT", 590, 472, ["L", "XL"], "2026/03/105-0401-009-760x1100.jpg", "2026/03/105-0401-009-Model-Image-760x1100.jpg", "Breathable cotton tank", "Gravity print, featherweight build."),

  p("tr1", "110-0101-010", "Sky Blue Trousers", "TROUSERS", 998, 499, ["M", "L", "XL", "2XL"], "2025/11/sky-blue1-760x1100.jpg", "2025/11/110-0101-010-model-front-760x1100.jpg", "Stretch cotton twill", "Smart-casual chino in a cool sky blue."),
  p("tr2", "110-0101-013", "Maroon Trousers", "TROUSERS", 998, 499, ["L", "XL", "2XL"], "2025/11/meroon-760x1100.jpg", "2025/11/110-0101-013-model-front-760x1100.jpg", "Stretch cotton twill", "Rich maroon twill with a tapered leg."),
  p("tr3", "110-0101-015", "Teal Trousers", "TROUSERS", 998, 499, ["L", "XL", "2XL"], "2025/11/fest-760x1100.jpg", "2025/11/110-0101-015-model-front-760x1100.jpg", "Stretch cotton twill", "Vibrant teal for looks that stand out."),
  p("tr4", "110-0101-012", "Brown Trousers", "TROUSERS", 998, 499, ["L", "XL"], "2025/11/110-0101-012-Front--760x1100.jpg", "2025/11/110-0101-012-model-front-760x1100.jpg", "Stretch cotton twill", "Classic brown, office to evening."),

  p("po1", "DCPS112", "Green Stripe Polo Shirt", "POLO", 998, 798, ["L", "2XL"], "2025/05/DCPS112-Front-copy-1-760x1100.webp", "2025/05/DCPS112-Close-copy-1-760x1100.webp", "Piqué cotton", "Club-collar green stripe polo."),

  p("a1", "109-0101-068", "DEEN Trifold Genuine Leather Wallet", "ACCESSORIES", 849, undefined, ["OS"], "2025/06/Deen-Trifold-Walet-Front-68-copy-760x1100.webp", "2025/06/Deen-Trifold-Walet-Back-68-copy-760x1100.webp", "Genuine leather", "Full-grain trifold, ages beautifully."),
  p("a2", "109-0104-004", "Compact Genuine Leather Card Holder", "ACCESSORIES", 590, undefined, ["OS"], "2026/04/109-0104-004-Front-760x1100.jpg", "2026/04/109-0104-004-Inside-760x1100.jpg", "Genuine leather", "Slim card holder for the minimal pocket.", true),
  p("a3", "109-0201-001", "France World Cup Edition Bottle", "ACCESSORIES", 498, undefined, ["OS"], "2026/06/France-760x1100.jpg", "2026/06/France-760x1100.jpg", "Aluminium, 750 ml", "Match-day aluminium bottle — France edition.", true),
  p("a4", "109-0201-002", "Argentina World Cup Edition Bottle", "ACCESSORIES", 498, undefined, ["OS"], "2026/06/Argentina-1-760x1100.jpg", "2026/06/Argentina-1-760x1100.jpg", "Aluminium, 750 ml", "Match-day aluminium bottle — Argentina edition.", true),
  p("a5", "109-0301-001", "Breathable Face Mask", "ACCESSORIES", 280, undefined, ["OS"], "2025/02/Breathable-Face-Mask-760x1100.webp", "2025/02/Breathable-Face-Mask-2nd-760x1140.webp", "Washable cotton layers", "Reusable, breathable, everyday protection."),
];

export const SEED_CATEGORIES: string[] = [
  "ALL",
  "JEANS",
  "PANJABI",
  "SHIRT",
  "T-SHIRT",
  "TROUSERS",
  "POLO",
  "ACCESSORIES",
];
