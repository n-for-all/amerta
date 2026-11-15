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

/**
 * Payload admin avatar (replaces Gravatar). Shows initials of the user's name
 * (e.g. "Naji Amer" → "NA"), or the first 2 letters of a single name / email.
 */
export const AdminAvatar = ({ user }: { user?: { name?: string | null; email?: string | null } | null }) => {
  const source = (user?.name || user?.email?.split("@")[0] || "").trim();
  const words = source.split(/\s+/).filter(Boolean);
  const letters = (words.length > 1 ? `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}` : source.slice(0, 2)).toUpperCase() || "?";
  return (
    <div
      aria-label={source}
      style={{
        width: 25,
        height: 25,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        background: "var(--theme-elevation-150)",
        color: "var(--theme-elevation-800)",
      }}
    >
      {letters}
    </div>
  );
};

export default Avatar;
