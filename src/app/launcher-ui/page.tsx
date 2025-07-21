"use client";

// This file is no longer in use and can be safely removed.
// The logic has been moved to the root page.tsx to simplify the user experience.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedLauncherPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <p>Redirecting...</p>
    </div>
  );
}
