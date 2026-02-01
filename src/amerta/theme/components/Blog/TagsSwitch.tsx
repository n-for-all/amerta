"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/amerta/theme/ui/select";
import { getURL } from "@/amerta/utilities/getURL";

export const TagsSwitch = ({ locale, tags, slug, label }: { locale: string; tags: any[]; slug: string; label: string }) => {
  return (
    <Select
      onValueChange={(value) => {
        if (value) {
          window.location.href = getURL(`/blog/tags/${value}`, locale);
        }
      }}
    >
      <SelectTrigger className="w-full max-w-xs">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {tags
          .filter((cat: any) => cat.slug !== slug) // Exclude current tag
          .map((cat: any) => (
            <SelectItem key={cat.id} value={cat.slug}>
              {cat.title}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};
