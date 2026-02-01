"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { AddressForm, SupportedCountry } from "./AddressForm";
import { CheckoutFormGuestValues } from ".";

export interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  street: string;
  apartment: string;
  building?: string;
  floor?: string;
  city: string;
  cityName?: string;
  country: string;
  countryName?: string;
  state?: string;
  postalCode?: string;

  phoneCountryCode: string;
  phone?: number;
}

interface GuestAddressSectionProps {
  countries?: SupportedCountry[];
  form?: UseFormReturn<CheckoutFormGuestValues>;
  cities?: Array<{ id: string; name: string }>;
  hasSpecificCities?: boolean;
}

const STORAGE_KEY = "guest-saved-addresses";

export function GuestAddressSection({ countries = [], form, cities = [], hasSpecificCities = false }: GuestAddressSectionProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Load saved addresses from localStorage and populate form on mount
  useEffect(() => {
    const loadAddresses = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && form) {
          const addresses: SavedAddress[] = JSON.parse(stored);
          const lastAddress = addresses[addresses.length - 1];

          if (lastAddress) {
            form.setValue("email", lastAddress.email);
            form.setValue("firstName", lastAddress.firstName);
            form.setValue("lastName", lastAddress.lastName);
            form.setValue("address", lastAddress.address);
            form.setValue("street", lastAddress.street || "");
            form.setValue("apartment", lastAddress.apartment || "");
            form.setValue("building", lastAddress.building || "");
            form.setValue("floor", lastAddress.floor || "");
            form.setValue("city", lastAddress.city);
            form.setValue("country", lastAddress.country);
            form.setValue("state", lastAddress.state || "");
            form.setValue("postalCode", lastAddress.postalCode);
            form.setValue("phoneCountryCode", lastAddress.phoneCountryCode || "");
            form.setValue("phone", lastAddress.phone!);
          }
        }
      } catch (err) {
        console.error("Error loading saved addresses:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAddresses();
  }, [form]);

  // Watch form changes and update localStorage
  useEffect(() => {
    if (isLoading || !form) return;

    const subscription = form.watch((data) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const addresses: SavedAddress[] = stored ? JSON.parse(stored) : [];

        // Get the last address ID or create a new one
        const lastAddressId = addresses.length > 0 ? addresses[addresses.length - 1]!.id : Date.now().toString();

        const updatedAddress: SavedAddress = {
          id: lastAddressId,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          address: data.address || "",
          street: data.street || "",
          apartment: data.apartment || "",
          building: data.building || "",
          floor: data.floor || "",
          city: data.city || "",
          country: data.country || "",
          state: data.state || "",
          postalCode: data.postalCode || "",
          phoneCountryCode: data.phoneCountryCode || "",
          phone: data.phone || undefined,
        };

        // Update or add the address
        const existingIndex = addresses.findIndex((a) => a.id === lastAddressId);
        if (existingIndex >= 0) {
          addresses[existingIndex] = updatedAddress;
        } else {
          addresses.push(updatedAddress);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
      } catch (err) {
        console.error("Error updating localStorage:", err);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, isLoading]);

  if (isLoading || !form) {
    return null;
  }

  return <AddressForm form={form} countries={countries} cities={cities} hasSpecificCities={hasSpecificCities} />;
}

export const useGuestAddressStorage = () => {
  const saveAddress = (address: SavedAddress) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const addresses: SavedAddress[] = stored ? JSON.parse(stored) : [];
      const existingIndex = addresses.findIndex((a) => a.id === address.id);

      if (existingIndex >= 0) {
        addresses[existingIndex] = address;
      } else {
        addresses.push(address);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
      return true;
    } catch (err) {
      console.error("Error saving address:", err);
      return false;
    }
  };

  return { saveAddress };
};
