"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUserData } from "@/services/apiProfile";

export default function NavbarWelcome() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchUserData,
  });

  if (isLoading) {
    return (
      <span className="text-sm font-medium text-gray-700 dark:text-[#7ba2e3]">
        Welcome...
      </span>
    );
  }

  return (
    <span className="text-sm font-medium dark:text-[#1b2537] dark:text-[#e8ecf4] flex flex-row gap-2">
      Hello !{"  "}
      <span className="text-sm font-medium text-[#244074] dark:text-[#7ba2e3]">
        {" "}
        {profile?.name}
      </span>
    </span>
  );
}
