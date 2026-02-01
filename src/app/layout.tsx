import "@payloadcms/next/css";
import React from "react";

type Args = {
  children: React.ReactNode;
};

const Layout = ({ children }: Args) => <>{children}</>;

export default Layout;
