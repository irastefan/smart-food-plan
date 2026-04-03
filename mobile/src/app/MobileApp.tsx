import { StatusBar, useColorScheme, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MobileI18nProvider } from "./MobileI18nProvider";
import { HomeScreen } from "../screens/HomeScreen";

export function MobileApp() {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <MobileI18nProvider>
        <View style={{ flex: 1 }}>
          <HomeScreen isDarkMode={isDarkMode} />
        </View>
      </MobileI18nProvider>
    </SafeAreaProvider>
  );
}
