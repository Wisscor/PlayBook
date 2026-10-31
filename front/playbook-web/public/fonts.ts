import { Roboto } from "next/font/google";

export const roboto = Roboto({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "vietnamese"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-roboto",
  display: "swap",
  preload: true,
});
