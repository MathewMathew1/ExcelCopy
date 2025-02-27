"use client"
import { useUser } from "~/contexts/useUser";
import WorkbookPreview from "./WorkBook/WorkbookPreview";

const UserWorkbooks = () => {
    const userData = useUser()
    
    return <div className="glass mx-4 mb-3 mt-2 h-[100%] overflow-auto">
    <h2 className="text-center text-xl font-semibold">Your Workbooks</h2>
    {userData.userData && userData.userData?.workbooks.length > 0 ? (
      <ul className="flex flex-col items-center justify-center space-y-2">
        {userData.userData.workbooks.map((workbook, index) => (
          <WorkbookPreview
            Workbook={workbook}
            key={`workbook preview ${index}`}
          ></WorkbookPreview>
        ))}
      </ul>
    ) : (
      <p className="text-gray-500">
        No workbooks found. Create one to get started.
      </p>
    )}
  </div>
}
 
export default UserWorkbooks;