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

      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 lg:p-6 overflow-y-auto font-mono">
        {isLoggedIn && (
          <div className="w-full max-w-md">
            <CardApoiar />
          </div>
        )}
      </div>
    </MainFrame>
  );
}
