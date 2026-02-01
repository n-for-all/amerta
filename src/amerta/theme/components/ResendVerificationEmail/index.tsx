"use client";

import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/amerta/theme/ui/button";
import { Input } from "@/amerta/theme/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/amerta/theme/ui/form";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { getErrorMessage } from "@/amerta/theme/utilities/get-error-message";
import { Message } from "@/amerta/components/Message";
import { getServerSideURL, getURL } from "@/amerta/utilities/getURL";

// 1. Zod Schema
const resendVerificationSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type ResendVerificationFormType = z.infer<typeof resendVerificationSchema>;

const ResendVerificationEmail: React.FC<{
  logo: React.ReactNode;
  innerClassName?: string;
}> = ({ logo, innerClassName = "flex flex-col items-center w-full max-w-sm px-6 py-12 border rounded-lg min-w-sm gap-y-4" }) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { locale } = useEcommerce();

  const form = useForm<ResendVerificationFormType>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = useCallback(
    async (data: ResendVerificationFormType) => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      try {
        // 2. Call Payload API to resend verification
        // NOTE: Adjust 'customer' to your actual collection slug if different
        const res = await fetch(`${getServerSideURL()}/api/customers/verify`, {
          method: "POST",
          body: JSON.stringify({
            email: data.email,
            triggerVerification: true, // This forces the email resend
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const json = await res.json();
          const message = getErrorMessage(json) || "Failed to send verification email.";
          setError(message);
          setIsLoading(false);
          return;
        }

        setSuccess("Verification email sent! Please check your inbox.");
        setIsLoading(false);
      } catch (e: any) {
        console.error("Error resending verification email:", e);
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
      }
    },
    [router, locale],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-6 lg:justify-start">
            {logo}

            <div className={innerClassName}>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Verify your email</h3>
                <p className="mt-1 text-sm text-muted-foreground">Enter your email address to receive a new verification link.</p>
              </div>

              {error && <Message error={error} />}
              {success && <Message message={success} />}

              {!success && (
                <div className="flex flex-col w-full gap-4 mt-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="you@example.com" className="w-full rounded-full px-3.5 py-2 text-sm border border-zinc-300 hover:border-zinc-400 bg-transparent focus:outline-hidden focus:ring-2 focus:ring-zinc-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" variant="default" disabled={isLoading} className="w-full">
                    {isLoading ? "Sending..." : "Send Verification Email"}
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

export default ResendVerificationEmail;
