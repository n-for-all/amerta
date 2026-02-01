"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/amerta/theme/ui/select";
import { getURL } from "@/amerta/utilities/getURL";

export const CategoriesSwitch = ({ locale, categories, slug, label }: { locale: string; categories: any[]; slug: string; label: string }) => {
  return (
    <Select
      onValueChange={(value) => {
        if (value) {
          window.location.href = getURL(`/blog/categories/${value}`, locale);
        }
      }}
    >
      <SelectTrigger className="w-full max-w-xs">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {categories
          .filter((cat: any) => cat.slug !== slug) // Exclude current category
          .map((cat: any) => (
            <SelectItem key={cat.id} value={cat.slug}>
              {cat.title}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};
