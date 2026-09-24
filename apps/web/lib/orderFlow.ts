import { Session, BotResponse, Intent } from "./types";
import { reply } from "./responses";
import { handlePlaceOrderFlow } from "./flows/placeOrder";
import { handleOrderStatusFlow } from "./flows/orderStatus";
import { handleProductSearch } from "./flows/productSearch";

/**
 * Main dialog manager and state machine dispatcher.
 */
export async function processDialogTurn(
  message: string,
  session: Session,
  classifiedIntent: Intent
): Promise<BotResponse> {
  // 1. If session is already in an active multi-turn order flow
  if (
    session.state === "ORDER_PRODUCT" ||
    session.state === "ORDER_SIZE" ||
    session.state === "ORDER_QTY" ||
    session.state === "ORDER_PHONE" ||
    session.state === "ORDER_ADDRESS" ||
    session.state === "ORDER_CONFIRM"
  ) {
    return handlePlaceOrderFlow(message, session);
  }

  // 2. If session is in an active order status lookup flow
  if (
    session.state === "STATUS_PHONE" ||
    session.state === "STATUS_ORDERNO"
  ) {
    return handleOrderStatusFlow(message, session);
  }

  // 3. Otherwise, session is IDLE -> Route based on classified intent
  switch (classifiedIntent) {
    case "PLACE_ORDER":
      return handlePlaceOrderFlow(message, session);

    case "ORDER_STATUS":
      return handleOrderStatusFlow(message, session);

    case "PRODUCT_SEARCH":
      return handleProductSearch(message, session);

    case "HUMAN_HANDOFF":
      return {
        reply: reply(session.lang, "HUMAN_HANDOFF"),
        quickReplies: [
          "WhatsApp (+8801952700500)",
          session.lang === "bn" ? "পণ্য দেখুন" : "Browse Products",
        ],
        state: "IDLE",
      };

    case "GREETING":
      return {
        reply: reply(session.lang, "GREETING"),
        quickReplies:
          session.lang === "bn"
            ? ["পাঞ্জাবি কালেকশন", "সেলভেজ জিন্স", "অর্ডার করতে চাই", "অর্ডার স্ট্যাটাস"]
            : session.lang === "banglish"
            ? ["Panjabi collection", "Selvedge Jeans", "Order korte chai", "Order status check"]
            : ["Panjabi Collection", "Selvedge Jeans", "Place an Order", "Track Order"],
        state: "IDLE",
      };

    case "UNKNOWN":
    default:
      // Log all UNKNOWN intents to server console with raw message + detected lang per requirements
      console.log(
        `[bot-unknown-intent] Unmatched message: "${message}" | Lang: ${session.lang}`
      );

      return {
        reply: reply(session.lang, "FALLBACK"),
        quickReplies:
          session.lang === "bn"
            ? ["পাঞ্জাবি কালেকশন", "জিন্স প্যান্ট", "অর্ডার করতে চাই", "কাস্টমার সাপোর্ট"]
            : session.lang === "banglish"
            ? ["Panjabi dekhbo", "Jeans pant", "Order korte chai", "Support e kotha bolbo"]
            : ["Show Products", "Place an Order", "Order Status", "Human Support"],
        state: "IDLE",
      };
  }
}
