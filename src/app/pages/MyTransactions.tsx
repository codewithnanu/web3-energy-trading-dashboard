import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import { ArrowUpRight, ArrowDownRight, ExternalLink, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { getMyTrades, getTrade, getSocietyIdByAddress, getSocietyTrades } from "../blockchain/contracts";

export default function MyTransactions() {
  const { user }                            = useAuth();
  const { walletAddress, isConnected }      = useWallet();
  const [trades, setTrades]                 = useState<any[]>([]);
  const [isLoading, setIsLoading]           = useState(true);

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadTrades();
    }
  }, [isConnected, walletAddress]);

  const loadTrades = async () => {
    setIsLoading(true);
    try {
      let tradeIds: any[] = [];

      if (user?.role === 'society') {
        // Societies see all trades where they were buyer OR seller
        // getSocietyTrades returns IDs from both sides of trades
        const societyIdBN = await getSocietyIdByAddress(walletAddress!);
        const sId = Number(societyIdBN);
        tradeIds = await getSocietyTrades(sId);
      } else {
        // Members only ever buy — getMyTrades returns their purchases
        tradeIds = await getMyTrades(walletAddress!);
      }

      if (tradeIds.length === 0) {
        setTrades([]);
        return;
      }

      // Deduplicate IDs (societyTrades can have duplicates if society both bought and sold)
      const uniqueIds = [...new Set(tradeIds.map(Number))];

      const loaded = await Promise.all(uniqueIds.map(async (id: number) => {
        const t = await getTrade(id);
        // Determine if this wallet was the buyer or seller in this trade
        const isBuyer = t.buyerWallet.toLowerCase() === walletAddress!.toLowerCase();
        return {
          id:          Number(t.id),
          listingId:   Number(t.listingId),
          buyerWallet: t.buyerWallet,
          sellerWallet: t.sellerWallet,
          kWh:         Number(t.kWhPurchased),
          totalEth:    parseFloat(ethers.formatEther(t.totalPaid)),
          isMemberTrade: t.isMemberTrade,
          type:        isBuyer ? "buy" : "sell",
          date:        new Date(Number(t.timestamp) * 1000).toLocaleString(),
        };
      }));

      // Sort newest first
      setTrades(loaded.sort((a, b) => b.id - a.id));
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load transactions", { description: err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const totalSpent  = trades.filter(t => t.type === "buy").reduce((s, t) => s + t.totalEth, 0);
  const totalEarned = trades.filter(t => t.type === "sell").reduce((s, t) => s + t.totalEth, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-3 text-gray-600">Loading transactions from blockchain...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Transactions</h1>
          <p className="text-gray-600 mt-1">View all your energy trading transactions</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-900">{trades.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-blue-600">{totalSpent.toFixed(4)} ETH</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Earned</p>
            <p className="text-3xl font-bold text-green-600">{totalEarned.toFixed(4)} ETH</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">No transactions yet. Start trading to see your history here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trade ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Energy</TableHead>
                    <TableHead>Amount (ETH)</TableHead>
                    <TableHead>Trade Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                          #{tx.id}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{tx.date}</TableCell>
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
                        <span className="font-medium">{tx.kWh} kWh</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{tx.totalEth.toFixed(4)} ETH</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={tx.isMemberTrade ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}>
                          {tx.isMemberTrade ? "Member" : "Society"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">Completed</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={`Buyer: ${tx.buyerWallet}\nSeller: ${tx.sellerWallet}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
