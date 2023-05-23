import { useState } from "react";
import moment from "moment";

//its a card component that displays few properties of a bet - price, time the betting stops and when winning side is chosen
export const BetItem = () => {
  const [betterCount] = useState(0);
  //   const [thresholdPrice, setThresholdPrice] = useState(0);
  const [timeStop] = useState(new Date());
  //   const [timeEval, setTimeEval] = useState(new Date());

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Addresses betting: {betterCount}</h5>
        <p className="card-text">{moment(timeStop).format("DD/MM/YYYY HH:mm:ss")}</p>
        <a href="#" className="btn btn-primary">
          Go somewhere
        </a>
      </div>
    </div>
  );
};
