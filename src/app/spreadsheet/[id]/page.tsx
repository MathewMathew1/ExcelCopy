"use server"
import Workbook from "~/app/components/WorkBook/Workbook";
import { findWorkbookWithCache, RootLayoutProps } from "./layout";

const WorkBookC = async ({
    children,
    params,
  }: RootLayoutProps) => {
    const { id } = await params
    const workbook = await findWorkbookWithCache(id);
 
    return <>
    {workbook?
        <Workbook workbook={workbook}/>
    :
        <div>Loading workbook...</div>
    }
 
</>
}
 
export default WorkBookC;