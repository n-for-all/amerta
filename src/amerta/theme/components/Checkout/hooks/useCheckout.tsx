"use client";

import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CartWithCalculations, PaymentMethod } from "@/amerta/theme/types";
import { Customer, EcommerceSettings } from "@/payload-types";
import { useGuestAddressStorage, SavedAddress } from "../GuestAddressSection";
import { PaymentHandle } from "../../Payment/gateways/types";
import { CheckoutFormValues } from "..";
import { useRouter } from "next/navigation";
import { getURL } from "@/amerta/utilities/getURL";
import { OrderSubmissionPayload } from "@/amerta/theme/types/order-submission";

export const requiredString = (message: string) => z.string({ error: message }).min(1, message);

export const checkoutSchema = z.object({
  email: z.email("Please enter a valid email address"),
  firstName: requiredString("First name is required"),
  lastName: requiredString("Last name is required"),
  company: z.string().optional(),
  address: requiredString("Address is required"),
  street: requiredString("Street is required"),
  floor: z.string().optional(),
  apartment: requiredString("Apartment/Unit is required"),
  building: z.string().optional(),
  city: requiredString("City is required"),
  country: requiredString("Country is required"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  phoneCountryCode: requiredString("Country code is required"),
  phone: z.number("Phone number is required").min(1, "Phone number is required"),
  deliveryMethodId: requiredString("Please select a delivery method"),
  paymentMethodId: requiredString("Payment method is required"),
  orderNote: z.string().optional(),
  billingAddressId: z.string().optional(),
});

export const loggedInCheckoutSchema = z.object({
  addressId: requiredString("Please select a shipping address"),
  billingAddressId: z.string().optional(),
  deliveryMethodId: requiredString("Please select a delivery method"),
  paymentMethodId: requiredString("Payment method is required"),
  orderNote: z.string().optional(),
});

export const CheckoutContext = createContext<{
  form: UseFormReturn<CheckoutFormValues>;
  checkoutState: ReturnType<typeof useCheckout>;
  data: { countries: any[]; paymentMethods: PaymentMethod[] };
  customer: Customer | null;
  ecommerceSettings: EcommerceSettings;
  deliveryMethods: any[];
  loadingDeliveryMethods: boolean;
  locale: string;
  paymentMethodRef: React.MutableRefObject<PaymentHandle | null>;
} | null>(null);

interface UseCheckoutProps {
  cart: CartWithCalculations | null;
  customer: Customer | null;
  data: { countries: any[]; paymentMethods: PaymentMethod[] };
  paymentMethodRef: React.MutableRefObject<PaymentHandle | null>;
  locale: string;
}

export function useCheckout({ cart: initialCart, customer, data, paymentMethodRef, locale }: UseCheckoutProps) {
  const [cart, setCart] = useState<CartWithCalculations | null>(initialCart);
  const [deliveryMethods, setDeliveryMethods] = useState<any[]>([]);
  const [loadingDeliveryMethods, setLoadingDeliveryMethods] = useState(false);
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [hasSpecificCities, setHasSpecificCities] = useState(false);

  const [taxRates, setTaxRates] = useState<Array<{ id: string; name: string; rate: number; code: string }>>([]);
  const [loadingTaxes, setLoadingTaxes] = useState(false);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { saveAddress: saveGuestAddress } = useGuestAddressStorage();
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const router = useRouter();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(customer ? loggedInCheckoutSchema : checkoutSchema),
    mode: "onSubmit",
    defaultValues: {
      email: customer?.email || "",
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      country: "",
      city: "",
      paymentMethodId: data?.paymentMethods?.[0]?.id || "",
      addressId: customer?.address?.items?.find((a) => a.isDefaultShipping)?.id || "",
      billingAddressId: "",
    },
  });

  const watchCountry = form.watch("country");
  const watchCity = form.watch("city");
  const watchDeliveryMethod = form.watch("deliveryMethodId");
  const watchPaymentMethodId = form.watch("paymentMethodId");
  const watchAddressId = form.watch("addressId");

  const deliveryMethodRef = useRef(watchDeliveryMethod);

  const handleCountryChange = useCallback(
    async (countryId: string) => {
      if (!countryId) {
        setCities([]);
        setHasSpecificCities(false);
        setTaxRates([]);
        return;
      }

      const selectedCountry = data.countries.find((c) => c.id === countryId);
      if (selectedCountry) {
        const isSpecific = selectedCountry.citiesType === "specific";
        setHasSpecificCities(isSpecific);
        setCities(isSpecific && Array.isArray(selectedCountry.cities) ? selectedCountry.cities.map((city: any) => ({ id: city.code || city.city, name: city.city })) : []);
      } else {
        setCities([]);
        setHasSpecificCities(false);
      }

      setLoadingTaxes(true);
      try {
        const response = await fetch(`/api/tax-rate/get-by-country?country=${countryId}`);
        const resData = await response.json();
        setTaxRates(resData.success ? resData.data : []);
      } catch (error) {
        console.error("Failed to fetch tax rates", error);
        setTaxRates([]);
      } finally {
        setLoadingTaxes(false);
      }
    },
    [data.countries],
  );

  useEffect(() => {
    deliveryMethodRef.current = watchDeliveryMethod;
  }, [watchDeliveryMethod]);

  useEffect(() => {
    const loadShippingMethods = async () => {
      let countryId = watchCountry;
      let cityValue = watchCity;

      if (customer && watchAddressId) {
        const addr = customer.address?.items?.find((a) => a.id === watchAddressId);
        if (addr) {
          countryId = typeof addr.country === "string" ? addr.country : addr.country?.id || "";
          cityValue = addr.city || "";
        }
      }

      if (!countryId) return;

      setLoadingDeliveryMethods(true);
      try {
        const params = new URLSearchParams({ country: countryId });
        if (cityValue) params.append("city", cityValue);

        const response = await fetch(`/api/shipping/get?${params.toString()}`);
        const resData = await response.json();

        const currentMethod = deliveryMethodRef.current;
        if (resData.success && Array.isArray(resData.data)) {
          setDeliveryMethods(resData.data);
          if (resData.data.length > 0 && (!currentMethod || !isInitialLoad)) {
            const currentExists = resData.data.find((m: any) => m.id === currentMethod);
            if (!currentExists) {
              form.setValue("deliveryMethodId", resData.data[0].id);
            }
          }
          if (isInitialLoad) setIsInitialLoad(false);
        } else {
          setDeliveryMethods([]);
        }
      } catch (err) {
        console.error("Error loading shipping methods:", err);
        setDeliveryMethods([]);
      } finally {
        setLoadingDeliveryMethods(false);
      }
    };

    loadShippingMethods();
  }, [watchCountry, watchCity, watchAddressId, customer, isInitialLoad, form]);

  useEffect(() => {
    if (watchCountry) handleCountryChange(watchCountry);
  }, [watchCountry, handleCountryChange]);

  const selectedShippingMethod = deliveryMethods.find((m) => m.id === watchDeliveryMethod);
  const subtotal = cart?.subtotal || 0;
  const discount = cart?.discount || 0;
  const qualifiesForFree = selectedShippingMethod?.freeThreshold && subtotal >= selectedShippingMethod.freeThreshold;
  const shippingCost = qualifiesForFree ? 0 : selectedShippingMethod?.cost || 0;

  const shippingTax = selectedShippingMethod?.taxable ? shippingCost * ((selectedShippingMethod.taxRate || 0) / 100) : 0;

  const orderTaxRate = taxRates.length > 0 ? taxRates.reduce((sum, r) => sum + (r.rate || 0), 0) / 100 : 0;
  const orderTaxPercentage = orderTaxRate * 100;

  const tax = (subtotal - discount) * orderTaxRate;
  const totalTax = tax + shippingTax;
  const safeTotal = subtotal - discount + shippingCost + totalTax;
  const [, setInvalidSubmissionCount] = useState(0);
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);

  const handleFailedAttempt = async () => {
    await paymentMethodRef.current?.validate();

    setInvalidSubmissionCount((prev) => {
      const newCount = prev + 1;

      if (newCount % 2 === 0) {
        setShowErrorDialog(true);
      }
      return newCount;
    });
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    try {
      form.clearErrors();

      const isPaymentValid = await paymentMethodRef?.current?.validate();
      if (!isPaymentValid || !paymentMethodRef?.current) {
        form.setError("paymentMethodId", { message: "Please check your payment details" });
        handleFailedAttempt();
        return;
      }

      let payload: OrderSubmissionPayload;

      const baseData = {
        paymentMethodId: watchPaymentMethodId,
        deliveryMethodId: watchDeliveryMethod!,
        cartTotal: safeTotal,
        orderNote: values.orderNote || "",
        locale,
        useShippingAsBilling,
      };

      if (customer) {
        const loggedInValues = values as z.infer<typeof loggedInCheckoutSchema>;
        if (!loggedInValues.addressId) {
          form.setError("root", { message: "Please select a shipping address" });
          return;
        }
        payload = {
          ...baseData,
          customerId: customer.id,
          shippingAddressId: loggedInValues.addressId,
          billingAddressId: loggedInValues.billingAddressId || loggedInValues.addressId,
          guest: false,
        };
      } else {
        const guestValues = values as z.infer<typeof checkoutSchema>;
        const getCountryName = (id: string) => data.countries.find((c) => c.id === id)?.name || id;
        const getCityName = (countryId: string, cityId: string) => {
          const country = data.countries.find((c) => c.id === countryId);
          const city = country?.cities?.find((c: any) => c.code === cityId || c.city === cityId);
          return city?.city || cityId;
        };

        const guestAddress: SavedAddress = {
          id: Date.now().toString(),
          firstName: guestValues.firstName,
          lastName: guestValues.lastName,
          email: guestValues.email,
          address: guestValues.address,
          street: guestValues.street,
          apartment: guestValues.apartment,
          building: guestValues.building,
          floor: guestValues.floor,
          city: guestValues.city,
          cityName: getCityName(guestValues.country, guestValues.city),
          country: guestValues.country,
          countryName: getCountryName(guestValues.country),
          postalCode: guestValues.postalCode,
          phone: guestValues.phone,
          phoneCountryCode: guestValues.phoneCountryCode,
        };

        saveGuestAddress(guestAddress);
        payload = {
          ...baseData,
          guest: true,
          email: guestValues.email,
          address: guestAddress,
          billingAddress: guestAddress,
        };
      }

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.errors) {
          Object.keys(responseData.errors).forEach((key) => {
            form.setError(key as any, { message: responseData.errors[key] });
          });
        }
        form.setError("root", { message: responseData.error || "Failed to create order" });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (responseData.redirect) {
        window.location.href = responseData.redirect;
        return;
      }

      if (responseData.id) {
        await paymentMethodRef.current.confirm(watchPaymentMethodId, responseData.billingAddress, responseData.id, getURL(`/checkout/order-received/${responseData.orderKey}`, locale));
      } else if (responseData.orderKey) {
        router.push(getURL(`/checkout/order-received/${responseData.orderKey}`, locale));
      } else {
        form.setError("root", { message: "Failed to create order" });
      }
    } catch (err) {
      console.error(err);
      form.setError("root", { message: err instanceof Error ? err.message : "An unexpected error occurred" });
    }
  };

  const onInvalid = async () => {
    await paymentMethodRef.current?.validate();
    handleFailedAttempt();
  };

  return {
    form,
    deliveryMethods,
    loadingDeliveryMethods,
    cities,
    hasSpecificCities,
    taxRates,
    loadingTaxes,
    subtotal,
    discount,
    shippingCost,
    tax,
    orderTaxPercentage,
    total: safeTotal,
    qualifiesForFree,
    showErrorDialog,
    setShowErrorDialog,
    onSubmit,
    onInvalid,
    handleCountryChange,
    setCart,
    useShippingAsBilling,
    setUseShippingAsBilling,
  };
}
