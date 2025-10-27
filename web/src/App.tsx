import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AddProductScreen } from "./screens/AddProductScreen";

function App(): JSX.Element {
  return (
    <I18nProvider>
      <ThemeProvider>
        <OnboardingVaultScreen />
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
