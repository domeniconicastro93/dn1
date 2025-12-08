import { AccountPage } from '@/components/account/AccountPage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Account Settings - Strike Gaming Cloud',
    description: 'Manage your account settings, language, region, and privacy preferences.',
    pathname: '/account',
    noindex: true,
  });
}

export default function AccountRoute() {
  return <AccountPage />;
}

