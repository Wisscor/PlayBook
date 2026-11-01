import { pageTitle } from "@/lib/pageTitle";

export const generateMetadata = pageTitle("title-user-profile");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
