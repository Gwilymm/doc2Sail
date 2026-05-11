import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { requestMagicLink } from '../../services/auth';

type Step = 'email' | 'sent';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRequestLink() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await requestMagicLink(email.trim());
      setStep('sent');
    } catch (e: any) {
      setError(e.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'sent') {
    return (
      <View className="flex-1 bg-base-200 items-center justify-center px-4">
        <View className="bg-base-100 rounded-card p-8 w-full max-w-sm items-center shadow">
          <Text className="text-5xl mb-4">📧</Text>
          <Text className="text-2xl font-bold text-base-content mb-2">Vérifiez vos emails</Text>
          <Text className="text-sm text-center text-base-content/70 mb-1">
            Un lien de connexion a été envoyé à
          </Text>
          <Text className="text-sm font-semibold text-primary mb-4">{email}</Text>
          <Text className="text-xs text-center text-base-content/50 mb-6">
            Cliquez sur le lien dans l'email pour vous connecter. Il expire dans 15 minutes.
          </Text>
          <Button variant="ghost" onPress={() => setStep('email')}>
            Utiliser un autre email
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
        className="bg-base-200"
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-base-100 rounded-card p-8 w-full max-w-sm items-center shadow">
          <Text className="text-5xl mb-2">⛵</Text>
          <Text className="text-3xl font-bold text-base-content mb-1">Doc2Sail</Text>
          <Text className="text-sm text-base-content/60 mb-6">Connexion sans mot de passe</Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="votre@email.com"
            onSubmitEditing={handleRequestLink}
            returnKeyType="send"
            error={error}
          />

          <View className="mt-4 w-full">
            <Button onPress={handleRequestLink} loading={loading} fullWidth>
              Recevoir le lien de connexion
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
