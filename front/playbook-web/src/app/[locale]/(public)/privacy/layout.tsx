import { pageTitle } from "@/lib/pageTitle";

export const generateMetadata = pageTitle("privacy-policy");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
