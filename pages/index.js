import Head from "next/head";
import CardYoutube from "./components/cardYoutube";
import CardPindorama from "./components/cardPindorama";
import MainFrame from "./components/MainFrame";

export default function SamuraiDashboard() {
  return (
    <MainFrame>
      <Head>
        <title>JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Main Container (The "Clear" Window) */}
      <div className="relative z-10 w-full h-full rounded-[35px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col p-10">
          {/* Center Section - Pindorama Card */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-1/3">
              <CardPindorama />
            </div>
          </div>

          <div className="mt-auto flex items-end w-full -mb-8">
            {/* Bottom Section - YouTube Card */}
            <CardYoutube />
          </div>
        </div>
      </div>
    </MainFrame>
  );
}
