import { useState, useRef } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { requestMagicLink, verifyCode } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

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
  const { isDark } = useTheme();

  const colors = isDark ? {
    background: '#061B29',
    surface:    '#082437',
    onSurface:  '#EAF7FA',
    onSurfaceVariant: '#78919A',
    primary:    '#8BD3E8',
  } : {
    background: '#F6FAFB',
    surface:    '#FFFFFF',
    onSurface:  '#071D2B',
    onSurfaceVariant: '#4A6572',
    primary:    '#0B4F6C',
  };

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
        style={{ backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 32,
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.08,
            shadowRadius: 12,
            elevation: isDark ? 0 : 4,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 8 }}>⛵</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.onSurface, marginBottom: 4 }}>
            Doc2Sail
          </Text>
          <Text style={{ fontSize: 14, color: colors.onSurfaceVariant, marginBottom: 24 }}>
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
              <View style={{ marginTop: 16, width: '100%', gap: 8 }}>
                <Button onPress={handleRequestLink} loading={loading} fullWidth>
                  Recevoir le code par email
                </Button>
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 14, textAlign: 'center', color: colors.onSurfaceVariant, marginBottom: 4 }}>
                Code envoyé à{' '}
                <Text style={{ fontWeight: '600', color: colors.primary }}>{email}</Text>
              </Text>
              <Text style={{ fontSize: 12, textAlign: 'center', color: colors.onSurfaceVariant, marginBottom: 16 }}>
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
              <View style={{ marginTop: 16, width: '100%', gap: 8 }}>
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
