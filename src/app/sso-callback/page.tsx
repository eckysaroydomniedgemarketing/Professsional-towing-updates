"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    void handleRedirectCallback({
      redirectUrl: "/dashboard",
    });
  }, [handleRedirectCallback, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Completing sign in...</h2>
        <p className="mt-2 text-sm text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}