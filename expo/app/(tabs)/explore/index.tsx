import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin, Search, Clock, Star, Filter, Navigation, ChevronRight, X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { mockPlaces, categoryLabels, categoryEmojis } from '@/mocks/places';
import { PlaceCategory } from '@/types';

type FilterCategory = PlaceCategory | 'all';

const FILTER_CATEGORIES: FilterCategory[] = ['all', 'food', 'grocery', 'pharmacy', 'gym', 'cafe', 'gas'];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [zipCode, setZipCode] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOpen24h, setShowOpen24h] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const cardAnims = useRef<Record<string, Animated.Value>>({}).current;

  const getCardAnim = useCallback((id: string) => {
    if (!cardAnims[id]) {
      cardAnims[id] = new Animated.Value(1);
    }
    return cardAnims[id];
  }, [cardAnims]);

  const filteredPlaces = useMemo(() => {
    let places = mockPlaces;

    if (activeFilter !== 'all') {
      places = places.filter(p => p.category === activeFilter);
    }

    if (showOpen24h) {
      places = places.filter(p => p.isOpen24h);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      places = places.filter(
        p => p.name.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return places;
  }, [activeFilter, showOpen24h, searchQuery]);

  const handleFilterPress = useCallback((cat: FilterCategory) => {
    setActiveFilter(cat);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (zipCode.trim().length >= 3) {
      setHasSearched(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [zipCode]);

  const handleCardPress = useCallback((id: string) => {
    const anim = getCardAnim(id);
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [getCardAnim]);

  const renderStars = useCallback((rating: number) => {
    const full = Math.floor(rating);
    const stars: React.ReactNode[] = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          color={i < full ? Colors.dark.amber : Colors.dark.textMuted}
          fill={i < full ? Colors.dark.amber : 'transparent'}
        />
      );
    }
    return stars;
  }, []);

  const renderPriceLevel = useCallback((level: number) => {
    return Array(level).fill('$').join('');
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Open Now</Text>
            <Text style={styles.subtitle}>Find what's open on your schedule</Text>
          </View>
          <View style={styles.headerIcon}>
            <MapPin size={22} color={Colors.dark.amber} />
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.zipRow}>
            <View style={styles.zipInputContainer}>
              <Navigation size={16} color={Colors.dark.textMuted} />
              <TextInput
                style={styles.zipInput}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="Enter zip code"
                placeholderTextColor={Colors.dark.textMuted}
                keyboardType="number-pad"
                maxLength={5}
                testID="zip-code-input"
              />
              {zipCode.length > 0 && (
                <Pressable onPress={() => { setZipCode(''); setHasSearched(false); }}>
                  <X size={16} color={Colors.dark.textMuted} />
                </Pressable>
              )}
            </View>
            <Pressable
              style={[styles.searchButton, zipCode.trim().length < 3 && styles.searchButtonDisabled]}
              onPress={handleSearch}
              testID="search-zip-button"
            >
              <Search size={18} color={Colors.dark.background} />
            </Pressable>
          </View>

          <View style={styles.nameSearchContainer}>
            <Search size={16} color={Colors.dark.textMuted} />
            <TextInput
              style={styles.nameSearchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or tag..."
              placeholderTextColor={Colors.dark.textMuted}
              testID="search-name-input"
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          style={styles.filtersScroll}
        >
          {FILTER_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.filterChip, activeFilter === cat && styles.filterChipActive]}
              onPress={() => handleFilterPress(cat)}
              testID={`filter-${cat}`}
            >
              <Text style={styles.filterEmoji}>{categoryEmojis[cat]}</Text>
              <Text style={[styles.filterText, activeFilter === cat && styles.filterTextActive]}>
                {categoryLabels[cat]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          style={[styles.toggle24h, showOpen24h && styles.toggle24hActive]}
          onPress={() => {
            setShowOpen24h(!showOpen24h);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          testID="toggle-24h"
        >
          <Clock size={14} color={showOpen24h ? Colors.dark.background : Colors.dark.amber} />
          <Text style={[styles.toggle24hText, showOpen24h && styles.toggle24hTextActive]}>
            24h Only
          </Text>
        </Pressable>

        {!hasSearched ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['rgba(245, 166, 35, 0.1)', 'rgba(245, 166, 35, 0.02)']}
              style={styles.emptyCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MapPin size={40} color={Colors.dark.amber} />
              <Text style={styles.emptyTitle}>Find Open Places Near You</Text>
              <Text style={styles.emptyText}>
                Enter your zip code to discover restaurants, pharmacies, gyms, and more that are open during your shift hours.
              </Text>
              <View style={styles.emptyFeatures}>
                <View style={styles.emptyFeature}>
                  <Text style={styles.emptyFeatureEmoji}>🍔</Text>
                  <Text style={styles.emptyFeatureText}>Late-night eats</Text>
                </View>
                <View style={styles.emptyFeature}>
                  <Text style={styles.emptyFeatureEmoji}>💊</Text>
                  <Text style={styles.emptyFeatureText}>24h pharmacies</Text>
                </View>
                <View style={styles.emptyFeature}>
                  <Text style={styles.emptyFeatureEmoji}>💪</Text>
                  <Text style={styles.emptyFeatureText}>Anytime gyms</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.resultsList}>
            <Text style={styles.resultsCount}>
              {filteredPlaces.length} place{filteredPlaces.length !== 1 ? 's' : ''} found
            </Text>

            {filteredPlaces.map((place) => (
              <Animated.View
                key={place.id}
                style={{ transform: [{ scale: getCardAnim(place.id) }] }}
              >
                <Pressable
                  style={styles.placeCard}
                  onPress={() => handleCardPress(place.id)}
                  testID={`place-${place.id}`}
                >
                  <View style={styles.placeHeader}>
                    <View style={[styles.placeEmoji, {
                      backgroundColor: place.isOpen24h ? Colors.dark.successDim : Colors.dark.amberDim,
                    }]}>
                      <Text style={styles.placeEmojiText}>{categoryEmojis[place.category]}</Text>
                    </View>
                    <View style={styles.placeInfo}>
                      <Text style={styles.placeName}>{place.name}</Text>
                      <Text style={styles.placeAddress}>{place.address}</Text>
                    </View>
                    <View style={styles.placeDistance}>
                      <Navigation size={12} color={Colors.dark.textMuted} />
                      <Text style={styles.placeDistanceText}>{place.distance}</Text>
                    </View>
                  </View>

                  <View style={styles.placeMeta}>
                    <View style={styles.placeOpenBadge}>
                      <Clock size={12} color={place.isOpen24h ? Colors.dark.success : Colors.dark.amber} />
                      <Text style={[
                        styles.placeOpenText,
                        { color: place.isOpen24h ? Colors.dark.success : Colors.dark.amber },
                      ]}>
                        {place.isOpen24h ? 'Open 24h' : `Until ${place.openUntil}`}
                      </Text>
                    </View>
                    <View style={styles.placeRating}>
                      {renderStars(place.rating)}
                      <Text style={styles.placeRatingText}>{place.rating}</Text>
                    </View>
                    <Text style={styles.priceLevelText}>{renderPriceLevel(place.priceLevel)}</Text>
                  </View>

                  <View style={styles.placeTags}>
                    {place.tags.slice(0, 3).map((tag, i) => (
                      <View key={i} style={styles.placeTag}>
                        <Text style={styles.placeTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              </Animated.View>
            ))}

            {filteredPlaces.length === 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No places match your filters</Text>
                <Pressable
                  style={styles.clearFiltersButton}
                  onPress={() => { setActiveFilter('all'); setShowOpen24h(false); setSearchQuery(''); }}
                >
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.dark.amberDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    marginBottom: 16,
    gap: 10,
  },
  zipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  zipInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  zipInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    paddingVertical: 14,
    fontWeight: '500' as const,
  },
  searchButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.dark.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.4,
  },
  nameSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  nameSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.text,
    paddingVertical: 12,
  },
  filtersScroll: {
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterChipActive: {
    backgroundColor: Colors.dark.amberDim,
    borderColor: Colors.dark.amber,
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  filterTextActive: {
    color: Colors.dark.amber,
  },
  toggle24h: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.dark.amber + '40',
    marginBottom: 20,
  },
  toggle24hActive: {
    backgroundColor: Colors.dark.amber,
  },
  toggle24hText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.amber,
  },
  toggle24hTextActive: {
    color: Colors.dark.background,
  },
  emptyState: {
    marginTop: 8,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyFeatures: {
    flexDirection: 'row',
    gap: 16,
  },
  emptyFeature: {
    alignItems: 'center',
    gap: 6,
  },
  emptyFeatureEmoji: {
    fontSize: 24,
  },
  emptyFeatureText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  resultsList: {
    gap: 0,
  },
  resultsCount: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    fontWeight: '500' as const,
    marginBottom: 14,
  },
  placeCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  placeEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeEmojiText: {
    fontSize: 20,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  placeDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeDistanceText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  placeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  placeOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeOpenText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  placeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  placeRatingText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  priceLevelText: {
    fontSize: 12,
    color: Colors.dark.success,
    fontWeight: '600' as const,
  },
  placeTags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  placeTag: {
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  placeTagText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  noResultsText: {
    fontSize: 15,
    color: Colors.dark.textMuted,
  },
  clearFiltersButton: {
    backgroundColor: Colors.dark.amberDim,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.amber,
  },
});
