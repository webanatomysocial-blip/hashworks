'use client';

import { useSearchParams } from 'next/navigation';
import PortfolioView from '@/Components/portfolio/PortfolioView';

export default function WorkerPortfolioPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('id');
    
    return <PortfolioView role="worker" userId={userId} />;
}
