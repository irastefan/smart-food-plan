import { ThemeProvider } from "@/theme/ThemeProvider";
import { AddProductScreen } from "./screens/AddProductScreen";

function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AddProductScreen />
    </ThemeProvider>
  );
}

export default App;
