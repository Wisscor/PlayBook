"use client";

import { Header } from "@/components/shared/Header";
import { PlayText } from "@/components/ui/Text";
import { useTranslations } from "next-intl";
import React from "react";

export const TermsOfServicePage = () => {
  const t = useTranslations();

  const userConductRules = [
    "user-conduct-rule-1",
    "user-conduct-rule-2",
    "user-conduct-rule-3",
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-b from-secondary via-extra to-primary px-6 py-8 md:px-12 lg:px-20 lg:py-12">
      <main className="relative z-10 flex flex-1 flex-col justify-between">
        <div className="w-full">
          <Header />
        </div>

        <div className="flex flex-col min-h-[calc(100vh-140px)] text-white px-4 py-8 md:px-12 lg:px-20 gap-8">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-6">
              <PlayText.Primary
                id="terms-of-service"
                className="text-3xl font-extrabold tracking-tight text-white"
              />

              <PlayText.Primary
                id="last-updated"
                values={{
                  date: "November 1, 2026",
                }}
                className="text-xs text-slate-400"
              />
            </div>

            <div className="flex flex-col gap-6 text-sm text-slate-300 leading-relaxed">
              <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-3">
                <PlayText.Primary
                  id="agreement-to-terms"
                  values={{ mark: "1" }}
                  className="text-base font-bold text-white"
                />
                <PlayText.Span
                  texts={[
                    { text: "by-accessing-or-using" },
                    {
                      content: " PlayBook",
                      className: "text-white font-semibold",
                    },
                    { text: "you-agree-to-be-bound" },
                  ]}
                />
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-3">
                <PlayText.Primary
                  id="user-accounts"
                  values={{ mark: "2" }}
                  className="text-base font-bold text-white"
                />
                <PlayText.Primary id="user-accounts-description-1" />
                <PlayText.Primary id="user-accounts-description-2" />
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-3">
                <PlayText.Primary
                  id="user-conduct"
                  values={{ mark: "3" }}
                  className="text-base font-bold text-white"
                />
                <PlayText.Primary id="user-conduct-description" />
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
                  {userConductRules.map((rule) => (
                    <li key={rule}>{t(rule)}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-3">
                <PlayText.Primary
                  id="changes-to-terms"
                  values={{ mark: "4" }}
                  className="text-base font-bold text-white"
                />
                <PlayText.Primary id="changes-to-terms-description" />
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-3">
                <PlayText.Primary
                  id="contact-us"
                  values={{ mark: "5" }}
                  className="text-base font-bold text-white"
                />
                <PlayText.Span
                  texts={[
                    { text: "terms-contact-description" },
                    {
                      content: "+212631205288",
                      className: "text-sky-400 font-medium",
                    },
                  ]}
                />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfServicePage;
