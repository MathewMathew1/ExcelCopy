import { api } from "~/trpc/react";
import { severityColors } from "~/types/Toast";
import { useUpdateToast } from "~/contexts/useToast";
import type { SheetWithCells } from "~/types/WorkBook";
import { useState } from "react";
import type { Chart } from "@prisma/client";

export const useChartMutations = (workbook: { sheets: SheetWithCells[] }) => {
  const updateToast = useUpdateToast();
  const [versionOfCharts, setVersionOfCharts] = useState(1);

  const createChart = api.chart.create.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Created chart",
        severity: severityColors.success,
      });

      const sheet = workbook.sheets.find((s) => s.id === data.sheetId);
      setVersionOfCharts((prev) => prev + 1);
      sheet?.charts.push(data);
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to create chart",
        severity: severityColors.error,
      });
    },
  });

  const updateChart = api.chart.update.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Updated chart",
        severity: severityColors.success,
      });

      const sheet = workbook.sheets.find((s) => s.id === data.sheetId);

      const index = sheet?.charts.findIndex((c) => c.id === data.id);
      if (index !== undefined) {
        sheet!.charts[index] = data;
        setVersionOfCharts((prev) => prev + 1);
      }
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to update chart",
        severity: severityColors.error,
      });
    },
  });

  const deleteChart = api.chart.delete.useMutation({
    onSuccess: (data) => {
      updateToast.addToast({
        toastText: "Deleted chart",
        severity: severityColors.success,
      });

      const sheet = workbook.sheets.find((s) => s.id === data.sheetId);

      const index = sheet?.charts.findIndex((c) => c.id === data.id);
      if (index !== undefined) {
        sheet?.charts.splice(index, 1);
        setVersionOfCharts((prev) => prev + 1);
      }
    },
    onError: () => {
      updateToast.addToast({
        toastText: "Failed to delete chart",
        severity: severityColors.error,
      });
    },
  });

  
  const createChartFunc = async (chart: Chart, sheetId: string) => {
    await createChart.mutateAsync({ ...chart, sheetId });
  };

  const updateChartFunc = async (chart: Chart) => {
    await updateChart.mutateAsync({ ...chart, chartId: chart.id });
  };

  const deleteChartFunc = async (chartId: string) => {
    await deleteChart.mutateAsync({ chartId });
  };

  return {
    updateChart,
    deleteChart,
    createChart,
    versionOfCharts,
    createChartFunc,
    updateChartFunc,
    deleteChartFunc
  };
};
