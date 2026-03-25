import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectWallet as connectMetaMask, getETHBalance } from '../blockchain/contracts';

// ─── TYPES ───
interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  ethBalance: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {

  const [isConnected, setIsConnected]     = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ethBalance, setEthBalance]       = useState<string>("0");
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // ─── AUTO RECONNECT ───
  // When page refreshes, check if MetaMask is still connected
  // If yes, restore the connection silently without showing popup
  useEffect(() => {
    const restoreConnection = async () => {
      if (!window.ethereum) return;

      // eth_accounts returns connected accounts WITHOUT showing a popup
      // If array is empty, wallet is not connected
      const accounts = await window.ethereum.request({ method: "eth_accounts" });

      if (accounts.length > 0) {
        const address = accounts[0];
        const balance = await getETHBalance(address);
        setWalletAddress(address);
        setEthBalance(balance);
        setIsConnected(true);
      }
    };

    restoreConnection();

    // ─── LISTEN FOR ACCOUNT CHANGES ───
    // If user switches accounts in MetaMask, update the app automatically
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected from MetaMask
          setIsConnected(false);
          setWalletAddress(null);
          setEthBalance("0");
        } else {
          // User switched to a different account
          setWalletAddress(accounts[0]);
          getETHBalance(accounts[0]).then(setEthBalance);
        }
      });
    }
  }, []);

  // connectWallet — triggers MetaMask popup to ask for connection
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // connectMetaMask is imported from contracts.js
      // It calls eth_requestAccounts which shows the MetaMask popup
      const address = await connectMetaMask();
      const balance = await getETHBalance(address);

      setWalletAddress(address);
      setEthBalance(balance);
      setIsConnected(true);

    } catch (err: any) {
      // User rejected the MetaMask popup or MetaMask not installed
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    // MetaMask does not have a programmatic disconnect
    // We just clear our local state
    setIsConnected(false);
    setWalletAddress(null);
    setEthBalance("0");
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        ethBalance,
        connectWallet,
        disconnectWallet,
        isLoading,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
