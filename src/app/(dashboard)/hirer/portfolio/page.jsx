'use client';

import { useSearchParams } from 'next/navigation';
import PortfolioView from '@/Components/portfolio/PortfolioView';

export default function HirerPortfolioPage() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('id');
    
    return <PortfolioView role="hirer" userId={userId} />;
}
