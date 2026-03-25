import { RouterProvider } from "react-router";
import { router } from "./routes";
import { WalletProvider } from "./contexts/WalletContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <RouterProvider router={router} />
        <Toaster />
      </WalletProvider>
    </AuthProvider>
  );
}