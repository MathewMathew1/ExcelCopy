import { Bar } from "react-chartjs-2";
import type { ChartDataType, ChartOptions } from "./ChartComponent";

const BarChartComponent = ({ data, options }: { data: ChartDataType; options: ChartOptions }) => {
  return <Bar data={data} options={options} />;
};

export default BarChartComponent;