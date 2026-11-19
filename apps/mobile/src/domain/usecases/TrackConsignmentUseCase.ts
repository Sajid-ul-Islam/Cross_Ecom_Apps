/**
 * Clean Architecture --- UseCase: TrackConsignmentUseCase
 *
 * Enforces Pathao Logistics Tracking standards (§1.2):
 * - Consignment IDs are NEVER faked or auto-generated.
 * - When a real consignment ID is present, resolves the live merchant tracking URL:
 *   https://merchant.pathao.com/tracking?consignment_id={id}
 * - When absent, returns "Preparing Dispatch" with no fake link.
 */

import { DomainConsignmentTracking } from "../models/types";

export class TrackConsignmentUseCase {
  public static readonly PATHAO_TRACKING_BASE = "https://merchant.pathao.com/tracking?consignment_id=";

  public execute(consignmentId?: string | null): DomainConsignmentTracking {
    const trimmed = (consignmentId || "").trim();

    // Check if real consignment ID is present (not empty, not synthetic placeholder)
    if (!trimmed || trimmed === "none" || trimmed === "pending" || trimmed.toLowerCase().includes("mock")) {
      return {
        hasTracking: false,
        consignmentId: null,
        trackingUrl: null,
        statusLabel: "Preparing Dispatch",
      };
    }

    return {
      hasTracking: true,
      consignmentId: trimmed,
      trackingUrl: `${TrackConsignmentUseCase.PATHAO_TRACKING_BASE}${encodeURIComponent(trimmed)}`,
      statusLabel: `Dispatched via Pathao (${trimmed})`,
    };
  }
}
