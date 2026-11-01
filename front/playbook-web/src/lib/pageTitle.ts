import { getTranslations } from "next-intl/server";

export const pageTitle = (key: string) => async () => {
  const t = await getTranslations();
  return { title: t(key) };
};
