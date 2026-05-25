// "use client";

// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { ColumnDef } from "@tanstack/react-table";
// import { ArrowDown } from "lucide-react";
// import Link from "next/link";

// export type Vendor = {
//   id: string;
//   type: string;
//   name: string;
//   owner?: string;
//   phone?: string;
//   email?: string;
//   address?: string;
// };

// export const getVendorColumns: ColumnDef<Vendor>[] =
//   [
//     {
//       accessorKey: "type",
//       header: "Type",
//       cell: ({ row }) => (
//         <span className="bg-gray-600">
//           {row.getValue("type")}
//         </span>
//       ),
//     },
//     {
//       accessorKey: "name",
//       header: "Name",
//       cell: ({ row }) => (
//         <span>{row.getValue("name")}</span>
//       ),
//     },
//     {
//       accessorKey: "email",
//       header: "Email",
//       cell: ({ row }) => (
//         <span>{row.getValue("email")}</span>
//       ),
//     },
//     {
//       accessorKey: "phone",
//       header: "Phone no.",
//       cell: ({ row }) => (
//         <span>{row.getValue("phone")}</span>
//       ),
//     },
//     {
//       id: "actions",
//       header: "Actions",
//       cell: () => (
//         <div className="flex gap-3 ">
//           <Button variant="outline">
//             <Link
//               href="/bill/add"
//               className=" hover:bg-gray-700 font-semibold text-blue-800   cursor-pointer"
//             >
//               Create a bill
//             </Link>
//           </Button>

//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="outline">
//                 <ArrowDown />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent>
//               <DropdownMenuGroup>
//                 <DropdownMenuItem>
//                   Edit
//                 </DropdownMenuItem>
//               </DropdownMenuGroup>
//               <DropdownMenuSeparator />
//               <DropdownMenuGroup>
//                 <DropdownMenuItem>
//                   Delete
//                 </DropdownMenuItem>
//               </DropdownMenuGroup>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       ),
//     },
//   ];
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export type Vendor = {
  id: string;
  type: string;
  name: string;
  owner?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export const getVendorColumns: ColumnDef<Vendor>[] =
  [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
          {row.getValue("type")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-slate-800">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-slate-500 text-sm">
          {row.getValue("email") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone no.",
      cell: ({ row }) => (
        <span className="text-slate-500 text-sm">
          {row.getValue("phone") ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: () => (
        <div className="flex items-center justify-end gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 text-xs font-medium"
          >
            <Link href="/bill/add">
              Create bill
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="px-2"
              >
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-36"
            >
              <DropdownMenuGroup>
                <DropdownMenuItem className="gap-2 text-slate-700 cursor-pointer">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="gap-2 bg-red-500 focus:text-gray-100 text-gray-100 focus:bg-red-500 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5 text-gray-100" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
