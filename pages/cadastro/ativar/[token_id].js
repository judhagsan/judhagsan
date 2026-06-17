import Head from "next/head";
import { useRouter } from "next/router";
import CardYoutube from "../../components/cardYoutube";
import CardAtivacao from "../../components/CardAtivacao";
import MainFrame from "../../components/MainFrame";

export default function AtivarPage() {
  const router = useRouter();
  const { token_id: tokenId } = router.query;

  return (
    <MainFrame>
      <Head>
        <title>Ativar cadastro · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Main Container (The "Clear" Window) */}
      <div className="relative z-10 w-full h-full rounded-[20px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto lg:overflow-hidden">
          {/* Center Section - Ativação Card */}
          <div className="lg:flex-1 flex items-start lg:items-center justify-center pt-2 lg:pt-0 shrink-0">
            <div className="w-full max-w-md lg:w-1/3">
              <CardAtivacao tokenId={tokenId} />
            </div>
          </div>

          <div className="lg:mt-auto flex items-end w-full shrink-0">
            {/* Bottom Section - YouTube Card */}
            <CardYoutube />
          </div>
        </div>
      </div>
    </MainFrame>
  );
}
