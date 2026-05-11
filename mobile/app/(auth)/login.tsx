import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
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
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>📧</Text>
          <Text style={styles.title}>Vérifiez vos emails</Text>
          <Text style={styles.subtitle}>
            Un lien de connexion a été envoyé à{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Text style={styles.hint}>
            Cliquez sur le lien dans l'email pour vous connecter. Il expire dans 15 minutes.
          </Text>
          <TouchableOpacity style={styles.linkButton} onPress={() => setStep('email')}>
            <Text style={styles.linkButtonText}>Utiliser un autre email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.emoji}>⛵</Text>
        <Text style={styles.title}>Doc2Sail</Text>
        <Text style={styles.subtitle}>Connexion sans mot de passe</Text>

        <TextInput
          style={styles.input}
          placeholder="votre@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          onSubmitEditing={handleRequestLink}
          returnKeyType="send"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRequestLink}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Recevoir le lien de connexion</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24, textAlign: 'center' },
  emailHighlight: { fontWeight: '600', color: '#0284c7' },
  hint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 20 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 8 },
  button: {
    width: '100%',
    backgroundColor: '#0284c7',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkButton: { marginTop: 16 },
  linkButtonText: { color: '#0284c7', fontSize: 14 },
});
