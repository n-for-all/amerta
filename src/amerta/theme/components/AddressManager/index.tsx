"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { Button } from "@/amerta/theme/ui/button";
import { Input } from "@/amerta/theme/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/amerta/theme/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/amerta/theme/ui/select";
import { useToast } from "@/amerta/theme/ui/toast";
import { Trash2, Plus, MapPin, Loader2, X, Edit, Phone, CreditCard } from "lucide-react";
import { Switch } from "@/amerta/theme/ui/switch";
import { Textarea } from "@/amerta/theme/ui/textarea";
import { ShippingCountry } from "@/amerta/theme/types";
import { Radio, RadioGroup } from "@/amerta/theme/ui/radio";
import { PhoneInput } from "@/amerta/theme/ui/phone-input";
import { useAuth } from "@/amerta/providers/Auth";
import { getServerSideURL } from "@/amerta/utilities/getURL";
import { Country, Customer } from "@/payload-types";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { printf } from "fast-printf";

// --- 1. Unified Schema (Contains flags for BOTH) ---
const addressSchema = z.object({
  title: z.string("Please enter an address title").trim().min(1, "Please enter an address title"),
  firstName: z.string("Please enter a first name").trim().min(1, "Please enter a first name"),
  lastName: z.string("Please enter a last name").trim().min(1, "Please enter a last name"),
  country: z.string("Please select a country").trim().min(1, "Please select a country"),
  city: z.string("Please enter your city").trim().min(1, "Please enter your city"),
  address: z.string("Please enter your address").trim().min(1, "Please enter your address"),
  street: z.string("Please enter your street").trim().min(1, "Please enter your street"),
  state: z.string().trim().optional(),
  building: z.string().trim().optional(),
  apartment: z.string("Please enter your apartment/unit number").trim().min(1, "Please enter your apartment/unit number"),
  postalCode: z.string().trim().optional(),
  phone: z.number().refine((val) => val !== undefined && val !== null && !isNaN(val), { message: "Please enter a valid phone number" }),
  phoneCountryCode: z.string(),
  // Both flags exist in the schema
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

// --- 2. Unified Dialog Component ---
interface AddressDialogProps {
  isOpen: boolean;
  type: "shipping" | "billing"; // Controls which default switch to show
  initialData: AddressFormData | null;
  countries: ShippingCountry[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => Promise<void>;
}

function AddressDialog({ isOpen, type, initialData, countries, loading, onClose, onSubmit }: AddressDialogProps) {
  const [cities, setCities] = useState<any[]>([]);
  const [hasSpecificCities, setHasSpecificCities] = useState(false);
  const isEditMode = !!initialData;
  const { __ } = useEcommerce();

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      country: "",
      city: "",
      address: "",
      street: "",
      state: "",
      building: "",
      apartment: "",
      postalCode: "",
      phone: undefined,
      phoneCountryCode: "",
      isDefaultShipping: false,
      isDefaultBilling: false,
    },
  });

  // Reset logic
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit Mode
        const formData = {
          title: initialData.title || "",
          firstName: initialData.firstName || "",
          lastName: initialData.lastName || "",
          country: String(initialData.country || ""),
          city: initialData.city || "",
          address: initialData.address || "",
          street: initialData.street || "",
          state: initialData.state || "",
          building: initialData.building || "",
          apartment: initialData.apartment || "",
          postalCode: initialData.postalCode || "",
          phone: initialData.phone,
          phoneCountryCode: initialData.phoneCountryCode || "",
          isDefaultShipping: initialData.isDefaultShipping || false,
          isDefaultBilling: initialData.isDefaultBilling || false,
        };
        form.reset(formData);
        handleCountryLogic(formData.country);
      } else {
        // Add Mode
        form.reset({
          title: "",
          firstName: "",
          lastName: "",
          country: "",
          city: "",
          address: "",
          street: "",
          state: "",
          building: "",
          apartment: "",
          postalCode: "",
          phone: undefined,
          phoneCountryCode: "",
          isDefaultShipping: false,
          isDefaultBilling: false,
        });
        setCities([]);
        setHasSpecificCities(false);
      }
    }
  }, [isOpen, initialData, form]);

  const handleCountryLogic = (countryId: string) => {
    if (!countryId) {
      setCities([]);
      setHasSpecificCities(false);
      return;
    }
    const selectedCountry = countries.find((c) => c.id === countryId);
    if (selectedCountry) {
      const isSpecific = selectedCountry.citiesType === "specific";
      setHasSpecificCities(isSpecific);
      if (isSpecific && Array.isArray(selectedCountry.cities)) {
        setCities(
          selectedCountry.cities.map((city: any) => ({
            id: city.code || city.city,
            name: city.city,
          })),
        );
      } else {
        setCities([]);
      }
    }
  };

  useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      if (name === "country") {
        handleCountryLogic(data.country || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form, countries]);

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4">
            <TransitionChild as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="relative w-full max-w-2xl max-h-[90vh] p-4 md:p-6 bg-white rounded-lg shadow-lg overflow-y-auto dark:bg-zinc-900">
                <button onClick={onClose} className="absolute transition-colors text-zinc-400 top-4 right-4 rtl:left-4 rtl:right-auto hover:text-zinc-600">
                  <X className="w-6 h-6" />
                </button>

                <h2 className="mb-6 text-2xl font-semibold">{isEditMode ? __("Edit Address") : type === "billing" ? __("Add Billing Address") : __("Add Shipping Address")}</h2>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Common Fields */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {__("Address Title (e.g., Home)")} <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder={__("Home")} {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone Section */}
                    <div>
                      <FormField
                        control={form.control}
                        name="phoneCountryCode"
                        render={({ field: codeField }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input type="hidden" {...codeField} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field: phoneField }) => {
                          const phoneCountryCode = form.watch("phoneCountryCode") || "";
                          const currentValue = { phoneCountryCode, phone: phoneField.value };
                          return (
                            <FormItem>
                              <FormLabel>
                                {__("Phone (For Delivery Contact)")} <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <PhoneInput
                                  value={currentValue}
                                  onChange={(value) => {
                                    form.setValue("phoneCountryCode", value.phoneCountryCode);
                                    phoneField.onChange(value.phone);
                                  }}
                                  placeholder={__("Enter your phone number")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    {/* Names */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {__("First Name")} <span className="text-red-500">*</span>
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
                              {__("Last Name")} <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Country & City */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {__("Country")} <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select value={String(field.value || "")} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={__("Select a country")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country.id} value={String(country.id)}>
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
                              {__("City")} <span className="text-red-500">*</span>
                            </FormLabel>
                            {hasSpecificCities ? (
                              <Select value={String(field.value || "")} onValueChange={field.onChange} disabled={!form.watch("country")}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={form.watch("country") ? __("Select a city") : __("Select country first")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {cities.map((city) => (
                                    <SelectItem key={city.id} value={String(city.id)}>
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

                    {/* Address Text */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {__("Address (Area/Landmark)")} <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea placeholder={__("Details")} {...field} className="resize-none" rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {__("Street")} <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder={__("Street name")} {...field} />
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
                            <FormLabel>{__("Building")}</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="apartment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {__("Apartment/Unit")} <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder={__("Apt 456")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{__("Postal Code")}</FormLabel>
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
                            <FormLabel>{__("State")}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Dynamic Default Switch based on Type */}
                    <div className="p-3 space-y-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                      {type === "shipping" ? (
                        <FormField
                          control={form.control}
                          name="isDefaultShipping"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl className="mb-0">
                                <Switch checked={field.value} onChange={field.onChange} className="w-4 h-4" />
                              </FormControl>
                              <FormLabel className="ml-1 cursor-pointer">{__("Set as default shipping address")}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name="isDefaultBilling"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl className="mb-0">
                                <Switch checked={field.value} onChange={field.onChange} className="w-4 h-4" />
                              </FormControl>
                              <FormLabel className="ml-1 cursor-pointer">{__("Set as default billing address")}</FormLabel>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={loading}>
                        {loading ? __("Saving...") : isEditMode ? __("Update Address") : __("Save Address")}
                      </Button>
                      <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        {__("Cancel")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// --- 3. Main Unified Manager Component ---
export function AddressManager({
  compact = false,
  type = "shipping", // "shipping" | "billing"
  title,
  selected,
  onSelect,
}: {
  compact?: boolean;
  type?: "shipping" | "billing";
  title?: string | null;
  selected?: string | null;
  onSelect?: (addressId: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddressData, setEditingAddressData] = useState<AddressFormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<ShippingCountry[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const toast = useToast();
  const { __ } = useEcommerce();
  const { user, setUser } = useAuth() as { user: Customer & { verified: boolean }; setUser: (user: Customer & { verified: boolean }) => void };

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${getServerSideURL()}/api/shipping/supported-countries`);
        if (response.ok) {
          const data = await response.json();
          setCountries(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch countries:", err);
      }
    };
    fetchCountries();
  }, []);

  const addresses = (user?.address?.items || []).filter((addr) => {
    if (type === "shipping") {
      return addr.type === "0" || addr.type === "2"; // Shipping or Both
    } else if (type === "billing") {
      return addr.type === "1"; // Billing or Both
    }
    return false;
  });
  const customerId = user?.id;

  const handleOpenAdd = () => {
    setEditingId(null);
    setEditingAddressData(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (addressId: string) => {
    const address = addresses.find((a) => a.id === addressId);
    if (address) {
      setEditingId(addressId);
      setEditingAddressData({
        title: address.title || "",
        firstName: address.firstName || "",
        lastName: address.lastName || "",
        country: typeof address.country === "string" ? address.country : address.country?.id || "",
        city: address.city || "",
        address: address.address || "",
        street: address.street || "",
        state: address.state || "",
        building: address.building || "",
        apartment: address.apartment || "",
        postalCode: address.postalCode || "",
        phone: address.phone!,
        phoneCountryCode: address.phoneCountryCode || "",
        isDefaultShipping: address.isDefaultShipping || false,
        isDefaultBilling: address.isDefaultBilling || false,
      });
      setDialogOpen(true);
    }
  };

  const handleDialogSubmit = async (data: AddressFormData) => {
    setLoading(true);
    try {
      const newAddresses = Array.isArray(addresses) ? [...addresses] : [];

      if (editingId) {
        // Update Mode
        const index = newAddresses.findIndex((a) => a.id === editingId);
        if (index >= 0) {
          newAddresses[index] = { ...newAddresses[index], ...data };
        }
      } else {
        // Create Mode
        newAddresses.push({
          ...data,
          id: Date.now().toString(),
        });
      }

      // Handle Defaults Logic based on the 'type' used in the dialog
      if (type === "shipping" && data.isDefaultShipping) {
        newAddresses.forEach((addr, idx) => {
          const isCurrent = editingId ? addr.id === editingId : idx === newAddresses.length - 1;
          if (!isCurrent) addr.isDefaultShipping = false;
        });
      }

      if (type === "billing" && data.isDefaultBilling) {
        newAddresses.forEach((addr, idx) => {
          const isCurrent = editingId ? addr.id === editingId : idx === newAddresses.length - 1;
          if (!isCurrent) addr.isDefaultBilling = false;
        });
      }

      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: { items: newAddresses },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || __("Failed to save address."));
      }

      const updatedCustomer = await response.json();
      setUser(updatedCustomer.doc);
      toast.success(editingId ? __("Address updated successfully") : __("Address added successfully"));
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : __("Failed to save address."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;
    setLoading(true);
    try {
      const newAddresses = Array.isArray(addresses) ? addresses.filter((addr) => addr.id !== addressToDelete) : [];
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: { items: newAddresses },
        }),
      });

      if (!response.ok) throw new Error(__("Failed to delete address"));

      const updatedCustomer = await response.json();
      setUser(updatedCustomer.doc);
      toast.success(__("Address deleted successfully"));
      setDeleteConfirmOpen(false);
      setAddressToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : __("Failed to delete address"));
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setLoading(true);
    try {
      const newAddresses = Array.isArray(addresses)
        ? addresses.map((addr) => ({
            ...addr,
            ...(type === "shipping" ? { isDefaultShipping: addr.id === addressId } : {}),
            ...(type === "billing" ? { isDefaultBilling: addr.id === addressId } : {}),
          }))
        : [];

      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: { items: newAddresses },
        }),
      });

      if (!response.ok) throw new Error(__("Failed to update default address"));

      const updatedCustomer = await response.json();
      setUser(updatedCustomer.doc);
      toast.success(printf(__(`Default %s address updated`), type));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : __("Failed to update default address"));
    } finally {
      setLoading(false);
    }
  };

  const getCountryName = (countryId: string | null | Country | undefined): string => {
    if (!countryId) return __("Unknown");
    if (typeof countryId !== "string") return countryId.name || __("Unknown");
    const country = countries.find((c) => c.id === countryId);
    return country?.name || __("Unknown");
  };

  if(!customerId){
    return null;
  }
  return (
    <div>
      <div className="">
        {title ? <h3 className="mb-2 text-lg font-semibold">{title}</h3> : null}
        {Array.isArray(addresses) && addresses.length > 0 ? (
          <div className={compact ? "grid gap-4 md:grid-cols-1" : "grid gap-4 md:grid-cols-2"}>
            <RadioGroup className="space-y-4" value={selected!}>
              {addresses.map((address) => (
                <div key={address.id} onClick={() => onSelect && onSelect(address.id!)} className={"relative flex items-center p-4 bg-white dark:bg-zinc-900 rounded-lg " + (selected === address.id ? "border-2 border-zinc-900 dark:border-zinc-700" : "border border-zinc-200 dark:border-zinc-700")}>
                  <div className="flex-1">
                    {!compact ? (
                      <div className="flex items-start justify-between mb-4">
                        <>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold">{address.title}</h4>
                            {/* Badges for Default */}
                            <div className="flex flex-col gap-1 mb-1 text-sm opacity-40">{address.type == "0" ? __("Shipping") : address.type == "1" ? __("Billing") : __("Shipping & Billing")} {__("Address")}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(address.id!);
                              }}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddressToDelete(address.id!);
                                setDeleteConfirmOpen(true);
                              }}
                              disabled={loading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="mb-1">
                          <span className="flex items-center font-medium">
                            {address.firstName} {address.lastName}
                            {compact && address.title && <span className="px-2 ml-4 text-xs py-0.5 bg-zinc-200 rounded-full dark:bg-zinc-700">{address.title}</span>}
                          </span>
                        </p>
                        {address.address && <p className="text-zinc-700 dark:text-zinc-500">{address.address}</p>}
                        <p className="flex flex-wrap gap-4 text-zinc-700 dark:text-zinc-500">
                          {address.street ? <span>{__("St:")} {address.street}</span> : null}
                          {address.apartment ? <span>{__("Apt:")} {address.apartment}</span> : null}
                          {address.phone ? (
                            <span>
                              <Phone className="inline-block w-3 h-3 mr-1" />
                              {address.phoneCountryCode} {address.phone}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 capitalize">
                          {address.city}, {getCountryName(address.country!)}
                        </p>
                      </div>
                      {!compact && (
                        <>
                          <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                            {/* Logic: Show button only if it is NOT the default for the current Type */}
                            {type === "shipping" && !address.isDefaultShipping ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetDefault(address.id!);
                                }}
                                disabled={loading}
                                className="text-xs"
                              >
                                <MapPin className="w-3 h-3 mr-1" /> {__("Set as Default")}
                              </Button>
                            ) : (
                              address.isDefaultShipping && type == "shipping" && <span className="inline-block w-fit px-2 py-0.5 text-[10px] text-blue-800 bg-blue-100 rounded">{__("Default Shipping")}</span>
                            )}
                            {type === "billing" && !address.isDefaultBilling ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetDefault(address.id!);
                                }}
                                disabled={loading}
                                className="text-xs"
                              >
                                <CreditCard className="w-3 h-3 mr-1" /> {__("Set as Default")}
                              </Button>
                            ) : (
                              address.isDefaultBilling && type == "billing" && <span className="inline-block w-fit px-2 py-0.5 text-[10px] text-green-800 bg-green-100 rounded">{__("Default Billing")}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {onSelect ? (
                    <div className="pl-4 ml-4">
                      <Radio value={address.id!} className="w-4 h-4" />
                    </div>
                  ) : null}
                </div>
              ))}
            </RadioGroup>
          </div>
        ) : !customerId ? (
          <div className={"bg-white border border-dashed rounded border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 " + (compact ? "p-4" : "p-8")}>
            <div className={"flex items-center justify-start text-zinc-500 text-sm"}>
              <Loader2 className="w-4 h-4 mr-1 animate-spin opacity-40" />
              <p className="ml-2">{__("Loading addresses...")}</p>
            </div>
          </div>
        ) : (
          <div className={"bg-white border border-dashed rounded border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 " + (compact ? "p-4" : "p-8")}>
            <div className={"flex items-center justify-start text-zinc-500 text-sm"}>
              <MapPin className="w-4 h-4 mr-1 opacity-40 rtl:ml-1 rtl:mr-0" />
              <p>{__("No addresses yet, click on the button below to add a new address.")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Trigger Button */}
      <div className="pt-4">
        <Button variant={"outline"} size={"sm"} onClick={handleOpenAdd} className="gap-2">
          <Plus className="w-4 h-4" /> {type === "billing" ? __("Add New Billing Address") : __("Add New Shipping Address")}
        </Button>
      </div>

      {/* Unified Dialog */}
      <AddressDialog
        isOpen={dialogOpen}
        type={type} // Pass type to dialog
        initialData={editingAddressData}
        countries={countries}
        loading={loading}
        onClose={() => {
          setDialogOpen(false);
          setEditingId(null);
          setEditingAddressData(null);
        }}
        onSubmit={handleDialogSubmit}
      />

      {/* Delete Confirmation */}
      <Transition show={deleteConfirmOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeleteConfirmOpen(false)}>
          <TransitionChild as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </TransitionChild>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <TransitionChild as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <DialogPanel className="w-full max-w-sm p-6 bg-white rounded-lg shadow-lg">
                  <h3 className="mb-2 text-lg font-semibold">{__("Delete Address")}</h3>
                  <p className="mb-6 text-sm text-gray-600">{__("Are you sure you want to delete this address? This action cannot be undone.")}</p>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={loading}>
                      {__("Cancel")}
                    </Button>
                    <Button type="button" onClick={handleDeleteAddress} disabled={loading} className="text-white bg-red-600 hover:bg-red-700">
                      {loading ? __("Deleting...") : __("Delete")}
                    </Button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
