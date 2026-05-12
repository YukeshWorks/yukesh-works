import { useEffect, useState } from "react";

type NetType = "slow-2g" | "2g" | "3g" | "4g" | "unknown";

interface NetInfo {
  effectiveType: NetType;
  saveData: boolean;
  isSlow: boolean; // true on 2g/slow-2g or saveData
}

export const useNetworkSpeed = (): NetInfo => {
  const get = (): NetInfo => {
    const c = (navigator as any).connection;
    const effectiveType: NetType = c?.effectiveType ?? "unknown";
    const saveData: boolean = !!c?.saveData;
    const isSlow = saveData || effectiveType === "slow-2g" || effectiveType === "2g";
    return { effectiveType, saveData, isSlow };
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
