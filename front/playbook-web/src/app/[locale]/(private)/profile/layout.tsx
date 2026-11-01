import { pageTitle } from "@/lib/pageTitle";

export const generateMetadata = pageTitle("my-profile");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
