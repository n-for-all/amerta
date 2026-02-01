"use client";

import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/amerta/theme/ui/button";
import { Input } from "@/amerta/theme/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/amerta/theme/ui/form";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { getErrorMessage } from "@/amerta/theme/utilities/get-error-message";
import { Message } from "@/amerta/components/Message";
import { getServerSideURL, getURL } from "@/amerta/utilities/getURL";

// 1. Zod Schema
const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormType = z.infer<typeof resetPasswordSchema>;

const ResetPasswordForm: React.FC<{
  logo: React.ReactNode;
  innerClassName?: string;
}> = ({ logo, innerClassName = "flex flex-col items-center w-full max-w-sm px-6 py-12 border rounded-lg min-w-sm gap-y-4" }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { locale } = useEcommerce();

  const form = useForm<ResetPasswordFormType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = useCallback(
    async (data: ResetPasswordFormType) => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      if (!token) {
        setError("Missing reset token.");
        setIsLoading(false);
        return;
      }

      try {
        // 2. Call Payload API to reset password
        const res = await fetch(`${getServerSideURL()}/api/customers/reset-password`, {
          method: "POST",
          body: JSON.stringify({
            token: token,
            password: data.password,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const json = await res.json();
          const message = getErrorMessage(json) || "Failed to reset password.";
          setError(message);
          setIsLoading(false);
          return;
        }

        setSuccess("Password reset successfully.");
        setIsLoading(false);

        setTimeout(() => router.push(getURL(`/login`, locale)), 3000);
      } catch (e: any) {
        console.error("Error resetting password:", e);
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
      }
    },
    [router, locale, token],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-6 lg:justify-start">
            {logo}

            <div className={innerClassName}>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Reset Password</h3>
                <p className="mt-1 text-sm text-muted-foreground">Enter your new password below.</p>
              </div>

              {error && <Message error={error} />}
              {success && <Message success={success} />}

              {!success && (
                <div className="flex flex-col w-full gap-4 mt-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••" className="w-full rounded-full px-3.5 py-2 text-sm border border-zinc-300 hover:border-zinc-400 bg-transparent focus:outline-hidden focus:ring-2 focus:ring-zinc-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••" className="w-full rounded-full px-3.5 py-2 text-sm border border-zinc-300 hover:border-zinc-400 bg-transparent focus:outline-hidden focus:ring-2 focus:ring-zinc-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" variant="default" disabled={isLoading} className="w-full">
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              )}

              {success && (
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href={getURL(`/login`, locale)}>Back to Login</Link>
                </Button>
              )}
            </div>

            <div className="flex justify-center gap-1 text-sm text-muted-foreground">
              <Link href={getURL(`/login`, locale)} className="font-medium text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};

export { ResetPasswordForm };
