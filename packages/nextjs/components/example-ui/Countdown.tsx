import { useEffect, useState } from "react";
import moment from "moment";

export const Countdown = (props: { milestoneTime: moment.Moment }) => {
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [days, setDays] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);

  const [counterReachedZero, setCounterReachedZero] = useState<boolean>(false);

  //funcation that takes duration and unit as an input and returns either a year, month, day, hour, minute or second.
  useEffect(() => {
    const interval = setInterval(() => {
      // const duration = moment.duration(props.milestoneTime.diff(moment()));
      const date: Date = new Date(
        new Date(props.milestoneTime.toDate()).getTime() - new Date(moment().toDate()).getTime(),
      );
      setYears(date.getUTCFullYear() - 1970);
      setMonths(date.getUTCMonth());
      setDays(date.getUTCDate() - 1);
      setHours(date.getUTCHours());
      setMinutes(date.getUTCMinutes());
      setSeconds(date.getUTCSeconds());

      setCounterReachedZero(moment().isAfter(props.milestoneTime));
      if (moment().isAfter(props.milestoneTime)) {
        clearInterval(interval);
      }
      return () => clearInterval(interval);
    }, 1000);
  }, [props.milestoneTime]);

  return (
    <div className={`grid grid-flow-col gap-5 text-center auto-cols-max ${counterReachedZero ? "hidden" : null}`}>
      {years ? (
        <div className="flex flex-col text-center text-3s">
          <span className="countdown font-monol">{/* <span style={{ "--value": years }}></span> */}</span>y
        </div>
      ) : null}
      {months ? (
        <div className="flex flex-col text-center">
          <span className="countdown font-mono">{/* <span style={{ "--value": months }}></span> */}</span>
          mon
        </div>
      ) : null}
      {days ? (
        <div className="flex flex-col">
          <span className="countdown font-mono">{/* <span style={{ "--value": days }}></span> */}</span>d
        </div>
      ) : null}
      {hours ? (
        <div className="flex flex-col text-center">
          <span className="countdown font-mono">{/* <span style={{ "--value": hours }}></span> */}</span>h
        </div>
      ) : null}
      {minutes ? (
        <div className="flex flex-col text-center">
          <span className="countdown font-mono">{/* <span style={{ "--value": minutes }}></span> */}</span>
          min
        </div>
      ) : null}
      {seconds ? (
        <div className="flex flex-col text-center">
          <span className="countdown font-mono">{/* <span style={{ "--value": seconds }}></span> */}</span>
          sec
        </div>
      ) : null}
    </div>
  );
};
