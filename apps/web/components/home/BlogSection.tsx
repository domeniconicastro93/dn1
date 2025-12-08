'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

export function BlogSection() {
  const t = useTranslations('home.blog');

  const posts = [
    {
      id: 1,
      title: 'The Future of Cloud Gaming',
      description: 'Exploring how cloud gaming is revolutionizing the industry',
      image: '/images/blog-1.jpg',
      category: 'Technology',
      date: 'March 15, 2024',
    },
    {
      id: 2,
      title: 'Top 10 Games to Play This Month',
      description: 'Discover the hottest games available on Strike',
      image: '/images/blog-2.jpg',
      category: 'Gaming',
      date: 'March 12, 2024',
    },
    {
      id: 3,
      title: 'How to Create Epic Gaming Reels',
      description: 'Tips and tricks for making viral gaming content',
      image: '/images/blog-3.jpg',
      category: 'Content',
      date: 'March 10, 2024',
    },
    {
      id: 4,
      title: 'Tournament Season is Here',
      description: 'Join the biggest gaming tournaments and win prizes',
      image: '/images/blog-4.jpg',
      category: 'Events',
      date: 'March 8, 2024',
    },
  ];

  return (
    <section className="relative w-full py-20 bg-[#080427] overflow-hidden">
      <div className="relative z-10 container mx-auto px-5 md:px-20">
        {/* Section Header */}
        <div className="max-w-[1280px] mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('sectionTitle')}
          </h2>
          <p className="text-lg text-gray-300 max-w-[768px]">
            {t('sectionDescription')}
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="max-w-[1290px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group cursor-pointer"
              >
                <div className="relative h-[240px] rounded-lg overflow-hidden mb-4">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-5 left-5">
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-md">
                      <span className="text-white text-xs font-medium">{post.category}</span>
                    </div>
                  </div>
                  <div className="absolute top-5 right-5">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <ArrowUpRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                <div className="px-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gray-300 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">{post.description}</p>
                  <p className="text-gray-500 text-xs">{post.date}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

