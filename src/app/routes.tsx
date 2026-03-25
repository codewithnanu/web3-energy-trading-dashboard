import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardLayout from "./layouts/DashboardLayout";
import MemberDashboard from "./pages/MemberDashboard";
import EnergyMarketplace from "./pages/EnergyMarketplace";
import SocietyTrading from "./pages/SocietyTrading";
import WalletIntegration from "./pages/WalletIntegration";
import EnergyAnalytics from "./pages/EnergyAnalytics";
import MyTransactions from "./pages/MyTransactions";
import MyEnergyUsage from "./pages/MyEnergyUsage";
import Settings from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: MemberDashboard },
      { path: "marketplace", Component: EnergyMarketplace },   // members only (redirects societies)
      { path: "society-trading", Component: SocietyTrading },  // societies only
      { path: "transactions", Component: MyTransactions },
      { path: "energy-usage", Component: MyEnergyUsage },
      { path: "wallet", Component: WalletIntegration },
      { path: "analytics", Component: EnergyAnalytics },
      { path: "settings", Component: Settings },
    ],
  },
]);
