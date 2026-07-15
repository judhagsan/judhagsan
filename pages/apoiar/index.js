import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import MainFrame from "../components/MainFrame";
import CardApoiar from "../components/CardApoiar";
import useUser from "hooks/useUser";
import useLanguage from "hooks/useLanguage";

export default function ApoiarPage() {
  const router = useRouter();
  const { isLoading, isLoggedIn } = useUser();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  return (
    <MainFrame>
      <Head>
        <title>{t("Apoiar o Pindorama")} · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className="relative z-10 w-full h-full rounded-[20px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        <div className="relative z-10 flex-1 flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
          {isLoggedIn && (
            <div className="w-full max-w-md">
              <CardApoiar />
            </div>
          )}
        </div>
      </div>
    </MainFrame>
  );
}
