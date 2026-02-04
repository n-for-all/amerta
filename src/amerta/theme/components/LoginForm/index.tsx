"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/amerta/theme/ui/button";
import { Input } from "@/amerta/theme/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/amerta/theme/ui/form";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { useAuth } from "@/amerta/providers/Auth";
import { RenderParams } from "@/amerta/components/RenderParams";
import { Message } from "@/amerta/components/Message";
import { getURL } from "@/amerta/utilities/getURL";
import { loginWith } from "@/amerta/theme/utilities/login-with";
import { printf } from "fast-printf";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormType = z.infer<typeof loginSchema>;

const LoginForm: React.FC<{
  logo: React.ReactNode;
  redirectTo?: string;
  innerClassName?: string;
  onLoginSuccess?: () => void;
}> = ({ logo, redirectTo, innerClassName = "flex flex-col items-center w-full max-w-sm px-6 py-12 border rounded-lg min-w-sm gap-y-4 bg-background border-zinc-200 dark:border-zinc-800", onLoginSuccess }) => {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  params.delete("error");
  params.delete("code");
  const allParams = params.toString() ? `${params.toString()}` : "";
  const redirect = useRef(searchParams.get("redirect"));
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { locale, __ } = useEcommerce();
  const [verification, setVerification] = React.useState<boolean>(false);
  const [providers, setProviders] = React.useState<
    {
      type: string;
      [key: string]: any;
    }[]
  >([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch(`/api/auth/providers`);
        const data = await response.json();
        setProviders(data.providers || []);
      } catch (e) {
        console.error("Failed to fetch auth providers", e);
      }
    };
    fetchProviders();
  }, []);

  const form = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = useCallback(
    async (data: LoginFormType) => {
      setIsLoading(true);
      setError(null);
      setVerification(false);
      try {
        const { error, user, code } = await login(data);
        setIsLoading(false);
        if (error) {
          if (code === "UnverifiedEmail") {
            setVerification(true);
            setError(__( "Your account is not verified yet, Please check your email for the verification link."));
            return;
          }
          setError(error);
          return;
        }
        if (!user) {
          setError(__( "Login failed. Please try again."));
          return;
        }
        if (onLoginSuccess) return onLoginSuccess();
        if (redirectTo) router.push(redirectTo);
        else if (redirect?.current) router.push(redirect.current as string);
        else router.push(getURL(`/account`, locale));
      } catch (e: any) {
        setVerification(false);
        setError(e.message || __( "There was an error with the credentials provided. Please try again."));
        setIsLoading(false);
      }
    },
    [login, router, onLoginSuccess, locale, redirectTo],
  );

  let errorMessage: React.ReactNode = error;

  if (verification) {
    errorMessage = (
      <div>
        <div className="mb-2">{error}</div> <Button variant="outline" size="sm" asChild>
          <Link href={getURL(`/resend-verification-email${allParams.trim() ? `?` : ""}${allParams}`, locale)}>Resend Verification Email</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-6 lg:justify-start">
            {logo}

            <div className={innerClassName}>
              <RenderParams
                actions={{
                  error: (message, type) => {
                    if (type !== "unverified") {
                      return <div>{message}</div>;
                    }
                    return (
                      <div>
                        <div className="mb-2">{message}</div> <Button variant="outline" size="sm" asChild>
                          <Link href={getURL(`/resend-verification-email${allParams.trim() ? `?` : ""}${allParams}`, locale)}>Resend Verification Email</Link>
                        </Button>
                      </div>
                    );
                  },
                }}
              />
              {errorMessage && <Message error={errorMessage} />}
              {providers && providers.length > 0 ? (
                <>
                  {providers.map((provider) => {
                    const handleProviderLogin = async (e) => {
                      e.preventDefault();
                      try {
                        await loginWith(provider.type, locale);
                      } catch (error: any) {
                        setError(error.message);
                      }
                    };

                    if (provider.type === "google") {
                      return (
                        <Button key={provider.type} onClick={handleProviderLogin} className="w-full">
                          <svg className={"w-6 h-5 mr-2 rtl:ml-2 rtl:mr-0"} xmlns="http://www.w3.org/2000/svg" height={24} viewBox="0 0 24 24" width={24}>
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            <path d="M1 1h22v22H1z" fill="none" />
                          </svg>
                          {__("Login with Google")}
                        </Button>
                      );
                    }
                    // Add other providers here
                    return (
                      <Button key={provider.type} onClick={handleProviderLogin} className="w-full">
                        {printf(__("Login with %s"), provider.type)}
                      </Button>
                    );
                  })}
                  <div className="relative flex items-center justify-center w-full py-2">
                    <div className="border-border absolute h-[1px] w-full border-t border-zinc-300 dark:border-zinc-700" />
                    <span className="relative px-2 text-xs bg-background text-muted-foreground">OR</span>
                  </div>
                </>
              ) : null}
              <div className="flex flex-col w-full gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{__("Email")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="you@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{__("Password")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="current-password" placeholder="••••••••" />
                      </FormControl>
                      <FormMessage />
                      <Link className="block text-xs text-blue-600 dark:text-blue-400 hover:underline" href={getURL(`/recover-password${allParams.trim() ? `?` : ""}${allParams}`, locale)}>
                        {__("Forget password?")}
                      </Link>
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" variant="default" disabled={isLoading} className="w-full">
                {isLoading ? __("Logging in...") : __("Login")}
              </Button>
            </div>
            <div className="flex justify-center gap-1 text-sm text-muted-foreground">
              <p>{__("Need an account?")}</p>
              <Link href={getURL(`/create-account${allParams.trim() ? `?` : ""}${allParams}`, locale)} className="font-medium text-primary hover:underline">
                {__("Sign up")}
              </Link>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
