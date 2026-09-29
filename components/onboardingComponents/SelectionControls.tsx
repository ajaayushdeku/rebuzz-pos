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
          ? "border-indigo-500 bg-indigo-50 text-indigo-600 font-bold dark:text-indigo-300 dark:bg-indigo-400/10"
          : "border-slate-200 bg-white dark:bg-white/5 text-slate-500 hover:border-indigo-200 dark:text-[#9aa6bd] dark:border-white/15",
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
          ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100 -translate-y-0.5 dark:bg-indigo-400/10"
          : "border-slate-200 bg-white dark:bg-white/5 shadow-sm hover:border-indigo-200 dark:border-white/15",
      )}
    >
      <Icon
        className={cn(
          "h-6 w-6",
          selected
            ? "text-indigo-500 dark:text-indigo-400"
            : "text-slate-400 dark:text-[#7b869b]",
        )}
      />
      <span
        className={cn(
          "text-xs font-semibold leading-tight",
          selected
            ? "text-indigo-600 dark:text-indigo-300"
            : "text-gray-700 dark:text-[#c3ccdc]",
        )}
      >
        {label}
      </span>
    </button>
  );
};
