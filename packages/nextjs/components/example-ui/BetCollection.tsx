import { BetItem } from "./BetItem";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export const BetCollection = () => {
  const { data: totalCounter } = useScaffoldContractRead({
    contractName: "BetCollectorFactory",
    functionName: "getClonesLength",
  });

  return (
    //center grid on page
    <div>
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-4 p-4">
          {/* loop as many times as the totalCounter is */}
          {Array.from(Array(totalCounter?.toNumber() || 0).keys()).map(index => (
            <BetItem key={index} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
