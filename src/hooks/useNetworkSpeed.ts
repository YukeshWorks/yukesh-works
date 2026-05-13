import { useEffect, useState } from "react";

type NetType = "slow-2g" | "2g" | "3g" | "4g" | "unknown";

interface NetInfo {
  effectiveType: NetType;
  saveData: boolean;
  downlink: number; // Mbps (0 if unknown)
  isSlow: boolean;  // 2g/slow-2g or saveData
  isFast: boolean;  // 4g + no saveData + downlink >= 5 Mbps (or unknown but 4g)
}

export const useNetworkSpeed = (): NetInfo => {
  const get = (): NetInfo => {
    const c = (navigator as any).connection;
    const effectiveType: NetType = c?.effectiveType ?? "unknown";
    const saveData: boolean = !!c?.saveData;
    const downlink: number = typeof c?.downlink === "number" ? c.downlink : 0;
    const isSlow = saveData || effectiveType === "slow-2g" || effectiveType === "2g";
    const isFast =
      !saveData &&
      effectiveType === "4g" &&
      (downlink === 0 || downlink >= 5);
    return { effectiveType, saveData, downlink, isSlow, isFast };
  };

  const [info, setInfo] = useState<NetInfo>(get);

  useEffect(() => {
    const c = (navigator as any).connection;
    if (!c) return;
    const onChange = () => setInfo(get());
    c.addEventListener?.("change", onChange);
    return () => c.removeEventListener?.("change", onChange);
  }, []);

  return info;
};
