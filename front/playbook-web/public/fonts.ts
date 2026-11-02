import localFont from "next/font/local";

export const roboto = localFont({
  src: "./fonts/roboto-latin-wght-normal.woff2",
  variable: "--font-roboto",
  weight: "100 900",
  display: "swap",
  preload: true,
});
