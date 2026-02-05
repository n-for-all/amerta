"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { User, Customer } from "@/payload-types"; // Ensure you import Customer type if available
import { getErrorMessage } from "@/amerta/theme/utilities/get-error-message";
import { getServerSideURL } from "@/amerta/utilities/getURL";

type UserWithVerified = (User & { verified: boolean }) | (Customer & { verified: boolean });
type ResetPassword = (args: { password: string; passwordConfirm: string; token: string }) => Promise<void>;
type ForgotPassword = (args: { email: string }) => Promise<void>;
type Create = (args: { email: string; password: string; passwordConfirm: string }) => Promise<void>;
type Login = (args: { email: string; password: string }) => Promise<{
  user?: UserWithVerified;
  error?: string;
  code?: string;
}>;
type Logout = () => Promise<void>;

type AuthContext = {
  user?: UserWithVerified | null;
  setUser: (user: UserWithVerified | null) => void;
  logout: Logout;
  login: Login;
  create: Create;
  resetPassword: ResetPassword;
  forgotPassword: ForgotPassword;
  status: undefined | "loggedOut" | "loggedIn";
};

const Context = createContext({} as AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserWithVerified | null>();
  const [status, setStatus] = useState<undefined | "loggedOut" | "loggedIn">();

  const login = useCallback<Login>(async (args) => {
    setStatus("loggedOut");
    setUser(undefined);

    try {
      const res = await fetch(`${getServerSideURL()}/api/customers/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: args.email,
          password: args.password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // REST API returns { user, token, exp }
        const user = data.user;
        if (!user) {
          return {
            error: "No user returned from login",
            code: "Unauthorized",
          };
        }
        setUser(user);
        setStatus("loggedIn");
        return { user: user as UserWithVerified };
      } else {
        const errorData = await res.json();
        const errorMessage = getErrorMessage(errorData);
        return {
          error: errorMessage || "Login failed",
          code: errorData.code,
        };
      }
    } catch (e: any) {
      return {
        error: e.message || "An error occurred while attempting to login.",
        code: "Unauthorized",
      };
    }
  }, []);

  const create = useCallback<Create>(
    async (args) => {
      try {
        // 1. Create the account
        // Standard Payload REST endpoint is POST /api/{slug}
        const res = await fetch(`${getServerSideURL()}/api/customer`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: args.email,
            password: args.password,
            passwordConfirm: args.passwordConfirm,
            // Add any other required fields here (e.g. name)
          }),
        });

        if (res.ok) {
          // 2. Auto-login after successful creation
          // REST create does not return a token, so we must manually log in
          await login({ email: args.email, password: args.password });
        } else {
          const errorData = await res.json();
          throw new Error(errorData.errors?.[0]?.message || "Failed to create account");
        }
      } catch (e: any) {
        throw new Error(e.message || "An error occurred while attempting to create account.");
      }
    },
    [login],
  );

  const logout = useCallback<Logout>(async () => {
    try {
      const res = await fetch(`${getServerSideURL()}/api/customers/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setUser(null);
        setStatus("loggedOut");
      } else {
        throw new Error("Logout failed");
      }
    } catch (e) {
      console.error(e);
      throw new Error("An error occurred while attempting to logout.");
    }
  }, []);

  const forgotPassword = useCallback<ForgotPassword>(async (args) => {
    try {
      const res = await fetch(`${getServerSideURL()}/api/customers/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: args.email,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send reset email");
      }
    } catch (e) {
      console.error(e);
      throw new Error("An error occurred while attempting to forgot password.");
    }
  }, []);

  const resetPassword = useCallback<ResetPassword>(async (args) => {
    try {
      const res = await fetch(`${getServerSideURL()}/api/customers/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: args.password,
          passwordConfirm: args.passwordConfirm,
          token: args.token,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Payload REST returns { user, token } on successful reset
        const user = data.user;
        setUser(user);
        setStatus("loggedIn");
      } else {
        throw new Error("Failed to reset password");
      }
    } catch (e) {
      console.error(e);
      throw new Error("An error occurred while attempting to reset password.");
    }
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${getServerSideURL()}/api/customers/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          const meUser = data.customer;
          setUser(meUser || null);
          setStatus(meUser ? "loggedIn" : "loggedOut");
        } else {
          setUser(null);
          setStatus("loggedOut");
        }
      } catch {
        setUser(null);
        setStatus("loggedOut");
      }
    };

    fetchMe();
  }, []);

  return (
    <Context.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        create,
        resetPassword,
        forgotPassword,
        status,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useAuth = () => useContext(Context);
