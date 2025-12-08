import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { t } from '@/lib/i18n';
import type { Clip } from '@/types';

// Simple icon placeholders
const HeartIcon = ({ size, color, fill }: { size: number; color: string; fill?: string }) => (
  <Text style={{ fontSize: size, color: fill || color }}>❤️</Text>
);
const MessageIcon = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size, color }}>💬</Text>
);
const ShareIcon = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size, color }}>📤</Text>
);
const EyeIcon = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size, color }}>👁️</Text>
);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelItemProps {
  clip: Clip;
  isActive: boolean;
  onViewableItemsChanged?: (viewableItems: any[]) => void;
}

export function ReelItem({ clip, isActive }: ReelItemProps) {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isActive]);

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <Video
        ref={videoRef}
        source={{ uri: clip.videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isActive}
        isLooping
        isMuted={false}
      />

      {/* Overlay Gradient - React Native doesn't support CSS gradients directly */}
      {/* Using a simple dark overlay for Phase 3 */}
      <View style={styles.gradientOverlay} />

      {/* Content Overlay */}
      <View style={styles.contentOverlay}>
        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconContainer}>
              <HeartIcon size={28} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>{clip.likes.toLocaleString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconContainer}>
              <MessageIcon size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>
              {clip.comments.toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconContainer}>
              <ShareIcon size={28} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <View style={styles.creatorInfo}>
            {clip.creatorAvatarUrl && (
              <Image
                source={{ uri: clip.creatorAvatarUrl }}
                style={styles.avatar}
              />
            )}
            <View style={styles.creatorText}>
              <Text style={styles.creatorHandle}>@{clip.creatorHandle}</Text>
              <Text style={styles.gameTitle}>{clip.gameTitle}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <EyeIcon size={16} color="#9CA3AF" />
              <Text style={styles.statText}>
                {clip.views.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Note: React Native doesn't support CSS gradients directly
    // For Phase 3, we use a simple overlay. In production, use react-native-linear-gradient
  },
  contentOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  rightActions: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomInfo: {
    gap: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  creatorText: {
    flex: 1,
  },
  creatorHandle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gameTitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

