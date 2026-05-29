"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Shield,
  UserCog,
} from "lucide-react";

export type StaffMember = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isEmployee?: boolean;
  isDeactivated?: boolean;
  emailVerified?: boolean;
};

// ── Role badge ──────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const isStaff = role === "staff";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isStaff
          ? "bg-purple-50 text-purple-700 border border-purple-200"
          : "bg-blue-50 text-blue-700 border border-blue-200"
      }`}
    >
      {isStaff ? (
        <Shield className="h-3 w-3" />
      ) : (
        <UserCog className="h-3 w-3" />
      )}
      {isStaff ? "Staff" : "Basic"}
    </span>
  );
}

// ── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ deactivated }: { deactivated?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        deactivated
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-green-50 text-green-700 border border-green-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          deactivated ? "bg-red-500" : "bg-green-500"
        }`}
      />
      {deactivated ? "Disabled" : "Active"}
    </span>
  );
}

// ── Columns ────────────────────────────────────────────────────────────────

export const getStaffColumns = (
  onEdit: (staff: StaffMember) => void,
  onDelete: (id: string) => void,
): ColumnDef<StaffMember>[] => [
  {
    id: "sno",
    header: () => <div className="text-center">S.No.</div>,
    cell: ({ row }) => (
      <div className="text-center text-sm text-gray-500">{row.index + 1}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-sm font-medium tracking-wide"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Staff Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium text-gray-900">
        {row.original.name || "—"}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-sm font-medium tracking-wide"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        {row.original.email || "—"}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        {row.original.phone || "—"}
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <RoleBadge role={row.getValue("role")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "isDeactivated",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge deactivated={row.getValue("isDeactivated")} />
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const member = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(member)}
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(member._id)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      );
    },
  },
];
