"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";

const Sheet = () => {
  const [a, setA] = useState("1");

  const params = useParams<{ id: string }>();

  const id = params?.id;

  const idOfProject = typeof id === "string" ? id : "1";

  const { data: workbook, isLoading, isError } = api.workbook.getById.useQuery({ id: idOfProject });
  

  // Local state for managing edited cells
  const [cellData, setCellData] = useState(() => {
    const initialData: Record<string, string | null> = {};
    workbook?.sheets.forEach((sheet) => {
      sheet.rows.forEach((row) => {
        row.cells.forEach((cell) => {
          initialData[`${sheet.id}-${row.rowNum}-${cell.colNum}`] = cell.value;
        });
      });
    });
    return initialData;
  });

  // Function to handle value change
  const handleCellChange = (sheetId: string, rowNum: number, colNum: number, newValue: string) => {
    setCellData((prevData) => ({
      ...prevData,
      [`${sheetId}-${rowNum}-${colNum}`]: newValue,
    }));
  };

  if (isLoading) return <div>Loading workbook...</div>;
  if (isError) return <div>Error loading workbook.</div>;

  // Save changes (optional, if you want to persist to server)
  const saveCellValue = async (sheetId: string, rowNum: number, colNum: number, newValue: string) => {
    // Here you would send a mutation to update the cell value in your database
    try {
     
    } catch (error) {
      console.error('Error updating cell value', error);
    }
  };

  

  return (
    <div className="workbook-container">
      <h1>{workbook?.name}</h1>

      {workbook?.sheets.map((sheet) => (
        <div key={sheet.id} className="sheet">
          <h2>{sheet.name}</h2>
          <div className="worksheet">
            <table className="excel-table">
              <thead>
                <tr>
                  {Array.from({ length: 16 }).map((_, colIndex) => (
                    <th key={colIndex}>Col {colIndex + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.cells.map((cell, colIndex) => {
                      const cellKey = `${sheet.id}-${row.rowNum}-${cell.colNum}`;
                      const currentValue = cellData[cellKey] ?? '';

                      return (
                        <td key={colIndex} onClick={() => handleCellChange(sheet.id, row.rowNum, cell.colNum, currentValue)}>
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              handleCellChange(sheet.id, row.rowNum, cell.colNum, newValue);
                              saveCellValue(sheet.id, row.rowNum, cell.colNum, newValue);
                            }}
                            onBlur={() => saveCellValue(sheet.id, row.rowNum, cell.colNum, currentValue)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};



export default Sheet;
