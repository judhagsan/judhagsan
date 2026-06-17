import Head from "next/head";
import CardYoutube from "../components/cardYoutube";
import CardContato from "../components/CardContato";
import MainFrame from "../components/MainFrame";

export default function ContatoPage() {
  return (
    <MainFrame>
      <Head>
        <title>Contato · JUDHAGSAN</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Main Container (The "Clear" Window) */}
      <div className="relative z-10 w-full h-full rounded-[20px] overflow-hidden border border-white/5 shadow-[inset_0px_0px_50px_rgba(0,0,0,0.9)] flex">
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col p-4 lg:p-10 gap-6 lg:gap-0">
          {/* Center Section - Contato Card */}
          <div className="lg:flex-1 flex items-start lg:items-center justify-center min-h-0 lg:-mt-8 shrink-0">
            <div className="w-full lg:w-[90%] lg:max-w-6xl h-full lg:h-[95%]">
              <CardContato />
            </div>
          </div>

          <div className="lg:mt-auto flex items-end w-full lg:-mb-8 shrink-0">
            {/* Bottom Section - YouTube Card */}
            <CardYoutube />
          </div>
        </div>
      </div>
    </MainFrame>
  );
}
