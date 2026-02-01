"use client";

import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/amerta/theme/ui/button";
import { Input } from "@/amerta/theme/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/amerta/theme/ui/form";
import { Message } from "@/amerta/components/Message";
import { getServerSideURL, getURL } from "@/amerta/utilities/getURL";

// 1. Define Zod Schema
const recoverPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type RecoverPasswordFormType = z.infer<typeof recoverPasswordSchema>;

const RecoverPasswordForm: React.FC<{
  logo?: React.ReactNode;
  locale?: string;
  innerClassName?: string;
}> = ({ logo, locale, innerClassName = "flex flex-col items-center w-full max-w-sm px-6 py-12 border rounded-lg min-w-sm gap-y-4" }) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<RecoverPasswordFormType>({
    resolver: zodResolver(recoverPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = useCallback(async (data: RecoverPasswordFormType) => {
    setLoading(true);
    setError("");

    // 2. Updated endpoint to 'customer' to match your other forms
    const response = await fetch(`${getServerSideURL()}/api/customers/forgot-password`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      setSuccess(true);
      setError("");
    } else {
      const json = await response.json();
      setError(json.errors?.[0]?.message || "There was a problem while attempting to send you a password reset email. Please try again.");
    }
    setLoading(false);
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center w-full max-w-sm gap-6 lg:justify-start">
            {logo}

            <div className={innerClassName}>
              {!success && (
                <div className="mb-4 text-center">
                  <h1 className="text-xl font-bold">Recover Password</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Please enter your email below. You will receive an email message with instructions on how to reset your password.</p>
                </div>
              )}

              {success && (
                <div className="mb-4 text-center">
                  <h1 className="text-xl font-bold text-green-600">Request Submitted</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Check your email for a link that will allow you to securely reset your password.</p>
                </div>
              )}

              <Message error={error} />

              {!success && (
                <div className="flex flex-col w-full gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="you@example.com" className="w-full rounded-full px-3.5 py-2 text-sm border border-zinc-300 hover:border-zinc-400 bg-transparent focus:outline-hidden focus:ring-2 focus:ring-zinc-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" variant="default" disabled={loading} className="w-full">
                    {loading ? "Processing..." : "Recover Password"}
                  </Button>
                </div>
              )}

              <div className="flex justify-center gap-1 mt-4 text-sm text-muted-foreground">
                <Link href={getURL(`/login`, locale)} className="font-medium text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};

export { RecoverPasswordForm };
