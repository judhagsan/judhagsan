import Link from "next/link";
import { HeartFillIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

// Pill compacto de apoio, usado no header dos cards do Pindorama (home e
// sessão). Leva para o hub de apoiadores, que vira o checkout quando a
// cobrança recorrente (AbacatePay) for integrada.
export default function SupportButton() {
  const { t } = useLanguage();

  return (
    <Link
      href="/apoiadores"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/40 hover:border-amber-400/70 text-amber-200 text-xs font-semibold transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 shrink-0"
    >
      <HeartFillIcon size={12} />
      {t("Apoiar")}
    </Link>
  );
}
