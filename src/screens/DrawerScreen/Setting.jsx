import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { light, dark } from '../../theme/Color';
import { handleEdges } from '../../utils/edges';

const FORMAT_OPTIONS = ['Doubles', 'Singles'];
const POINTS_OPTIONS = [
  '21 Points (Official BWF)',
  '15 Points (Quick Match)',
  '11 Points (Sprint)',
];
const LENGTH_OPTIONS = ['Best of 3', 'Best of 1', 'Best of 5'];

const Setting = () => {
  const systemColorScheme = useColorScheme();
  const [selectedTheme, setSelectedTheme] = useState(systemColorScheme || 'dark');
  const colors = selectedTheme === 'dark' ? dark : light;
  const navigation = useNavigation();

  // Rule States
  const [format, setFormat] = useState('Doubles');
  const [points, setPoints] = useState('21 Points (Official BWF)');
  const [length, setLength] = useState('Best of 3');

  // Picker Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({
    title: '',
    options: [],
    selected: '',
    onSelect: () => {},
  });

  const openPicker = (title, options, selected, onSelect) => {
    setPickerConfig({
      title,
      options,
      selected,
      onSelect: (val) => {
        onSelect(val);
        setPickerVisible(false);
      },
    });
    setPickerVisible(true);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bgBase }]}
      edges={handleEdges ? handleEdges() : ['top', 'left', 'right', 'bottom']}
    >
      <StatusBar
        barStyle={selectedTheme === 'dark' ? 'light-content' : 'dark-content'}
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
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: App Appearance */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>
            APP APPEARANCE
          </Text>

          <View style={styles.toggleRow}>
            {/* Light Mode Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.modeButton,
                selectedTheme === 'light'
                  ? { backgroundColor: colors.accentBg }
                  : {
                      backgroundColor: colors.bgBase,
                      borderColor: colors.borderColor,
                      borderWidth: 1,
                    },
              ]}
              onPress={() => setSelectedTheme('light')}
            >
              <Text style={styles.modeIcon}>☀️</Text>
              <Text
                style={[
                  styles.modeButtonText,
                  {
                    color:
                      selectedTheme === 'light'
                        ? colors.accentText
                        : colors.textPrimary,
                  },
                ]}
              >
                Light Mode
              </Text>
            </TouchableOpacity>

            {/* Dark Mode Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.modeButton,
                selectedTheme === 'dark'
                  ? { backgroundColor: colors.accentBg }
                  : {
                      backgroundColor: colors.bgBase,
                      borderColor: colors.borderColor,
                      borderWidth: 1,
                    },
              ]}
              onPress={() => setSelectedTheme('dark')}
            >
              <Text style={styles.modeIcon}>🌙</Text>
              <Text
                style={[
                  styles.modeButtonText,
                  {
                    color:
                      selectedTheme === 'dark'
                        ? colors.accentText
                        : colors.textPrimary,
                  },
                ]}
              >
                Dark Mode
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 2: Default Match Rules */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>
            DEFAULT MATCH RULES
          </Text>

          {/* Default Format */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>
              DEFAULT FORMAT
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.selectInput,
                { backgroundColor: colors.bgBase, borderColor: colors.borderColor },
              ]}
              onPress={() =>
                openPicker('Select Match Format', FORMAT_OPTIONS, format, setFormat)
              }
            >
              <Text style={[styles.selectValue, { color: colors.textPrimary }]}>
                {format}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Default Game Points */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>
              DEFAULT GAME POINTS
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.selectInput,
                { backgroundColor: colors.bgBase, borderColor: colors.borderColor },
              ]}
              onPress={() =>
                openPicker('Select Game Points', POINTS_OPTIONS, points, setPoints)
              }
            >
              <Text style={[styles.selectValue, { color: colors.textPrimary }]}>
                {points}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Default Match Length */}
          <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
            <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>
              DEFAULT MATCH LENGTH
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.selectInput,
                { backgroundColor: colors.bgBase, borderColor: colors.borderColor },
              ]}
              onPress={() =>
                openPicker('Select Match Length', LENGTH_OPTIONS, length, setLength)
              }
            >
              <Text style={[styles.selectValue, { color: colors.textPrimary }]}>
                {length}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Selection Bottom Sheet Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalOverlay, { backgroundColor: colors.overlayBg }]}
          onPress={() => setPickerVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderColor },
            ]}
          >
            <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary }]}>
              {pickerConfig.title}
            </Text>

            {pickerConfig.options.map((opt) => {
              const isSelected = pickerConfig.selected === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  activeOpacity={0.7}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: colors.borderColor },
                    isSelected && {
                      backgroundColor:
                        selectedTheme === 'dark' ? '#27272A' : '#E4E4E7',
                    },
                  ]}
                  onPress={() => pickerConfig.onSelect(opt)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: colors.textPrimary },
                      isSelected && { fontWeight: '800' },
                    ]}
                  >
                    {opt}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={colors.textPrimary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default Setting;

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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeIcon: {
    fontSize: 16,
  },
  modeButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  selectInput: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
});