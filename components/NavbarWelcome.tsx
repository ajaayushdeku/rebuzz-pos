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
      <span className="text-sm font-medium text-gray-700">Welcome...</span>
    );
  }

  return (
    <span className="text-sm font-medium text-gray-700">
      Welcome, {profile?.name} !
    </span>
  );
}
