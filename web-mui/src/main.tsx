import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./app/providers/AppProviders";
import { router } from "./app/router";

createRoot(document.getElementById("root")!).render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
);
