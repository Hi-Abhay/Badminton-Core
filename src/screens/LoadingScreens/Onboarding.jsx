import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';

// Video Import
import SplashVideo from '../../assets/video/Splash.mp4';
import { light, dark } from '../../theme/Color';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Connect &\nTrack Scores',
    description:
      'Play with friends and manage your match scores in real-time. Your entire match history and stats are permanently saved.',
  },
  {
    id: '2',
    title: 'Chat & Watch\nLive Matches',
    description:
      "Stay connected with built-in chat. Spectate your mutual friends' matches live as the action happens on the court.",
  },
  {
    id: '3',
    title: 'Form Teams &\nCompete',
    description:
      'Create your own doubles team, invite a partner, and challenge other teams to rise to the top.',
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

  const gradientColors = isDark
    ? ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.9)', theme.bgBase]
    : ['rgba(244, 244, 245, 0)', 'rgba(244, 244, 245, 0.45)', 'rgba(244, 244, 245, 0.9)', theme.bgBase];

  const renderSlide = ({ item }) => {
    return (
      <View style={styles.slideContainer}>
        <View style={styles.imageWrapper}>
          <LinearGradient
            colors={gradientColors}
            locations={[0, 0.45, 0.8, 1]}
            style={styles.gradientOverlay}
          />
        </View>

        <View style={[styles.textContainer, { backgroundColor: theme.bgBase }]}>
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
        barStyle={'light-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* INSTANT PLAYBACK VIDEO CONFIGURATION */}
      <Video
        source={SplashVideo}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat={true}
        muted={true}
        paused={false}           // Explicitly force play immediately
        rate={1.0}               // Explicitly set speed
        hideShutterView={true}   // Hides black screen before first frame
        playInBackground={false}
        playWhenInactive={false}
      />

      {/* PERFORMANCE BOOSTED FLATLIST */}
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
        style={styles.flatList}
        // These 3 lines stop the FlatList from rendering off-screen slides initially, 
        // freeing up the CPU so the video can start instantly.
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={2}
      />

      <View
        style={[
          styles.footerWrapper,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 28,
            backgroundColor: theme.bgBase,
          },
        ]}
      >
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

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={[styles.actionButton, { backgroundColor: theme.accentBg }]}
        >
          <View style={[styles.buttonBadge, { backgroundColor: theme.accentText }]}>
            <Ionicons name="sparkles" size={17} color={theme.accentBg} />
          </View>
          <Text style={[styles.actionButtonText, { color: theme.accentText }]}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
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
  flatList: {
    flex: 1,
    zIndex: 2,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: 'transparent',
  },
  imageWrapper: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.60,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  textContainer: {
    paddingHorizontal: 28,
    flex: 1,
    justifyContent: 'center',
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
    zIndex: 3,
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