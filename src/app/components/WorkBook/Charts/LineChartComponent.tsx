import { Line } from "react-chartjs-2";
import type { ChartDataType, ChartOptions } from "./ChartComponent";

const LineChartComponent = ({ data, options }: { data: ChartDataType; options: ChartOptions }) => {
  return <Line data={data} options={options} />;
};

export default LineChartComponent;