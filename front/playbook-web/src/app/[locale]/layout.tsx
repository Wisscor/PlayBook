import "@/public/globals.css";

import { Providers } from "@/hooks/contexts/contextsProviders";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { Locale, locales } from "../../../i18n";
import { AuthProvider } from "@/hooks/contexts/authContext";
import { ChatProvider } from "@/hooks/contexts/chatContext";
import { roboto } from "@/public/fonts";
import { pageTitle } from "@/lib/pageTitle";

type Props = {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
};

export const generateMetadata = pageTitle("title-home");

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) notFound();

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={` h-full ${roboto.variable} `}
      data-scroll-behavior="smooth"
    >
      <body className={`  ${roboto.className} min-h-full flex flex-col`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <ChatProvider>
              <Providers>{children}</Providers>
            </ChatProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
