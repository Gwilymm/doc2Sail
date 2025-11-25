import { useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    StyleSheet,
} from "react-native";

type LoginStep = "email" | "code";
type LoginStatus = "idle" | "loading" | "success" | "error";

const API_URL = "http://localhost:8000/fr"; // Remplacer par votre URL de production

export default function LoginScreen() {
    const [step, setStep] = useState<LoginStep>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [status, setStatus] = useState<LoginStatus>("idle");
    const [token, setToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");

    // Étape 1 : Demander un code par email
    const requestCode = useCallback(async () => {
        if (!email.trim()) {
            Alert.alert("Erreur", "Veuillez entrer votre email");
            return;
        }

        setStatus("loading");

        try {
            const response = await fetch(`${API_URL}/api/auth/request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setStatus("idle");
                setStep("code");
                Alert.alert(
                    "Email envoyé",
                    data.message || "Vérifiez votre boîte mail"
                );
            } else {
                setStatus("error");
                Alert.alert(
                    "Erreur",
                    data.error || "Impossible d&apos;envoyer le code"
                );
            }
        } catch (error) {
            console.error("Request Code Error:", error);
            setStatus("error");
            Alert.alert("Erreur", "Impossible de se connecter à l&apos;API");
        }
    }, [email]);

    // Étape 2 : Vérifier le code
    const verifyCode = useCallback(async () => {
        if (!code.trim()) {
            Alert.alert("Erreur", "Veuillez entrer le code de connexion");
            return;
        }

        setStatus("loading");

        try {
            const response = await fetch(`${API_URL}/api/auth/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ code: code.trim() }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                setToken(data.token);
                setUserName(data.user?.displayName || "");
                setStatus("success");
            } else {
                setStatus("error");
                Alert.alert("Erreur", data.error || "Code invalide");
            }
        } catch (error) {
            console.error("Verify Code Error:", error);
            setStatus("error");
            Alert.alert("Erreur", "Impossible de vérifier le code");
        }
    }, [code]);

    // Écran de succès
    if (status === "success" && token) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "white",
                    paddingHorizontal: 24,
                }}
            >
                <Text
                    style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        color: "#059669",
                        marginBottom: 16,
                    }}
                >
                    ✓ Connecté !
                </Text>
                {userName && (
                    <Text
                        style={{
                            fontSize: 16,
                            color: "#4b5563",
                            marginBottom: 16,
                        }}
                    >
                        Bienvenue {userName}
                    </Text>
                )}
                <Text
                    style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}
                >
                    Token JWT:
                </Text>
                <Text
                    style={{
                        fontSize: 10,
                        color: "#1f2937",
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        backgroundColor: "#f3f4f6",
                        borderRadius: 8,
                        marginBottom: 24,
                    }}
                    numberOfLines={3}
                >
                    {token}
                </Text>
                <TouchableOpacity
                    style={{
                        backgroundColor: "#4b5563",
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 8,
                    }}
                    onPress={() => {
                        setToken(null);
                        setStatus("idle");
                        setStep("email");
                        setEmail("");
                        setCode("");
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                        Se déconnecter
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Écran principal de connexion
    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "white",
                paddingHorizontal: 32,
            }}
        >
            <Text
                style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: "#1e40af",
                    marginBottom: 8,
                }}
            >
                Doc2Sail
            </Text>
            <Text style={{ color: "#6b7280", marginBottom: 48 }}>
                Mobile App
            </Text>

            <View style={{ width: "100%", maxWidth: 400 }}>
                {step === "email" ? (
                    <>
                        <Text
                            style={{
                                color: "#374151",
                                fontWeight: "600",
                                marginBottom: 12,
                            }}
                        >
                            Adresse email
                        </Text>

                        <TextInput
                            style={{
                                width: "100%",
                                backgroundColor: "white",
                                borderWidth: 2,
                                borderColor: "#d1d5db",
                                borderRadius: 8,
                                paddingHorizontal: 16,
                                paddingVertical: 16,
                                fontSize: 16,
                                marginBottom: 24,
                            }}
                            placeholder="email@exemple.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoCorrect={false}
                            editable={status !== "loading"}
                        />

                        <TouchableOpacity
                            style={{
                                width: "100%",
                                paddingVertical: 16,
                                borderRadius: 8,
                                backgroundColor:
                                    status === "loading"
                                        ? "#93c5fd"
                                        : "#2563eb",
                            }}
                            onPress={requestCode}
                            disabled={status === "loading"}
                        >
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: 16,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                }}
                            >
                                {status === "loading"
                                    ? "Envoi..."
                                    : "Recevoir un code"}
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text
                            style={{
                                color: "#374151",
                                fontWeight: "600",
                                marginBottom: 12,
                            }}
                        >
                            Code de connexion
                        </Text>

                        <TextInput
                            style={{
                                width: "100%",
                                backgroundColor: "white",
                                borderWidth: 2,
                                borderColor: "#d1d5db",
                                borderRadius: 8,
                                paddingHorizontal: 16,
                                paddingVertical: 16,
                                fontSize: 20,
                                textAlign: "center",
                                fontFamily: "monospace",
                                marginBottom: 24,
                                letterSpacing: 4,
                            }}
                            placeholder="ABC-123"
                            value={code}
                            onChangeText={setCode}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            editable={status !== "loading"}
                        />

                        <TouchableOpacity
                            style={{
                                width: "100%",
                                paddingVertical: 16,
                                borderRadius: 8,
                                backgroundColor:
                                    status === "loading"
                                        ? "#93c5fd"
                                        : "#2563eb",
                                marginBottom: 12,
                            }}
                            onPress={verifyCode}
                            disabled={status === "loading"}
                        >
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: 16,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                }}
                            >
                                {status === "loading"
                                    ? "Vérification..."
                                    : "Se connecter"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ paddingVertical: 8 }}
                            onPress={() => {
                                setStep("email");
                                setCode("");
                                setStatus("idle");
                            }}
                        >
                            <Text
                                style={{
                                    color: "#6b7280",
                                    textAlign: "center",
                                }}
                            >
                                ← Changer d&apos;email
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {status === "loading" && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 16,
                        }}
                    >
                        <ActivityIndicator size="small" color="#2563eb" />
                        <Text style={{ marginLeft: 8, color: "#6b7280" }}>
                            Connexion...
                        </Text>
                    </View>
                )}

                {status === "error" && (
                    <Text
                        style={{
                            color: "#dc2626",
                            textAlign: "center",
                            marginTop: 16,
                            fontWeight: "500",
                        }}
                    >
                        ✗ Erreur de connexion
                    </Text>
                )}
            </View>
        </View>
    );
}
