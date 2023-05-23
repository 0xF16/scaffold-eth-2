import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export const PriceChart = () => {
  const [data] = useState<number[]>([1500, 1600, 1530, 1650, 1624, 1639, 1543, 1688, 1565, 1534, 1576]);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);
      const height = 500;
      const width = 500;
      const margin = { top: 20, right: 20, bottom: 20, left: 20 };

      const x = d3
        .scaleLinear()
        .domain([0, data.length - 1])
        .range([margin.left, width - margin.right]);

      const y = d3
        .scaleLinear()
        .domain(d3.extent(data) as [number, number])
        .range([height - margin.bottom, margin.top]);

      const line = d3
        .area<number>()
        .x((d, i) => x(i))
        .y0(y(0))
        .y1(d => y(d));

      svg.selectAll("path").data([data]).join("path").attr("d", line).attr("fill", "#cce5df").attr("stroke", "#69b3a2");
    }
  }, [data]);

  //return the svg in the dom that is 100% width and height
  return <svg ref={ref} width="100%" height="100%" viewBox="0 0 500 500" />;
};
