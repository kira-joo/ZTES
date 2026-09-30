import { getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";
import { Link } from "src/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("content");
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-4 py-24 text-center">
      <SearchX className="size-16 text-brand" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-ink">{t("notFoundTitle")}</h1>
      <p className="text-ink-soft">{t("notFoundBody")}</p>
      <Link href="/" className="mt-2 rounded-card bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
        {t("backHome")}
      </Link>
    </div>
  );
}
