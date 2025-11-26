import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

type AuthUser = {
    id: number;
    displayName: string;
    roles: string[];
};

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    requestMagicLink: (email: string) => Promise<boolean>;
    verifyCode: (code: string) => Promise<boolean>;
    logout: () => Promise<void>;
    biometricAvailable: boolean;
    unlockWithBiometrics: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// API base - locale removed, Accept-Language will handle
const API_BASE = "http://192.168.1.2:8000";

const TOKEN_KEY = "doc2sail_jwt";
const USER_KEY = "doc2sail_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [locked, setLocked] = useState(false);

    // Initial load & biometric capability
    useEffect(() => {
        (async () => {
            try {
                const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
                const storedUser = await SecureStore.getItemAsync(USER_KEY);
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    // Require biometric unlock if available
                    const hardware =
                        await LocalAuthentication.hasHardwareAsync();
                    const enrolled =
                        await LocalAuthentication.isEnrolledAsync();
                    if (hardware && enrolled) {
                        setBiometricAvailable(true);
                        setLocked(true);
                    }
                } else {
                    const hardware =
                        await LocalAuthentication.hasHardwareAsync();
                    const enrolled =
                        await LocalAuthentication.isEnrolledAsync();
                    setBiometricAvailable(hardware && enrolled);
                }
            } catch (e) {
                // Ignore for now
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const requestMagicLink = useCallback(async (email: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "Accept-Language": "fr",
                },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            return !!data.success;
        } catch {
            return false;
        }
    }, []);

    const verifyCode = useCallback(async (code: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "Accept-Language": "fr",
                },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (res.ok && data.token) {
                setToken(data.token);
                setUser(data.user);
                await SecureStore.setItemAsync(TOKEN_KEY, data.token);
                await SecureStore.setItemAsync(
                    USER_KEY,
                    JSON.stringify(data.user)
                );
                setLocked(false);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        setToken(null);
        setUser(null);
        setLocked(false);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
    }, []);

    const unlockWithBiometrics = useCallback(async () => {
        if (!biometricAvailable || !locked) return true; // Nothing to do
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Déverrouiller Doc2Sail",
            fallbackLabel: "Entrer le code",
            cancelLabel: "Annuler",
        });
        if (result.success) {
            setLocked(false);
            return true;
        }
        return false;
    }, [biometricAvailable, locked]);

    const value: AuthContextValue = {
        user: locked ? null : user,
        token: locked ? null : token,
        loading,
        requestMagicLink,
        verifyCode,
        logout,
        biometricAvailable,
        unlockWithBiometrics,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

export default AuthProvider;
