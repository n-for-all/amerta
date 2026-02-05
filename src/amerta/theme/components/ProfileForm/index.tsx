"use client";
import React, { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAuth } from "@/amerta/providers/Auth";

import { Button } from "@/amerta/theme/ui/button";
import { Input } from "@/amerta/theme/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/amerta/theme/ui/form";
import { Separator } from "@/amerta/theme/ui/separator";
import { PhoneInput } from "@/amerta/theme/ui/phone-input";

import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { Customer } from "@/payload-types";
import { useToast } from "@/amerta/theme/ui/toast";
import { getServerSideURL, getURL } from "@/amerta/utilities/getURL";

const formSchema = z
  .object({
    email: z.email("Invalid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneCountryCode: z.string().optional(),
    phone: z.number().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    passwordConfirm: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.password && data.password !== data.passwordConfirm) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ["passwordConfirm"],
    },
  );

type FormData = z.infer<typeof formSchema>;

const ProfileForm: React.FC = () => {
  const { user, setUser } = useAuth();
  const { locale, __, defaultPhoneCountryCode } = useEcommerce();
  const toast = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phoneCountryCode: "+1",
      phone: undefined,
      password: "",
      passwordConfirm: "",
    },
  });

  const router = useRouter();

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (user) {
        const payload: Record<string, any> = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneCountryCode: data.phoneCountryCode || null,
          phone: data.phone || null,
        };

        // Only include password if it's provided
        if (data.password) {
          payload.password = data.password;
        }

        const response = await fetch(`${getServerSideURL()}/api/customers/${user.id}`, {
          credentials: "include",
          method: "PATCH",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const json = await response.json();
          setUser(json.doc);
          toast.success("Your account has been updated.");
          form.reset({
            email: json.doc.email,
            firstName: json.doc.firstName || "",
            lastName: json.doc.lastName || "",
            phoneCountryCode: json.doc.phoneCountryCode || "+1",
            phone: json.doc.phone || "",
            password: "",
            passwordConfirm: "",
          });
        } else {
          toast.error("There was a problem updating your account, Please try again.");
        }
      }
    },
    [user, setUser, form],
  );

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        firstName: (user as Customer).firstName || "",
        lastName: (user as Customer).lastName || "",
        phoneCountryCode: (user as Customer).phoneCountryCode || defaultPhoneCountryCode || "+1",
        phone: (user as Customer).phone || undefined,
        password: "",
        passwordConfirm: "",
      });
    }
  }, [user, router, form, locale]);

  return (
    <>
      <main className="flex-1 md:pl-8">
        <div className="space-y-6">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{__("Account Details")}</h1>
            <p className="text-muted-foreground">{__("Manage your personal information and password")}</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{__("Email Address")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{__("First Name")}</FormLabel>
                      <FormControl>
                        <Input type="text" {...field} />
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
                      <FormLabel>{__("Last Name")}</FormLabel>
                      <FormControl>
                        <Input type="text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field: phoneField }) => (
                  <FormField
                    control={form.control}
                    name="phoneCountryCode"
                    render={({ field: phoneCountryCodeField }) => (
                      <FormItem>
                        <FormLabel>{__("Phone Number")}</FormLabel>
                        <FormControl>
                          <PhoneInput
                            value={{
                              phoneCountryCode: phoneCountryCodeField.value,
                              phone: phoneField.value,
                            }}
                            onChange={({ phoneCountryCode, phone }) => {
                              phoneCountryCodeField.onChange(phoneCountryCode);
                              phoneField.onChange(phone);
                            }}
                            placeholder={__("Enter your phone number")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              />

              <Separator />

              <div>
                <h3 className="mb-4 text-lg font-semibold">{__("Change Password")}</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{__("New Password")}</FormLabel>
                        <FormControl>
                          <Input autoComplete="new-password" type="password" placeholder={__("Leave blank to keep current password")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passwordConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{__("Confirm New Password")}</FormLabel>
                        <FormControl>
                          <Input autoComplete="new-password" type="password" placeholder={__("Confirm new password")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-start">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? __("Updating...") : __("Save Changes")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </>
  );
};

export default ProfileForm;
