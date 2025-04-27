
import { useUpdateWorkBook } from "~/types/WorkBook"; 
import Button from "../../Button";
import Modal from "../../Modal";
import { Macro } from "@prisma/client";



const DeleteMacroModal = ({handleClose, macro}: {
    handleClose: () => void,
    macro: Macro|null
}) => {

    const workbook = useUpdateWorkBook()
    
    const deleteMacro = () => {
        if(!macro) return
        workbook.deleteMacroFunc(macro.id)
        handleClose()
    }

    return <> 
    {macro?
        <Modal onClose={handleClose}>
            <div onClick={()=>handleClose()} className="flex mt-3 flex-col p-5 text-white z-[2000]">
                <div> <h3 className="text-[1rem] text-bold mb-3">Are you sure you want to delete {macro.name}?</h3></div>
                <div className="flex justify-end gap-2">
                    <Button color="blue" onClick={()=>handleClose()}>Cancel</Button>
                    <Button color="red" onClick={()=>deleteMacro()}>Delete</Button>
                </div>
            </div>
        </Modal>
    :
        null
    }
    </>
}
 
export default DeleteMacroModal;