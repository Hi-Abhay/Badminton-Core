import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Svg, {
  Path,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from 'react-native-svg';

import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --------------------------------------------------
// COURT BACKGROUND
// --------------------------------------------------

const CourtBackground = ({ strokeColor }) => (
  <Svg
    width={SCREEN_WIDTH}
    height={SCREEN_HEIGHT}
    viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}
    style={StyleSheet.absoluteFill}
    pointerEvents="none"
  >
    <Defs>
      <LinearGradient id="courtFade" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor={strokeColor} stopOpacity="0" />
        <Stop offset="50%" stopColor={strokeColor} stopOpacity="0.10" />
        <Stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
      </LinearGradient>
    </Defs>
    <Line x1="26" y1="0" x2="26" y2={SCREEN_HEIGHT} stroke="url(#courtFade)" strokeWidth="1" />
    <Line x1={SCREEN_WIDTH - 26} y1="0" x2={SCREEN_WIDTH - 26} y2={SCREEN_HEIGHT} stroke="url(#courtFade)" strokeWidth="1" />
    <Line x1="52" y1="0" x2="52" y2={SCREEN_HEIGHT} stroke={strokeColor} strokeOpacity="0.035" strokeDasharray="5 9" />
    <Line x1={SCREEN_WIDTH - 52} y1="0" x2={SCREEN_WIDTH - 52} y2={SCREEN_HEIGHT} stroke={strokeColor} strokeOpacity="0.035" strokeDasharray="5 9" />
    <Line x1="26" y1={SCREEN_HEIGHT * 0.28} x2={SCREEN_WIDTH - 26} y2={SCREEN_HEIGHT * 0.28} stroke={strokeColor} strokeOpacity="0.045" />
    <Line x1="26" y1={SCREEN_HEIGHT * 0.72} x2={SCREEN_WIDTH - 26} y2={SCREEN_HEIGHT * 0.72} stroke={strokeColor} strokeOpacity="0.045" />
    <Circle cx={SCREEN_WIDTH / 2} cy={SCREEN_HEIGHT / 2} r={SCREEN_WIDTH * 0.40} stroke={strokeColor} strokeOpacity="0.025" strokeWidth="1" fill="none" />
  </Svg>
);

// --------------------------------------------------
// PREMIUM SHUTTLECOCK LOGO
// --------------------------------------------------

const ShuttlecockLogo = ({ size = 118, theme }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="featherGradient" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor={theme.textPrimary} />
        <Stop offset="100%" stopColor={theme.textSecondary} />
      </LinearGradient>
      <LinearGradient id="corkGradient" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor={theme.textPrimary} />
        <Stop offset="100%" stopColor={theme.textTertiary} />
      </LinearGradient>
    </Defs>
    <Path d="M25 22 L95 22 L74 79 Q60 86 46 79 Z" fill="url(#featherGradient)" stroke={theme.textPrimary} strokeWidth="1" strokeLinejoin="round" />
    <Line x1="31" y1="24" x2="49" y2="79" stroke={theme.textTertiary} strokeWidth="1.2" />
    <Line x1="44" y1="23" x2="54" y2="82" stroke={theme.textTertiary} strokeWidth="1.2" />
    <Line x1="60" y1="23" x2="60" y2="84" stroke={theme.textSecondary} strokeWidth="1.4" />
    <Line x1="76" y1="23" x2="66" y2="82" stroke={theme.textTertiary} strokeWidth="1.2" />
    <Line x1="89" y1="24" x2="71" y2="79" stroke={theme.textTertiary} strokeWidth="1.2" />
    <Path d="M30 42 Q60 50 90 42" stroke={theme.textTertiary} strokeWidth="1.4" fill="none" />
    <Path d="M38 62 Q60 69 82 62" stroke={theme.textTertiary} strokeWidth="1.4" fill="none" />
    <Path d="M47 79 H73 V86 H47 Z" fill={theme.accentBg} />
    <Path d="M47 86 C47 105 73 105 73 86 Z" fill="url(#corkGradient)" stroke={theme.textPrimary} strokeWidth="0.8" />
  </Svg>
);

// --------------------------------------------------
// SPLASH SCREEN
// --------------------------------------------------

const Splash = () => {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? dark : light;

  const user = useSelector((state) => state.auth);
  const isLogin = user?.isLoggedIn || false;
  const navigation = useNavigation();

  // Screen Shake & Camera
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Shuttlecock Drop & Physics
  const shuttleY = useRef(new Animated.Value(-SCREEN_HEIGHT * 0.6)).current;
  const shuttleScaleY = useRef(new Animated.Value(1.5)).current; // Stretched initially
  const shuttleScaleX = useRef(new Animated.Value(0.7)).current; // Thinner initially
  const shuttleOpacity = useRef(new Animated.Value(0)).current;
  
  // Impact VFX
  const shockwaveScale1 = useRef(new Animated.Value(0)).current;
  const shockwaveOpacity1 = useRef(new Animated.Value(1)).current;
  const shockwaveScale2 = useRef(new Animated.Value(0)).current;
  const shockwaveOpacity2 = useRef(new Animated.Value(1)).current;
  const particlesProgress = useRef(new Animated.Value(0)).current;
  
  // Ambient & Continuous
  const orbitRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Typography
  const brandScale = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const dividerWidth = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // Generate 8 particles flying outward
  const NUM_PARTICLES = 8;
  const particles = Array.from({ length: NUM_PARTICLES }).map((_, i) => {
    const angle = (i * (360 / NUM_PARTICLES)) * (Math.PI / 180);
    const distance = 120;
    return {
      translateX: particlesProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(angle) * distance],
      }),
      translateY: particlesProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(angle) * distance],
      }),
      opacity: particlesProgress.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [1, 1, 0],
      }),
      scale: particlesProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1.5],
      }),
    };
  });

  useEffect(() => {
    let mounted = true;

    // Ambient Continuous Animations
    Animated.loop(
      Animated.timing(orbitRotation, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // 💥 THE SMASH IMPACT SEQUENCE
    const masterSequence = Animated.sequence([
      // 1. The High-Speed Drop
      Animated.parallel([
        Animated.timing(shuttleOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(shuttleY, {
          toValue: 0,
          duration: 350,
          easing: Easing.in(Easing.exp),
          useNativeDriver: true,
        }),
      ]),

      // 2. The Impact (Squash & Stretch, Screen Shake, Shockwaves, Particles)
      Animated.parallel([
        // Squash physics
        Animated.sequence([
          Animated.timing(shuttleScaleY, { toValue: 0.5, duration: 50, useNativeDriver: true }),
          Animated.timing(shuttleScaleX, { toValue: 1.3, duration: 50, useNativeDriver: true }),
          // Bounce back to normal
          Animated.spring(shuttleScaleY, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
          Animated.spring(shuttleScaleX, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
        ]),

        // Violent Screen Shake
        Animated.sequence([
          Animated.timing(shakeX, { toValue: 12, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeY, { toValue: -12, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -8, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeY, { toValue: 8, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeY, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]),

        // Expanding Shockwaves
        Animated.timing(shockwaveScale1, { toValue: 3.5, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(shockwaveOpacity1, { toValue: 0, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        
        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.timing(shockwaveScale2, { toValue: 2.5, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(shockwaveOpacity2, { toValue: 0, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ])
        ]),

        // Exploding Particles
        Animated.timing(particlesProgress, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),

        // 3. Brand Text Slam
        Animated.sequence([
          Animated.delay(150),
          Animated.parallel([
            Animated.timing(brandOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.spring(brandScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
          ])
        ]),
      ]),

      // 4. Reveal Details Smoothly
      Animated.parallel([
        Animated.timing(dividerWidth, { toValue: 60, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.timing(footerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),

      Animated.delay(1200), // Hold for viewing

      // 5. Exit Transition
      Animated.timing(screenOpacity, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]);

    masterSequence.start(({ finished }) => {
      if (!finished || !mounted) return;
      navigation.reset({ index: 0, routes: [{ name: isLogin ? 'DrawerRoot' : 'Onboarding' }] });
    });

    return () => { mounted = false; };
  }, [navigation, isLogin]);

  // Interpolations
  const orbitRotateInterpolate = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  const pulseGlow = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.15],
  });

  return (
    <Animated.View style={[styles.root, { backgroundColor: theme.bgBase, opacity: screenOpacity }]}>
      <CourtBackground strokeColor={theme.textPrimary} />

      {/* Camera Shake Wrapper */}
      <Animated.View style={[styles.safeArea, { transform: [{ translateX: shakeX }, { translateY: shakeY }] }]}>
        <SafeAreaView edges={handleEdges()} style={styles.safeArea}>
          <View style={styles.main}>
            
            <View style={styles.logoStage}>
              
              {/* Particles Explosion */}
              {particles.map((p, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.particle,
                    { backgroundColor: index % 2 === 0 ? theme.accentBg : theme.textSecondary },
                    {
                      opacity: p.opacity,
                      transform: [
                        { translateX: p.translateX },
                        { translateY: p.translateY },
                        { scale: p.scale }
                      ]
                    }
                  ]}
                />
              ))}

              {/* Shockwaves */}
              <Animated.View style={[ styles.shockwave, { borderColor: theme.textSecondary, opacity: shockwaveOpacity2, transform: [{ scale: shockwaveScale2 }] } ]} />
              <Animated.View style={[ styles.shockwave, { borderColor: theme.accentBg, opacity: shockwaveOpacity1, transform: [{ scale: shockwaveScale1 }] } ]} />

              {/* Breathing Glow & Orbit */}
              <Animated.View style={[ styles.glow, { backgroundColor: theme.accentBg, opacity: pulseGlow, transform: [{ scale: pulseScale }] } ]} />

              <Animated.View style={[ styles.orbit, { borderColor: theme.borderColor, transform: [{ rotate: orbitRotateInterpolate }, { scale: pulseScale }] } ]}>
                <View style={[styles.orbitDot, { backgroundColor: theme.accentBg }]} />
                <View style={[styles.orbitDot2, { backgroundColor: theme.textSecondary }]} />
              </Animated.View>

              <View style={[styles.innerOrbit, { borderColor: theme.borderColor }]} />

              {/* Shuttlecock with Squash and Stretch */}
              <Animated.View
                style={[
                  styles.shuttle,
                  {
                    opacity: shuttleOpacity,
                    transform: [
                      { translateY: shuttleY },
                      { scaleX: shuttleScaleX },
                      { scaleY: shuttleScaleY }
                    ],
                  },
                ]}
              >
                <ShuttlecockLogo size={118} theme={theme} />
              </Animated.View>
            </View>

            {/* Brand Identity */}
            <View style={{ alignItems: 'center', height: 120 }}>
              <Animated.View
                style={{
                  opacity: brandOpacity,
                  transform: [{ scale: brandScale }],
                }}
              >
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.brand, { color: theme.textPrimary }]}>
                  BADMINTON<Text style={{ color: theme.textSecondary }}>CORE</Text>
                </Text>
              </Animated.View>

              <Animated.View style={[styles.divider, { backgroundColor: theme.accentBg, width: dividerWidth }]} />

              <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }] }}>
                <Text style={[styles.tagline, { color: theme.textSecondary }]}>
                  EVERY RALLY. EVERY POINT.
                </Text>
              </Animated.View>
            </View>
          </View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
            <View style={[styles.footerLine, { backgroundColor: theme.borderColor }]} />
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>BUILT FOR THE GAME</Text>
            <Text style={[styles.version, { color: theme.textTertiary }]}>BADMINTONCORE</Text>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </Animated.View>
  );
};

export default Splash;

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  safeArea: { flex: 1 },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  logoStage: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  glow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  shockwave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  orbit: {
    position: 'absolute',
    width: 186,
    height: 186,
    borderRadius: 93,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  orbitDot: {
    position: 'absolute',
    top: 18,
    right: 24,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orbitDot2: {
    position: 'absolute',
    bottom: 18,
    left: 24,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  innerOrbit: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
  },
  shuttle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  divider: {
    height: 2,
    borderRadius: 2,
    marginTop: 20,
    marginBottom: 17,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.8,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  footerLine: {
    width: 30,
    height: 1,
    marginBottom: 14,
  },
  footerText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.4,
  },
  version: {
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 2,
    marginTop: 9,
  },
});