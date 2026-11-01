import { PlayText } from "@/components/ui/Text";
import { LegalPage, LegalSection } from "@/components/shared/legal";
import { useTranslations } from "next-intl";
import React from "react";

const TermsOfServicePage = () => {
  const t = useTranslations();

  const userConductRules = [
    "user-conduct-rule-1",
    "user-conduct-rule-2",
    "user-conduct-rule-3",
  ];

  return (
    <LegalPage titleId="terms-of-service" date="November 1, 2026">
      <LegalSection titleId="agreement-to-terms" mark="1" index={0}>
        <PlayText.Span
          texts={[
            { text: "by-accessing-or-using" },
            { content: " PlayBook", className: "font-semibold text-amber-200" },
            { text: "you-agree-to-be-bound" },
          ]}
        />
      </LegalSection>

      <LegalSection titleId="user-accounts" mark="2" index={1}>
        <PlayText.Primary id="user-accounts-description-1" />
        <PlayText.Primary id="user-accounts-description-2" />
      </LegalSection>

      <LegalSection titleId="user-conduct" mark="3" index={2}>
        <PlayText.Primary id="user-conduct-description" />
        <ul className="mt-1 flex flex-col gap-2">
          {userConductRules.map((rule) => (
            <li
              key={rule}
              className="flex gap-3 rounded-2xl border border-white/5 bg-neutral-950/40 px-4 py-3 text-stone-400"
            >
              <span
                aria-hidden
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              />
              {t(rule)}
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection titleId="changes-to-terms" mark="4" index={3}>
        <PlayText.Primary id="changes-to-terms-description" />
      </LegalSection>

      <LegalSection titleId="contact-us" mark="5" index={4}>
        <PlayText.Span
          texts={[
            { text: "terms-contact-description" },
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

export default TermsOfServicePage;
