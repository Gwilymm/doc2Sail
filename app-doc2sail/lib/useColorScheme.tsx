import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { COLORS } from "@/theme/colors";

const THEME_KEY = "doc2sail-theme";

export function useColorScheme() {
    const [colorScheme, setColorSchemeState] =
        useState<ColorSchemeName>("light");

    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY).then((stored) => {
            if (stored === "dark" || stored === "light") {
                setColorSchemeState(stored);
            } else {
                setColorSchemeState(Appearance.getColorScheme());
            }
        });
    }, []);

    const setColorScheme = (scheme: ColorSchemeName) => {
        setColorSchemeState(scheme);
        if (scheme) {
            AsyncStorage.setItem(THEME_KEY, scheme);
        }
    };

    const isDarkColorScheme = colorScheme === "dark";
    const colors = colorScheme === "dark" ? COLORS.dark : COLORS.light;

    return {
        colorScheme: colorScheme ?? "light",
        isDarkColorScheme,
        setColorScheme,
        colors,
    };
}

export function useInitialAndroidBarSync() {
    // Android-specific status bar syncing can be added here if needed
    return null;
}
