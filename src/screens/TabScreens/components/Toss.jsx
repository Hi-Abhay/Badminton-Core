import React, { useState, useRef, useCallback } from 'react';
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
    Platform,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';

import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';
import { post_api, get_api } from '../../../utils/api';

const Toss = () => {
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? dark : light;
    const navigation = useNavigation();
    const user = useSelector(state => state.auth);
    const route = useRoute();

    const initialMatch = route?.params?.match || {};
    const [matchData, setMatchData] = useState(initialMatch);
    const [refreshing, setRefreshing] = useState(false);

    // Dynamically derive names (Works seamlessly for both Singles and Doubles)
    const player1 = matchData?.sideA?.displayName || 'Player 1';
    const player2 = matchData?.sideB?.displayName || 'Player 2';

    // State
    const [isFlipping, setIsFlipping] = useState(false);
    const [tossResult, setTossResult] = useState(null); // 'HEADS' | 'TAILS'
    const [winSide, setWinSide] = useState('sideA'); // Tracks winner ('sideA' | 'sideB')
    const [election, setElection] = useState('Serve'); // 'Serve' | 'Receive'

    // Dynamic Toast State
    const [toastConfig, setToastConfig] = useState({
        visible: false,
        message: '',
        type: 'info', // 'info' | 'error' | 'success'
    });
    const toastAnim = useRef(new Animated.Value(-120)).current;
    const toastTimeout = useRef(null);

    // Coin Flip Anim values
    const flipAnim = useRef(new Animated.Value(0)).current;

    const showToast = useCallback((message, type = 'info') => {
        setToastConfig({ visible: true, message, type });

        Animated.spring(toastAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
            speed: 14,
        }).start();

        if (toastTimeout.current) {
            clearTimeout(toastTimeout.current);
        }

        toastTimeout.current = setTimeout(() => {
            Animated.timing(toastAnim, {
                toValue: -140,
                duration: 280,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }).start(() => {
                setToastConfig(prev => ({ ...prev, visible: false }));
            });
        }, 3200);
    }, [toastAnim]);

    // Pull-to-refresh to fetch updated match status (e.g., waiting for acceptance)
    const onRefresh = useCallback(async () => {
        if (!matchData?._id) return;
        setRefreshing(true);
        try {
            const res = await get_api(`/matches/${matchData._id}`, user?.token);
            if (res?.success && res?.match) {
                setMatchData(res.match);
            }
        } catch (error) {
            console.error('Error refreshing toss match details:', error);
        } finally {
            setRefreshing(false);
        }
    }, [matchData?._id, user?.token]);

    const handleFlipCoin = () => {
        if (isFlipping) return;

        setIsFlipping(true);
        flipAnim.setValue(0);

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

    const handle_match = async () => {
        if (matchData.status === 'INVITATION_PENDING') {
            showToast('Before toss, opponent must accept the match challenge. Pull down to refresh.', 'error');
            return;
        }

        const body = {
            winnerSide: winSide,
            choice: election,
        };

        try {
            const res = await post_api(`/matches/${matchData?._id}/toss`, body, user?.token);
            if (res?.success) {
                showToast('Toss recorded! Starting match...', 'success');
                setTimeout(() => {
                    navigation.replace('Live', { match: res.match || matchData });
                }, 600);
            } else {
                showToast(res?.message || 'Unable to record toss result.', 'error');
            }
        } catch (error) {
            showToast(error?.message || 'Network connection failed. Please retry.', 'error');
        }
    };

    const getToastStyle = () => {
        switch (toastConfig.type) {
            case 'success':
                return styles.toastSuccess;
            case 'error':
                return styles.toastError;
            case 'info':
            default:
                return styles.toastInfo;
        }
    };

    const getToastIcon = () => {
        switch (toastConfig.type) {
            case 'success':
                return <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />;
            case 'error':
                return <Ionicons name="alert-circle" size={20} color="#FFFFFF" />;
            case 'info':
            default:
                return <Ionicons name="information-circle" size={20} color="#FFFFFF" />;
        }
    };

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
            edges={handleEdges ? handleEdges() : ['top', 'left', 'right', 'bottom']}
        >
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.bgBase}
            />

            {/* Custom Dynamic Animated Toast */}
            {toastConfig.visible && (
                <Animated.View
                    style={[
                        styles.toastContainer,
                        getToastStyle(),
                        { transform: [{ translateY: toastAnim }] },
                    ]}
                >
                    <View style={styles.toastIconWrapper}>{getToastIcon()}</View>
                    <Text numberOfLines={2} style={styles.toastText}>
                        {toastConfig.message}
                    </Text>
                </Animated.View>
            )}

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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.textPrimary}
                        colors={[colors.textPrimary]}
                    />
                }
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
                            <MaterialCommunityIcons name="badminton" color={colors.textPrimary} size={60} />
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
                                        winSide === 'sideA'
                                            ? { backgroundColor: colors.accentBg }
                                            : { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, borderWidth: 1 },
                                    ]}
                                    onPress={() => setWinSide('sideA')}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.toggleButtonText,
                                            { color: winSide === 'sideA' ? colors.accentText : colors.textPrimary },
                                        ]}
                                    >
                                        {player1}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[
                                        styles.toggleButton,
                                        winSide === 'sideB'
                                            ? { backgroundColor: colors.accentBg }
                                            : { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, borderWidth: 1 },
                                    ]}
                                    onPress={() => setWinSide('sideB')}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.toggleButtonText,
                                            { color: winSide === 'sideB' ? colors.accentText : colors.textPrimary },
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
                                        election === 'Serve'
                                            ? { backgroundColor: colors.accentBg }
                                            : { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, borderWidth: 1 },
                                    ]}
                                    onPress={() => setElection('Serve')}
                                >
                                    <Text
                                        style={[
                                            styles.toggleButtonText,
                                            { color: election === 'Serve' ? colors.accentText : colors.textPrimary },
                                        ]}
                                    >
                                        Serve
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
                            onPress={handle_match}
                        >
                            <Text style={[styles.startButtonText, { color: colors.accentText }]}>
                                Start Match
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
    toastContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 44 : 32,
        left: 18,
        right: 18,
        minHeight: 50,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
    },
    toastIconWrapper: {
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toastText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
        letterSpacing: -0.2,
        lineHeight: 18,
    },
    toastSuccess: {
        backgroundColor: '#10B981',
    },
    toastError: {
        backgroundColor: '#EF4444',
    },
    toastInfo: {
        backgroundColor: '#2563EB',
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