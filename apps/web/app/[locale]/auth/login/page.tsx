import { LoginPage } from '@/components/auth/LoginPage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Login - Strike Gaming Cloud',
    description: 'Sign in to your Strike account to start gaming.',
    pathname: '/auth/login',
    noindex: true,
  });
}

export default function LoginRoute() {
  return <LoginPage />;
}

