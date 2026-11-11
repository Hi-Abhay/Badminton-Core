import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { get_api, post_api, URL } from '../../../utils/api';

export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '';

  const [username, domain] = email.split('@');
  const visible = username.slice(0, 2);
  const masked = '*'.repeat(Math.max(username.length - 2, 3));

  return `${visible}${masked}@${domain}`;
};

const CreateMatch = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const navigation = useNavigation();
  const user = useSelector((state) => state?.auth);

  // Step State (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- SINGLES STATES ---
  const [friends, setFriends] = useState([]);
  const [selectedSideB, setSelectedSideB] = useState(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  // --- DOUBLES STATES ---
  const [myTeams, setMyTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [selectedTeamA, setSelectedTeamA] = useState(null); // Host Team
  const [selectedTeamB, setSelectedTeamB] = useState(null); // Challenge Team
  const [teamPickerMode, setTeamPickerMode] = useState(null); // 'A' | 'B' | null
  const [teamSearch, setTeamSearch] = useState('');

  // Step 1: Match Format ('SINGLES' | 'DOUBLES')
  const [matchFormat, setMatchFormat] = useState('SINGLES');

  // Step 3: Scoring Rules
  const [matchTitle, setMatchTitle] = useState('');
  const [bestOf, setBestOf] = useState(3); // 1 | 3 | 5
  const [pointsPerGame, setPointsPerGame] = useState(21); // 11 | 15 | 21

  // FETCH DATA
  const fetch_initial_data = async () => {
    try {
      // 1. Fetch Connections
      const resConnections = await get_api('/connections', user?.token);
      if (resConnections?.success) {
        setFriends(resConnections?.friends || []);
      }

      // 2. Fetch My Teams (For Host Team Selection)
      const resMyTeams = await get_api('/teams/my-teams', user?.token);
      if (resMyTeams?.success) {
        setMyTeams(resMyTeams?.teams || []);
      }

      // 3. Fetch All Teams (For Challenge Team Selection)
      const resAllTeams = await get_api('/teams', user?.token);
      if (resAllTeams?.success) {
        setAllTeams(resAllTeams?.teams || []);
      }
    } catch (error) {
      console.log('Error fetching initial match data:', error);
    }
  };

  useEffect(() => {
    fetch_initial_data();
  }, []);

  const handleSelectFormat = (format) => {
    if (format !== matchFormat) {
      setMatchFormat(format);
      // Reset selections when switching modes to avoid invalid state
      setSelectedSideB(null);
      setSelectedTeamA(null);
      setSelectedTeamB(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  const isStep2Valid = useMemo(() => {
    if (matchFormat === 'SINGLES') {
      return !!selectedSideB;
    }
    return !!selectedTeamA && !!selectedTeamB;
  }, [matchFormat, selectedSideB, selectedTeamA, selectedTeamB]);

  const handleNext = () => {
    if (currentStep === 2 && !isStep2Valid) return;
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  // --- FILTER MEMOS ---
  const filteredFriends = useMemo(() => {
    const query = friendSearch.trim().toLowerCase();
    return friends.filter((item) => {
      const player = item?.player;
      if (!player) return false;

      // Exclude logged in user
      const loggedUserId = user?._id || user?.id;
      if (loggedUserId && player?._id === loggedUserId) return false;

      const name = (player?.fullName || '').toLowerCase();
      const email = (player?.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [friends, friendSearch, user]);

  const filteredTeams = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    const sourceList = teamPickerMode === 'A' ? myTeams : allTeams;

    return sourceList.filter((team) => {
      // Exclude Team A from Team B's list so they don't play themselves
      if (teamPickerMode === 'B' && selectedTeamA && team._id === selectedTeamA._id) {
        return false;
      }
      const nameMatch = (team?.teamName || '').toLowerCase().includes(query);
      const codeMatch = (team?.teamCode || '').toLowerCase().includes(query);
      return nameMatch || codeMatch;
    });
  }, [myTeams, allTeams, teamPickerMode, teamSearch, selectedTeamA]);

  // --- SUBMIT ---
  const handleProceedToToss = async () => {
    if (isSubmitting || !isStep2Valid) return;

    let sideAPayload, sideBPayload, defaultTitle;

    if (matchFormat === 'SINGLES') {
      sideAPayload = {
        primaryUser: user?._id || user?.id,
        partnerUser: null,
        displayName: user?.fullName || 'Player 1',
      };
      sideBPayload = {
        primaryUser: selectedSideB?._id,
        partnerUser: null,
        displayName: selectedSideB?.fullName,
      };
      defaultTitle = `${user?.fullName || 'Player 1'} vs ${selectedSideB?.fullName}`;
    } else {
      // DOUBLES Payload
      sideAPayload = {
        primaryUser: selectedTeamA?.player1?._id || selectedTeamA?.player1,
        partnerUser: selectedTeamA?.player2?._id || selectedTeamA?.player2,
        displayName: selectedTeamA?.teamName,
      };
      sideBPayload = {
        primaryUser: selectedTeamB?.player1?._id || selectedTeamB?.player1,
        partnerUser: selectedTeamB?.player2?._id || selectedTeamB?.player2,
        displayName: selectedTeamB?.teamName,
      };
      defaultTitle = `${selectedTeamA?.teamName} vs ${selectedTeamB?.teamName}`;
    }

    const payload = {
      title: matchTitle.trim() || defaultTitle,
      format: matchFormat,
      sideA: sideAPayload,
      sideB: sideBPayload,
      bestOf,
      pointsPerGame,
    };

    try {
      setIsSubmitting(true);
      const res = await post_api('/matches', payload, user?.token);
      setIsSubmitting(false);

      if (res?.success) {
        navigation.replace('Toss', {
          match: res?.match || res?.data || payload,
        });
      } else {
        navigation.replace('Toss', { match: payload });
      }
    } catch (error) {
      setIsSubmitting(false);
      console.log('Error creating match:', error);
    }
  };

  // --- Step 1: Match Format ---
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
        Step 1: Match Format
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Choose between individual singles or doubles partnership.
      </Text>

      {/* Singles Card */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleSelectFormat('SINGLES')}
        style={[
          styles.formatCard,
          {
            backgroundColor: colors.bgSurface,
            borderColor: matchFormat === 'SINGLES' ? colors.textPrimary : colors.borderColor,
            borderWidth: matchFormat === 'SINGLES' ? 2 : 1,
          },
        ]}
      >
        <View style={[styles.badgeCircle, { backgroundColor: matchFormat === 'SINGLES' ? colors.accentBg : colors.bgBase }]}>
          <Text style={[styles.badgeText, { color: matchFormat === 'SINGLES' ? colors.accentText : colors.textPrimary }]}>
            1v1
          </Text>
        </View>
        <View style={styles.formatInfo}>
          <Text style={[styles.formatTitle, { color: colors.textPrimary }]}>Singles Match</Text>
          <Text style={[styles.formatDescription, { color: colors.textTertiary }]}>Individual match between two single players</Text>
        </View>
      </TouchableOpacity>

      {/* Doubles Card */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleSelectFormat('DOUBLES')}
        style={[
          styles.formatCard,
          {
            backgroundColor: colors.bgSurface,
            borderColor: matchFormat === 'DOUBLES' ? colors.textPrimary : colors.borderColor,
            borderWidth: matchFormat === 'DOUBLES' ? 2 : 1,
          },
        ]}
      >
        <View style={[styles.badgeCircle, { backgroundColor: matchFormat === 'DOUBLES' ? colors.accentBg : colors.bgBase }]}>
          <Text style={[styles.badgeText, { color: matchFormat === 'DOUBLES' ? colors.accentText : colors.textPrimary }]}>
            2v2
          </Text>
        </View>
        <View style={styles.formatInfo}>
          <Text style={[styles.formatTitle, { color: colors.textPrimary }]}>Doubles Match</Text>
          <Text style={[styles.formatDescription, { color: colors.textTertiary }]}>Partnership match between two doubles teams</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // --- Step 2: Select Competitors ---
  const renderStep2 = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
          Step 2: Select Competitors
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          {matchFormat === 'SINGLES'
            ? 'Pick your opponent from your connections for this singles match.'
            : 'Select your team and choose an opposing team to challenge.'}
        </Text>

        {matchFormat === 'SINGLES' ? (
          <>
            {/* Singles: Side A (Host - Locked) */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>SIDE A (HOST PLAYER) *</Text>
              <View style={[styles.dropdownSelector, { backgroundColor: colors.bgBase, borderColor: colors.borderColor }]}>
                <Text style={[styles.dropdownSelectedText, { color: colors.textPrimary }]}>
                  {user?.fullName || 'Myself'}
                </Text>
                <Ionicons name="lock-closed" size={17} color={colors.textTertiary} />
              </View>
            </View>

            {/* Singles: Side B (Opponent Picker) */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>SIDE B (CHALLENGE OPPONENT) *</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsPickerVisible(true)}
                style={[styles.dropdownSelector, { backgroundColor: colors.bgSurface, borderColor: selectedSideB ? colors.textPrimary : colors.borderColor }]}
              >
                <Text style={[styles.dropdownSelectedText, { color: selectedSideB ? colors.textPrimary : colors.textTertiary }]}>
                  {selectedSideB?.fullName || 'Select Opponent from Friends'}
                </Text>
                <Ionicons name="search" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Doubles: Side A (Host Team Picker) */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>SIDE A (YOUR HOST TEAM) *</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTeamPickerMode('A')}
                style={[styles.dropdownSelector, { backgroundColor: colors.bgSurface, borderColor: selectedTeamA ? colors.textPrimary : colors.borderColor }]}
              >
                <Text style={[styles.dropdownSelectedText, { color: selectedTeamA ? colors.textPrimary : colors.textTertiary }]}>
                  {selectedTeamA?.teamName || 'Select from My Teams'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Doubles: Side B (Challenge Team Picker) */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>SIDE B (CHALLENGE TEAM) *</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTeamPickerMode('B')}
                style={[styles.dropdownSelector, { backgroundColor: colors.bgSurface, borderColor: selectedTeamB ? colors.textPrimary : colors.borderColor }]}
              >
                <Text style={[styles.dropdownSelectedText, { color: selectedTeamB ? colors.textPrimary : colors.textTertiary }]}>
                  {selectedTeamB?.teamName || 'Select from All Teams'}
                </Text>
                <Ionicons name="search" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  // --- Step 3: Scoring Rules ---
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Step 3: Scoring Rules</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Set points per game and match length.</Text>

      <View style={styles.formGroup}>
        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>MATCH TITLE (OPTIONAL)</Text>
        <TextInput
          value={matchTitle}
          onChangeText={setMatchTitle}
          placeholder="e.g. Club Championship Final"
          placeholderTextColor={colors.textTertiary}
          style={[styles.textInput, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, color: colors.textPrimary }]}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>BEST OF (GAMES)</Text>
        <View style={styles.optionRow}>
          {[1, 3, 5].map((val) => {
            const isSelected = bestOf === val;
            return (
              <TouchableOpacity
                key={val}
                activeOpacity={0.8}
                onPress={() => setBestOf(val)}
                style={[styles.toggleButton, { backgroundColor: isSelected ? colors.accentBg : colors.bgSurface, borderColor: isSelected ? colors.accentBg : colors.borderColor }]}
              >
                <Text style={[styles.toggleButtonText, { color: isSelected ? colors.accentText : colors.textPrimary }]}>Best of {val}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>POINTS PER GAME</Text>
        <View style={styles.optionRow}>
          {[11, 15, 21].map((pts) => {
            const isSelected = pointsPerGame === pts;
            return (
              <TouchableOpacity
                key={pts}
                activeOpacity={0.8}
                onPress={() => setPointsPerGame(pts)}
                style={[styles.toggleButton, { backgroundColor: isSelected ? colors.accentBg : colors.bgSurface, borderColor: isSelected ? colors.accentBg : colors.borderColor }]}
              >
                <Text style={[styles.toggleButtonText, { color: isSelected ? colors.accentText : colors.textPrimary }]}>{pts} pts</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  // --- Step 4: Review Setup ---
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Step 4: Review Setup</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Confirm your setup before dispatching match invite & proceeding to toss.</Text>

      <View style={[styles.reviewCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
        {matchTitle.trim() ? (
          <View style={styles.reviewSection}>
            <Text style={[styles.reviewLabel, { color: colors.textTertiary }]}>MATCH TITLE</Text>
            <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>{matchTitle.trim()}</Text>
          </View>
        ) : null}

        <View style={styles.reviewSection}>
          <Text style={[styles.reviewLabel, { color: colors.textTertiary }]}>FORMAT</Text>
          <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>{matchFormat}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={[styles.reviewLabel, { color: colors.textTertiary }]}>COMPETITORS</Text>
          <Text style={styles.reviewCompetitorsRow}>
            <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>
              {matchFormat === 'SINGLES' ? (user?.fullName || 'Host Player') : (selectedTeamA?.teamName || 'Host Team')}{' '}
            </Text>
            <Text style={[styles.reviewVsText, { color: colors.textTertiary }]}>vs </Text>
            <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>
              {matchFormat === 'SINGLES' ? (selectedSideB?.fullName || 'Competitor B') : (selectedTeamB?.teamName || 'Challenge Team')}
            </Text>
          </Text>
        </View>

        <View style={styles.reviewSectionNoBorder}>
          <Text style={[styles.reviewLabel, { color: colors.textTertiary }]}>SCORING STANDARD</Text>
          <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>Best of {bestOf} games • {pointsPerGame} points per game (capped at 30)</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgBase }]} edges={handleEdges()}>
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleBack} style={styles.headerBackButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Match</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((step) => {
              const isActive = currentStep >= step;
              return <View key={step} style={[styles.progressBarSegment, { backgroundColor: isActive ? colors.accentBg : colors.borderColor }]} />;
            })}
          </View>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        <View style={styles.bottomBar}>
          {currentStep === 1 ? (
            <TouchableOpacity activeOpacity={0.85} onPress={handleNext} style={[styles.primaryButton, styles.fullWidthButton, { backgroundColor: colors.accentBg }]}>
              <Text style={[styles.primaryButtonText, { color: colors.accentText }]}>Next: Select Competitors</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={handleBack} disabled={isSubmitting} style={[styles.backButton, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
                <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={currentStep === 4 ? handleProceedToToss : handleNext}
                disabled={!isStep2Valid || isSubmitting}
                style={[styles.primaryButton, styles.flexButton, { backgroundColor: colors.accentBg, opacity: !isStep2Valid || isSubmitting ? 0.5 : 1 }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.accentText} size="small" />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: colors.accentText }]}>
                    {currentStep === 2 && 'Next: Rules Setup'}
                    {currentStep === 3 && 'Next: Review'}
                    {currentStep === 4 && 'Proceed to Toss'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* --- FRIEND PICKER MODAL (SINGLES) --- */}
      <Modal visible={isPickerVisible} transparent animationType="fade" onRequestClose={() => setIsPickerVisible(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setIsPickerVisible(false)} style={[styles.pickerOverlay, { backgroundColor: colors.overlayBg }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.pickerContainer, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerHeaderTitle, { color: colors.textPrimary }]}>Select Opponent</Text>
                <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
                  <Ionicons name="close" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.pickerSearchBar, { backgroundColor: colors.bgBase, borderColor: colors.borderColor }]}>
                <Ionicons name="search" size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  value={friendSearch}
                  onChangeText={setFriendSearch}
                  placeholder="Search by name or email..."
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.pickerSearchInput, { color: colors.textPrimary }]}
                />
              </View>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {filteredFriends.length === 0 ? (
                  <View style={styles.emptyConnections}>
                    <Text style={[styles.emptyConnectionsText, { color: colors.textTertiary }]}>No connections found</Text>
                  </View>
                ) : (
                  filteredFriends.map((item, idx) => {
                    const player = item?.player;
                    const isSelected = selectedSideB?._id === player?._id;

                    return (
                      <TouchableOpacity
                        key={player?._id || idx.toString()}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedSideB(player);
                          setIsPickerVisible(false);
                          setFriendSearch('');
                        }}
                        style={[styles.friendOptionRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderColor }]}
                      >
                        <View style={styles.friendInfoLeft}>
                          {player?.profile_image ? (
                            <Image source={{ uri: player.profile_image }} style={styles.avatarImg} />
                          ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.bgBase }]}>
                              <Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>{(player?.fullName || '?')[0].toUpperCase()}</Text>
                            </View>
                          )}
                          <View style={styles.friendTextCol}>
                            <Text style={[styles.friendNameText, { color: colors.textPrimary }, isSelected && { fontWeight: '700' }]}>{player?.fullName}</Text>
                            <Text style={[styles.friendEmailText, { color: colors.textTertiary }]}>{maskEmail(player?.email)}</Text>
                          </View>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.accentText || colors.textPrimary} />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* --- TEAM PICKER MODAL (DOUBLES) --- */}
      <Modal visible={!!teamPickerMode} transparent animationType="fade" onRequestClose={() => setTeamPickerMode(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setTeamPickerMode(null)} style={[styles.pickerOverlay, { backgroundColor: colors.overlayBg }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.pickerContainer, { backgroundColor: colors.bgSurface, borderColor: colors.borderColor }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerHeaderTitle, { color: colors.textPrimary }]}>
                  Select {teamPickerMode === 'A' ? 'Your Team' : 'Challenge Team'}
                </Text>
                <TouchableOpacity onPress={() => setTeamPickerMode(null)}>
                  <Ionicons name="close" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.pickerSearchBar, { backgroundColor: colors.bgBase, borderColor: colors.borderColor }]}>
                <Ionicons name="search" size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  value={teamSearch}
                  onChangeText={setTeamSearch}
                  placeholder="Search team name or code..."
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.pickerSearchInput, { color: colors.textPrimary }]}
                />
              </View>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {filteredTeams.length === 0 ? (
                  <View style={styles.emptyConnections}>
                    <Text style={[styles.emptyConnectionsText, { color: colors.textTertiary }]}>No teams found</Text>
                  </View>
                ) : (
                  filteredTeams.map((team, idx) => {
                    const isSelected = teamPickerMode === 'A'
                      ? selectedTeamA?._id === team?._id
                      : selectedTeamB?._id === team?._id;

                    return (
                      <TouchableOpacity
                        key={team?._id || idx.toString()}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (teamPickerMode === 'A') setSelectedTeamA(team);
                          else setSelectedTeamB(team);
                          setTeamPickerMode(null);
                          setTeamSearch('');
                        }}
                        style={[styles.friendOptionRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderColor }]}
                      >
                        <View style={styles.friendInfoLeft}>
                          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.bgBase, borderRadius: 8 }]}>
                            <Ionicons name="shield-half-outline" size={18} color={colors.textPrimary} />
                          </View>
                          <View style={styles.friendTextCol}>
                            <Text style={[styles.friendNameText, { color: colors.textPrimary }, isSelected && { fontWeight: '700' }]}>{team?.teamName}</Text>
                            <Text style={[styles.friendEmailText, { color: colors.textTertiary }]}>
                              {team?.player1?.fullName || 'Player 1'} & {team?.player2?.fullName || 'Player 2'}
                            </Text>
                          </View>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.accentText || colors.textPrimary} />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

export default CreateMatch;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBackButton: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  headerSpacer: { width: 36 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  progressContainer: { flexDirection: 'row', gap: 8, marginBottom: 26 },
  progressBarSegment: { flex: 1, height: 3.5, borderRadius: 2 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 },
  stepSubtitle: { fontSize: 14.5, lineHeight: 20, marginBottom: 24 },
  formatCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 18, marginBottom: 14 },
  badgeCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  badgeText: { fontSize: 15, fontWeight: '800' },
  formatInfo: { flex: 1 },
  formatTitle: { fontSize: 17, fontWeight: '800', marginBottom: 3 },
  formatDescription: { fontSize: 13.5, lineHeight: 18 },
  formGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  textInput: { height: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, fontSize: 15 },
  dropdownSelector: { height: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownSelectedText: { fontSize: 15, fontWeight: '500' },
  optionRow: { flexDirection: 'row', gap: 10 },
  toggleButton: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  toggleButtonText: { fontSize: 14.5, fontWeight: '700' },
  reviewCard: { borderRadius: 20, borderWidth: 1, padding: 20 },
  reviewSection: { marginBottom: 18 },
  reviewSectionNoBorder: {},
  reviewLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, marginBottom: 4 },
  reviewValue: { fontSize: 17, fontWeight: '800', lineHeight: 23 },
  reviewCompetitorsRow: { fontSize: 17 },
  reviewVsText: { fontSize: 15, fontWeight: '500' },
  bottomBar: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingTop: 12 },
  actionRow: { flexDirection: 'row', gap: 12 },
  fullWidthButton: { width: '100%' },
  flexButton: { flex: 1.5 },
  backButton: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 15, fontWeight: '700' },
  primaryButton: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },

  /* Pickers */
  pickerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  pickerContainer: { width: '100%', maxWidth: 340, borderRadius: 20, borderWidth: 1, padding: 16 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  pickerHeaderTitle: { fontSize: 17, fontWeight: '800' },
  pickerSearchBar: { flexDirection: 'row', alignItems: 'center', height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 },
  pickerSearchInput: { flex: 1, fontSize: 14, padding: 0 },
  friendOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  friendInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarImg: { width: 38, height: 38, borderRadius: 19 },
  avatarPlaceholder: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 15, fontWeight: '700' },
  friendTextCol: { flex: 1 },
  friendNameText: { fontSize: 14.5, fontWeight: '600' },
  friendEmailText: { fontSize: 12, marginTop: 1 },
  emptyConnections: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  emptyConnectionsText: { fontSize: 13.5 },
});