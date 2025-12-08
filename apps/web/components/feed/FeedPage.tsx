'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReelsGrid } from './ReelsGrid';
import { SteamVmPanel } from './SteamVmPanel';

export function FeedPage() {
  const t = useTranslations('feed');
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'explore'>('for-you');

  return (
    <div className="min-h-screen bg-[#080427] py-8">
      <div className="container mx-auto px-5 md:px-20">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-300">
            {t('description')}
          </p>
        </div>

        <div className="mb-10">
          <SteamVmPanel />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="bg-white/10 border border-white/20 mb-8">
            <TabsTrigger value="for-you" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#080427]">
              {t('tabs.forYou')}
            </TabsTrigger>
            <TabsTrigger value="following" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#080427]">
              {t('tabs.following')}
            </TabsTrigger>
            <TabsTrigger value="explore" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#080427]">
              {t('tabs.explore')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="for-you">
            <ReelsGrid type="for-you" />
          </TabsContent>
          <TabsContent value="following">
            <ReelsGrid type="following" />
          </TabsContent>
          <TabsContent value="explore">
            <ReelsGrid type="explore" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

