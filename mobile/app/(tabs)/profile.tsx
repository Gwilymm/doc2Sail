import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../theme/useAppTheme';
import { Button } from '../../components/ui/Button';
import { M3Switch } from '../../components/ui/M3Switch';
import { AppHeader } from '../../components/AppHeader';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ProfileScreen() {
  const { user, logout, updateDisplayName } = useAuth();
  const { isDark, setTheme, colors } = useAppTheme();
  const dark = isDark;

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraftName(user?.displayName ?? '');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraftName('');
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    try {
      await updateDisplayName(draftName);
      setEditing(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le nom.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Profil" subtitle={user?.displayName ?? 'Compte et préférences'} icon="user" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 16,
          paddingBottom: 32,
          maxWidth: Platform.OS === 'web' ? 480 : undefined,
          alignSelf: Platform.OS === 'web' ? 'center' : undefined,
          width: '100%',
        }}
        keyboardShouldPersistTaps="handled"
      >
      {/* Avatar + identity card */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          paddingVertical: 28,
          paddingHorizontal: 20,
          alignItems: 'center',
          marginBottom: 12,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: dark ? 0 : 0.06,
          shadowRadius: 6,
          elevation: dark ? 0 : 2,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surfaceContainerHigh,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 36, lineHeight: 44 }}>👤</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '600', color: colors.onSurface, letterSpacing: 0 }}>
          {user?.displayName ?? 'Utilisateur'}
        </Text>
        {user?.roles.includes('ROLE_ADMIN') && (
          <View
            style={{
              marginTop: 6,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 12,
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.onPrimary, letterSpacing: 0.5 }}>
              ADMIN
            </Text>
          </View>
        )}
      </View>

      {/* Stats card */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: 12,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: dark ? 0 : 0.06,
          shadowRadius: 6,
          elevation: dark ? 0 : 2,
        }}
      >
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>
            {user?.regattasCount ?? 0}
          </Text>
          <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>Mes régates</Text>
        </View>
        <View style={{ width: 1, backgroundColor: colors.outlineVariant }} />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>
            {user?.sharedRegattasCount ?? 0}
          </Text>
          <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>Partagées</Text>
        </View>
      </View>

      {/* Account card */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          marginBottom: 12,
          overflow: 'hidden',
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: dark ? 0 : 0.06,
          shadowRadius: 6,
          elevation: dark ? 0 : 2,
        }}
      >
        {/* Display name row */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: editing ? 12 : 0 }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: colors.onSurface }}>Nom affiché</Text>
            {!editing && (
              <TouchableOpacity onPress={startEdit} hitSlop={8}>
                <FontAwesome name="pencil" size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View style={{ gap: 10 }}>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                autoFocus
                placeholder="Votre nom"
                placeholderTextColor={colors.onSurfaceVariant}
                style={{
                  backgroundColor: colors.inputBg,
                  borderWidth: 1.5,
                  borderColor: colors.inputBorderFocus,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: colors.onSurface,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={cancelEdit}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.onSurfaceVariant }}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveEdit}
                  disabled={saving}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                  }}
                >
                  {saving
                    ? <ActivityIndicator size="small" color={colors.onPrimary} />
                    : <Text style={{ fontSize: 14, fontWeight: '600', color: colors.onPrimary }}>Enregistrer</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 14, color: colors.onSurfaceVariant, marginTop: 2 }}>
              {user?.displayName ?? '—'}
            </Text>
          )}
        </View>

        {/* Dark mode row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: colors.onSurface }}>
              Thème sombre
            </Text>
            <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>
              {dark ? 'Activé' : 'Désactivé'}
            </Text>
          </View>
          <M3Switch
            value={dark}
            onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
            trackOnColor={colors.primary}
            thumbOnColor={colors.onPrimary}
            trackOffBorder={colors.outline}
            thumbOffColor={colors.outline}
          />
        </View>
      </View>

      {/* Logout */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: dark ? 0 : 0.06,
          shadowRadius: 6,
          elevation: dark ? 0 : 2,
        }}
      >
        <Button variant="error" onPress={logout} fullWidth>
          Se déconnecter
        </Button>
      </View>
      </ScrollView>
    </View>
  );
}
