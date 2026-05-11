import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  ScrollView,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export type SortKey = 'recent' | 'oldest' | 'name';

type Props = {
  visible: boolean;
  categories: string[];
  activeCategories: string[];
  activeSort: SortKey;
  onApply: (categories: string[], sort: SortKey) => void;
  onClose: () => void;
};

type SheetColors = {
  surface: string;
  onSurface: string;
  onSurfaceVariant: string;
  outlineVariant: string;
  primary: string;
  outline: string;
  btnOutlineBorder: string;
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Plus récent' },
  { key: 'oldest', label: 'Plus ancien' },
  { key: 'name', label: 'Nom A–Z' },
];

function CheckRow({
  label,
  checked,
  onPress,
  colors,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  colors: SheetColors;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 16 }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 2,
          borderWidth: checked ? 0 : 2,
          borderColor: colors.outline,
          backgroundColor: checked ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && (
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', lineHeight: 14 }}>✓</Text>
        )}
      </View>
      <Text style={{ fontSize: 16, fontWeight: '400', color: colors.onSurface, letterSpacing: 0.5 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function RadioRow({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: SheetColors;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 16 }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.outline,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
        )}
      </View>
      <Text style={{ fontSize: 16, fontWeight: '400', color: colors.onSurface, letterSpacing: 0.5 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SectionLabel({ children, colors }: { children: string; colors: SheetColors }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.5,
        color: colors.onSurfaceVariant,
        textTransform: 'uppercase',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 4,
      }}
    >
      {children}
    </Text>
  );
}

export function FilterBottomSheet({
  visible,
  categories,
  activeCategories,
  activeSort,
  onApply,
  onClose,
}: Props) {
  const { isDark } = useTheme();
  const translateY = useRef(new Animated.Value(600)).current;
  const [localCategories, setLocalCategories] = useState<string[]>(activeCategories);
  const [localSort, setLocalSort] = useState<SortKey>(activeSort);

  const colors: SheetColors = isDark ? {
    surface:          '#0D2A3F',
    onSurface:        '#EAF7FA',
    onSurfaceVariant: '#78919A',
    outlineVariant:   '#31515D',
    primary:          '#8BD3E8',
    outline:          '#78919A',
    btnOutlineBorder: '#31515D',
  } : {
    surface:          '#FFFBFE',
    onSurface:        '#1C1B1F',
    onSurfaceVariant: '#49454F',
    outlineVariant:   '#CAC4D0',
    primary:          '#0B4F6C',
    outline:          '#79747E',
    btnOutlineBorder: '#CAC4D0',
  };

  useEffect(() => {
    if (visible) {
      setLocalCategories(activeCategories);
      setLocalSort(activeSort);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 26,
        stiffness: 220,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 600,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  function toggleCategory(cat: string) {
    setLocalCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function handleApply() {
    onApply(localCategories, localSort);
    onClose();
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
      />

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          transform: [{ translateY }],
          paddingBottom: 32,
        }}
      >
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: colors.outlineVariant }} />
        </View>

        {/* Title row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 4,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '400', color: colors.onSurface }}>Filtrer</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={12}>
            <Text style={{ fontSize: 22, color: colors.onSurfaceVariant }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView bounces={false}>
          {/* Category — checkboxes */}
          <SectionLabel colors={colors}>Catégorie</SectionLabel>
          {categories
            .filter((cat) => cat !== 'Tous')
            .map((cat) => (
              <CheckRow
                key={cat}
                label={cat}
                checked={localCategories.includes(cat)}
                onPress={() => toggleCategory(cat)}
                colors={colors}
              />
            ))}

          {/* Sort — radio */}
          <SectionLabel colors={colors}>Trier par</SectionLabel>
          {SORT_OPTIONS.map((opt) => (
            <RadioRow
              key={opt.key}
              label={opt.label}
              selected={localSort === opt.key}
              onPress={() => setLocalSort(opt.key)}
              colors={colors}
            />
          ))}
        </ScrollView>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingTop: 16 }}>
          {/* Reset — M3 Outlined Button */}
          <TouchableOpacity
            onPress={() => setLocalCategories([])}
            activeOpacity={0.7}
            style={{
              height: 40,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.btnOutlineBorder,
              paddingHorizontal: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', letterSpacing: 0.1, color: colors.onSurfaceVariant }}>
              Réinitialiser
            </Text>
          </TouchableOpacity>

          {/* Apply — M3 Filled Button */}
          <TouchableOpacity
            onPress={handleApply}
            activeOpacity={0.85}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', letterSpacing: 0.1, color: isDark ? '#003543' : '#FFFFFF' }}>
              Appliquer
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}
