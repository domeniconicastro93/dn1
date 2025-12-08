import { UserLibraryGrid } from '@/components/library/UserLibraryGrid';
import { loadUserLibrary } from '@/lib/server/user-library';

interface LibraryPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function LibraryPage({ params }: LibraryPageProps) {
  const { locale } = await params;
  let library = null;
  let error: string | null = null;

  try {
    library = await loadUserLibrary();
  } catch (err) {
    library = null;
    if (err instanceof Error) {
      if (err.message === 'Steam account not linked') {
        error = 'steam_not_linked';
      } else if (err.message.includes('STEAM_WEB_API_KEY')) {
        error = 'steam_api_key_missing';
      } else {
        error = err.message;
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#050214] py-12">
      <div className="container mx-auto px-5 md:px-20">
        {error === 'steam_api_key_missing' && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            <p className="font-semibold">Steam Web API key is not configured</p>
            <p className="mt-2 text-red-100">
              Please set STEAM_WEB_API_KEY in your environment. Get your key from{' '}
              <a
                href="https://steamcommunity.com/dev/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-red-50"
              >
                https://steamcommunity.com/dev/apikey
              </a>
            </p>
          </div>
        )}
        <UserLibraryGrid library={library} locale={locale} />
      </div>
    </div>
  );
}

