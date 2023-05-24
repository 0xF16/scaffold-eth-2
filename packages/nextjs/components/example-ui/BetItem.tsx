import { useEffect, useState } from "react";
import betCollector from "../../../hardhat/artifacts/contracts/BetCollector.sol/BetCollector.json";
import { BigNumber } from "ethers";
import moment from "moment";
import { useContractRead } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export const BetItem = (props: { index: number | undefined }) => {
  const { data: address } = useScaffoldContractRead({
    contractName: "BetCollectorFactory",
    functionName: "clones",
    args: [BigNumber.from(props.index)],
  });

  const { data: price } = useContractRead({
    abi: betCollector.abi,
    address: address?.toString(),
    functionName: "priceThreshold",
  });

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
  // const { data: timePriceUnveil } = useContractRead({
  //   abi: betCollector.abi,
  //   address: address?.toString(),
  //   functionName: "timePriceUnveil",
  // });

  const [timeBetCreated, setTimeBetCreated] = useState(moment());
  const [timeToFinishBetting, setTimeToFinishBetting] = useState(moment());

  const [timeLeftToFinishBetting, setTimeLeftToFinishBetting] = useState(0);
  const [timePassedSinceCreation, setTimePassedSinceCreation] = useState(0);

  useEffect(() => {
    setTimeBetCreated(moment(parseInt(timeBetCollectrorCreatedRefined.toString()) * 1000, "x"));
    setTimeToFinishBetting(moment(parseInt(timeStopRefined.toString()) * 1000, "x"));
  }, [timeBetCollectrorCreatedRefined, timeStopRefined]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimePassedSinceCreation(moment().unix() - timeBetCreated.unix());
      setTimeLeftToFinishBetting(timeToFinishBetting.unix() - moment().unix());
      if (timeToFinishBetting.unix() - moment().unix() <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeBetCreated, timeToFinishBetting]);

  function temperatureClassname(value: number, max: number) {
    const prefix = "progress-";

    if (value / max < 0.5) {
      return prefix + "primary";
    } else if (value / max < 0.75) {
      return prefix + "warning";
    } else {
      return prefix + "error";
    }
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex flex-col">
          <ul className="steps">
            <li className="step step-primary">Accepting bets</li>
            <li className="step step-primary">Bets collected</li>
            <li className="step">Winner known</li>
            <li className="step">Rewards paid out</li>
          </ul>
          {/* <p>Address: {address}</p> */}
          <p>Price: {price?.toString()}</p>
          {/* <p>Exact time bet created: {timeBetCreated.unix()}</p>
          <p>Exact time left to bet: {timeToFinishBetting.unix()}</p> */}
          <p>Time passed since creation: {timePassedSinceCreation}</p>
          <p>Time left to bet: {timeLeftToFinishBetting}</p>
          {/* <p>Exact time left to choose winers: {timePriceUnveil?.toString()}</p> */}
          {/* <p>Time left to choose winers: {timeToChooseWiners?.toString()}</p> */}
          <progress
            className={`progress ${temperatureClassname(
              timePassedSinceCreation,
              timeToFinishBetting.unix() - timeBetCreated.unix(),
            )} w-full`}
            value={timePassedSinceCreation}
            max={timeToFinishBetting.unix() - timeBetCreated.unix()}
          ></progress>
        </div>

        <div className="card-actions justify-end">
          <button className="btn btn-primary">Buy Now</button>
        </div>
      </div>
    </div>
  );
};
