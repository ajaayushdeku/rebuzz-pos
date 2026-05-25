"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Page() {
  const [name, setName] = useState("");
  // const [type, setType] = useState("Product");
  const [description, setDescription] =
    useState("");
  const [price, setPrice] = useState("");

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className=" mb-8">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Add a Product or Service
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          Products and services you buy from
          vendors appear as items on Bills to
          record purchases.
        </p>
      </div>

      {/* Card */}
      <div className="flex items-center justify-center w-full">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-xl">
          <div className="p-8 space-y-6">
            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Name{" "}
                <span className="text-red-500">
                  *
                </span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Office Supplies"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="h-10  border-slate-200 focus:bg-white focus:border-blue-400 placeholder:text-slate-400 text-slate-800 transition-colors"
              />
            </div>
            <div className="space-y-1.5 flex gap-2">
              <Label
                htmlFor="type"
                className="text-sm font-medium text-gray-700"
              >
                Type {"  "}
              </Label>
              <Select defaultValue="product">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="product">
                      Product
                    </SelectItem>
                    <SelectItem value="service">
                      Service
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-slate-700"
                >
                  Description
                </Label>
                <span className="text-xs text-slate-400">
                  Optional
                </span>
              </div>
              <Textarea
                id="description"
                placeholder="Briefly describe this item…"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={3}
                className=" border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400 text-slate-800 resize-none text-sm transition-colors"
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label
                  htmlFor="price"
                  className="text-sm font-medium text-slate-700"
                >
                  Price
                </Label>
                <span className="text-xs text-slate-400">
                  Optional
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value)
                  }
                  className="pl-7 h-10  border-slate-200 focus:bg-white focus:border-blue-400 placeholder:text-slate-400 text-slate-800 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              <Link href="/products-services">
                Cancel
              </Link>
            </Button>
            <Button
              disabled={!name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 shadow-sm disabled:opacity-40 cursor-pointer"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
