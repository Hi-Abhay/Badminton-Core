import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { light, dark } from '../../../theme/Color';
import { useSelector } from 'react-redux';

const TeamProfile = ({ route, navigation }) => {
    const userTheme = useColorScheme();
    const isDark = userTheme === 'dark';
    const user = useSelector((state) => state.auth)
    const my_id = user?.id
    const colors = isDark ? dark : light;
    const data = route?.params?.item || {}
    console.log(data);

    // Assuming team data is passed via navigation parameters. 
    // Fallback mock data provided for previewing.
    const team = {
        teamName: data?.teamName,
        teamCode: data?.teamCode,
        teamType: data?.teamType === 'double' ? 'Double' : 'Single',
        totalMatch: 12,
        winMatch: 8,
        player1: { fullName: data?.player1?.fullName, role: 'Captain', cate: data?.player1?.role, image: data?.player1?.profile_image },
        player2: { fullName: data?.player2?.fullName, role: 'Player', cate: data?.player1?.role, image: data?.player1?.profile_image },
    };

    const matches = team.totalMatch || 0;
    const wins = team.winMatch || 0;
    const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

    const handleLeaveTeam = () => {
        Alert.alert(
            'Leave Team',
            'Are you sure you want to leave this team?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: () => console.log('Leave Triggered') },
            ]
        );
    };

    const renderPlayerRow = (player, isCaptain) => {
        if (!player) return null;

        return (
            <View style={[styles.playerRow, { borderBottomColor: colors.borderColor }]}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.bgBase }]}>
                    <Image source={{ uri: player?.image }} style={{ width: 50, height: 50 }} />
                </View>
                <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { color: colors.textPrimary }]}>
                        {player.fullName}
                    </Text>
                    <Text style={[styles.playerEmail, { color: colors.textTertiary }]}>
                        Category - {player.cate || 'No mention provided'}s
                    </Text>
                </View>
                {isCaptain && (
                    <View style={[styles.captainBadge, { backgroundColor: colors.accentBg }]}>
                        <Text style={[styles.captainText, { color: colors.accentText }]}>Captain</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgBase }]}>
            {/* HEADER */}
            <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                    Team Profile
                </Text>
                {/* Empty view for flex balancing */}
                <View style={{ width: 24 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* TOP HERO SECTION */}
                <View style={styles.heroSection}>
                    <View style={[styles.teamIconWrapper, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
                        <Ionicons name="shield-half-outline" size={48} color={colors.textPrimary} />
                    </View>
                    <Text style={[styles.teamName, { color: colors.textPrimary }]}>{team.teamName}</Text>

                    <View style={styles.badgesRow}>
                        <View style={[styles.badge, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
                            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                                Code: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{team.teamCode}</Text>
                            </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
                            <Text style={[styles.badgeText, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
                                {team.teamType}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* STATS OVERVIEW */}
                <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Performance</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{matches}</Text>
                            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Matches</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.borderColor }]} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: colors.success }]}>{wins}</Text>
                            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Won</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.borderColor }]} />
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{winRate}%</Text>
                            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Win Rate</Text>
                        </View>
                    </View>
                </View>

                {/* TEAM MEMBERS */}
                <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, paddingBottom: 4 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Team Members</Text>
                    {renderPlayerRow(team.player1, true)}
                    {team.player2 ? (
                        renderPlayerRow(team.player2, false)
                    ) : (
                        <View style={[styles.emptyPlayer, { borderBottomColor: 'transparent' }]}>
                            <Ionicons name="person-add-outline" size={20} color={colors.textTertiary} style={{ marginRight: 12 }} />
                            <Text style={[styles.emptyPlayerText, { color: colors.textTertiary }]}>
                                Waiting for Player 2
                            </Text>
                        </View>
                    )}
                </View>

                {/* ACTIONS SECTION */}
                <View style={styles.actionSection}>
                    {data?.player1?._id === my_id ? (<TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleLeaveTeam}
                        style={[styles.destructiveButton, { borderColor: colors.danger }]}
                    >
                        <Ionicons name="exit-outline" size={20} color={colors.danger} style={{ marginRight: 8 }} />
                        <Text style={[styles.destructiveText, { color: colors.danger }]}>Remove Team</Text>
                    </TouchableOpacity>)
                        :
                        (<TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleLeaveTeam}
                            style={[styles.destructiveButton, { borderColor: colors.danger }]}
                        >
                            <Ionicons name="exit-outline" size={20} color={colors.danger} style={{ marginRight: 8 }} />
                            <Text style={[styles.destructiveText, { color: colors.danger }]}>Leave Team</Text>
                        </TouchableOpacity>)}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default TeamProfile;

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: { padding: 4, marginLeft: -4 },
    headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 60 },

    heroSection: { alignItems: 'center', marginBottom: 28 },
    teamIconWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    teamName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 12 },
    badgesRow: { flexDirection: 'row', gap: 10 },
    badge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeText: { fontSize: 13, fontWeight: '500' },

    card: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, marginBottom: 16 },

    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statBox: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    statLabel: { fontSize: 13, fontWeight: '500' },
    statDivider: { width: 1, height: 40 },

    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 82,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        overflow: 'hidden'
    },
    avatarInitial: { fontSize: 16, fontWeight: '700' },
    playerInfo: { flex: 1 },
    playerName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    playerEmail: { fontSize: 13 },
    captainBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    captainText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    emptyPlayer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    emptyPlayerText: { fontSize: 14, fontWeight: '500', fontStyle: 'italic' },

    actionSection: { marginTop: 10 },
    destructiveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 12,
        height: 52,
        backgroundColor: 'transparent',
    },
    destructiveText: { fontSize: 15, fontWeight: '700' },
});