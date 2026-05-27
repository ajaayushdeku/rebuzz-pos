"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionType, useTracker } from "@/providers/ExpenseContext";

export default function ManagePurposesModal({
  open,
  onClose,
  type,
}: {
  open: boolean;
  onClose: () => void;
  type: TransactionType;
}) {
  const { expensePurposes, incomePurposes, addPurpose, removePurpose } =
    useTracker();
  const [newPurpose, setNewPurpose] = useState("");
  const purposes = type === "expense" ? expensePurposes : incomePurposes;

  const handleAdd = () => {
    const trimmed = newPurpose.trim();
    if (!trimmed || purposes.includes(trimmed)) return;
    addPurpose(type, trimmed);
    setNewPurpose("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900 capitalize">
            Manage {type} Purposes
          </DialogTitle>
        </DialogHeader>

        {/* Add new */}
        <div className="flex gap-2">
          <input
            value={newPurpose}
            onChange={(e) => setNewPurpose(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="New purpose name..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {purposes.map((p) => (
            <div
              key={p}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50"
            >
              <span className="text-sm text-gray-700">{p}</span>
              <button
                onClick={() => removePurpose(type, p)}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
