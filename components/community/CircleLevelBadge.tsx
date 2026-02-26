"use client";

import { CircleLevel } from "@prisma/client";

type CircleLevelBadgeProps = {
  level: CircleLevel;
  size?: "sm" | "md" | "lg";
};

export default function CircleLevelBadge({
  level,
  size = "md",
}: CircleLevelBadgeProps) {
  const getLabel = () => {
    switch (level) {
      case CircleLevel.STATE:
        return "State";
      case CircleLevel.DISTRICT:
        return "District";
      case CircleLevel.MOHALLA:
        return "Mohalla";
      default:
        return "";
    }
  };

  const getColor = () => {
    switch (level) {
      case CircleLevel.STATE:
        return "bg-[#0F1F6B] text-white";
      case CircleLevel.DISTRICT:
        return "bg-[#2B4FD4] text-white";
      case CircleLevel.MOHALLA:
        return "bg-[#F59E0B] text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-0.5";
      case "lg":
        return "text-sm px-3 py-1";
      default:
        return "text-xs px-2.5 py-1";
    }
  };

  return (
    <span
      className={`rounded-full font-medium ${getColor()} ${getSizeClass()}`}
    >
      {getLabel()}
    </span>
  );
}
