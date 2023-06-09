import { useState } from "react";
import { CopyIcon } from "./assets/CopyIcon";
import { DiamondIcon } from "./assets/DiamondIcon";
import { HareIcon } from "./assets/HareIcon";
import { BigNumber } from "ethers";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import DateTimePicker from "react-datetime-picker";
import "react-datetime-picker/dist/DateTimePicker.css";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export const NewBet = () => {
  const [thresholdPrice, setThresholdPrice] = useState(0);
  const [timeStop, setTimeStop] = useState(new Date());
  const [timeEval, setTimeEval] = useState(new Date());

  const { writeAsync, isLoading } = useScaffoldContractWrite({
    contractName: "BetCollectorFactory",
    functionName: "clone",
    args: [
      BigNumber.from(thresholdPrice || 0),
      BigNumber.from(Math.floor(timeStop.valueOf() / 1000)),
      BigNumber.from(Math.floor(timeEval.valueOf() / 1000)),
    ],
  });

  return (
    <div className="flex bg-base-300 relative pb-10">
      <DiamondIcon className="absolute top-24" />
      <CopyIcon className="absolute bottom-0 left-36" />
      <HareIcon className="absolute right-0 bottom-24" />
      <div className="flex flex-col w-full mx-5 sm:mx-8 2xl:mx-20 py-auto">
        <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-95 rounded-2xl shadow-lg border-2 border-primary">
          <h1 className="text-4xl sm:text-6xl">New bet on ETH price</h1>

          {/* TODO: Use input groups as per https://daisyui.com/components/input-group/*/}
          <div className="mt-8 flex flex-row sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
            <label className="uppercase text-lg w-1/3">Ethereum price</label>
            <input
              type="number"
              placeholder="price of ETH in USD"
              className="input font-bai-jamjuree w-full px-5 border border-primary text-lg sm:text-2xl uppercase"
              onChange={e => setThresholdPrice(e.target.valueAsNumber)}
            />
          </div>

          <div className="mt-8 flex flex-row sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
            <label className="uppercase text-lg w-1/3">Stop collecting bets</label>
            <DateTimePicker
              format="yyyy-MM-dd HH:mm:ss"
              value={timeStop}
              onChange={value => setTimeStop(value)}
              className="input font-bai-jamjuree w-full px-5 border border-primary text-lg sm:text-2xl uppercase "
              // onChange={e => setTimeStop(new Date(e.target.value))}
            />
          </div>

          <div className="mt-8 flex flex-row sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
            <label className="uppercase text-lg w-1/3">Evaluate winners at</label>
            <DateTimePicker
              format="yyyy-MM-dd HH:mm:ss"
              value={timeEval}
              onChange={value => setTimeEval(value)}
              className="input font-bai-jamjuree w-full px-5 border border-primary text-lg sm:text-2xl uppercase"
            />
          </div>

          <div className="mt-8 flex rounded-full border border-primary p-1 flex-shrink-0">
            <div className="flex rounded-full border-2 border-primary p-1 w-full">
              <button
                className={`btn btn-primary flex rounded-full capitalize font-normal font-white w-full items-center gap-1 hover:gap-2 transition-all tracking-widest ${
                  isLoading ? "loading" : ""
                }`}
                onClick={writeAsync}
              >
                {!isLoading && (
                  <>
                    Create bet <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 items-start">
            <span className="text-sm leading-tight">Price:</span>
            <div className="badge badge-warning">0.01 ETH + Gas</div>
          </div>
        </div>
      </div>
    </div>
  );
};
