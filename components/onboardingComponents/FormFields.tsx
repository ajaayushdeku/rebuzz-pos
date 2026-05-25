// components/onboarding/FormFields.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}

export const FormInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: FormInputProps) => {
  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border-[1.5px] border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
      />
    </div>
  );
};

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
}

export const FormSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}: FormSelectProps) => {
  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
        {label}
      </label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
