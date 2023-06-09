import { useEffect, useState } from "react";

export const DynamicProgressBar = (props: { value: number; max: number }) => {
  const [ratio, setRatio] = useState(0);
  const [level, setLevel] = useState("");

  useEffect(() => {
    setRatio(props.value / props.max);
  }, [props.value, props.max]);

  useEffect(() => {
    if (ratio < 0.75) {
      setLevel("primary");
    } else if (ratio < 0.9) {
      setLevel("warning");
    } else {
      setLevel("error");
    }
  }, [ratio]);

  function temperatureClassname() {
    return "progress-" + level;
  }

  return (
    <progress className={`progress ${temperatureClassname()} w-full`} value={props.value} max={props.max}></progress>
  );
};
