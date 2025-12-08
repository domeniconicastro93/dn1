import { WalletPage } from '@/components/wallet/WalletPage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Wallet - Strike Gaming Cloud',
    description: 'Manage your balance, transactions, and payment methods.',
    pathname: '/wallet',
    noindex: true, // Wallet page should not be indexed
  });
}

export default function WalletRoute() {
  return <WalletPage />;
}

