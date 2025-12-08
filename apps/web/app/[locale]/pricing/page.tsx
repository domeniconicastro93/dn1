import { PricingPage } from '@/components/pricing/PricingPage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Pricing - Strike Gaming Cloud',
    description:
      'Choose the perfect plan for your gaming needs. Free tier available. Premium plans with priority access.',
    pathname: '/pricing',
  });
}

export default function PricingRoute() {
  return <PricingPage />;
}

