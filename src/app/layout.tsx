import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/app-nav";
import { I18nProvider } from "@/components/i18n-provider";
import { getI18n } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// Every page shows live glossary data and the current user's score.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: "26³", template: "%s · 26³" },
    description: t.metadata.description,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { locale } = await getI18n();

  return (
    <html lang={locale} className={cn("font-sans", inter.variable)}>
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={locale}>
          <AppHeader />
          <main className="mx-auto max-w-3xl px-4 pt-8 pb-28 md:pb-16">{children}</main>
          <MobileNav />
        </I18nProvider>
      </body>
    </html>
  );
}

