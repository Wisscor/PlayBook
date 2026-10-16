import localFont from "next/font/local";

export const myTTFFont = localFont({
  src: [
    {
      path: "./fonts/Oswald-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/Oswald-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/Oswald-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Oswald-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Oswald-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Oswald-Bold.ttf",
      weight: "700",
      style: "bold",
    },
  ],
  variable: "--font-oswald",
  display: "swap",
});
