import "./globals.css";

import { Providers } from "@/hooks/contexts/contextsProviders";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { Locale, locales } from "../../../i18n";
import { myTTFFont } from "./fonts";

type Props = {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) notFound();

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={` h-full `}
    >
      <body className={`  ${myTTFFont.className} min-h-full flex flex-col`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
