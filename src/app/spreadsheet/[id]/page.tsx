"use server";

import Workbook from "~/app/components/WorkBook/Workbook";
import type { PageLayoutProps } from "../utils/utils";
import { findWorkbookWithCache } from "../utils/utils";

async function Page ({ params }: PageLayoutProps)  {
  const { id } = await params; 
  const workbook = await findWorkbookWithCache(id); 

  return (
    <>
      {workbook ? <Workbook workbook={workbook} /> : <div>Loading workbook...</div>}
    </>
  );
};

export default Page;
