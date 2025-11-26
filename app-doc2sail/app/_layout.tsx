import "../global.css";
import "expo-dev-client";
import { PortalHost } from "@rn-primitives/portal";
import { ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

import { useColorScheme, useInitialAndroidBarSync } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/theme";
import { AuthProvider } from "./context/AuthContext";

export const unstable_settings = {
    anchor: "(tabs)",
};

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
    useInitialAndroidBarSync();
    const { colorScheme, isDarkColorScheme } = useColorScheme();

    return (
        <>
            <StatusBar
                key={`root-status-bar-${isDarkColorScheme ? "light" : "dark"}`}
                style={isDarkColorScheme ? "light" : "dark"}
            />
            <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                <AuthProvider>
                    <NavThemeProvider value={NAV_THEME[colorScheme]}>
                        <Stack>
                            <Stack.Screen
                                name="(tabs)"
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="modal"
                                options={{
                                    presentation: "modal",
                                    title: "Modal",
                                }}
                            />
                        </Stack>
                        <PortalHost />
                    </NavThemeProvider>
                </AuthProvider>
            </KeyboardProvider>
        </>
    );
}
