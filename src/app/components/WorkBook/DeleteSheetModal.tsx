
import { useSheet } from "./Workbook";
import Button from "../Button";
import Modal from "../Modal";


const DeleteSheetModal = ({isOpen, handleClose, deleteFunc, sheetId}: {
    isOpen: boolean, 
    handleClose: () => void,
    deleteFunc: (sheetId: string) => void
    sheetId: string
}) => {

    const workbook = useSheet()

    const sheet = workbook.sheets.find(s => s.id == sheetId) || workbook.sheets[0]!
    
    const deleteSheet = () => {
        deleteFunc(sheetId)
        handleClose()
    }

    return <> 
    {isOpen?
        <Modal onClose={handleClose}>
            <div onClick={()=>handleClose()} className="flex mt-3 flex-col p-5 text-white">
                <div> <h3 className="text-[1rem] text-bold mb-3">Are you sure you want to delete {sheet.name}?</h3></div>
                <div className="flex justify-end gap-2">
                    <Button color="blue" onClick={()=>handleClose()}>Cancel</Button>
                    <Button color="red" onClick={()=>deleteSheet()}>Delete</Button>
                </div>
            </div>
        </Modal>
    :
        null
    }
    </>
}
 
export default DeleteSheetModal;