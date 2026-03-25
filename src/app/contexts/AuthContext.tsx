import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'society';
  societyId: string;    // For members: the society they belong to. For societies: their own ID.
  societyName: string;  // For members: their society's name. For societies: their own name.
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: 'member' | 'society', societyId?: string, societyName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Stored accounts persist across login/signup so role is remembered
const ACCOUNTS_KEY = 'enerchain_accounts';

function getAccounts(): Record<string, User & { password: string }> {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAccount(email: string, user: User, password: string) {
  const accounts = getAccounts();
  accounts[email] = { ...user, password };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const accounts = getAccounts();
        const account = accounts[email];

        if (account) {
          // Found existing account — restore their role and society
          const userData: User = {
            id: account.id,
            name: account.name,
            email: account.email,
            role: account.role,
            societyId: account.societyId,
            societyName: account.societyName,
          };
          setUser(userData);
          localStorage.setItem('enerchain_user', JSON.stringify(userData));
        } else {
          // No account found — reject so the caller can show an error
          reject(new Error('Account not found. Please sign up first.'));
          return;
        }
        resolve();
      }, 1000);
    });
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: 'member' | 'society',
    societyId?: string,
    societyName?: string,
  ) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const userId = Math.random().toString(36).substring(2, 11);

        const newUser: User = {
          id: userId,
          name,
          email,
          role,
          societyId: role === 'society' ? userId : (societyId ?? ''),
          societyName: role === 'society' ? name : (societyName ?? ''),
        };

        setUser(newUser);
        localStorage.setItem('enerchain_user', JSON.stringify(newUser));
        saveAccount(email, newUser, password);
        resolve();
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('enerchain_user');
  };

  // Restore session on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem('enerchain_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
