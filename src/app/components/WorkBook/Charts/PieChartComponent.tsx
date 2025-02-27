import { Pie } from "react-chartjs-2";

const PieChartComponent = ({ data, options }: { data: any; options: any }) => {
  return <Pie data={data} options={options} />;
};

export default PieChartComponent;