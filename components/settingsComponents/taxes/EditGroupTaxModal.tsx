import { useState } from "react";
import { Search, Check, Loader2 } from "lucide-react";
import { Tax, GroupedTax } from "@/services/apiTaxes.client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EditGroupTaxModal = ({
  open,
  onOpenChange,
  group,
  taxes,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupedTax | null;
  taxes: Tax[];
  onSave: (payload: { name: string; taxIds: string[] }) => void;
  isPending: boolean;
}) => {
  const [name, setName] = useState(group?.name ?? "");
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>(
    group?.taxIds ?? [],
  );
  const [search, setSearch] = useState("");

  // Reset state when group changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && group) {
      setName(group.name);
      setSelectedTaxIds([...group.taxIds]);
      setSearch("");
    }
    onOpenChange(isOpen);
  };

  const toggleTaxId = (id: string) => {
    setSelectedTaxIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const getGroupRate = (taxIds: string[]) =>
    taxIds.reduce((sum, id) => {
      const t = taxes.find((x) => x._id === id);
      return sum + (t?.rate ?? 0);
    }, 0);

  const handleSave = () => {
    if (!name.trim() || selectedTaxIds.length === 0) return;
    onSave({ name, taxIds: selectedTaxIds });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Edit Group Tax
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">
              Group Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Total Tax"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">
              Select Taxes
            </Label>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search taxes..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {taxes.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No normal taxes available.
                </p>
              ) : (
                taxes
                  .filter((t) =>
                    t.name.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((tax) => {
                    const isSelected = selectedTaxIds.includes(tax._id);
                    return (
                      <button
                        key={tax._id}
                        type="button"
                        onClick={() => toggleTaxId(tax._id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="text-left">
                          <p className="font-medium text-xs">{tax.name}</p>
                          <p className="text-xs text-gray-400">{tax.rate}%</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
          {selectedTaxIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">
                    Combined Rate
                  </p>
                  <p className="text-xs text-blue-400 mt-0.5">
                    {selectedTaxIds
                      .map((id) => {
                        const t = taxes.find((x) => x._id === id);
                        return t ? `${t.name} (${t.rate}%)` : "";
                      })
                      .join(" + ")}
                  </p>
                </div>
                <p className="text-xl font-bold text-blue-700">
                  {getGroupRate(selectedTaxIds)}%
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-sm rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim() || selectedTaxIds.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-sm rounded-lg"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditGroupTaxModal;
