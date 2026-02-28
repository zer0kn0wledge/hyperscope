'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrderbookIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/orderbook/BTC');
  }, [router]);
  return null;
}
