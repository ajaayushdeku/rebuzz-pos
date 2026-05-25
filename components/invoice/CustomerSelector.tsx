import { Customer } from "@/lib/types/customer";

import { useState } from "react";
import { Check, Plus } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { useCustomerNames } from "@/hooks/useCustomersList";
import CustomerFormModal from "./CustomerFormModal";

interface CustomerSelectorProps {
  // customers: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  onCreateNew?: () => void;
  value?: Customer | null;
}

const CustomerSelector = ({
  onCustomerSelect,
  onCreateNew: _onCreateNew,
  value,
}: CustomerSelectorProps) => {
  const { data: customers = [], isLoading } = useCustomerNames();
  const [open, setOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const hasSelectedCustomer = value && (value.name || value.id);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="p-5 m-4 w-62.5 h-35 font-semibold text-blue-700 rounded-lg flex items-center justify-center border border-gray-300 cursor-pointer hover:bg-blue-50 transition-colors">
            {isLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : hasSelectedCustomer ? (
              <div className="text-center">
                <p className="font-semibold text-gray-900">{value.name}</p>
                <p className="text-sm text-gray-500 font-normal">
                  {value.email}
                </p>
              </div>
            ) : (
              <span>+ Add a customer</span>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Type a customer name" />

            <CommandList className="max-h-[100px]">
              <CommandEmpty>No customer found.</CommandEmpty>

              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    // Command uses 'value' for filtering; ensure it's a string
                    value={customer.name}
                    onSelect={() => {
                      // Update the parent's state
                      onCustomerSelect(customer);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        // Check against the prop ID
                        value?.id === customer.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {customer.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>

            <CommandSeparator />
            <div
              className="flex items-center gap-2 px-4 py-2.5 text-blue-600 font-medium text-sm cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => {
                setCreateModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create new customer
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create customer modal */}
      <CustomerFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={(customer) => {
          // Auto-select the newly created customer
          onCustomerSelect(customer);
          setOpen(false);
        }}
      />
    </>
  );
};

export default CustomerSelector;
