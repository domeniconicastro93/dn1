import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function BetaPage() {
  const t = useTranslations('common');
  const tBeta = useTranslations('beta');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#080427] via-[#0a0a2e] to-[#16213e]">
      <div className="container mx-auto px-5 md:px-20 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            {tBeta('title')}
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            {t('tagline')}
          </p>
          <p className="text-lg text-gray-400 mb-12">
            {tBeta('description')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/feed"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              {t('getStarted')}
            </Link>
            <Link
              href="/games"
              className="px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20"
            >
              {tBeta('exploreGames')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

