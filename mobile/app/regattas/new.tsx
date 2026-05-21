import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { apiFetch } from '../../services/api';
import { useAppTheme } from '../../theme/useAppTheme';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getErrorMessage(body: any): string {
  if (body?.error) return body.error;
  if (body?.detail) return body.detail;
  if (Array.isArray(body?.violations) && body.violations[0]?.message) {
    return body.violations[0].message;
  }
  return 'Impossible de créer la régate';
}

export default function NewRegattaScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const initialDate = useMemo(() => todayIsoDate(), []);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      setError('Le nom de la régate est obligatoire');
      return;
    }
    if (!startDate || !endDate) {
      setError('Les dates sont obligatoires');
      return;
    }
    if (endDate < startDate) {
      setError('La date de fin doit être après la date de début');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/regattas', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          startDate,
          endDate,
          description: description.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(getErrorMessage(body));
      }

      const id = body.id;
      if (id) {
        router.replace(`/(tabs)/regattas/${id}`);
      } else {
        router.replace('/(tabs)/regattas');
      }
    } catch (e: any) {
      setError(e.message ?? 'Impossible de créer la régate');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Nouvelle régate" subtitle="Créer un espace de documents" />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 16,
            gap: 14,
            width: '100%',
            maxWidth: 560,
            alignSelf: 'center',
          }}
        >
          {error ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.error,
                borderRadius: 8,
                padding: 12,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: '600' }}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Nom"
            value={name}
            onChangeText={setName}
            placeholder="Coupe de printemps"
            autoCapitalize="sentences"
            returnKeyType="next"
          />
          <Input
            label="Date de début"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            inputMode="numeric"
            autoCapitalize="none"
          />
          <Input
            label="Date de fin"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            inputMode="numeric"
            autoCapitalize="none"
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Lieu, série, informations utiles"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 104 }}
          />

          <View style={{ gap: 8, marginTop: 4 }}>
            <Button onPress={handleCreate} loading={loading} fullWidth>
              Créer la régate
            </Button>
            <Button onPress={() => router.back()} variant="ghost" fullWidth>
              Annuler
            </Button>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
