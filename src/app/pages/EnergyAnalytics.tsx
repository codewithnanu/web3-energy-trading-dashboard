import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Zap, DollarSign } from "lucide-react";
import { ethers } from "ethers";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { getMyTrades, getTrade, getSocietyIdByAddress, getSocietyTrades } from "../blockchain/contracts";

const dailyConsumptionData = [
  { day: "Mon", consumption: 28.5, production: 42.3 },
  { day: "Tue", consumption: 32.1, production: 38.7 },
  { day: "Wed", consumption: 29.8, production: 45.2 },
  { day: "Thu", consumption: 35.2, production: 41.6 },
  { day: "Fri", consumption: 31.7, production: 39.8 },
  { day: "Sat", consumption: 26.4, production: 48.9 },
  { day: "Sun", consumption: 24.8, production: 52.1 },
];


const energySourceData = [
  { name: "Solar Panels", value: 65, color: "#F59E0B" },
  { name: "Wind Turbines", value: 20, color: "#3B82F6" },
  { name: "Grid Supply", value: 10, color: "#6B7280" },
  { name: "Battery Storage", value: 5, color: "#10B981" },
];

const hourlyPatternData = [
  { hour: "00:00", usage: 2.3 },
  { hour: "03:00", usage: 1.8 },
  { hour: "06:00", usage: 3.5 },
  { hour: "09:00", usage: 5.2 },
  { hour: "12:00", usage: 6.8 },
  { hour: "15:00", usage: 5.9 },
  { hour: "18:00", usage: 7.4 },
  { hour: "21:00", usage: 4.8 },
];

export default function EnergyAnalytics() {
  const { user }                       = useAuth();
  const { walletAddress, isConnected } = useWallet();

  const [stats, setStats] = useState({
    kwhBought:    0,
    kwhSold:      0,
    ethEarned:    0,
    ethSpent:     0,
    totalTrades:  0,
  });
  const [tradingChartData, setTradingChartData] = useState<any[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);

  useEffect(() => {
    if (isConnected && walletAddress) loadStats();
  }, [isConnected, walletAddress]);

  // ─── LOAD REAL STATS FROM BLOCKCHAIN ───
  // Loads all trades and computes totals for the stat cards
  const loadStats = async () => {
    try {
      let tradeIds: any[] = [];
      if (user?.role === 'society') {
        const sId = Number(await getSocietyIdByAddress(walletAddress!));
        tradeIds = await getSocietyTrades(sId);
      } else {
        tradeIds = await getMyTrades(walletAddress!);
      }

      if (tradeIds.length === 0) return;

      const uniqueIds = [...new Set(tradeIds.map(Number))];
      const trades = await Promise.all(uniqueIds.map((id: number) => getTrade(id)));

      const wallet = walletAddress!.toLowerCase();

      const kwhBought = trades
        .filter((t: any) => t.buyerWallet.toLowerCase() === wallet)
        .reduce((s: number, t: any) => s + Number(t.kWhPurchased), 0);

      const kwhSold = trades
        .filter((t: any) => t.sellerWallet.toLowerCase() === wallet)
        .reduce((s: number, t: any) => s + Number(t.kWhPurchased), 0);

      const ethEarned = trades
        .filter((t: any) => t.sellerWallet.toLowerCase() === wallet)
        .reduce((s: number, t: any) => s + parseFloat(ethers.formatEther(t.totalPaid)), 0);

      const ethSpent = trades
        .filter((t: any) => t.buyerWallet.toLowerCase() === wallet)
        .reduce((s: number, t: any) => s + parseFloat(ethers.formatEther(t.totalPaid)), 0);

      setStats({ kwhBought, kwhSold, ethEarned, ethSpent, totalTrades: uniqueIds.length });

      // ─── BUILD MONTHLY CHART DATA (last 6 months) ───
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const now = new Date();

      // Create an ordered list of the last 6 months
      const monthKeys = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { label: monthNames[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth()}` };
      });

      // Initialize all months to zero
      const monthly: Record<string, { bought: number; sold: number; revenue: number; spent: number }> = {};
      monthKeys.forEach(m => { monthly[m.key] = { bought: 0, sold: 0, revenue: 0, spent: 0 }; });

      // Accumulate trade values into the correct month bucket
      for (const t of trades) {
        const d = new Date(Number(t.timestamp) * 1000);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthly[key]) continue;
        const eth = parseFloat(ethers.formatEther(t.totalPaid));
        const kwh = Number(t.kWhPurchased);
        if (t.buyerWallet.toLowerCase() === wallet) {
          monthly[key].bought += kwh;
          monthly[key].spent  += eth;
        }
        if (t.sellerWallet.toLowerCase() === wallet) {
          monthly[key].sold    += kwh;
          monthly[key].revenue += eth;
        }
      }

      setTradingChartData(monthKeys.map(m => ({
        month:  m.label,
        bought: monthly[m.key].bought,
        sold:   monthly[m.key].sold,
      })));

      setRevenueChartData(monthKeys.map(m => ({
        month:   m.label,
        revenue: parseFloat(monthly[m.key].revenue.toFixed(6)),
        spent:   parseFloat(monthly[m.key].spent.toFixed(6)),
      })));

    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Energy Analytics</h1>
        <p className="text-gray-600 mt-1">Comprehensive insights into your energy usage and trading</p>
      </div>

      {/* Key Metrics — real blockchain data */}
      <div className={`grid gap-6 ${user?.role === 'society' ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-gray-600">Total kWh Bought</p>
              <TrendingDown className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.kwhBought} kWh</p>
            <p className="text-sm text-blue-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-gray-600">Total ETH Spent</p>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.ethSpent.toFixed(4)} ETH</p>
            <p className="text-sm text-blue-600 mt-1">On purchases</p>
          </CardContent>
        </Card>

        {user?.role === 'society' && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-gray-600">Total kWh Sold</p>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.kwhSold} kWh</p>
                <p className="text-sm text-green-600 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-gray-600">Total ETH Earned</p>
                  <Zap className="w-5 h-5 text-teal-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.ethEarned.toFixed(4)} ETH</p>
                <p className="text-sm text-teal-600 mt-1">From sales</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="consumption" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-4">
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        {/* Consumption Tab */}
        <TabsContent value="consumption" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Energy Consumption vs Production</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={dailyConsumptionData}>
                  <defs>
                    <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
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
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="consumption" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fill="url(#colorConsumption)"
                    name="Consumption (kWh)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="production" 
                    stroke="#16A34A" 
                    strokeWidth={2}
                    fill="url(#colorProduction)"
                    name="Production (kWh)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hourly Usage Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyPatternData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#6b7280" />
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
                    dot={{ fill: '#14B8A6', r: 4 }}
                    name="Usage (kWh)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Energy Trading Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={tradingChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="bought" fill="#3B82F6" name="Energy Bought (kWh)" radius={[8, 8, 0, 0]} />
                  {user?.role === 'society' && (
                    <Bar dataKey="sold" fill="#16A34A" name="Energy Sold (kWh)" radius={[8, 8, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue from Energy Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey={user?.role === 'society' ? "revenue" : "spent"}
                    stroke="#10B981"
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                    name={user?.role === 'society' ? "ETH Earned" : "ETH Spent"}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            {user?.role === 'society' && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-1">Total ETH Earned</p>
                  <p className="text-3xl font-bold text-green-600">{stats.ethEarned.toFixed(4)} ETH</p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Total Trades</p>
                <p className="text-3xl font-bold text-teal-600">{stats.totalTrades}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Total ETH Spent</p>
                <p className="text-3xl font-bold text-blue-600">{stats.ethSpent.toFixed(4)} ETH</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Energy Source Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={energySourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {energySourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Energy Source Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {energySourceData.map((source) => (
                    <div key={source.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="font-medium text-gray-900">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{source.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
