import { Discount } from "@/app/(app)/settings/discount/page";
import { Pencil, Trash2 } from "lucide-react";

const DiscountTable = ({
  discounts,
  search,
  onEdit,
  onDelete,
}: {
  discounts: Discount[];
  search: string;
  onEdit: (d: Discount) => void;
  onDelete: (id: string) => void;
}) => {
  const filtered = discounts.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No discounts found
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-gray-400 border-b border-gray-100">
          <th className="text-left pb-2.5 font-medium">Name</th>
          <th className="text-left pb-2.5 font-medium">Value</th>
          <th className="text-right pb-2.5 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((d) => (
          <tr
            key={d._id}
            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
          >
            <td className="py-3 font-medium text-gray-800">{d.name}</td>
            <td className="py-3 text-gray-600">
              {d.type === "percentage" ? `${d.rate}%` : `Rs ${d.rate}`}
            </td>
            <td className="py-3">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => onEdit(d)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(d._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DiscountTable;
