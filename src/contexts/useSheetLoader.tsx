import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { SheetWithCells } from "~/types/WorkBook";

export const useSheetLoader = (
  workbookSheets: SheetWithCells[],
  currentSheetId: string | null,
  setCurrentSheetId: (id: string) => void,
) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();



  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams!);
    params.set(name, value);
    return params.toString();
  };

  useEffect(() => {
    if (!searchParams) return;
    const sheetFromUrl = workbookSheets.find(
      (sheet) => sheet.id === searchParams.get("sheet"),
    );

    if (sheetFromUrl) {
      setCurrentSheetId(sheetFromUrl.id);
    } else if (workbookSheets.length > 0) {
      const firstSheet = workbookSheets[0]!;
      setCurrentSheetId(firstSheet.id);
      router.push(pathname + "?" + createQueryString("sheet", firstSheet.id));
    }
  }, [searchParams, workbookSheets]);

  useEffect(() => {
    if (currentSheetId) {
      router.push(pathname + "?" + createQueryString("sheet", currentSheetId));
    }
  }, [currentSheetId]);
};
