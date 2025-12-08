'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/v1/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          locale: locale,
          marketingConsent: false,
        }),
      });

      let data;
      try {
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        // If JSON parsing fails, use the response text
        console.error('Failed to parse response:', parseError);
        setError(`Registration failed: ${response.statusText || 'Invalid response from server'}`);
        setIsLoading(false);
        return;
      }

      if (!response.ok || !data.success) {
        // Handle various error formats:
        // 1. {error: "string"}
        // 2. {error: {code: "...", message: "..."}}
        // 3. {error: {error: {...}}}
        // 4. {message: "..."}
        let errorMessage = 'Registration failed';

        if (data.error) {
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error.message) {
            errorMessage = data.error.message;
          } else if (data.error.code) {
            errorMessage = `Registration failed: ${data.error.code}`;
          }
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }

        // Log full response for debugging
        console.error('Registration error response:', {
          status: response.status,
          statusText: response.statusText,
          data: JSON.stringify(data, null, 2),
          errorMessage,
        });
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Registration successful - tokens are stored in cookies by server action
      // Redirect to games page
      router.push('/games');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080427] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          {t('register.title')}
        </h1>
        <p className="text-gray-400 text-center mb-8">
          {t('register.description')}
        </p>

        <form onSubmit={handleSubmit} className="bg-white/5 rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-[#080427] hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : t('register.submit')}
          </Button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

