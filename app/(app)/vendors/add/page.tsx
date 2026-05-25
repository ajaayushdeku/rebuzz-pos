"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  return (
    <div className="min-h-screen bg-white p-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Add a Vendor
        </h1>
        {/* <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          Vendors
        </p> */}
      </div>

      <div className="flex items-center justify-center w-full">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-xl">
          <div className="p-8 space-y-6">
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Vendor Name{" "}
                <span className="text-red-500">
                  *
                </span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Egg Supplier"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="h-10  border-gray-200 focus:bg-white focus:border-blue-400 placeholder:text-gray-400 text-gray-800 transition-colors"
              />
            </div>
            <div className=" space-y-1.5 grid grid-cols-2 gap-2">
              <div>
                <Label
                  htmlFor="owner"
                  className="text-sm font-medium text-gray-700"
                >
                  Owner&apos;s Name{" "}
                </Label>
                <Input
                  id="owner"
                  placeholder="e.g. John Doe"
                  value={owner}
                  onChange={(e) =>
                    setOwner(e.target.value)
                  }
                  className="h-10  border-gray-200 focus:bg-white focus:border-blue-400 placeholder:text-gray-400 text-gray-800 transition-colors"
                />
              </div>
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="e.g. eggs@gmail.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="h-10  border-gray-200 focus:bg-white focus:border-blue-400 placeholder:text-gray-400 text-gray-800 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700"
              >
                Phone no
              </Label>
              <Input
                id="phone"
                placeholder="e.g. +977 98********"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                className="h-10  border-gray-200 focus:bg-white focus:border-blue-400 placeholder:text-gray-400 text-gray-800 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="address"
                className="text-sm font-medium text-gray-700"
              >
                Address
              </Label>
              <Input
                id="address"
                placeholder="e.g. Nayabazar, Pokhara"
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                className="h-10  border-gray-200 focus:bg-white focus:border-blue-400 placeholder:text-gray-400 text-gray-800 transition-colors"
              />
            </div>
          </div>
          {/* Footer */}
          <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              <Link href="/vendors">Cancel</Link>
            </Button>
            <Button
              disabled={!name.trim()}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 shadow-sm disabled:opacity-40"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
