'use client';

import { authClient } from '@/auth/client';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function Page() {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;

    async function doSignOut() {
      try {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              if (!cancelled) router.replace('/login');
            },
          },
        });
      } catch (err) {
        console.error('Sign-out error:', err);
      }
    }

    doSignOut();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
