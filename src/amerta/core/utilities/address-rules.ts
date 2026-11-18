import type * as z from "zod";

/**
 * Address form rules per country. Countries not listed here keep the default (Gulf-style) form:
 * area/landmark and apartment required, state and postal code optional.
 */

export const US_STATES: { code: string; name: string }[] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"],
  ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"],
  ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"],
  ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"],
  ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
  ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([code, name]) => ({ code: code!, name: name! }));

export interface AddressRules {
  /** Show the "Address (Area/Landmark)" field */
  showArea: boolean;
  areaRequired: boolean;
  showBuilding: boolean;
  apartmentRequired: boolean;
  stateRequired: boolean;
  /** When set, state is picked from this list (value = code) */
  stateOptions?: { code: string; name: string }[];
  postalRequired: boolean;
  postalPattern?: RegExp;
  labels: { street: string; apartment: string; state: string; postal: string; postalPlaceholder?: string; streetPlaceholder?: string };
  messages: { state: string; postal: string; postalFormat: string; apartment: string; area: string };
}

const DEFAULT_RULES: AddressRules = {
  showArea: true,
  areaRequired: true,
  showBuilding: true,
  apartmentRequired: true,
  stateRequired: false,
  postalRequired: false,
  labels: { street: "Street", apartment: "Apartment/Unit", state: "State/Province", postal: "Postal Code", streetPlaceholder: "Street name" },
  messages: {
    state: "Please enter your state",
    postal: "Please enter your postal code",
    postalFormat: "Please enter a valid postal code",
    apartment: "Apartment/Unit is required",
    area: "Address is required",
  },
};

const COUNTRY_RULES: Record<string, Partial<AddressRules>> = {
  US: {
    showArea: false,
    areaRequired: false,
    showBuilding: false,
    apartmentRequired: false,
    stateRequired: true,
    stateOptions: US_STATES,
    postalRequired: true,
    postalPattern: /^\d{5}(-\d{4})?$/,
    labels: {
      street: "Street address",
      apartment: "Apt, suite, unit (optional)",
      state: "State",
      postal: "ZIP code",
      postalPlaceholder: "12345",
      streetPlaceholder: "123 Main St",
    },
    messages: {
      ...DEFAULT_RULES.messages,
      state: "Please select your state",
      postal: "Please enter your ZIP code",
      postalFormat: "Please enter a 5-digit ZIP code",
    },
  },
};

export function getAddressRules(iso2?: string | null): AddressRules {
  const custom = iso2 ? COUNTRY_RULES[iso2.toUpperCase()] : undefined;
  return custom ? { ...DEFAULT_RULES, ...custom } : DEFAULT_RULES;
}

type AddressValues = { address?: string | null; apartment?: string | null; state?: string | null; postalCode?: string | null };

/** Field errors for the country-dependent parts of an address (keys: address, apartment, state, postalCode) */
export function addressCountryErrors(values: AddressValues, iso2?: string | null): Partial<Record<keyof AddressValues, string>> {
  const rules = getAddressRules(iso2);
  const errors: Partial<Record<keyof AddressValues, string>> = {};
  const has = (v?: string | null) => typeof v === "string" && v.trim().length > 0;
  if (rules.showArea && rules.areaRequired && !has(values.address)) errors.address = rules.messages.area;
  if (rules.apartmentRequired && !has(values.apartment)) errors.apartment = rules.messages.apartment;
  if (rules.stateRequired) {
    if (!has(values.state)) errors.state = rules.messages.state;
    else if (rules.stateOptions && !rules.stateOptions.some((s) => s.code === values.state!.trim().toUpperCase())) errors.state = rules.messages.state;
  }
  if (rules.postalRequired && !has(values.postalCode)) errors.postalCode = rules.messages.postal;
  else if (has(values.postalCode) && rules.postalPattern && !rules.postalPattern.test(values.postalCode!.trim())) errors.postalCode = rules.messages.postalFormat;
  return errors;
}

/** zod superRefine for forms whose `country` holds a country id */
export const addressRefinement =
  (getIso: (countryId: string) => string | undefined | null) =>
  (data: any, ctx: z.RefinementCtx) => {
    if (!data?.country) return;
    const errors = addressCountryErrors(data, getIso(String(data.country)));
    for (const [path, message] of Object.entries(errors)) {
      ctx.addIssue({ code: "custom", path: [path], message: message! });
    }
  };
