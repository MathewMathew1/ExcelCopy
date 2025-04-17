import React from "react";
import type { severityColors } from "~/types/Toast";

interface ToastProps {
  variant: severityColors;
  message: string;
  handleClose: () => void;
  bottom: number;
}

const Toast: React.FC<ToastProps> = ({
  variant,
  message,
  handleClose,
  bottom,
}) => {
  return (
    <div
      style={{ bottom: `${bottom}px` }}
      className="fixed right-8 w-[300px] animate-slide-up fade-in"
    >
      <div
        className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 shadow-lg ${variant} text-white`}
        role="alert"
      >
        <span className="text-sm leading-snug">{message}</span>
        <button
          onClick={handleClose}
          className="rounded-full p-1 hover:bg-white/10 transition"
          aria-label="Close toast"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;

