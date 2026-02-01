import React from "react";
import { cn } from "@/amerta/utilities/ui";

interface AvatarProps {
  initials: string;
  className?: string;
}

const getAvatarUrl = (name: string) => {
  if (!name) return "";
  const names = name.trim().split(" ");
  return names
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({ initials, className }) => {
  return <div className={cn("flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-medium", className)}>{getAvatarUrl((initials || "").trim().split(" ").slice(0, 2).join(" ")) || "?"}</div>;
};

export default Avatar;
