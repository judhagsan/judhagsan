import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/router";
import MainFrame from "../components/MainFrame";
import useUser from "hooks/useUser";
import useLanguage from "hooks/useLanguage";

const CardAdminReleases = dynamic(
  () => import("../components/CardAdminReleases"),
);

export default function AdminReleasesPage() {
  const router = useRouter();
  const { user, isLoading, isLoggedIn, isAdmin } = useUser();
  const { t } = useLanguage();

  const canSendReleaseEmail = Boolean(
    isAdmin && user?.features?.includes("send:release_email"),
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (!canSendReleaseEmail) {
      router.replace("/sessao");
    }
  }, [isLoading, isLoggedIn, canSendReleaseEmail, router]);

  return (
    <MainFrame>
      <Head>
        <title>{t("Emails de releases")} · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className="relative z-10 w-full h-full flex flex-col p-2 lg:p-4 overflow-y-auto lg:overflow-hidden">
        {canSendReleaseEmail && (
          <CardAdminReleases fullPage onBack={() => router.push("/sessao")} />
        )}
      </div>
    </MainFrame>
  );
}
