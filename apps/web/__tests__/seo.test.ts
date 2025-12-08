/**
 * SEO Utilities Tests
 */

// @ts-nocheck - Test file, type checking disabled
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { describe, it, expect } from '@jest/globals';
import {
  generateSEOMetadata,
  generateVideoObjectStructuredData,
  generateVideoGameStructuredData,
  generatePersonStructuredData,
  generateBroadcastEventStructuredData,
} from '../lib/seo';

describe('SEO Utilities', () => {
  describe('generateSEOMetadata', () => {
    it('should generate complete metadata with all required fields', () => {
      const metadata = generateSEOMetadata(
        {
          title: 'Test Page',
          description: 'Test description',
          pathname: '/test',
        },
        '/test'
      );

      expect(metadata.title).toBe('Test Page');
      expect(metadata.description).toBe('Test description');
      expect(metadata.alternates?.canonical).toBeDefined();
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.twitter).toBeDefined();
    });

    it('should include hreflang tags for all locales', () => {
      const metadata = generateSEOMetadata(
        {
          title: 'Test Page',
          description: 'Test description',
          pathname: '/test',
        },
        '/test'
      );

      expect(metadata.alternates?.languages).toBeDefined();
      const languages = metadata.alternates?.languages as Record<string, string>;
      expect(Object.keys(languages).length).toBeGreaterThan(0);
    });
  });

  describe('generateVideoObjectStructuredData', () => {
    it('should generate valid VideoObject schema', () => {
      const structuredData = generateVideoObjectStructuredData({
        id: 'clip_123',
        title: 'Test Clip',
        description: 'Test description',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        duration: 120,
        creator: {
          name: 'Test Creator',
          handle: 'testcreator',
        },
        game: {
          name: 'Test Game',
        },
        publishedAt: '2024-01-01T00:00:00Z',
      });

      const data = structuredData as Record<string, unknown>;
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('VideoObject');
      expect(data.name).toBe('Test Clip');
      expect(data.duration).toBe('PT120S');
    });
  });

  describe('generateVideoGameStructuredData', () => {
    it('should generate valid VideoGame schema', () => {
      const structuredData = generateVideoGameStructuredData({
        id: 'game_123',
        name: 'Test Game',
        description: 'Test game description',
        genre: ['Action', 'Adventure'],
        releaseDate: '2024-01-01',
      });

      const data = structuredData as Record<string, unknown>;
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('VideoGame');
      expect(data.name).toBe('Test Game');
    });
  });

  describe('generatePersonStructuredData', () => {
    it('should generate valid Person schema', () => {
      const structuredData = generatePersonStructuredData({
        id: 'creator_123',
        name: 'Test Creator',
        handle: 'testcreator',
        bio: 'Test bio',
      });

      const data = structuredData as Record<string, unknown>;
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('Person');
      expect(data.name).toBe('Test Creator');
    });
  });

  describe('generateBroadcastEventStructuredData', () => {
    it('should generate valid BroadcastEvent schema', () => {
      const structuredData = generateBroadcastEventStructuredData({
        id: 'stream_123',
        name: 'Test Stream',
        description: 'Test stream description',
        startDate: '2024-01-01T00:00:00Z',
        videoUrl: 'https://example.com/stream.m3u8',
        creator: {
          name: 'Test Creator',
          handle: 'testcreator',
        },
        game: {
          name: 'Test Game',
        },
      });

      const data = structuredData as Record<string, unknown>;
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('BroadcastEvent');
      expect(data.name).toBe('Test Stream');
    });
  });
});

