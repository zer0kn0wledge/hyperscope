'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CompareIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/compare/dex');
  }, [router]);
  return null;
}
