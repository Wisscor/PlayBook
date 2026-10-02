"use client";

import { ResizeProvider } from "./resizeContext";

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ResizeProvider>{children}</ResizeProvider>;
};
