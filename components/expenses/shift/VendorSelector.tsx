import { useVendors } from "@/hooks/expenses/useVendors";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Vendor } from "./vendors/vendor-columns";
import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorSelectorProps {
  onVendorSelect: (vendor: Vendor) => void;
  onCreateNew?: () => void;
  value?: Vendor | null;
}

export default function VendorSelector({
  onVendorSelect,
  onCreateNew,
  value,
}: VendorSelectorProps) {
  const { data: vendors = [], isLoading } =
    useVendors();
  const [open, setOpen] = useState(false);
  const hasSelectedVendor =
    value && (value.name || value.id);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="p-5 m-4 w-62.5 h-35 font-semibold text-blue-700 rounded-lg flex items-center justify-center border border-gray-300 cursor-pointer hover:bg-blue-50 transition-colors">
          {isLoading ? (
            <span className="text-gray-400">
              Loading...
            </span>
          ) : hasSelectedVendor ? (
            <div className="text-center">
              <p className="font-semibold text-gray-900">
                {value.name}
              </p>
              <p className="text-sm text-gray-500 font-normal">
                {value.email}
              </p>
            </div>
          ) : (
            <span>+ Add a vendor</span>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Type a vendor name" />
          <CommandList>
            <CommandEmpty>
              No vendor found.
            </CommandEmpty>
            <CommandGroup>
              {vendors.map((vendor) => (
                <CommandItem
                  key={vendor.id}
                  value={vendor.name}
                  onSelect={() => {
                    onVendorSelect(vendor);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      // Check against the prop ID
                      value?.id === vendor.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {vendor.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
