import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    StatusBar,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';

const Toss = () => {
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? dark : light;
    const navigation = useNavigation();
    const route = useRoute();

    // Players from route params or defaults
    const player1 = route.params?.player1 || 'Viktor Axelsen';
    const player2 = route.params?.player2 || 'Lakshya Sen';

    // State
    const [isFlipping, setIsFlipping] = useState(false);
    const [tossResult, setTossResult] = useState(null); // 'HEADS' | 'TAILS'
    const [winner, setWinner] = useState(player1);
    const [election, setElection] = useState('Serve First'); // 'Serve First' | 'Receive'

    // Coin Flip Animation values
    const flipAnim = useRef(new Animated.Value(0)).current;

    const handleFlipCoin = () => {
        if (isFlipping) return;

        setIsFlipping(true);
        flipAnim.setValue(0);

        // Randomize Heads or Tails
        const outcome = Math.random() < 0.5 ? 'HEADS' : 'TAILS';

        Animated.timing(flipAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            setTossResult(outcome);
            setIsFlipping(false);
        });
    };

    // 3D rotation & scale interpolation for a tactile coin flip
    const rotateY = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '1440deg'],
    });

    const scale = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.25, 1],
    });

    const hasFlipped = tossResult !== null && !isFlipping;

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
            edges={handleEdges ? handleEdges() : ['top', 'left', 'right', 'bottom']}
        >
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.bgBase}
            />

            {/* Screen Header */}
            <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                    Match Toss
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Subtitle & Matchup Title */}
                <View style={styles.titleSection}>
                    <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
                        VIRTUAL COIN TOSS
                    </Text>
                    <Text style={[styles.matchupTitle, { color: colors.textPrimary }]}>
                        {player1} vs {player2}
                    </Text>
                </View>

                {/* Coin Area */}
                <View style={styles.coinContainer}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        disabled={isFlipping}
                        onPress={handleFlipCoin}
                    >
                        <Animated.View
                            style={[
                                styles.coin,
                                {
                                    backgroundColor: colors.bgSurface,
                                    borderColor: colors.borderColor,
                                    transform: [{ rotateY }, { scale }],
                                },
                            ]}
                        >
                            <Text style={styles.coinEmoji}>🏸</Text>
                            <Text style={[styles.coinText, { color: colors.textPrimary }]}>
                                {tossResult || 'HEADS'}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Prompt / Result Indicator */}
                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                        {hasFlipped
                            ? `Result: ${tossResult}! Select winner's decision below.`
                            : 'Tap the coin to flip!'}
                    </Text>
                </View>

                {/* Toss Decision Card */}
                {hasFlipped && (
                    <View
                        style={[
                            styles.decisionCard,
                            { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
                        ]}
                    >
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                            Toss Decision
                        </Text>

                        {/* Winner Selection */}
                        <View style={styles.sectionBlock}>
                            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                                TOSS WINNER
                            </Text>
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[
                                        styles.toggleButton,
                                        winner === player1
                                            ? { backgroundColor: colors.accentBg }
                                            : { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, borderWidth: 1 },
                                    ]}
                                    onPress={() => setWinner(player1)}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.toggleButtonText,
                                            { color: winner === player1 ? colors.accentText : colors.textPrimary },
                                        ]}
                                    >
                                        {player1}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[
                                        styles.toggleButton,
                                        winner === player2
                                            ? { backgroundColor: colors.accentBg }
                                            : { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, borderWidth: 1 },
                                    ]}
                                    onPress={() => setWinner(player2)}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.toggleButtonText,
                                            { color: winner === player2 ? colors.accentText : colors.textPrimary },
                                        ]}
                                    >
                                        {player2}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Election Selection */}
                        <View style={styles.sectionBlock}>
                            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                                WINNER ELECTED TO
                            </Text>
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[
                                        styles.toggleButton,
                                        election === 'Serve First'
                                            ? { backgroundColor: colors.accentBg }
                                            : { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, borderWidth: 1 },
                                    ]}
                                    onPress={() => setElection('Serve First')}
                                >
                                    <Text
                                        style={[
                                            styles.toggleButtonText,
                                            { color: election === 'Serve First' ? colors.accentText : colors.textPrimary },
                                        ]}
                                    >
                                        Serve First
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[
                                        styles.toggleButton,
                                        election === 'Receive'
                                            ? { backgroundColor: colors.accentBg }
                                            : { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, borderWidth: 1 },
                                    ]}
                                    onPress={() => setElection('Receive')}
                                >
                                    <Text
                                        style={[
                                            styles.toggleButtonText,
                                            { color: election === 'Receive' ? colors.accentText : colors.textPrimary },
                                        ]}
                                    >
                                        Receive
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Start Match CTA */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={[styles.startButton, { backgroundColor: colors.accentBg }]}
                            onPress={() => {
                                navigation.navigate('Live');
                            }}
                        >
                            <Text style={[styles.startButtonText, { color: colors.accentText }]}>
                                Start Match 🚀
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Toss;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        paddingVertical: 4,
        paddingRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 21,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 24,
        paddingBottom: 36,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    subtitle: {
        fontSize: 12.5,
        fontWeight: '800',
        letterSpacing: 1.1,
        marginBottom: 8,
    },
    matchupTitle: {
        fontSize: 23,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    coinContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 12,
    },
    coin: {
        width: 146,
        height: 146,
        borderRadius: 73,
        borderWidth: 6,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    coinEmoji: {
        fontSize: 34,
        marginBottom: 6,
    },
    coinText: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1,
    },
    statusText: {
        fontSize: 15,
        fontWeight: '600',
        marginTop: 26,
        textAlign: 'center',
    },
    decisionCard: {
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        marginTop: 28,
    },
    cardTitle: {
        fontSize: 19,
        fontWeight: '800',
        letterSpacing: -0.3,
        marginBottom: 16,
    },
    sectionBlock: {
        marginBottom: 18,
    },
    sectionLabel: {
        fontSize: 11.5,
        fontWeight: '800',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    toggleButton: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    toggleButtonText: {
        fontSize: 14.5,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    startButton: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    startButtonText: {
        fontSize: 15.5,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
});