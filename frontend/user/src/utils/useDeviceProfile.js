import { useEffect, useState } from "react";

const MOBILE_WIDTH = 767;
const TABLET_WIDTH = 992;

const getConnection = () => {
  if (typeof navigator === "undefined") return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
};

const hasCoarsePointer = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(pointer: coarse)").matches;
};

const readDeviceProfile = () => {
  if (typeof window === "undefined") {
    return {
      width: 1024,
      isMobile: false,
      isTabletOrBelow: false,
      effectiveType: "",
      saveData: false,
      isConstrained: false
    };
  }

  const width = Number(window.innerWidth || 1024);
  const coarsePointer = hasCoarsePointer();
  const connection = getConnection();
  const effectiveType = String(connection?.effectiveType || "").toLowerCase();
  const saveData = !!connection?.saveData;
  const deviceMemory = Number(navigator.deviceMemory || 0);
  const hardwareConcurrency = Number(navigator.hardwareConcurrency || 0);
  const lowBandwidth = effectiveType.includes("2g");
  const lowMemory = Number.isFinite(deviceMemory) && deviceMemory > 0 && deviceMemory <= 4;
  const lowCpu = Number.isFinite(hardwareConcurrency) && hardwareConcurrency > 0 && hardwareConcurrency <= 4;
  const isMobile = width <= MOBILE_WIDTH || (coarsePointer && width <= 900);
  const isTabletOrBelow = width <= TABLET_WIDTH || coarsePointer;
  const isConstrained = saveData || lowBandwidth || (isTabletOrBelow && (lowMemory || lowCpu));

  return {
    width,
    isMobile,
    isTabletOrBelow,
    effectiveType,
    saveData,
    isConstrained
  };
};

export const useDeviceProfile = () => {
  const [profile, setProfile] = useState(() => readDeviceProfile());

  useEffect(() => {
    const updateProfile = () => {
      setProfile(readDeviceProfile());
    };

    updateProfile();
    window.addEventListener("resize", updateProfile, { passive: true });

    const connection = getConnection();
    if (connection?.addEventListener) {
      connection.addEventListener("change", updateProfile);
    } else if (connection?.addListener) {
      connection.addListener(updateProfile);
    }

    return () => {
      window.removeEventListener("resize", updateProfile);
      if (connection?.removeEventListener) {
        connection.removeEventListener("change", updateProfile);
      } else if (connection?.removeListener) {
        connection.removeListener(updateProfile);
      }
    };
  }, []);

  return profile;
};
