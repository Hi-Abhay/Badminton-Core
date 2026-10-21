import React, { useState } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { light, dark } from '../../../theme/Color';
import { handleEdges } from '../../../utils/edges';
import { useNavigation } from '@react-navigation/native';

const SINGLES_PLAYERS = [
  'Lakshya Sen',
  'Akane Yamaguchi',
  'Viktor Axelsen',
  'Tai Tzu-ying',
  'Satwiksairaj Rankireddy',
  'Chirag Shetty',
  'An Se-young',
  'Carolina Marin',
];

const DOUBLES_TEAMS = [
  'Sat-Chi Smashers',
  'Chia-Soh Titans',
  'Alpha Smashers',
  'Court Dominators',
];

const CreateMatch = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? dark : light;
  const navigation = useNavigation()
  // Step State (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Match Format ('SINGLES' | 'DOUBLES')
  const [matchFormat, setMatchFormat] = useState('SINGLES');

  // Step 2: Competitors
  const [sideA, setSideA] = useState('');
  const [sideB, setSideB] = useState('');
  const [pickerTarget, setPickerTarget] = useState(null); // 'sideA' | 'sideB' | null

  // Step 3: Scoring Rules
  const [matchTitle, setMatchTitle] = useState('');
  const [bestOf, setBestOf] = useState(3); // 1 | 3
  const [pointsPerGame, setPointsPerGame] = useState(21); // 11 | 15 | 21

  // Handle format switch (resets competitor selections)
  const handleSelectFormat = (format) => {
    if (format !== matchFormat) {
      setMatchFormat(format);
      setSideA('');
      setSideB('');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && (!sideA || !sideB)) {
      return;
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const getCompetitorOptions = () => {
    const list = matchFormat === 'SINGLES' ? SINGLES_PLAYERS : DOUBLES_TEAMS;
    if (pickerTarget === 'sideA') {
      return list.filter((item) => item !== sideB);
    }
    if (pickerTarget === 'sideB') {
      return list.filter((item) => item !== sideA);
    }
    return list;
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
            borderColor:
              matchFormat === 'SINGLES' ? colors.textPrimary : colors.borderColor,
            borderWidth: matchFormat === 'SINGLES' ? 2 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.badgeCircle,
            {
              backgroundColor:
                matchFormat === 'SINGLES' ? colors.accentBg : colors.bgBase,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color:
                  matchFormat === 'SINGLES'
                    ? colors.accentText
                    : colors.textPrimary,
              },
            ]}
          >
            1v1
          </Text>
        </View>

        <View style={styles.formatInfo}>
          <Text style={[styles.formatTitle, { color: colors.textPrimary }]}>
            Singles Match
          </Text>
          <Text style={[styles.formatDescription, { color: colors.textTertiary }]}>
            Individual match between two single players
          </Text>
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
            borderColor:
              matchFormat === 'DOUBLES' ? colors.textPrimary : colors.borderColor,
            borderWidth: matchFormat === 'DOUBLES' ? 2 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.badgeCircle,
            {
              backgroundColor:
                matchFormat === 'DOUBLES' ? colors.accentBg : colors.bgBase,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color:
                  matchFormat === 'DOUBLES'
                    ? colors.accentText
                    : colors.textPrimary,
              },
            ]}
          >
            2v2
          </Text>
        </View>

        <View style={styles.formatInfo}>
          <Text style={[styles.formatTitle, { color: colors.textPrimary }]}>
            Doubles Match
          </Text>
          <Text style={[styles.formatDescription, { color: colors.textTertiary }]}>
            Partnership match between two doubles teams
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // --- Step 2: Select Competitors ---
  const renderStep2 = () => {
    const isSingles = matchFormat === 'SINGLES';
    const labelA = isSingles ? 'SIDE A (PLAYER 1) *' : 'SIDE A (TEAM 1) *';
    const labelB = isSingles ? 'SIDE B (PLAYER 2) *' : 'SIDE B (TEAM 2) *';

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
          Step 2: Select Competitors
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Pick both sides for this {isSingles ? 'singles' : 'doubles'} match.
        </Text>

        {/* Side A */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
            {labelA}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPickerTarget('sideA')}
            style={[
              styles.dropdownSelector,
              {
                backgroundColor: colors.bgSurface,
                borderColor: sideA ? colors.textPrimary : colors.borderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.dropdownSelectedText,
                { color: sideA ? colors.textPrimary : colors.textTertiary },
              ]}
            >
              {sideA || 'Select Competitor A'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Side B */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
            {labelB}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPickerTarget('sideB')}
            style={[
              styles.dropdownSelector,
              {
                backgroundColor: colors.bgSurface,
                borderColor: sideB ? colors.textPrimary : colors.borderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.dropdownSelectedText,
                { color: sideB ? colors.textPrimary : colors.textTertiary },
              ]}
            >
              {sideB || 'Select Competitor B'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- Step 3: Scoring Rules ---
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
        Step 3: Scoring Rules
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Set points per game and match length.
      </Text>

      {/* Match Title */}
      <View style={styles.formGroup}>
        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
          MATCH TITLE (OPTIONAL)
        </Text>
        <TextInput
          value={matchTitle}
          onChangeText={setMatchTitle}
          placeholder="e.g. Club Championship Final"
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderColor,
              color: colors.textPrimary,
            },
          ]}
        />
      </View>

      {/* Best Of (Games) */}
      <View style={styles.formGroup}>
        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
          BEST OF (GAMES)
        </Text>
        <View style={styles.optionRow}>
          {[1, 3].map((val) => {
            const isSelected = bestOf === val;
            return (
              <TouchableOpacity
                key={val}
                activeOpacity={0.8}
                onPress={() => setBestOf(val)}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: isSelected
                      ? colors.accentBg
                      : colors.bgSurface,
                    borderColor: isSelected
                      ? colors.accentBg
                      : colors.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    {
                      color: isSelected
                        ? colors.accentText
                        : colors.textPrimary,
                    },
                  ]}
                >
                  Best of {val}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Points Per Game */}
      <View style={styles.formGroup}>
        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
          POINTS PER GAME
        </Text>
        <View style={styles.optionRow}>
          {[11, 15, 21].map((pts) => {
            const isSelected = pointsPerGame === pts;
            return (
              <TouchableOpacity
                key={pts}
                activeOpacity={0.8}
                onPress={() => setPointsPerGame(pts)}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: isSelected
                      ? colors.accentBg
                      : colors.bgSurface,
                    borderColor: isSelected
                      ? colors.accentBg
                      : colors.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    {
                      color: isSelected
                        ? colors.accentText
                        : colors.textPrimary,
                    },
                  ]}
                >
                  {pts} pts
                </Text>
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
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
        Step 4: Review Setup
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Confirm your setup before heading to the coin toss.
      </Text>

      <View
        style={[
          styles.reviewCard,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderColor,
          },
        ]}
      >
        {/* Format */}
        <View style={styles.reviewSection}>
          <Text style={[styles.reviewLabel, { color: colors.textTertiary }]}>
            FORMAT
          </Text>
          <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>
            {matchFormat}
          </Text>
        </View>

        {/* Competitors */}
        <View style={styles.reviewSection}>
          <Text style={[styles.reviewLabel, { color: colors.textTertiary }]}>
            COMPETITORS
          </Text>
          <Text style={styles.reviewCompetitorsRow}>
            <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>
              {sideA || 'Competitor A'}{' '}
            </Text>
            <Text style={[styles.reviewVsText, { color: colors.textTertiary }]}>
              vs{' '}
            </Text>
            <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>
              {sideB || 'Competitor B'}
            </Text>
          </Text>
        </View>

        {/* Scoring Standard */}
        <View style={styles.reviewSectionNoBorder}>
          <Text style={[styles.reviewLabel, { color: colors.textTertiary }]}>
            SCORING STANDARD
          </Text>
          <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>
            Best of {bestOf} games • {pointsPerGame} points per game (capped at 30)
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
      edges={handleEdges()}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          style={styles.headerBackButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Create Match
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 4-Step Progress Indicator Bar */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((step) => {
              const isActive = currentStep >= step;
              return (
                <View
                  key={step}
                  style={[
                    styles.progressBarSegment,
                    {
                      backgroundColor: isActive
                        ? colors.accentBg
                        : colors.borderColor,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Active Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        {/* Bottom Actions Bar */}
        <View style={styles.bottomBar}>
          {currentStep === 1 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleNext}
              style={[
                styles.primaryButton,
                styles.fullWidthButton,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: colors.accentText },
                ]}
              >
                Next: Select Competitors →
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleBack}
                style={[
                  styles.backButton,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderColor,
                  },
                ]}
              >
                <Text
                  style={[styles.backButtonText, { color: colors.textPrimary }]}
                >
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={
                  currentStep === 4
                    ? () => navigation.navigate('Toss')
                    : handleNext
                }
                disabled={currentStep === 2 && (!sideA || !sideB)}
                style={[
                  styles.primaryButton,
                  styles.flexButton,
                  {
                    backgroundColor: colors.accentBg,
                    opacity:
                      currentStep === 2 && (!sideA || !sideB) ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: colors.accentText },
                  ]}
                >
                  {currentStep === 2 && 'Next: Rules Setup →'}
                  {currentStep === 3 && 'Next: Review →'}
                  {currentStep === 4 && 'Proceed to Toss 🪙'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Competitors Dropdown Picker Modal */}
      <Modal
        visible={pickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerTarget(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPickerTarget(null)}
          style={[styles.pickerOverlay, { backgroundColor: colors.overlayBg }]}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.pickerContainer,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.borderColor,
                },
              ]}
            >
              <ScrollView style={{ maxHeight: 340 }}>
                {getCompetitorOptions().map((name, idx) => {
                  const isSelected =
                    (pickerTarget === 'sideA' && sideA === name) ||
                    (pickerTarget === 'sideB' && sideB === name);

                  return (
                    <TouchableOpacity
                      key={name}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (pickerTarget === 'sideA') setSideA(name);
                        if (pickerTarget === 'sideB') setSideB(name);
                        setPickerTarget(null);
                      }}
                      style={[
                        styles.pickerOption,
                        idx > 0 && {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: colors.borderColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          { color: colors.textPrimary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {name}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.textPrimary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
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
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 26,
  },
  progressBarSegment: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14.5,
    lineHeight: 20,
    marginBottom: 24,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  badgeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  formatInfo: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
  },
  formatDescription: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  dropdownSelector: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownSelectedText: {
    fontSize: 15,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  reviewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  reviewSection: {
    marginBottom: 18,
  },
  reviewSectionNoBorder: {},
  reviewLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  reviewCompetitorsRow: {
    fontSize: 17,
  },
  reviewVsText: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fullWidthButton: {
    width: '100%',
  },
  flexButton: {
    flex: 1.5,
  },
  backButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pickerContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  pickerOptionText: {
    fontSize: 15,
  },
});