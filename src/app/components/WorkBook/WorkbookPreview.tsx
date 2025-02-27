import { Workbook } from "@prisma/client";
import Link from "next/link";
import Button from "../Button";

const WorkbookPreview = ({ Workbook }: { Workbook: Workbook }) => {

  return (
    <li
      key={Workbook.id}
      className="flex items-center justify-between rounded-lg border p-2 shadow-sm max-w-[600px] w-full"
    >
      <span className="text-lg">{Workbook.name}</span>
      <div>
      <Link
          href={`/spreadsheet/${Workbook.id}`}
          className="w-full h-full"
        >
      <Button color={"blue"}>
        
          Open
        
      </Button>
      </Link>
      </div>
      
    </li>
  );
};

export default WorkbookPreview;
