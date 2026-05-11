import { useState, useRef } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { requestMagicLink, verifyCode, devGetCode } from '../../services/auth';
import { useAuth } from '../../hooks/useAuth';

type Step = 'email' | 'code';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const codeInputRef = useRef<TextInput>(null);
  const { checkAuth } = useAuth();
  const router = useRouter();

  async function handleRequestLink() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await requestMagicLink(email.trim());
      setStep('code');
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch (e: any) {
      setError(e.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (code.length < 4) return;
    setLoading(true);
    setError('');
    try {
      await verifyCode(code);
      await checkAuth();
      router.replace('/(tabs)/regattas');
    } catch (e: any) {
      setError(e.message ?? 'Code invalide');
    } finally {
      setLoading(false);
    }
  }

  async function handleDevLogin() {
    setLoading(true);
    setError('');
    try {
      const devEmail = email.trim() || 'marin.davies@gmail.com';
      const shortCode = await devGetCode(devEmail);
      await verifyCode(shortCode);
      await checkAuth();
      router.replace('/(tabs)/regattas');
    } catch (e: any) {
      setError(e.message ?? 'Erreur dev login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView
        contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
        className="bg-base-200"
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-base-100 rounded-card p-8 w-full max-w-sm items-center shadow">
          <Text className="text-5xl mb-2">⛵</Text>
          <Text className="text-3xl font-bold text-base-content mb-1">Doc2Sail</Text>
          <Text className="text-sm text-base-content/60 mb-6">
            {step === 'email' ? 'Connexion sans mot de passe' : 'Vérification'}
          </Text>

          {step === 'email' ? (
            <>
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
              <View className="mt-4 w-full gap-2">
                <Button onPress={handleRequestLink} loading={loading} fullWidth>
                  Recevoir le code par email
                </Button>
                {__DEV__ && (
                  <Button onPress={handleDevLogin} variant="ghost" fullWidth loading={loading}>
                    ⚡ Dev : connexion directe
                  </Button>
                )}
              </View>
            </>
          ) : (
            <>
              <Text className="text-sm text-center text-base-content/70 mb-1">
                Code envoyé à <Text className="font-semibold text-primary">{email}</Text>
              </Text>
              <Text className="text-xs text-center text-base-content/50 mb-4">
                Saisissez le code à 6 caractères reçu par email
              </Text>
              <Input
                ref={codeInputRef}
                label="Code de connexion"
                value={code}
                onChangeText={(v) => setCode(v.toUpperCase())}
                autoCapitalize="characters"
                autoComplete="one-time-code"
                placeholder="ABC123"
                maxLength={6}
                onSubmitEditing={handleVerifyCode}
                returnKeyType="done"
                error={error}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <View className="mt-4 w-full gap-2">
                <Button onPress={handleVerifyCode} loading={loading} fullWidth disabled={code.length < 4}>
                  Se connecter
                </Button>
                <Button onPress={() => { setStep('email'); setCode(''); setError(''); }} variant="ghost" fullWidth>
                  ← Changer d'email
                </Button>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
