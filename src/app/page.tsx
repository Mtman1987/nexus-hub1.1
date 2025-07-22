
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to the launcher UI.
    // The launcher will handle logic for the setup wizard.
    router.replace('/launcher-ui');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <p>Initializing...</p>
    </div>
  );
}
