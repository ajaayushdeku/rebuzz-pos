"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBusiness,
  useUpdateBusiness,
} from "@/hooks/useBusiness";
import {
  Building2,
  MapPin,
  Phone,
  FileText,
  User,
  Briefcase,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

function FieldRow({
  label,
  icon,
  children,
  index,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <div
      className="group grid grid-cols-[1fr_2fr] gap-2 items-center py-3  transition-all duration-200 hover:bg-slate-50/60 -mx-6 px-6 rounded-md"
      style={{
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-slate-400 group-hover:text-blue-500 transition-colors duration-200">
          {icon}
        </span>
        <label className="text-sm font-bold text-gray-700 tracking-wide uppercase">
          {label}
        </label>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

type BusinessFormValues = {
  businessName: string;
  address: string;
  accurateLocation: string;
  phoneNumber: string;
  panNumber: number;
  owner: string;
  businessType: string;
};

export default function Page() {
  const { data: business } = useBusiness();
  const { mutate: updateBusiness, isPending } =
    useUpdateBusiness();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset } =
    useForm<BusinessFormValues>({
      defaultValues: {
        businessName: business?.businessName,
        address: business?.address,
        accurateLocation:
          business?.accurateLocation ?? "",
        phoneNumber: business?.phoneNumber,
        panNumber: business?.panNumber,
        owner: business?.owner,
        businessType: business?.businessType,
      },
    });

  useEffect(() => {
    if (business) reset(business);
  }, [business]);
  function handleSave(data: BusinessFormValues) {
    updateBusiness({ businessData: data });
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="py-2 border-b-2 border-gray-400">
          <h1 className="text-2xl font-bold text-blue-700  tracking-tight">
            BUSINESS INFORMATION
          </h1>
          <p className="text-gray-600  text-xl">
            Manage your business profile and
            public details.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white  shadow-xl shadow-slate-100/60 overflow-hidden">
          <div className="h-1 w-full bg-linear-to-r from-blue-500 via-blue-400 to-sky-400" />

          <div className="px-6 py-2">
            <form
              className="divide-y divide-slate-100"
              onSubmit={handleSubmit(handleSave)}
            >
              <FieldRow
                label="Business Name"
                icon={
                  <Building2 className="w-4 h-4" />
                }
                index={0}
              >
                <input
                  type="text"
                  id="businessName"
                  {...register("businessName")}
                  // defaultValue={
                  //   business?.businessName
                  // }
                  placeholder="e.g. Meowtrix"
                  className="w-full pl-5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white outline-none transition-all duration-200"
                />
              </FieldRow>

              <FieldRow
                label="Address"
                icon={
                  <MapPin className="w-4 h-4" />
                }
                index={1}
              >
                <input
                  type="text"
                  id="address"
                  {...register("address")}
                  // defaultValue={business?.address}
                  placeholder="123 Main Street, City"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white outline-none transition-all duration-200"
                />
              </FieldRow>

              <FieldRow
                label="Accurate Location"
                icon={
                  <MapPin className="w-4 h-4" />
                }
                index={6}
              >
                <input
                  type="text"
                  {...register(
                    "accurateLocation",
                  )}
                  placeholder="e.g. Lakeside, Pokhara"
                  className="w-full pl-5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 ..."
                />
              </FieldRow>
              <FieldRow
                label="Phone Number"
                icon={
                  <Phone className="w-4 h-4" />
                }
                index={2}
              >
                <input
                  type="tel"
                  id="phoneNumber"
                  {...register("phoneNumber")}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white outline-none transition-all duration-200"
                />
              </FieldRow>

              <FieldRow
                label="PAN No."
                icon={
                  <FileText className="w-4 h-4" />
                }
                index={3}
              >
                <input
                  type="number"
                  id="panNumber"
                  {...register("panNumber")}
                  placeholder="e.g. 123456789"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white outline-none transition-all duration-200"
                />
              </FieldRow>

              <FieldRow
                label="Owner"
                icon={
                  <User className="w-4 h-4" />
                }
                index={4}
              >
                <input
                  type="text"
                  id="owner"
                  {...register("owner")}
                  // defaultValue={business?.owner}
                  placeholder="Full name"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white outline-none transition-all duration-200"
                />
              </FieldRow>

              <FieldRow
                label="Business Type"
                icon={
                  <Briefcase className="w-4 h-4" />
                }
                index={5}
              >
                <Select
                  {...register("businessType")}
                >
                  <SelectTrigger className="w-full text-sm border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-lg">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="food">
                        Food
                      </SelectItem>
                      <SelectItem value="service">
                        Service
                      </SelectItem>
                      <SelectItem value="tech">
                        Tech
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldRow>

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-6 pb-2">
                <p className="text-xs text-slate-400">
                  Details appear on invoices,
                  receipts, and reports.
                </p>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 hover:text-white"
                >
                  {saved
                    ? " Saved"
                    : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* <p className="text-center text-xs text-slate-400 mt-6">
          Changes are reflected immediately across
          your account.
        </p> */}
      </div>
    </div>
  );
}
