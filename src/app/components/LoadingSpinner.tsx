import { VscRefresh } from "react-icons/vsc";

type LoadingSpinnerProps = {
  big?: boolean;
};

export function LoadingSpinner({ big = false }: LoadingSpinnerProps) {
  const sizeClasses = big ? "w-[40%] h-[40%]" : "w-10 h-10";

  return (
    <div className="flex justify-center p-2 ">
      <VscRefresh fill="black" className={`animate-spin ${sizeClasses}`} />
    </div>
  );
}