"use client";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/amerta/theme/ui/form";
import { Input } from "@/amerta/theme/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/amerta/theme/ui/select";
import { Textarea } from "@/amerta/theme/ui/textarea";
import { PhoneInput } from "@/amerta/theme/ui/phone-input";
import { UseFormReturn } from "react-hook-form";
import { CheckoutFormGuestValues } from ".";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

export interface SupportedCountry {
  id: string;
  name: string;
  display_name: string;
  iso_2: string;
  iso_3: string;
  citiesType: "all" | "specific";
  cities: Array<{ city: string; code?: string; active: boolean }>;
}

interface AddressFormProps {
  form: UseFormReturn<CheckoutFormGuestValues>;
  countries: SupportedCountry[];
  hasSpecificCities: boolean;
  cities: Array<{ id: string; name: string }>;
}

export function AddressForm({ form, countries, hasSpecificCities, cities }: AddressFormProps) {
  const { __ } = useEcommerce();
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* First and Last Name */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                First Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Last Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Country and City */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Country <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                City <span className="text-red-500">*</span>
              </FormLabel>
              {hasSpecificCities ? (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.watch("country")}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={form.watch("country") ? "Select a city" : "Select country first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FormControl>
                  <Input {...field} placeholder={__("Enter your city")} disabled={!form.watch("country")} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Address (Area/Landmark) */}
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Address (Area/Landmark) <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Textarea placeholder="Enter area or landmark details" {...field} className="resize-none" rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Street */}
      <FormField
        control={form.control}
        name="street"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Street <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Street name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Building and Apartment */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="apartment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Apartment/Unit <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="building"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Postal Code and Area */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State/Province</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Phone - TWO FormFields */}
      <div className="grid items-end grid-cols-1 gap-4">
        {/* Phone Country Code */}
        <FormField
          control={form.control}
          name="phoneCountryCode"
          render={({ field: codeField }) => (
            <FormItem className="hidden">
              <FormControl>
                {/* Hidden - managed by PhoneInput */}
                <Input type="hidden" {...codeField} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Number */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field: phoneField }) => {
            // Get both values from form
            const phoneCountryCode = form.watch("phoneCountryCode") || "";
            const currentValue = {
              phoneCountryCode,
              phone: phoneField.value,
            };

            return (
              <FormItem>
                <FormLabel>
                  Phone (For Delivery Contact) <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <PhoneInput
                    value={currentValue || null}
                    onChange={(value) => {
                      // Update BOTH form fields with validation trigger
                      form.setValue("phoneCountryCode", value.phoneCountryCode, { shouldValidate: true });
                      phoneField.onChange(value.phone); // Triggers phone field validation
                    }}
                    placeholder="Enter your phone number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
}
