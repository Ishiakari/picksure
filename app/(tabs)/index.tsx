import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Template } from '@/src/data/templates';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuth } from '@/context/AuthContext';
import { Colors, Fonts } from '@/constants/theme';
import { useBookmarks } from '@/hooks/useBookmarks';
import UploadTemplateModal from '@/components/UploadTemplateModal';

import { useTemplateSearch } from '@/hooks/useTemplateSearch';
import CategoryCarousel from '@/components/home/CategoryCarousel';
import FeedHeader from '@/components/home/FeedHeader';
import FeedFooter from '@/components/home/FeedFooter';
import TemplateFeedCard from '@/components/home/TemplateFeedCard';

export default function HomeScreen() {
  const {
    templates,
    loading,
    refreshing,
    refresh,
    retry,
    loadingMore,
    loadMore,
    hasMore,
    error,
  } = useTemplates();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark, bookmarkedIds } = useBookmarks();
  const params = useLocalSearchParams<{ category?: string; openSearch?: string }>();
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  // Search & category filtering
  const {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    isSearchActive,
    setIsSearchActive,
    filteredTemplates,
    featuredTemplate,
    gridTemplates,
    resetFilters,
  } = useTemplateSearch({
    templates,
    paramCategory: params.category,
    paramOpenSearch: params.openSearch,
  });

  const handleTemplatePress = useCallback((id: string) => {
    router.push({
      pathname: '/detail',
      params: { id },
    });
  }, []);

  const renderCard: ListRenderItem<Template> = useCallback(
    ({ item, index }) => (
      <TemplateFeedCard
        item={item}
        index={index}
        isSaved={isBookmarked(item.id)}
        onPress={handleTemplatePress}
        onToggleSave={toggleBookmark}
      />
    ),
    [isBookmarked, handleTemplatePress, toggleBookmark]
  );

  const renderHeader = useCallback(
    () => (
      <FeedHeader
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRetry={retry}
        filteredCount={filteredTemplates.length}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        featuredTemplate={featuredTemplate}
        onPressFeatured={handleTemplatePress}
        onResetFilters={resetFilters}
        onOpenUpload={() => setIsUploadModalVisible(true)}
        isLoggedIn={Boolean(user)}
        onGoToAuth={() => router.push('/auth')}
      />
    ),
    [
      loading,
      refreshing,
      error,
      retry,
      filteredTemplates.length,
      selectedCategory,
      searchQuery,
      featuredTemplate,
      handleTemplatePress,
      resetFilters,
      user,
    ]
  );

  const renderFooter = useCallback(
    () => (
      <FeedFooter
        hasGuides={!loading && !error && filteredTemplates.length > 0}
        loadingMore={loadingMore}
      />
    ),
    [loading, error, filteredTemplates.length, loadingMore]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header Section */}
      <View style={styles.header}>
        {isSearchActive ? (
          <View style={styles.searchContainer}>
            <Feather name="search" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search templates, styles..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity
              style={styles.searchCloseBtn}
              onPress={() => {
                setIsSearchActive(false);
                setSearchQuery('');
              }}
            >
              <Feather name="x" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.headerBrandCenter}>
              <Text style={styles.headerBrandTitle}>Picksure</Text>
            </View>

            <View style={styles.headerRightRow}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => setIsSearchActive(true)}
              >
                <Feather name="search" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>

              {/* Primary + Create Guide Trigger */}
              <TouchableOpacity
                style={[styles.headerIconBtn, styles.headerCreateBtn]}
                onPress={() => setIsUploadModalVisible(true)}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={20} color={Colors.background} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => {
                  if (user) {
                    router.push('/(tabs)/profile');
                  } else {
                    router.push('/auth');
                  }
                }}
              >
                {user?.user_metadata?.avatar_url ? (
                  <Image
                    source={{ uri: user.user_metadata.avatar_url }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : user ? (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {(user.email?.charAt(0) || 'U').toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.avatarFallback}>
                    <Feather name="user" size={18} color={Colors.textPrimary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Category Horizontal Filter Pills */}
      <CategoryCarousel
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Main Feed Content */}
      <FlashList
        data={loading || error ? [] : gridTemplates}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        masonry={true}
        extraData={bookmarkedIds}
        contentContainerStyle={styles.feedScroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (hasMore && !loadingMore && !loading) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primaryDark}
            colors={[Colors.primaryDark]}
          />
        }
      />

      {/* Upload Template Modal */}
      <UploadTemplateModal
        visible={isUploadModalVisible}
        onClose={() => setIsUploadModalVisible(false)}
        onUploadSuccess={refresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerBrandCenter: {
    alignItems: 'center',
  },
  headerBrandTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCreateBtn: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.primaryDark,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  searchCloseBtn: {
    padding: 4,
  },
  feedScroll: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
});
