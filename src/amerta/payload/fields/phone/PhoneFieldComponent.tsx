"use client";

import React, { useState, useMemo } from "react";
import { Button, TextInput, useField } from "@payloadcms/ui";
import { Search } from "lucide-react";
import "./index.scss";
import { TextFieldClientProps } from "payload";

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

type PhoneFieldProps = {
  path?: string;
  onChange?: (value: string) => void;
} & TextFieldClientProps;

const PhoneFieldComponent: React.FC<PhoneFieldProps> = ({ path, field, onChange }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { value: fieldValue, setValue } = useField<string>({ path: path || field.name });

  // Get unique countries
  const uniqueCountriesByCode = useMemo(() => {
    const map = new Map<string, (typeof COUNTRIES)[0]>();
    COUNTRIES.forEach((country) => {
      if (!map.has(country.code)) {
        map.set(country.code, country);
      }
    });
    return Array.from(map.values());
  }, []);

  // Filter countries
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return uniqueCountriesByCode;

    const query = searchQuery.toLowerCase();
    const filtered = COUNTRIES.filter((country) => country.code.includes(query) || country.name.toLowerCase().includes(query));

    const map = new Map<string, (typeof COUNTRIES)[0]>();
    filtered.forEach((country) => {
      if (!map.has(country.code)) {
        map.set(country.code, country);
      }
    });
    return Array.from(map.values());
  }, [searchQuery, uniqueCountriesByCode]);

  const selectedCountry = uniqueCountriesByCode.find((c) => c.code === fieldValue);

  const handleCountryChange = (code: string) => {
    setValue(code);
    setIsOpen(false);
  };

  return (
    <div className="PhoneFieldComponent__wrapper">
      <input type="hidden" value={fieldValue} name={path} />
      <div className="PhoneFieldComponent__dropdown">
        <Button onClick={() => setIsOpen(!isOpen)} className="PhoneFieldComponent__toggle">
          <span>{selectedCountry?.flag}</span>
          <span>{selectedCountry?.code}</span>
        </Button>

        {isOpen && (
          <div className="PhoneFieldComponent__menu">
            {/* Search */}
            <div className="PhoneFieldComponent__search-wrapper">
              <div className="PhoneFieldComponent__search-container">
                <Search className="PhoneFieldComponent__search-icon" />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="PhoneFieldComponent__search-input" onClick={(e) => e.stopPropagation()} />
              </div>
            </div>

            {/* Options */}
            <div className="PhoneFieldComponent__options">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button key={`${country.code}-${country.name}`} onClick={() => handleCountryChange(country.code)} className="PhoneFieldComponent__option">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                    <span className="PhoneFieldComponent__option-code">{country.code}</span>
                  </button>
                ))
              ) : (
                <div className="PhoneFieldComponent__no-results">No countries found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneFieldComponent;
