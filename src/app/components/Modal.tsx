import { useEffect, useRef } from "react";

const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => {
  const modalRef = useRef<HTMLDivElement>(null); // Ref to the modal content

  useEffect(() => {
    const handleOnMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose(); 
      }
    }
    
    document.addEventListener("mousedown", handleOnMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleOnMouseDown); 
    };
  }, [onClose]);

  return (
    <div
      className="relative z-[100]"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true" 
    >
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0  z-10 w-screen overflow-y-auto">
        <div className="flex  min-h-full  items-end justify-center text-center sm:items-center sm:p-0">
          <div ref={modalRef} className="max-h-[100vh] overflow-visible flex relative transform overflow-hidden rounded-lg bg-[#333537] text-left shadow-xl transition-all sm:w-full sm:max-w-lg">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
