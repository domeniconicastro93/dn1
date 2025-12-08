import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ReelItem } from '@/components/feed/ReelItem';
import { t } from '@/lib/i18n';
import type { Clip } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function FeedScreen() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // TODO: Replace with actual API call
  // useEffect(() => {
  //   loadFeed();
  // }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Clip; index: number }) => (
      <ReelItem
        clip={item}
        isActive={index === activeIndex}
        onViewableItemsChanged={(viewableItems) => {
          if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
          }
        }}
      />
    ),
    [activeIndex]
  );

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    []
  );

  if (clips.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {/* Empty state */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={clips}
        renderItem={renderItem}
        estimatedItemSize={SCREEN_HEIGHT}
        getItemType={() => 'reel'}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        onEndReached={() => {
          // TODO: Load more clips
        }}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080427',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#080427',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

