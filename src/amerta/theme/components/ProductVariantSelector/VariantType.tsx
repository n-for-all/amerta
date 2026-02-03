"use client";

import { cn } from "@/amerta/utilities/ui";
import { Tooltip } from "@/amerta/theme/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/amerta/theme/ui/select";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";
import { ProductMedia } from "@/payload-types";

// ✅ 1. Define the specific shape of a single choice
export interface VariantChoice {
  label: string;
  value: string;
  isSelected: boolean;
  isAvailable: boolean;
  hidden: boolean;
  meta?: string | ProductMedia | null; // Hex code (Color) or Image Media
}

// ✅ 2. Define exactly what the UI needs
interface SelectorUIProps {
  label: string; // "Size", "Color"
  choices: VariantChoice[];
  onSelect: (value: string) => void;
  compact?: boolean;
}

// --- COLOR ---
export const VariantColorSelector = ({ choices, onSelect, compact }: SelectorUIProps) => {
  if (!choices.length) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {choices.map((c) => (
        <Tooltip key={c.value} content={c.label}>
          <button
            type="button"
            onClick={() => onSelect(c.value)}
            disabled={!c.isAvailable}
            className={cn("h-8 w-8 rounded-full transition-all relative ring-offset-2 focus:outline-none", c.isSelected ? "ring-2 ring-zinc-600 scale-105" : "ring-1 ring-zinc-200 hover:scale-105", !c.isAvailable && "opacity-20 cursor-not-allowed ring-zinc-100", compact && "h-5 w-5")}
            style={{ backgroundColor: typeof c.meta === "string" ? c.meta : "#000" }}
          />
        </Tooltip>
      ))}
    </div>
  );
};

// --- IMAGE ---
export const VariantImageSelector = ({ choices, onSelect, compact }: SelectorUIProps) => {
  if (!choices.length) return null;

  const getUrl = (media: any) => (typeof media === "string" ? media : media?.url);

  return (
    <div className="flex flex-wrap gap-4">
      {choices.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onSelect(c.value)}
          disabled={!c.isAvailable}
          className={cn("relative h-16 w-16 overflow-hidden rounded-xs border-2 transition-all", c.isSelected ? "border-blue-600 opacity-100 ring-1 ring-blue-600" : "border-zinc-200 opacity-80 hover:opacity-100", !c.isAvailable && "opacity-30 grayscale cursor-not-allowed", compact && "h-10 w-10")}
          title={c.label}
        >
          {c.meta ? <ImageMedia src={getUrl(c.meta)!} alt={c.label} fill imgClassName="object-cover" /> : <span className="p-1 text-xs">{c.label}</span>}
        </button>
      ))}
    </div>
  );
};

// --- DROPDOWN ---
export const VariantDropdownSelector = ({ label, choices, onSelect, compact }: SelectorUIProps) => {
  if (!choices.length) return null;

  const selected = choices.find((c) => c.isSelected)?.value || "";

  return (
    <div className="relative w-full max-w-xs">
      <Select value={selected} onValueChange={onSelect}>
        <SelectTrigger className="text-left rtl:text-right">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {choices.map((c) => (
            <SelectItem key={c.value} value={c.value} disabled={!c.isAvailable}>
              {c.label} {!c.isAvailable && "(Unavailable)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// --- TEXT / RADIO ---
export const VariantTextSelector = ({ choices, onSelect, compact }: SelectorUIProps) => {
  if (!choices.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {choices.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onSelect(c.value)}
          disabled={!c.isAvailable}
          className={cn(
            "px-4 py-2 text-sm font-medium border transition-colors",
            c.isSelected ? "bg-black text-white border-black" : "bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400",
            !c.isAvailable && "bg-zinc-50 text-zinc-300 border-zinc-100 cursor-not-allowed line-through",
            compact && "text-xs px-2 py-1.5",
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
};
