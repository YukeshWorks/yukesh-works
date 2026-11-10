import { useEffect, useState } from "react";

type NetType = "slow-2g" | "2g" | "3g" | "4g" | "unknown";

interface NetInfo {
  effectiveType: NetType;
  saveData: boolean;
  downlink: number;
  isSlow: boolean;
  isFast: boolean;
}

interface NetworkInformation extends EventTarget {
  effectiveType?: NetType;
  saveData?: boolean;
  downlink?: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

export const useNetworkSpeed = (): NetInfo => {
  const get = (): NetInfo => {
    const connection = (navigator as NavigatorWithConnection).connection;
    const effectiveType: NetType = connection?.effectiveType ?? "unknown";
    const saveData = Boolean(connection?.saveData);
    const downlink = typeof connection?.downlink === "number" ? connection.downlink : 0;
    const isSlow = saveData || effectiveType === "slow-2g" || effectiveType === "2g";
    const isFast = !saveData && effectiveType === "4g" && (downlink === 0 || downlink >= 5);
    return { effectiveType, saveData, downlink, isSlow, isFast };
  };

  const [info, setInfo] = useState<NetInfo>(get);

  useEffect(() => {
    const connection = (navigator as NavigatorWithConnection).connection;
    if (!connection) return;
    const onChange = () => setInfo(get());
    connection.addEventListener("change", onChange);
    return () => connection.removeEventListener("change", onChange);
  }, []);

  return info;
};
