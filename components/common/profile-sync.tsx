"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

interface ProfileSyncProps {
  profileId: string;
  displayName: string;
  level: number;
  xp: number;
  controlIndex: number;
  copToUsdRate: number;
}

export function ProfileSync({ profileId, displayName, level, xp, controlIndex, copToUsdRate }: ProfileSyncProps) {
  const setProfile = useAppStore((s) => s.setProfile);
  const setCopToUsdRate = useAppStore((s) => s.setCopToUsdRate);

  useEffect(() => {
    setProfile({ profileId, displayName, level, xp, controlIndex });
    setCopToUsdRate(copToUsdRate);
  }, [profileId, displayName, level, xp, controlIndex, copToUsdRate, setProfile, setCopToUsdRate]);

  return null;
}
