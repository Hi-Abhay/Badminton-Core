import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import { light, dark } from '../../theme/Color';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Book Courts\nInstantly',
    description:
      'Quickly find and reserve nearby badminton courts without calls or waiting.',
    imageUri:
      'https://imgs.search.brave.com/wgPMzGla0-XDKSB2VihleokukDmxVQIEjdXudas3_3U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbHVz/LnVuc3BsYXNoLmNv/bS9wcmVtaXVtX3Bo/b3RvLTE2NzAwMDIy/NzI0OTEtM2QzZjhm/NWMwMGE1P2ZtPWpw/ZyZxPTYwJnc9MzAw/MCZhdXRvPWZvcm1h/dCZmaXQ9Y3JvcCZp/eGxpYj1yYi00LjEu/MCZpeGlkPU5Id3hN/akEzZkRBPQ',
  },
  {
    id: '2',
    title: 'Come Hang out\nand Join The\nTournaments!',
    description:
      'Compete in local tournaments and friendly matches. Track your progress and climb the ranks.',
    imageUri:
      'https://imgs.search.brave.com/squWVhGRt3deREzJO4IwSqxcn1q_x8te7fDi3In2R4U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbmcu/cG5ndHJlZS5jb20v/dGh1bWJfYmFjay9m/aDI2MC9iYWNrZ3Jv/dW5kLzIwMjUwNjE4/L3BuZ3RyZWUtZmll/cnktYmFkbWludG9u/LXBsYXllci1pbi1h/Y3Rpb24tZHluYW1p/Yy1zcG9ydC1pbWFn/ZV8xNzQzNzMxOC5q/cGc?w=1000&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    title: 'Build Your\nCommunity',
    description:
      'Connect with players at your skill level. Find partners, join teams, and grow together.',
    imageUri:
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1000&auto=format&fit=crop&q=80',
  },
];

const Onboarding = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? dark : light;
  const isDark = colorScheme === 'dark';

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate('Login');
    }
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  // Uses theme-matched transparent base colors to avoid muddy gray bands during crossfade
  const gradientColors = isDark
    ? ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.9)', theme.bgBase]
    : ['rgba(244, 244, 245, 0)', 'rgba(244, 244, 245, 0.45)', 'rgba(244, 244, 245, 0.9)', theme.bgBase];

  const renderSlide = ({ item }) => {
    return (
      <View style={[styles.slideContainer, { backgroundColor: theme.bgBase }]}>
        {/* Top Visual Artwork */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.imageUri }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Smooth Linear Gradient Bleed */}
          <LinearGradient
            colors={gradientColors}
            locations={[0, 0.45, 0.8, 1]}
            style={styles.gradientOverlay}
          />
        </View>

        {/* Text Details Area */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {item.title}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bgBase }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScroll}
      />

      {/* Bottom Sticky Action Deck */}
      <View
        style={[
          styles.footerWrapper,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 28,
            backgroundColor: theme.bgBase,
          },
        ]}
      >
        {/* Capsule Pagination Indicator */}
        <View
          style={[
            styles.paginationCapsule,
            { borderColor: theme.borderColor, backgroundColor: theme.bgSurface },
          ]}
        >
          {SLIDES.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={idx}
                style={[
                  isActive ? styles.activeIndicator : styles.inactiveDot,
                  {
                    backgroundColor: isActive ? theme.success : theme.borderColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Action Pill Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={[styles.actionButton, { backgroundColor: theme.accentBg }]}
        >
          {/* Left Sparkle Badge */}
          <View style={[styles.buttonBadge, { backgroundColor: theme.accentText }]}>
            <Ionicons name="sparkles" size={17} color={theme.accentBg} />
          </View>

          {/* Dynamic Label */}
          <Text style={[styles.actionButtonText, { color: theme.accentText }]}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>

          {/* Right Arrow Badge */}
          <View style={[styles.buttonBadge, { backgroundColor: theme.accentText }]}>
            <Ionicons name="arrow-forward" size={18} color={theme.accentBg} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  imageWrapper: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.54,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180, // Generous height for a smooth transition into text
  },
  textContainer: {
    paddingHorizontal: 28,
    paddingTop: 16,
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 40,
    marginBottom: 12,
  },
  description: {
    fontSize: 14.5,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: -0.1,
    maxWidth: '90%',
  },
  footerWrapper: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  paginationCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    paddingHorizontal: 4,
    marginBottom: 20,
    marginLeft: 4,
  },
  activeIndicator: {
    width: 22,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  actionButton: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});