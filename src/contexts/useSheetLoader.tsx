import { useCallback, useEffect, useRef} from "react";
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

  const changes = useRef(false)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      // eslint-disable-next-line
      const params = new URLSearchParams(searchParams!);
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

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

      const path = pathname + "?" + createQueryString("sheet", firstSheet.id)
      window.history.pushState({}, "",path);

    }
  }, [searchParams, workbookSheets, pathname ]);

  useEffect(() => {


    if (currentSheetId) {
      console.log(currentSheetId)
      const path = pathname + "?" + createQueryString("sheet", currentSheetId)
      window.history.pushState({}, "",path);
    }
  }, [currentSheetId, searchParams]);
};
