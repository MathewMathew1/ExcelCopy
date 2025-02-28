import { Pie } from "react-chartjs-2";
import type { ChartDataType, ChartOptions } from "./ChartComponent";

const PieChartComponent = ({ data, options }: { data: ChartDataType; options: ChartOptions }) => {
  return <Pie data={data} options={options} />;
};

export default PieChartComponent;