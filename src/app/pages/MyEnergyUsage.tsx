import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Zap, TrendingDown, Calendar, Activity } from "lucide-react";
import { ethers } from "ethers";
import { useWallet } from "../contexts/WalletContext";
import { getMyTrades, getTrade } from "../blockchain/contracts";


export default function MyEnergyUsage() {
  const { walletAddress, isConnected } = useWallet();

  const [totalKwh, setTotalKwh]         = useState(0);
  const [totalEth, setTotalEth]         = useState(0);
  const [tradeCount, setTradeCount]     = useState(0);
  const [weeklyData, setWeeklyData]     = useState<any[]>([]);
  const [monthlyData, setMonthlyData]   = useState<any[]>([]);

  useEffect(() => {
    if (isConnected && walletAddress) loadUsage();
  }, [isConnected, walletAddress]);

  // ─── LOAD REAL PURCHASE DATA ───
  // For members, every trade is a purchase — kWh bought = energy received
  const loadUsage = async () => {
    try {
      const ids = await getMyTrades(walletAddress!);
      if (ids.length === 0) return;

      const trades = await Promise.all(ids.map((id: any) => getTrade(Number(id))));

      const kwh = trades.reduce((s: number, t: any) => s + Number(t.kWhPurchased), 0);
      const eth = trades.reduce((s: number, t: any) => s + parseFloat(ethers.formatEther(t.totalPaid)), 0);

      setTotalKwh(kwh);
      setTotalEth(eth);
      setTradeCount(ids.length);

      // ─── BUILD WEEKLY CHART (last 7 days) ───
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const today = new Date();
      const weekMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        weekMap[d.toDateString()] = 0;
      }
      trades.forEach((t: any) => {
        const d = new Date(Number(t.timestamp) * 1000);
        const key = d.toDateString();
        if (weekMap[key] !== undefined) weekMap[key] += Number(t.kWhPurchased);
      });
      setWeeklyData(Object.entries(weekMap).map(([dateStr, usage]) => ({
        day: dayNames[new Date(dateStr).getDay()],
        usage,
      })));

      // ─── BUILD MONTHLY CHART (last 6 months) ───
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthKeys = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
        return { label: monthNames[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth()}` };
      });
      const monthMap: Record<string, number> = {};
      monthKeys.forEach(m => { monthMap[m.key] = 0; });
      trades.forEach((t: any) => {
        const d = new Date(Number(t.timestamp) * 1000);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthMap[key] !== undefined) monthMap[key] += Number(t.kWhPurchased);
      });
      setMonthlyData(monthKeys.map(m => ({ month: m.label, usage: monthMap[m.key] })));

    } catch (err) {
      console.error("Failed to load usage:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Energy Usage</h1>
        <p className="text-gray-600 mt-1">Track your energy consumption patterns</p>
      </div>

      {/* Stat cards — real blockchain data */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-gray-600">Total kWh Purchased</p>
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalKwh} kWh</p>
            <p className="text-sm text-green-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-gray-600">Total Purchases</p>
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{tradeCount}</p>
            <p className="text-sm text-teal-600 mt-1">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-gray-600">Total ETH Spent</p>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalEth.toFixed(4)} ETH</p>
            <p className="text-sm text-blue-600 mt-1">On energy</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-gray-600">Avg. Cost/kWh</p>
              <TrendingDown className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {totalKwh > 0 ? (totalEth / totalKwh).toFixed(4) : "0.0000"} ETH
            </p>
            <p className="text-sm text-purple-600 mt-1">Per kWh</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Energy Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorUsageWeek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
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
                fill="url(#colorUsageWeek)" 
                name="Usage (kWh)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Energy Usage Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
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
                dataKey="usage" 
                stroke="#14B8A6" 
                strokeWidth={3}
                dot={{ fill: '#14B8A6', r: 5 }}
                name="Usage (kWh)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { category: "Lighting", usage: 35, color: "bg-yellow-500" },
              { category: "Heating/Cooling", usage: 28, color: "bg-red-500" },
              { category: "Appliances", usage: 22, color: "bg-blue-500" },
              { category: "Electronics", usage: 15, color: "bg-purple-500" },
            ].map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{item.category}</span>
                  <span className="text-sm text-gray-600">{item.usage}%</span>
                </div>
                <Progress value={item.usage} className="h-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
