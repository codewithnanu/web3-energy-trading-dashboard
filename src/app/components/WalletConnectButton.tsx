import { Button } from "./ui/button";
import { Wallet, CheckCircle, Loader2 } from "lucide-react";
import { useWallet } from "../contexts/WalletContext";

export function WalletConnectButton() {
  const { isConnected, walletAddress, connectWallet, isLoading } = useWallet();

  // ─── CONNECTED STATE ───
  // Shows shortened wallet address e.g. 0xa14F...D5
  if (isConnected && walletAddress) {
    return (
      <Button variant="outline" className="gap-2 bg-green-50 border-green-500 text-green-700 hover:bg-green-100">
        <CheckCircle className="w-4 h-4" />
        <span className="hidden sm:inline">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </span>
        <span className="sm:hidden">Connected</span>
      </Button>
    );
  }

  // ─── LOADING STATE ───
  // Shows spinner while MetaMask popup is open
  if (isLoading) {
    return (
      <Button disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  // ─── DEFAULT STATE ───
  // connectWallet triggers MetaMask popup
  return (
    <Button onClick={connectWallet} className="gap-2 bg-primary hover:bg-primary/90">
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
}
