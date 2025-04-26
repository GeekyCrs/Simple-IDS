"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page simply redirects to the chef's version to avoid code duplication.
// Access control should ideally happen in middleware or the layout based on role.
export default function ManagerManageMenuRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chef/manage-menu');
  }, [router]);

  return (
    <div className="container mx-auto py-8 text-center">
      <p className="text-muted-foreground">Redirecting to menu management...</p>
    </div>
  );
}
