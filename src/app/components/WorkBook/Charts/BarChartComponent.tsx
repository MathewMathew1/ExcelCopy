import { Bar } from "react-chartjs-2";

const BarChartComponent = ({ data, options }: { data: any; options: any }) => {
  return <Bar data={data} options={options} />;
};

export default BarChartComponent;