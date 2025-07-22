
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    // This check runs only on the client-side
    const hasSetup = localStorage.getItem('edenApiKey');
    if (hasSetup) {
      router.replace('/dashboard');
    } else {
      router.replace('/launcher-ui');
    }
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <p>Initializing...</p>
    </div>
  );
}
