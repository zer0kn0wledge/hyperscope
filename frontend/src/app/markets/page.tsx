'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MarketsIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/markets/BTC');
  }, [router]);
  return null;
}
