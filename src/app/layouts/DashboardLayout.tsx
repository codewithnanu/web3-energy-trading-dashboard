import { Outlet, Link, useLocation, Navigate } from "react-router";
import { WalletConnectButton } from "../components/WalletConnectButton";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Zap,
  Wallet,
  BarChart3,
  Settings,
  Building2,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";

const memberNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Buy Energy", href: "/dashboard/marketplace", icon: ShoppingCart },
  { name: "My Transactions", href: "/dashboard/transactions", icon: Receipt },
  { name: "My Energy Usage", href: "/dashboard/energy-usage", icon: Zap },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const societyNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Society Trading", href: "/dashboard/society-trading", icon: Building2 },
  { name: "My Transactions", href: "/dashboard/transactions", icon: Receipt },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navigation = user?.role === 'society' ? societyNavigation : memberNavigation;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              active
                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                : "text-gray-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}

      <div className="pt-4 mt-4 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-300 hover:bg-slate-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold hidden sm:inline">EnerChain</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:block text-right mr-2">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-400">
                  {user.role === 'member'
                    ? `Member · ${user.societyName}`
                    : 'Society Admin'}
                </p>
              </div>
            )}
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-slate-900 text-white min-h-[calc(100vh-73px)] sticky top-[73px]">
          {/* Role badge */}
          <div className="px-4 pt-4 pb-2">
            <div className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full inline-block ${
              user?.role === 'society'
                ? 'bg-teal-700 text-teal-100'
                : 'bg-green-800 text-green-100'
            }`}>
              {user?.role === 'society' ? 'Society Admin' : `Member · ${user?.societyName}`}
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <NavLinks />
          </nav>
        </aside>

        {/* Sidebar - Mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-[73px] bottom-0 w-64 bg-slate-900 text-white z-50 lg:hidden overflow-y-auto"
              >
                <div className="px-4 pt-4 pb-2">
                  <div className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full inline-block ${
                    user?.role === 'society'
                      ? 'bg-teal-700 text-teal-100'
                      : 'bg-green-800 text-green-100'
                  }`}>
                    {user?.role === 'society' ? 'Society Admin' : `Member · ${user?.societyName}`}
                  </div>
                </div>
                <nav className="p-4 space-y-1">
                  <NavLinks onLinkClick={() => setSidebarOpen(false)} />
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
