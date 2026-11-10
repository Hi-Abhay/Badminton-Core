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
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';

import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';
import { post_api, get_api, delete_api } from '../../../utils/api';

const Toss = () => {
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? dark : light;
    const navigation = useNavigation();
    const user = useSelector((state) => state.auth);
    const route = useRoute();

    const initialMatch = route?.params?.match || {};
    const [matchData, setMatchData] = useState(initialMatch);
    const [refreshing, setRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

    // Match Date State
    const initialDate = matchData?.date || matchData?.scheduledAt || new Date().toISOString();
    const [matchDate, setMatchDate] = useState(new Date(initialDate));
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
    const [tempDate, setTempDate] = useState(new Date(initialDate));
    const [isSavingDate, setIsSavingDate] = useState(false);

    // Dynamically derive names (Works for Singles and Doubles)
    const player1 = matchData?.sideA?.displayName || 'Player 1';
    const player2 = matchData?.sideB?.displayName || 'Player 2';

    // State
    const [isFlipping, setIsFlipping] = useState(false);
    const [tossResult, setTossResult] = useState(null); // 'HEADS' | 'TAILS'
    const [winSide, setWinSide] = useState('sideA');
    const [election, setElection] = useState('Serve');

    // Dynamic Toast State
    const [toastConfig, setToastConfig] = useState({
        visible: false,
        message: '',
        type: 'info',
    });
    const toastAnim = useRef(new Animated.Value(-120)).current;
    const toastTimeout = useRef(null);

    // Coin Flip Anim values
    const flipAnim = useRef(new Animated.Value(0)).current;

    const showToast = useCallback(
        (message, type = 'info') => {
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
                    setToastConfig((prev) => ({ ...prev, visible: false }));
                });
            }, 3200);
        },
        [toastAnim]
    );

    // Pull-to-refresh
    const onRefresh = useCallback(async () => {
        if (!matchData?._id) return;
        setRefreshing(true);
        try {
            const res = await get_api(`/matches/${matchData._id}`, user?.token);
            if (res?.success && res?.match) {
                setMatchData(res.match);
                if (res.match.date || res.match.scheduledAt) {
                    setMatchDate(new Date(res.match.date || res.match.scheduledAt));
                }
            }
        } catch (error) {
            // console.error('Error refreshing toss match details:', error);
        } finally {
            setRefreshing(false);
        }
    }, [matchData?._id, user?.token]);

    // Open delete confirmation modal
    const handleDismissMatch = () => {
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        if (!isDeleting) {
            setIsDeleteModalVisible(false);
        }
    };

    // Delete match after confirmation
    const handleConfirmDelete = async () => {
        if (!matchData?._id) {
            setIsDeleteModalVisible(false);
            navigation.goBack();
            return;
        }
        try {
            setIsDeleting(true);
            const res = await delete_api(`/matches/${matchData._id}`, user?.token);
            setIsDeleteModalVisible(false);
            if (res?.success) {
                navigation.goBack();
            } else {
                showToast(res?.message || 'Failed to delete match.', 'error');
            }
        } catch (error) {
            setIsDeleteModalVisible(false);
            showToast('Network error while deleting match.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    // Date Formatting Helper
    const formatDateTime = (dateObj) => {
        try {
            const d = new Date(dateObj);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[d.getMonth()];
            const day = String(d.getDate()).padStart(2, '0');
            const year = d.getFullYear();
            let hours = d.getHours();
            const mins = String(d.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${day} ${month} ${year}, ${hours}:${mins} ${ampm}`;
        } catch {
            return 'Date not set';
        }
    };

    // Save / Update Match Date
    const handleSaveMatchDate = async () => {
        try {
            setIsSavingDate(true);
            const isoDate = tempDate.toISOString();
            const res = await post_api(
                `/matches/${matchData?._id}`,
                { date: isoDate, scheduledAt: isoDate },
                user?.token
            );

            if (res?.success) {
                setMatchDate(tempDate);
                setMatchData((prev) => ({ ...prev, date: isoDate, scheduledAt: isoDate }));
                setIsDatePickerVisible(false);
                showToast('Match date updated successfully!', 'success');
            } else {
                // Update locally anyway if server responds with 200 format or fall back
                setMatchDate(tempDate);
                setIsDatePickerVisible(false);
                showToast('Match date saved locally.', 'info');
            }
        } catch (error) {
            setMatchDate(tempDate);
            setIsDatePickerVisible(false);
            showToast('Date updated.', 'info');
        } finally {
            setIsSavingDate(false);
        }
    };

    const handleAdjustDate = (daysToAdd) => {
        const next = new Date(tempDate);
        next.setDate(next.getDate() + daysToAdd);
        setTempDate(next);
    };

    const handleAdjustHours = (hoursToAdd) => {
        const next = new Date(tempDate);
        next.setHours(next.getHours() + hoursToAdd);
        setTempDate(next);
    };

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
            showToast('Opponent must accept challenge before toss. Pull down to refresh.', 'error');
            return;
        }

        const body = {
            winnerSide: winSide,
            choice: election,
            matchDate: matchDate.toISOString(),
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

            {/* Dynamic Animated Toast */}
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

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
                <View style={styles.headerLeftGroup}>
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

                {/* Dismiss Match Button */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={isDeleting}
                    style={[styles.dismissBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                    onPress={handleDismissMatch}
                >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={styles.dismissText}>Dismiss</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={'#FFFFFF'}
                        colors={['#000000']}
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
                                            : {
                                                backgroundColor: colors.bgSurface,
                                                borderColor: colors.borderColor,
                                                borderWidth: 1,
                                            },
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
                                            : {
                                                backgroundColor: colors.bgSurface,
                                                borderColor: colors.borderColor,
                                                borderWidth: 1,
                                            },
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
                                            : {
                                                backgroundColor: colors.bgSurface,
                                                borderColor: colors.borderColor,
                                                borderWidth: 1,
                                            },
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
                                            : {
                                                backgroundColor: colors.bgSurface,
                                                borderColor: colors.borderColor,
                                                borderWidth: 1,
                                            },
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

            {/* Delete Confirmation Modal */}
            <Modal
                visible={isDeleteModalVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={closeDeleteModal}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.modalBackdrop}
                    onPress={closeDeleteModal}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[
                            styles.modalContainer,
                            { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
                        ]}
                    >
                        <View style={styles.deleteIconCircle}>
                            <Ionicons name="trash-outline" size={30} color="#EF4444" />
                        </View>

                        <Text style={[styles.deleteTitle, { color: colors.textPrimary }]}>
                            Delete this match?
                        </Text>

                        <Text style={[styles.deleteMessage, { color: colors.textSecondary }]}>
                            {player1} vs {player2} will be permanently removed. This action cannot be undone.
                        </Text>

                        <View style={styles.deleteBtnRow}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                disabled={isDeleting}
                                style={[styles.cancelBtn, { borderColor: colors.borderColor }]}
                                onPress={closeDeleteModal}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={isDeleting}
                                style={[styles.confirmDeleteBtn, isDeleting && { opacity: 0.7 }]}
                                onPress={handleConfirmDelete}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmDeleteText}>Delete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerLeftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
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
    dismissBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    dismissText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 36,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 12.5,
        fontWeight: '800',
        letterSpacing: 1.1,
        marginBottom: 6,
    },
    matchupTitle: {
        fontSize: 23,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    dateScheduleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    dateLeftWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateLabel: {
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    dateValueText: {
        fontSize: 13.5,
        fontWeight: '700',
        marginTop: 2,
    },
    changeDateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    changeDateChipText: {
        fontSize: 11.5,
        fontWeight: '600',
    },
    coinContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    coin: {
        width: 140,
        height: 140,
        borderRadius: 70,
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
        fontSize: 14.5,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
    },
    decisionCard: {
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        marginTop: 24,
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
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        width: '100%',
        borderRadius: 22,
        borderWidth: 1,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    datePreviewBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    datePreviewText: {
        fontSize: 15,
        fontWeight: '700',
    },
    quickDateRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 18,
    },
    quickDateBtn: {
        flex: 1,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickDateText: {
        fontSize: 12.5,
        fontWeight: '600',
    },
    stepperContainer: {
        gap: 12,
        marginBottom: 20,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepperLabel: {
        fontSize: 13.5,
        fontWeight: '600',
    },
    stepperControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stepperBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValue: {
        fontSize: 13,
        fontWeight: '700',
        minWidth: 50,
        textAlign: 'center',
    },
    saveDateBtn: {
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveDateBtnText: {
        fontSize: 14.5,
        fontWeight: '800',
    },

    // Delete confirmation modal
    deleteIconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 16,
    },
    deleteTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.3,
        textAlign: 'center',
        marginBottom: 8,
    },
    deleteMessage: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 22,
    },
    deleteBtnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 14.5,
        fontWeight: '700',
    },
    confirmDeleteBtn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmDeleteText: {
        color: '#FFFFFF',
        fontSize: 14.5,
        fontWeight: '800',
    },
});