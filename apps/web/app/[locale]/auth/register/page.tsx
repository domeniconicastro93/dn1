import { RegisterPage } from '@/components/auth/RegisterPage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Sign Up - Strike Gaming Cloud',
    description: 'Create your Strike account and start playing instantly.',
    pathname: '/auth/register',
    noindex: true,
  });
}

export default function RegisterRoute() {
  return <RegisterPage />;
}

