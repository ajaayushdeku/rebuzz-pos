import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";

export default function BillHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-4xl font-bold text-gray-900">
        Bills
      </h1>
      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl">
        <Plus className="mt-0.5" />
        <Link href="/bills/add">
          Create a bill
        </Link>
      </Button>
    </div>
  );
}
