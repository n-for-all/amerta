import React, { useState, useMemo } from "react";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./select";
import { Search } from "lucide-react";

// Country codes data
const COUNTRIES = [
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "+41", name: "Switzerland", flag: "🇨🇭" },
  { code: "+43", name: "Austria", flag: "🇦🇹" },
  { code: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "+358", name: "Finland", flag: "🇫🇮" },
  { code: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "+421", name: "Slovakia", flag: "🇸🇰" },
  { code: "+385", name: "Croatia", flag: "🇭🇷" },
  { code: "+36", name: "Hungary", flag: "🇭🇺" },
  { code: "+40", name: "Romania", flag: "🇷🇴" },
  { code: "+359", name: "Bulgaria", flag: "🇧🇬" },
  { code: "+30", name: "Greece", flag: "🇬🇷" },
  { code: "+213", name: "Algeria", flag: "🇩🇿" },
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "+57", name: "Colombia", flag: "🇨🇴" },
  { code: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "+51", name: "Peru", flag: "🇵🇪" },
  { code: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "+506", name: "Costa Rica", flag: "🇨🇷" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "+64", name: "New Zealand", flag: "🇳🇿" },
];

interface PhoneInputProps {
  value?: {
    phoneCountryCode?: string;
    phone?: number | null;
  };
  onChange?: (data: { phoneCountryCode: string; phone: number }) => void;
  onCountryCodeChange?: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showName?: boolean;
  required?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(({ showName, value, onChange, onCountryCodeChange, placeholder = "Enter phone number", disabled = false, className = "", required = false }, ref) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState(value?.phoneCountryCode || "+1");
  const [phoneNumber, setPhoneNumber] = useState(value?.phone || "");

  const uniqueCountriesByCode = useMemo(() => {
    const map = new Map<string, (typeof COUNTRIES)[0]>();
    COUNTRIES.forEach((country) => {
      if (!map.has(country.code)) {
        map.set(country.code, country);
      }
    });
    return Array.from(map.values());
  }, []);
  // Get the selected country object for display
  const selectedCountry = useMemo(() => {
    return uniqueCountriesByCode.find((c) => c.code === selectedCountryCode);
  }, [selectedCountryCode, uniqueCountriesByCode]);

  // Filter countries based on search query (unique by code)
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return uniqueCountriesByCode;

    const query = searchQuery.toLowerCase();
    const filtered = COUNTRIES.filter((country) => country.code.includes(query) || country.name.toLowerCase().includes(query));

    // Keep only one entry per unique code
    const map = new Map<string, (typeof COUNTRIES)[0]>();
    filtered.forEach((country) => {
      if (!map.has(country.code)) {
        map.set(country.code, country);
      }
    });
    return Array.from(map.values());
  }, [searchQuery, uniqueCountriesByCode]);

  const handleCountryCodeChange = (code: string) => {
    setSelectedCountryCode(code);
    onCountryCodeChange?.(code);
    onChange?.({ phoneCountryCode: code, phone: Number(phoneNumber) });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value;
    setPhoneNumber(newPhoneNumber);
    onChange?.({ phoneCountryCode: selectedCountryCode, phone: Number(newPhoneNumber) });
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Country Code Select */}
      <Select value={selectedCountryCode} onValueChange={handleCountryCodeChange} disabled={disabled} required={required}>
        <SelectTrigger className="flex-shrink-0 w-32">
          <div className="flex items-center gap-1">
            <span>{selectedCountry?.flag}</span>
            <span>{selectedCountry?.code}</span>
            {showName && <span className="hidden text-xs sm:inline">{selectedCountry?.name}</span>}
          </div>
        </SelectTrigger>
        <SelectContent className="max-w-xs">
          {/* Search Input in Select */}
          <div className="sticky top-0 z-10 p-2 bg-white border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
              <input type="text" placeholder="Search countries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full py-2 pl-8 pr-3 text-sm border rounded-md outline-none border-zinc-200 focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-white" onClick={(e) => e.stopPropagation()} />
            </div>
          </div>

          {/* Country Options */}
          <div className="overflow-y-auto max-h-48">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <SelectItem key={`${country.code}-${country.name}`} value={country.code} className="cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-300">{country.code}</span>
                  </span>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-center text-zinc-500 dark:text-zinc-400">No countries found</div>
            )}
          </div>
        </SelectContent>
      </Select>

      {/* Phone Number Input */}
      <Input ref={ref} type="number" required={required} placeholder={placeholder} value={phoneNumber} onChange={handlePhoneChange} disabled={disabled} className="flex-1" />
    </div>
  );
});

PhoneInput.displayName = "PhoneInput";
