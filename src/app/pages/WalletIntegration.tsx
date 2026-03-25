import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useWallet } from "../contexts/WalletContext";
import { useAuth } from "../contexts/AuthContext";
import {
  Wallet, ExternalLink, Copy, CheckCircle,
  ArrowUpRight, ArrowDownRight, Zap
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { ethers } from "ethers";
import { getMyTrades, getTrade, getSocietyIdByAddress, getSocietyTrades } from "../blockchain/contracts";

export default function WalletIntegration() {
  const { isConnected, walletAddress, ethBalance, connectWallet, disconnectWallet } = useWallet();
  const { user } = useAuth();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [trades, setTrades]               = useState<any[]>([]);

  useEffect(() => {
    if (isConnected && walletAddress) loadTrades();
  }, [isConnected, walletAddress]);

  const loadTrades = async () => {
    try {
      let ids: any[] = [];
      if (user?.role === 'society') {
        const sId = Number(await getSocietyIdByAddress(walletAddress!));
        ids = await getSocietyTrades(sId);
      } else {
        ids = await getMyTrades(walletAddress!);
      }
      if (ids.length === 0) return;
      const uniqueIds = [...new Set(ids.map(Number))];
      const loaded = await Promise.all(uniqueIds.map((id: number) => getTrade(id)));
      const wallet = walletAddress!.toLowerCase();
      setTrades(loaded.map((t: any) => ({
        id:      Number(t.id),
        type:    t.buyerWallet.toLowerCase() === wallet ? "buy" : "sell",
        energy:  Number(t.kWhPurchased),
        ethPaid: parseFloat(ethers.formatEther(t.totalPaid)),
        date:    new Date(Number(t.timestamp) * 1000).toLocaleString(),
      })).sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error(err);
    }
  };

  const totalEnergyBought = trades.filter(tx => tx.type === "buy").reduce((s, tx) => s + tx.energy, 0);
  const totalEnergySold   = trades.filter(tx => tx.type === "sell").reduce((s, tx) => s + tx.energy, 0);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopiedAddress(true);
      toast.success("Address Copied!", {
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wallet Integration</h1>
        <p className="text-gray-600 mt-1">Manage your MetaMask wallet and view transactions</p>
      </div>

      {/* Wallet Status */}
      <Card className={isConnected ? "border-green-200 bg-gradient-to-br from-green-50 to-white" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Wallet Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Connected to MetaMask</p>
                  <p className="text-sm text-gray-600">Your wallet is connected and ready to trade</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium text-gray-900 truncate">
                      {walletAddress}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="shrink-0"
                    >
                      {copiedAddress ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">ETH Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{parseFloat(ethBalance).toFixed(4)} ETH</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(`https://etherscan.io/address/${walletAddress}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Etherscan
                </Button>
                <Button 
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={disconnectWallet}
                >
                  Disconnect Wallet
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-6">Connect your MetaMask wallet to start trading energy</p>
              <Button 
                onClick={connectWallet}
                className="gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
              >
                <Wallet className="w-4 h-4" />
                Connect MetaMask
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <>
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Energy Bought</p>
                    <h3 className="text-3xl font-bold text-blue-600">{totalEnergyBought.toFixed(1)} kWh</h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ArrowDownRight className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {user?.role === 'society' && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Energy Sold</p>
                      <h3 className="text-3xl font-bold text-green-600">{totalEnergySold.toFixed(1)} kWh</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <ArrowUpRight className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                    <h3 className="text-3xl font-bold text-purple-600">{trades.length}</h3>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trade ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Energy Amount</TableHead>
                      <TableHead>ETH Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No transactions yet.
                        </TableCell>
                      </TableRow>
                    ) : trades.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                            #{tx.id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tx.type === "buy" ? (
                              <>
                                <ArrowDownRight className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-600">Buy</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-600">Sell</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{tx.energy} kWh</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{tx.ethPaid.toFixed(4)} ETH</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{tx.date}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700">Completed</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
