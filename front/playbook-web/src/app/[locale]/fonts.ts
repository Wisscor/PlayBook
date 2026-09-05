import localFont from "next/font/local";

export const myTTFFont = localFont({
  src: [
    {
      path: "./fonts/Slabo13px-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-slabo",
  display: "swap",
});
