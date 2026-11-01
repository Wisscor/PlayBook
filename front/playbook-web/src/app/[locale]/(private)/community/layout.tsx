import { pageTitle } from "@/lib/pageTitle";

export const generateMetadata = pageTitle("title-community");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
