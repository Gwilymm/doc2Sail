import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput as RNTextInput,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/nativewindui/Button";
import { Text } from "@/components/nativewindui/Text";
import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { cn } from "@/lib/cn";

type Step = "intro" | "email" | "code";

export default function HomeScreen() {
    const {
        user,
        token,
        requestMagicLink,
        verifyCode,
        logout,
        loading,
        biometricAvailable,
        unlockWithBiometrics,
    } = useAuth();

    // Consider session locked if biometrics are available, token exists, and user is not yet unlocked
    const locked = biometricAvailable && token && !user;
    const [step, setStep] = useState<Step>("intro");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [working, setWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (biometricAvailable && token && !user) {
            unlockWithBiometrics();
        }
    }, [biometricAvailable, token, user, unlockWithBiometrics]);

    const handleRequest = useCallback(async () => {
        setError(null);
        if (!email.trim()) {
            setError("Veuillez entrer un email valide");
            return;
        }
        setWorking(true);
        const ok = await requestMagicLink(email.trim());
        setWorking(false);
        if (ok) {
            Alert.alert("Email envoyé", "Vérifiez votre boîte mail / Mailpit");
            setStep("code");
        } else {
            setError("Impossible d'envoyer le code");
        }
    }, [email, requestMagicLink]);

    const handleVerify = useCallback(async () => {
        setError(null);
        if (!code.trim()) {
            setError("Code requis");
            return;
        }
        setWorking(true);
        const ok = await verifyCode(code.trim());
        setWorking(false);
        if (!ok) setError("Code invalide ou expiré");
    }, [code, verifyCode]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator />
                <Text className="mt-3 text-foreground">Chargement...</Text>
            </View>
        );
    }

    if (token && user) {
        return (
            <View className="flex-1 items-center justify-center bg-background px-6">
                <View className="bg-card p-6 rounded-2xl gap-4 w-full max-w-md shadow-lg">
                    <Text variant="title1" className="text-secondary">
                        ✓ Connecté
                    </Text>
                    <Text variant="body">Bienvenue {user.displayName}</Text>
                    <Text variant="caption1" color="secondary">
                        Token JWT
                    </Text>
                    <Text
                        variant="caption2"
                        className="bg-muted p-3 rounded-lg"
                        numberOfLines={4}
                    >
                        {token}
                    </Text>
                    <Button variant="secondary" onPress={logout}>
                        <Text>Se déconnecter</Text>
                    </Button>
                </View>
            </View>
        );
    }

    // Main onboarding/auth flow
    return (
        <View className="flex-1 bg-background">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 24,
                        paddingVertical: 48,
                    }}
                >
                    <View className="mb-6">
                        <Text variant="largeTitle" className="text-foreground">
                            Doc2Sail
                        </Text>
                        <Text variant="subhead" color="secondary">
                            App Mobile – Onboarding
                        </Text>
                    </View>
                    {/* ...existing code for locked, intro, email, code steps... */}
                    {locked && (
                        <View className="bg-card p-5 rounded-xl mb-6">
                            <Text variant="callout" className="mb-3">
                                Session protégée par biométrie
                            </Text>
                            <Button onPress={unlockWithBiometrics}>
                                <Text>Déverrouiller</Text>
                            </Button>
                        </View>
                    )}
                    {step === "intro" && !locked && (
                        <View className="bg-card p-6 rounded-2xl gap-4 shadow">
                            <Text variant="title3">
                                Connexion sans mot de passe
                            </Text>
                            <Text variant="subhead" color="secondary">
                                Nous utilisons des « liens magiques » et des
                                codes courts temporaires :
                            </Text>
                            <Text variant="footnote" color="tertiary">
                                1. Vous entrez votre email.
                            </Text>
                            <Text variant="footnote" color="tertiary">
                                2. Vous recevez un email avec un code (ex:
                                ABC-123).
                            </Text>
                            <Text variant="footnote" color="tertiary">
                                3. Vous entrez le code et votre session est
                                créée.
                            </Text>
                            <Text
                                variant="footnote"
                                color="tertiary"
                                className="mt-2"
                            >
                                Le jeton est stocké en sécurisé. Si disponible,
                                Face ID / empreinte déverrouille votre session.
                            </Text>
                            {biometricAvailable && (
                                <Text
                                    variant="caption1"
                                    className="text-secondary"
                                >
                                    Biométrie disponible ✓
                                </Text>
                            )}
                            <Button onPress={() => setStep("email")}>
                                <Text>Commencer</Text>
                            </Button>
                        </View>
                    )}
                    {step === "email" && !locked && (
                        <View className="bg-card p-6 rounded-2xl gap-4 shadow">
                            <Text variant="title3">Votre email</Text>
                            <View>
                                <Text
                                    variant="caption1"
                                    color="secondary"
                                    className="mb-2"
                                >
                                    Adresse
                                </Text>
                                <RNTextInput
                                    className={cn(
                                        "bg-input border-2 border-border px-4 py-3 rounded-xl text-base",
                                        error && "border-destructive"
                                    )}
                                    placeholder="email@exemple.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!working}
                                />
                                {error && (
                                    <Text
                                        variant="caption1"
                                        className="text-destructive mt-1"
                                    >
                                        {error}
                                    </Text>
                                )}
                            </View>
                            <Button onPress={handleRequest} disabled={working}>
                                {working ? (
                                    <ActivityIndicator />
                                ) : (
                                    <Text>
                                        {working
                                            ? "Envoi..."
                                            : "Recevoir mon code"}
                                    </Text>
                                )}
                            </Button>
                            <Button
                                variant="plain"
                                onPress={() => setStep("intro")}
                            >
                                <Text>← Retour</Text>
                            </Button>
                        </View>
                    )}
                    {step === "code" && !locked && (
                        <View className="bg-card p-6 rounded-2xl gap-4 shadow">
                            <Text variant="title3">Code reçu par email</Text>
                            <View>
                                <Text
                                    variant="caption1"
                                    color="secondary"
                                    className="mb-2"
                                >
                                    Code
                                </Text>
                                <RNTextInput
                                    className={cn(
                                        "bg-input border-2 border-border px-4 py-3 rounded-xl text-center text-xl tracking-widest font-mono",
                                        error && "border-destructive"
                                    )}
                                    placeholder="ABC-123"
                                    value={code}
                                    onChangeText={setCode}
                                    autoCapitalize="characters"
                                    editable={!working}
                                />
                                {error && (
                                    <Text
                                        variant="caption1"
                                        className="text-destructive mt-1"
                                    >
                                        {error}
                                    </Text>
                                )}
                            </View>
                            <Button onPress={handleVerify} disabled={working}>
                                {working ? (
                                    <ActivityIndicator />
                                ) : (
                                    <Text>
                                        {working
                                            ? "Vérification..."
                                            : "Se connecter"}
                                    </Text>
                                )}
                            </Button>
                            <Button
                                variant="plain"
                                onPress={() => setStep("email")}
                            >
                                <Text>← Changer d&apos;email</Text>
                            </Button>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// Remove all legacy/duplicate code below this line
