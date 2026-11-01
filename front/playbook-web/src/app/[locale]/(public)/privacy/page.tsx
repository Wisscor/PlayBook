import { PlayText } from "@/components/ui/Text";
import { LegalPage, LegalSection } from "@/components/shared/legal";
import { useTranslations } from "next-intl";
import React from "react";

const PrivacyPage = () => {
  const t = useTranslations();
  const datasCollected = [
    { title: "identity-data", description: "identity-data-description" },
    { title: "contact-data", description: "contact-data-description" },
    { title: "profile-data", description: "profile-data-description" },
    { title: "technical-data", description: "technical-data-description" },
  ];

  const howWeUseData = [
    "to-register-and-manage-your-account",
    "to-facilitate-match-rooms",
    "to-manage-our-relationship-with-you",
  ];

  return (
    <LegalPage titleId="privacy-policy" date="November 1, 2026">
      <LegalSection titleId="introduction" mark="1" index={0}>
        <PlayText.Span
          texts={[
            { text: "welcome-to" },
            { content: "PlayBook", className: "font-semibold text-amber-200" },
            { text: "we-respect-your-privacy" },
          ]}
        />
      </LegalSection>

      <LegalSection titleId="data-we-collect" mark="2" index={1}>
        <PlayText.Primary id="data-we-collect-description" />
        <ul className="mt-1 flex flex-col gap-2">
          {datasCollected.map((data) => (
            <li
              key={data.title}
              className="flex gap-3 rounded-2xl border border-white/5 bg-neutral-950/40 px-4 py-3"
            >
              <span
                aria-hidden
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              />
              <span className="text-stone-400">
                <span className="font-semibold text-stone-100">
                  {t(data.title)}
                </span>{" "}
                {t(data.description)}
              </span>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection titleId="how-we-use-your-data" mark="3" index={2}>
        <PlayText.Primary id="how-we-use-your-data-description" />
        <ul className="mt-1 flex flex-col gap-2">
          {howWeUseData.map((data) => (
            <li
              key={data}
              className="flex gap-3 rounded-2xl border border-white/5 bg-neutral-950/40 px-4 py-3 text-stone-400"
            >
              <span
                aria-hidden
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              />
              {t(data)}
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection titleId="contact-us" mark="4" index={3}>
        <PlayText.Span
          texts={[
            { text: "contact-us-description" },
            {
              content: "+212631205288",
              className: "font-semibold text-amber-200",
            },
          ]}
        />
      </LegalSection>
    </LegalPage>
  );
};

export default PrivacyPage;
