import Head from "next/head";
import type { NextPage } from "next";
import { NewBet } from "~~/components/example-ui/NewBet";
import { PriceChart } from "~~/components/example-ui/PriceChart";

const ExampleUI: NextPage = () => {
  return (
    <>
      <Head>
        <title>Betting Platform</title>
        <meta name="description" content="Created with 🏗 scaffold-eth" />
        {/* We are importing the font this way to lighten the size of SE2. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree&display=swap" rel="stylesheet" />
      </Head>
      <div className="grid lg:grid-cols-2 flex-grow">
        <NewBet />
        <PriceChart />
      </div>
    </>
  );
};

export default ExampleUI;
