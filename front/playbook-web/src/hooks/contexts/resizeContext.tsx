import { Metadata } from "next";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const metadata: Metadata = {
  title: {
    default: "Playbook",
    template: "%s | Playbook",
  },
};

type ResizeContextType = {
  windowWidth: number;
};

const ResizeContext = createContext<ResizeContextType | undefined>(undefined);

export function ResizeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const value = useMemo(() => ({ windowWidth }), [windowWidth]);

  return (
    <ResizeContext.Provider value={value}>{children}</ResizeContext.Provider>
  );
}

export function useResize() {
  const ctx = useContext(ResizeContext);
  if (!ctx) throw new Error("useResize must be used inside ResizeProvider");
  return ctx;
}
