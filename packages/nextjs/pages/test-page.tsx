import Head from "next/head";
import moment from "moment";
import type { NextPage } from "next";
import { Countdown } from "~~/components/example-ui/Countdown";

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
      <div>
        <Countdown milestoneTime={moment().add(1, "year").add(5, "hours")} />
      </div>
    </>
  );
};

export default ExampleUI;
