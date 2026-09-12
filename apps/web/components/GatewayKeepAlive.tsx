"use client";

import { useEffect } from "react";
import { startWebGatewayKeepAlive } from "@/lib/api";

export default function GatewayKeepAlive() {
  useEffect(() => {
    return startWebGatewayKeepAlive();
  }, []);

  return null;
}
