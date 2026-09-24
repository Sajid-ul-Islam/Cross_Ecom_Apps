import { Session, BotResponse } from "../types";
import { reply } from "../responses";
import { matchProducts } from "../productMatch";

/**
 * Handles the PRODUCT_SEARCH intent.
 */
export async function handleProductSearch(
  query: string,
  session: Session
): Promise<BotResponse> {
  const products = await matchProducts(query, 4);

  if (products.length === 0) {
    const quickReplies =
      session.lang === "bn"
        ? ["পাঞ্জাবি দেখান", "শার্ট কালেকশন", "সেলভেজ জিন্স", "কাস্টমার কেয়ার"]
        : session.lang === "banglish"
        ? ["Panjabi collection", "Shirt collection", "Selvedge Jeans", "Customer support"]
        : ["Show Panjabi", "Show Shirts", "Show Jeans", "Customer Support"];

    return {
      reply: reply(session.lang, "NO_PRODUCTS", { query }),
      products: [],
      quickReplies,
      state: "IDLE",
    };
  }

  const quickReplies =
    session.lang === "bn"
      ? ["আমি অর্ডার করতে চাই", "অন্য পণ্য খুঁজুন", "কাস্টমার কেয়ার"]
      : session.lang === "banglish"
      ? ["Order korte chai", "Onno item dekhan", "Hotline e kotha bolbo"]
      : ["I want to order", "Search other items", "Talk to human"];

  return {
    reply: reply(session.lang, "HERE_ARE_PRODUCTS"),
    products,
    quickReplies,
    actions: [
      { label: "🛍️ Browse All Products", action: "navigate_shop" },
    ],
    state: "IDLE",
  };
}
