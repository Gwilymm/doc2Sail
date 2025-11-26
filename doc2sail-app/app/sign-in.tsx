import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth-context';
import { router, Stack } from 'expo-router';
import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

const SCREEN_OPTIONS = {
  title: 'Sign In',
  headerShown: true,
};

export default function SignInScreen() {
  const { requestCode, verifyCode } = useAuth();
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [step, setStep] = React.useState<'email' | 'code'>('email');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  const handleRequestCode = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await requestCode(email);
      setSuccessMessage(result.message);
      setStep('code');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      if (Platform.OS !== 'web') {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setError('Please enter the code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await verifyCode(code);
      // Rediriger vers la page d'accueil après connexion réussie
      router.replace('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      if (Platform.OS !== 'web') {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          contentContainerClassName="flex-1 items-center justify-center p-4"
          keyboardShouldPersistTaps="handled">
          <View className="w-full max-w-md">
            <Card>
              <CardHeader className="items-center">
                <CardTitle>Sign In to Doc2Sail</CardTitle>
                <CardDescription>
                  {step === 'email'
                    ? 'Enter your email to receive a verification code'
                    : 'Enter the 6-character code sent to your email'}
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-4">
                {error ? (
                  <View className="rounded-md bg-destructive/10 p-3">
                    <Text className="text-sm text-destructive">{error}</Text>
                  </View>
                ) : null}

                {successMessage ? (
                  <View className="rounded-md bg-green-500/10 p-3">
                    <Text className="text-sm text-green-700 dark:text-green-400">
                      {successMessage}
                    </Text>
                  </View>
                ) : null}

                {step === 'email' ? (
                  <View className="gap-2">
                    <Label nativeID="email">Email</Label>
                    <Input
                      placeholder="m@example.com"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      editable={!isLoading}
                      aria-labelledby="email"
                    />
                  </View>
                ) : (
                  <View className="gap-2">
                    <Label nativeID="code">Verification Code</Label>
                    <Input
                      placeholder="ABC123"
                      value={code}
                      onChangeText={(text) => setCode(text.toUpperCase())}
                      autoCapitalize="characters"
                      maxLength={6}
                      editable={!isLoading}
                      aria-labelledby="code"
                    />
                    <Text className="text-xs text-muted-foreground">Sent to {email}</Text>
                  </View>
                )}
              </CardContent>
              <CardFooter className="flex-col gap-3">
                {step === 'email' ? (
                  <Button onPress={handleRequestCode} disabled={isLoading} className="w-full">
                    <Text>{isLoading ? 'Sending code...' : 'Send Code'}</Text>
                  </Button>
                ) : (
                  <>
                    <Button onPress={handleVerifyCode} disabled={isLoading} className="w-full">
                      <Text>{isLoading ? 'Verifying...' : 'Verify Code'}</Text>
                    </Button>
                    <Button
                      onPress={() => {
                        setStep('email');
                        setCode('');
                        setError('');
                        setSuccessMessage('');
                      }}
                      variant="ghost"
                      disabled={isLoading}
                      className="w-full">
                      <Text>Use different email</Text>
                    </Button>
                  </>
                )}

                <Text className="text-center text-sm text-muted-foreground">
                  First time?{' '}
                  <Text className="text-primary">An account will be created automatically</Text>
                </Text>
              </CardFooter>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
