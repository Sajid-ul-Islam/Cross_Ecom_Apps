import { Session, BotResponse } from "../types";
import { reply } from "../responses";
import { extractEntities } from "../entities";
import { lookupOrderStatus } from "../orderLookup";

/**
 * Handles the ORDER_STATUS multi-turn flow.
 */
export async function handleOrderStatusFlow(
  message: string,
  session: Session
): Promise<BotResponse> {
  const entities = extractEntities(message);

  // If already at IDLE and both phone + orderNumber are given upfront
  if (session.state === "IDLE" || session.state === "STATUS_PHONE") {
    const candidatePhone = entities.phone || session.slots.phone;
    const candidateOrder = entities.orderNumber || session.slots.orderNumber;

    if (candidatePhone && candidateOrder) {
      const result = await lookupOrderStatus(candidatePhone, candidateOrder);
      session.state = "IDLE";
      session.slots = {};

      if (result.found) {
        return {
          reply: reply(session.lang, "STATUS_FOUND", {
            orderId: result.orderId || candidateOrder,
            status: result.status || "PROCESSING",
            total: result.total || 0,
            items: result.items || "Apparel",
            date: result.date || "Recent",
          }),
          quickReplies:
            session.lang === "bn"
              ? ["নতুন পণ্য দেখুন", "কাস্টমার কেয়ার"]
              : ["Browse Products", "Contact Support"],
          state: "IDLE",
        };
      } else {
        return {
          reply: reply(session.lang, "STATUS_NOT_FOUND"),
          quickReplies:
            session.lang === "bn"
              ? ["আবার চেষ্টা করুন", "কাস্টমার কেয়ার"]
              : ["Try Again", "Human Support"],
          state: "IDLE",
        };
      }
    }
  }

  // State: STATUS_PHONE
  if (session.state === "STATUS_PHONE") {
    if (!entities.phone) {
      return {
        reply: reply(session.lang, "ORDER_INVALID_PHONE"),
        state: "STATUS_PHONE",
      };
    }

    session.slots.phone = entities.phone;
    session.state = "STATUS_ORDERNO";

    return {
      reply: reply(session.lang, "STATUS_ASK_ORDERNO"),
      quickReplies: ["#1041", "#1042", "#1045"],
      state: "STATUS_ORDERNO",
    };
  }

  // State: STATUS_ORDERNO
  if (session.state === "STATUS_ORDERNO") {
    const orderNo = entities.orderNumber || message.replace(/\D/g, "");
    if (!orderNo || orderNo.length < 3) {
      return {
        reply: reply(session.lang, "STATUS_ASK_ORDERNO"),
        state: "STATUS_ORDERNO",
      };
    }

    const phone = session.slots.phone || "";
    const result = await lookupOrderStatus(phone, orderNo);

    session.state = "IDLE";
    session.slots = {};

    if (result.found) {
      return {
        reply: reply(session.lang, "STATUS_FOUND", {
          orderId: result.orderId || orderNo,
          status: result.status || "PROCESSING",
          total: result.total || 0,
          items: result.items || "Apparel",
          date: result.date || "Recent",
        }),
        quickReplies:
          session.lang === "bn"
            ? ["অন্য পণ্য দেখুন", "সহায়তা"]
            : ["Shop More", "Support"],
        state: "IDLE",
      };
    } else {
      return {
        reply: reply(session.lang, "STATUS_NOT_FOUND"),
        quickReplies:
          session.lang === "bn"
            ? ["অর্ডার চেক করুন", "কাস্টমার কেয়ার"]
            : ["Check Order Again", "Customer Support"],
        state: "IDLE",
      };
    }
  }

  // Initial trigger from IDLE
  session.state = "STATUS_PHONE";
  return {
    reply: reply(session.lang, "STATUS_ASK_PHONE"),
    state: "STATUS_PHONE",
  };
}
