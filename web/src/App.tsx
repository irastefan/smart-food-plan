import { ThemeProvider } from "@/theme/ThemeProvider";
import { OnboardingVaultScreen } from "./screens/OnboardingVaultScreen";

function App(): JSX.Element {
  return (
    <ThemeProvider>
      <OnboardingVaultScreen />
    </ThemeProvider>
  );
}

export default App;
