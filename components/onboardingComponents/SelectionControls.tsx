import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export const Chip = ({ label, selected, onClick }: ChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full border-2 text-sm font-medium whitespace-nowrap transition-all duration-200",
        selected
          ? "border-indigo-500 bg-indigo-50 text-indigo-600 font-bold"
          : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200",
      )}
    >
      {label}
    </button>
  );
};

interface GoalCardProps {
  icon: React.ElementType;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export const GoalCard = ({
  icon: Icon,
  label,
  selected,
  onClick,
}: GoalCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-5 rounded-2xl border-2 text-center flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer",
        selected
          ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100 -translate-y-0.5"
          : "border-slate-200 bg-white shadow-sm hover:border-indigo-200",
      )}
    >
      <Icon
        className={cn(
          "h-6 w-6",
          selected ? "text-indigo-500" : "text-slate-400",
        )}
      />
      <span
        className={cn(
          "text-xs font-semibold leading-tight",
          selected ? "text-indigo-600" : "text-gray-700",
        )}
      >
        {label}
      </span>
    </button>
  );
};
