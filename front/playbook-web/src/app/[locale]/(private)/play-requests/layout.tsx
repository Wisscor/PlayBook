import { pageTitle } from "@/lib/pageTitle";

export const generateMetadata = pageTitle("play-requests");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
