import { useEffect, useState } from "react";
import betCollector from "../../../hardhat/artifacts/contracts/BetCollector.sol/BetCollector.json";
import { Countdown } from "./Countdown";
import { DynamicProgressBar } from "./DynamicProgressBar";
import { BigNumber } from "ethers";
import moment from "moment";
import { useContractRead, useContractWrite, usePrepareContractWrite } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

//TODO: add a placeholder while loading data in each item

export const BetItem = (props: { index: number | undefined }) => {
  const [timeBetCreated, setTimeBetCreated] = useState(moment()); //when the bet collector contract was created
  const [timeToFinishBetting, setTimeToFinishBetting] = useState(moment()); //when betting stops
  const [timeToChooseWiners, setTimeToChooseWiners] = useState(moment()); //when winners are chosen

  const [, setTimeLeftToFinishBetting] = useState(0);
  const [timePassedSinceCreation, setTimePassedSinceCreation] = useState(0);

  const [winnerKnownState, setWinnerKnownState] = useState(false);
  const [winnerKnownIsLoading, setWinnerKnownIsLoading] = useState(false);

  const { data: address } = useScaffoldContractRead({
    contractName: "BetCollectorFactory",
    functionName: "clones",
    args: [BigNumber.from(props.index)],
  });

  // const price: number = data['price'] || 0; //priceThreshold
  // console.log("price", JSON.stringify(data.priceThreshold));

  // const { data: price } = useContractRead({
  //   abi: betCollector.abi,
  //   address: address?.toString(),
  //   functionName: "priceThreshold",
  // });

  //read timeBetCollectrorCreated from contract
  const { data: timeBetCollectrorCreated } = useContractRead({
    abi: betCollector.abi,
    address: address?.toString(),
    functionName: "timeBetCollectrorCreated",
  });
  let timeBetCollectrorCreatedRefined: BigNumber = BigNumber.from(0);
  if (timeBetCollectrorCreated !== undefined) {
    timeBetCollectrorCreatedRefined = BigNumber.from(timeBetCollectrorCreated);
  }

  //read timeFinishAcceptingBets from contract
  const { data: timeStop } = useContractRead({
    abi: betCollector.abi,
    address: address?.toString(),
    functionName: "timeFinishAcceptingBets",
  });
  let timeStopRefined: BigNumber = BigNumber.from(0);
  if (timeStop !== undefined) {
    timeStopRefined = BigNumber.from(timeStop);
  }

  //read timePriceUnveil from contract
  const { data: timePriceUnveil } = useContractRead({
    abi: betCollector.abi,
    address: address?.toString(),
    functionName: "timePriceUnveil",
  });
  let timePriceUnveilRefined: BigNumber = BigNumber.from(0);
  if (timePriceUnveil !== undefined) {
    timePriceUnveilRefined = BigNumber.from(timePriceUnveil);
  }

  const { data: winnerKnown } = useContractRead({
    abi: betCollector.abi,
    address: address?.toString(),
    functionName: "winnerKnown",
  });
  let winnerKnownRefined = false;
  if (winnerKnown !== undefined) {
    winnerKnownRefined = winnerKnown as boolean;
  }

  useEffect(() => {
    setTimeBetCreated(moment(parseInt(timeBetCollectrorCreatedRefined.toString()) * 1000, "x"));
    setTimeToFinishBetting(moment(parseInt(timeStopRefined.toString()) * 1000, "x"));
    setTimeToChooseWiners(moment(parseInt(timePriceUnveilRefined.toString()) * 1000, "x"));
  }, [timeBetCollectrorCreatedRefined, timePriceUnveilRefined, timeStopRefined]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimePassedSinceCreation(moment().unix() - timeBetCreated.unix());
      setTimeLeftToFinishBetting(timeToFinishBetting.unix() - moment().unix());
      setWinnerKnownState(winnerKnownRefined);
      //TODO: subscribe to the event so the buttons are get automatically updated
      // if (moment().isAfter(timeToChooseWiners) && winnerKnownState == false) {
      //   const listenerIfWinnerKnown = watchContractEvent(
      //     {
      //       abi: betCollector.abi,
      //       address: address?.toString(),
      //       eventName: "WinnerKnown",
      //     },
      //     event => {
      //       //first event value contains if upper or lower bound won
      //       setWinnerKnownState(true);
      //       console.log("event: ", event);
      //     },
      //   );
      // }
      if (winnerKnownRefined == true) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeBetCreated, timeToFinishBetting, winnerKnownRefined]);

  const findWinnerWrite = usePrepareContractWrite({
    abi: betCollector.abi,
    address: address?.toString(),
    functionName: "findWinner",
  });
  const { isLoading, write } = useContractWrite(findWinnerWrite.config);

  useEffect(() => {
    setWinnerKnownIsLoading(isLoading);
  }, [isLoading]);

  function findWinnerHandler() {
    if (write !== undefined) write();
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex flex-col">
          <ul className="steps">
            <li className={`step ${moment().unix() > timeBetCreated.unix() ? "step-primary" : " "}`}>Bets open</li>
            <li className={`step ${moment().unix() > timeToFinishBetting.unix() ? "step-primary" : " "}`}>
              Bets closed
            </li>
            <li className={`step ${moment().unix() > timeToChooseWiners.unix() ? "step-primary" : " "}`}>
              Judge results
            </li>
            <li className={`step ${winnerKnown ? "step-primary" : " "}`}>Rewards to claim</li>
          </ul>
          {/* <p>Address: {address}</p> */}
          {/* <p>Price: {price?.toString()}</p> */}
          {/* <p>Exact time bet created: {timeBetCreated.unix()}</p>
          <p>Exact time left to bet: {timeToFinishBetting.unix()}</p> */}
          {/* <p>Time passed since creation: {timePassedSinceCreation}</p>
          <p>Time left to bet: {timeLeftToFinishBetting}</p> */}
          {/* <p>Exact time left to choose winers: {timePriceUnveil?.toString()}</p> */}
          {/* <p>Time left to choose winers: {timeToChooseWiners?.toString()}</p> */}
          {/*TODO: use countdown to display time left*/}
          <div className="mx-auto">
            <Countdown milestoneTime={timeToFinishBetting} />
          </div>

          <DynamicProgressBar
            value={timePassedSinceCreation}
            max={timeToFinishBetting.unix() - timeBetCreated.unix()}
          />
        </div>

        <div className="card-actions justify-end">
          <button className={`btn btn-primary ${moment().unix() < timeToFinishBetting.unix() ? "" : "hidden"}`}>
            Place bet
          </button>
          <button
            className={`btn btn-primary ${
              moment().unix() >= timeToChooseWiners.unix() && winnerKnownRefined == false ? "" : "hidden"
            } ${winnerKnownIsLoading || !write ? "btn-disabled" : ""}`}
            onClick={findWinnerHandler}
          >
            Choose winners
          </button>
          {/* {findWinnerWrite.isError && findWinnerWrite.error ? <div>Error: {findWinnerWrite.error.message}</div> : ""} */}
          {/* TODO: add a glow effect */}
          <button className={`btn btn-primary ${winnerKnownState == true ? "" : "hidden"}`}>Withdraw price</button>
        </div>
      </div>
    </div>
  );
};
