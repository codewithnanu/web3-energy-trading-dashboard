import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Zap, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight,
  Sun, Battery, DollarSign
} from "lucide-react";
import { useWallet } from "../contexts/WalletContext";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "motion/react";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { ethers } from "ethers";
import { fetchFromIPFS } from "../blockchain/ipfs";
import { getMyTrades, getTrade, getActiveListingsForMembers } from "../blockchain/contracts";

const energyUsageData = [
  { time: "00:00", usage: 2.3 },
  { time: "04:00", usage: 1.8 },
  { time: "08:00", usage: 4.5 },
  { time: "12:00", usage: 6.2 },
  { time: "16:00", usage: 5.8 },
  { time: "20:00", usage: 7.1 },
  { time: "23:59", usage: 3.4 },
];

// Fallback price trend shown before any trades are made
const energyPriceData = [
  { time: "Mon", price: 0 },
  { time: "Tue", price: 0 },
  { time: "Wed", price: 0 },
  { time: "Thu", price: 0 },
  { time: "Fri", price: 0 },
  { time: "Sat", price: 0 },
  { time: "Sun", price: 0 },
];


export default function MemberDashboard() {
  const { isConnected, ethBalance, walletAddress } = useWallet();
  const { user } = useAuth();

  const [recentTrades, setRecentTrades]   = useState<any[]>([]);
  const [listings, setListings]           = useState<any[]>([]);
  const [priceTrend, setPriceTrend]       = useState<any[]>([]);

  useEffect(() => {
    if (isConnected && walletAddress) loadDashboardData();
  }, [isConnected, walletAddress]);

  const loadDashboardData = async () => {
    try {
      // Load trades — used for recent transactions and price trend chart
      const ids = await getMyTrades(walletAddress!);
      if (ids.length > 0) {
        const allIds = [...new Set(ids.map(Number))];
        const trades = await Promise.all(allIds.map((id: number) => getTrade(id)));

        // Recent 3 trades for the transactions section
        setRecentTrades(trades.slice(-3).reverse().map((t: any) => ({
          id:       Number(t.id),
          kWh:      Number(t.kWhPurchased),
          totalEth: parseFloat(ethers.formatEther(t.totalPaid)),
          date:     new Date(Number(t.timestamp) * 1000).toLocaleString(),
        })));

        // Price trend: price per kWh for each trade (last 7 trades)
        const trend = trades.slice(-7).map((t: any) => {
          const kwh = Number(t.kWhPurchased);
          const eth = parseFloat(ethers.formatEther(t.totalPaid));
          return {
            time: new Date(Number(t.timestamp) * 1000).toLocaleDateString('en-US', { month:'short', day:'numeric' }),
            price: kwh > 0 ? parseFloat((eth / kwh).toFixed(6)) : 0,
          };
        });
        setPriceTrend(trend);
      }

      // Load available energy listings for this member's society
      if (user?.societyId) {
        const raw = await getActiveListingsForMembers(parseInt(user.societyId));
        const enriched = await Promise.all(raw.map(async (l: any) => {
          let timeSlot = "N/A";
          try {
            const ipfs = await fetchFromIPFS(l.ipfsHash);
            timeSlot = ipfs.timeSlot || timeSlot;
          } catch {}
          return {
            time:      timeSlot,
            available: `${Number(l.availableKwh)} kWh`,
            price:     `${parseFloat(ethers.formatEther(l.pricePerKwh)).toFixed(4)} ETH/kWh`,
            status:    "Available",
          };
        }));
        setListings(enriched.slice(0, 4));
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your energy overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Energy Available Today</p>
                  <h3 className="text-3xl font-bold text-green-700">45.8 kWh</h3>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    +12% from yesterday
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Sun className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">My Energy Consumption</p>
                  <h3 className="text-3xl font-bold text-teal-700">28.3 kWh</h3>
                  <p className="text-sm text-teal-600 mt-2 flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4" />
                    -5% from last week
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
                  <h3 className="text-3xl font-bold text-blue-700">
                    {isConnected ? `${parseFloat(ethBalance).toFixed(4)} ETH` : "0.0000 ETH"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 truncate max-w-[150px]">
                    {walletAddress ? `${walletAddress.slice(0, 10)}...` : "Not connected"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Society Production</p>
                  <h3 className="text-3xl font-bold text-purple-700">156 kWh</h3>
                  <p className="text-sm text-purple-600 mt-2 flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    +8% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Battery className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Energy Usage (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={energyUsageData}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#16A34A" 
                  strokeWidth={2}
                  fill="url(#colorUsage)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Energy Price Trend (ETH/kWh)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceTrend.length > 0 ? priceTrend : energyPriceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#14B8A6" 
                  strokeWidth={3}
                  dot={{ fill: '#14B8A6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Transactions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700">
              <Sun className="w-4 h-4" />
              Buy Energy
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <DollarSign className="w-4 h-4" />
              Sell Energy
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <TrendingUp className="w-4 h-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTrades.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transactions yet.</p>
            ) : (
              <div className="space-y-4">
                {recentTrades.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                        <ArrowDownRight className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Bought {tx.kWh} kWh</p>
                        <p className="text-sm text-gray-500">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{tx.totalEth.toFixed(4)} ETH</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Energy Slots — real listings from blockchain */}
      <Card>
        <CardHeader>
          <CardTitle>Available Energy Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No energy listings available from your society right now.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {listings.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition"
                >
                  <p className="font-medium text-gray-900 mb-2">{slot.time}</p>
                  <p className="text-2xl font-bold text-green-600 mb-1">{slot.available}</p>
                  <p className="text-sm text-gray-600 mb-3">{slot.price}</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
