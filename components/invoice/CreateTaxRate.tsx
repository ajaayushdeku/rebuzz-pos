"use client";

import { useState } from "react";
import { Plus, Percent, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTax, useCreateGroupTax, useTaxes } from "@/hooks/useTaxes";

type Tab = "normal" | "group";

export const CreateTaxDialog = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("normal");

  // Normal tax form
  const { mutate: createTax, isPending: creatingTax } = useCreateTax();
  const [normalForm, setNormalForm] = useState({ name: "", rate: 0 });

  // Group tax form
  const { mutate: createGroupTax, isPending: creatingGroup } =
    useCreateGroupTax();
  const { data: taxData } = useTaxes();
  const taxes = taxData?.taxes ?? [];
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);

  const filteredTaxes = taxes.filter((t) =>
    t.name.toLowerCase().includes(groupSearch.toLowerCase()),
  );

  const totalGroupRate = selectedTaxIds.reduce((sum, id) => {
    const t = taxes.find((x) => x._id === id);
    return sum + (t?.rate ?? 0);
  }, 0);

  const toggleTaxId = (id: string) => {
    setSelectedTaxIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const reset = () => {
    setNormalForm({ name: "", rate: 0 });
    setGroupName("");
    setGroupSearch("");
    setSelectedTaxIds([]);
    setTab("normal");
  };

  const handleSaveNormal = () => {
    if (!normalForm.name.trim() || normalForm.rate <= 0) return;
    createTax(
      {
        taxes: [
          {
            name: normalForm.name,
            rate: normalForm.rate,
            _id: null,
            adminId: null,
            isSelected: false,
            isEnabled: false,
            isToogleLoading: false,
          },
        ],
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  };

  const handleSaveGroup = () => {
    if (!groupName.trim() || selectedTaxIds.length === 0) return;
    createGroupTax(
      { groupName, groupedTaxes: selectedTaxIds },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  };

  const isPending = creatingTax || creatingGroup;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Tax
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-blue-600 text-base">
            Create Tax
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["normal", "group"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "normal" ? "Normal Tax" : "Group Tax"}
            </button>
          ))}
        </div>

        {/* Normal tax form */}
        {tab === "normal" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Tax Name
              </Label>
              <Input
                placeholder="e.g., VAT, Service Tax"
                value={normalForm.name}
                onChange={(e) =>
                  setNormalForm({ ...normalForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Rate (%)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="pl-7"
                  value={normalForm.rate}
                  onChange={(e) =>
                    setNormalForm({
                      ...normalForm,
                      rate: Number(e.target.value),
                    })
                  }
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Percent className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Group tax form */}
        {tab === "group" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Group Tax Name
              </Label>
              <Input
                placeholder="e.g., Total Tax"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Select Taxes to Group
              </Label>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Search taxes..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {taxes.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No normal taxes available. Create one first.
                  </p>
                ) : filteredTaxes.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No taxes match your search.
                  </p>
                ) : (
                  filteredTaxes.map((tax) => {
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

            {/* Live rate preview */}
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
                    {totalGroupRate}%
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            className="text-sm rounded-lg"
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-sm rounded-lg"
            onClick={tab === "normal" ? handleSaveNormal : handleSaveGroup}
            disabled={
              isPending ||
              (tab === "normal" &&
                (!normalForm.name.trim() || normalForm.rate <= 0)) ||
              (tab === "group" &&
                (!groupName.trim() || selectedTaxIds.length === 0))
            }
          >
            {isPending ? "Creating..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
