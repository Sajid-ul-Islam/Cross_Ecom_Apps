import { Session, BotResponse, ProductCard } from "../types";
import { reply } from "../responses";
import { extractEntities } from "../entities";
import { matchProducts } from "../productMatch";
import { createOrder } from "../woo";
import { normalizeLower } from "../normalize";

/**
 * Handles the multi-turn PLACE_ORDER dialog state machine.
 */
export async function handlePlaceOrderFlow(
  message: string,
  session: Session
): Promise<BotResponse> {
  const norm = normalizeLower(message);
  const entities = extractEntities(message);

  // Universal Cancel
  if (
    norm === "cancel" ||
    norm === "stop" ||
    norm === "বাতিল" ||
    norm === "bad" ||
    norm === "dorkar nai" ||
    norm === "না" ||
    (norm === "no" && session.state !== "ORDER_CONFIRM")
  ) {
    session.state = "IDLE";
    session.slots = {};
    return {
      reply: reply(session.lang, "ORDER_CANCELLED"),
      quickReplies:
        session.lang === "bn"
          ? ["পণ্য কালেকশন দেখুন", "সাহায্য"]
          : ["Browse Catalog", "Help"],
      state: "IDLE",
    };
  }

  // Universal Back
  if (norm === "back" || norm === "পিছনে" || norm === "piche") {
    switch (session.state) {
      case "ORDER_CONFIRM":
        session.state = "ORDER_ADDRESS";
        return {
          reply: reply(session.lang, "ORDER_ASK_ADDRESS"),
          state: "ORDER_ADDRESS",
        };
      case "ORDER_ADDRESS":
        session.state = "ORDER_PHONE";
        return {
          reply: reply(session.lang, "ORDER_ASK_PHONE"),
          state: "ORDER_PHONE",
        };
      case "ORDER_PHONE":
        session.state = "ORDER_QTY";
        return {
          reply: reply(session.lang, "ORDER_ASK_QTY"),
          quickReplies: ["1", "2", "3"],
          state: "ORDER_QTY",
        };
      case "ORDER_QTY":
        session.state = "ORDER_SIZE";
        return {
          reply: reply(session.lang, "ORDER_ASK_SIZE"),
          quickReplies: session.slots.product?.sizes || ["M", "L", "XL", "32", "34"],
          state: "ORDER_SIZE",
        };
      case "ORDER_SIZE":
        session.state = "ORDER_PRODUCT";
        return {
          reply: reply(session.lang, "ORDER_ASK_PRODUCT"),
          state: "ORDER_PRODUCT",
        };
      default:
        session.state = "IDLE";
        return {
          reply: reply(session.lang, "GREETING"),
          state: "IDLE",
        };
    }
  }

  // State: ORDER_PRODUCT
  if (session.state === "ORDER_PRODUCT") {
    const matches = await matchProducts(message, 1);

    if (matches.length > 0) {
      const selected = matches[0];
      session.slots.product = selected;
      session.slots.productId = selected.id;
      session.slots.productName = selected.name;
      session.slots.retryCount = 0;
      session.state = "ORDER_SIZE";

      const availableSizes =
        selected.sizes && selected.sizes.length > 0
          ? selected.sizes
          : ["M", "L", "XL", "XXL", "30", "32", "34", "36"];

      return {
        reply: `${selected.name} (${selected.price} Tk) নির্বাচন করা হয়েছে।\n\n${reply(
          session.lang,
          "ORDER_ASK_SIZE"
        )}`,
        quickReplies: availableSizes.slice(0, 6),
        state: "ORDER_SIZE",
      };
    }

    // No match
    const retries = (session.slots.retryCount || 0) + 1;
    session.slots.retryCount = retries;

    if (retries >= 2) {
      session.state = "IDLE";
      session.slots = {};
      return {
        reply: reply(session.lang, "HUMAN_HANDOFF"),
        quickReplies: ["WhatsApp (+8801952700500)", "Browse All Items"],
        state: "IDLE",
      };
    }

    return {
      reply: reply(session.lang, "ORDER_ASK_PRODUCT"),
      quickReplies:
        session.lang === "bn"
          ? ["জিন্স প্যান্ট", "পাঞ্জাবি", "শার্ট", "টি-শার্ট"]
          : ["Jeans", "Panjabi", "Shirt", "T-Shirt"],
      state: "ORDER_PRODUCT",
    };
  }

  // State: ORDER_SIZE
  if (session.state === "ORDER_SIZE") {
    const size = entities.size || message.trim().toUpperCase();
    if (!size || size.length > 10) {
      return {
        reply: reply(session.lang, "ORDER_ASK_SIZE"),
        quickReplies: session.slots.product?.sizes || ["M", "L", "XL", "30", "32", "34"],
        state: "ORDER_SIZE",
      };
    }

    session.slots.size = size;
    session.state = "ORDER_QTY";

    return {
      reply: reply(session.lang, "ORDER_ASK_QTY"),
      quickReplies: ["1", "2", "3", "4"],
      state: "ORDER_QTY",
    };
  }

  // State: ORDER_QTY
  if (session.state === "ORDER_QTY") {
    const qtyVal = entities.quantity || parseInt(message.replace(/\D/g, ""), 10) || 1;
    const finalQty = Math.max(1, Math.min(10, qtyVal));

    session.slots.quantity = finalQty;
    session.state = "ORDER_PHONE";

    return {
      reply: reply(session.lang, "ORDER_ASK_PHONE"),
      state: "ORDER_PHONE",
    };
  }

  // State: ORDER_PHONE
  if (session.state === "ORDER_PHONE") {
    if (!entities.phone) {
      return {
        reply: reply(session.lang, "ORDER_INVALID_PHONE"),
        state: "ORDER_PHONE",
      };
    }

    session.slots.phone = entities.phone;
    session.state = "ORDER_ADDRESS";

    return {
      reply: reply(session.lang, "ORDER_ASK_ADDRESS"),
      state: "ORDER_ADDRESS",
    };
  }

  // State: ORDER_ADDRESS
  if (session.state === "ORDER_ADDRESS") {
    const address = message.trim();
    if (address.length < 8) {
      return {
        reply: reply(session.lang, "ORDER_ASK_ADDRESS"),
        state: "ORDER_ADDRESS",
      };
    }

    session.slots.address = address;
    session.state = "ORDER_CONFIRM";

    const product: ProductCard = session.slots.product || {
      id: "prod-1",
      name: session.slots.productName || "Product",
      price: 2450,
      image: "",
      in_stock: true,
    };

    const unitPrice = product.salePrice ?? product.price;
    const qty = session.slots.quantity || 1;
    const total = unitPrice * qty;

    return {
      reply: reply(session.lang, "ORDER_CONFIRM", {
        product: product.name,
        size: session.slots.size || "Standard",
        qty: qty,
        phone: session.slots.phone || "",
        address: address,
        total: total,
      }),
      quickReplies:
        session.lang === "bn"
          ? ["হ্যাঁ, কনফার্ম করুন", "না, বাতিল"]
          : session.lang === "banglish"
          ? ["Haa, confirm korun", "Na, cancel"]
          : ["Yes, Confirm Order", "No, Cancel"],
      state: "ORDER_CONFIRM",
    };
  }

  // State: ORDER_CONFIRM
  if (session.state === "ORDER_CONFIRM") {
    const isYes =
      norm.includes("yes") ||
      norm.includes("haa") ||
      norm.includes("ha") ||
      norm.includes("হ্যাঁ") ||
      norm.includes("confirm") ||
      norm.includes("ok") ||
      norm.includes("thik") ||
      norm.includes("হাঁ");

    const isNo =
      norm.includes("no") ||
      norm.includes("na") ||
      norm.includes("না") ||
      norm.includes("cancel") ||
      norm.includes("বাতিল");

    if (isYes) {
      const order = await createOrder({
        customerName: session.slots.customerName || "Valued Customer",
        phone: session.slots.phone || "01700000000",
        address: session.slots.address || "Dhaka, Bangladesh",
        items: [
          {
            productId: session.slots.productId || 1,
            size: session.slots.size,
            quantity: session.slots.quantity || 1,
          },
        ],
      });

      session.state = "IDLE";
      session.slots = {};

      if (order && order.id) {
        return {
          reply: reply(session.lang, "ORDER_PLACED", { orderId: order.id }),
          quickReplies:
            session.lang === "bn"
              ? ["আরো পণ্য দেখুন", "অর্ডার স্ট্যাটাস"]
              : ["Shop More", "Check Order Status"],
          state: "IDLE",
        };
      } else {
        return {
          reply: reply(session.lang, "ORDER_FAILED"),
          state: "IDLE",
        };
      }
    }

    if (isNo) {
      session.state = "IDLE";
      session.slots = {};
      return {
        reply: reply(session.lang, "ORDER_CANCELLED"),
        state: "IDLE",
      };
    }

    // Unrecognized response at confirmation step
    return {
      reply:
        session.lang === "bn"
          ? "দয়া করে অর্ডারটি কনফার্ম করতে 'হ্যাঁ' অথবা বাতিল করতে 'না' বলুন।"
          : session.lang === "banglish"
          ? "Doya kore order confirm korte 'Haa' ba cancel korte 'Na' bolun."
          : "Please reply with 'Yes' to confirm your order or 'No' to cancel.",
      quickReplies: ["Yes", "No"],
      state: "ORDER_CONFIRM",
    };
  }

  // Initial Entry into PLACE_ORDER from IDLE
  session.slots = {};
  session.state = "ORDER_PRODUCT";

  return {
    reply: `${reply(session.lang, "ORDER_START")}\n${reply(
      session.lang,
      "ORDER_ASK_PRODUCT"
    )}`,
    quickReplies:
      session.lang === "bn"
        ? ["সেলভেজ জিন্স", "পাঞ্জাবি", "শার্ট", "টি-শার্ট"]
        : ["Selvedge Jeans", "Panjabi", "Shirt", "T-Shirt"],
    state: "ORDER_PRODUCT",
  };
}
