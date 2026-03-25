import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { motion } from "motion/react";
import { Sun, Clock, Zap, Filter, CheckCircle, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { fetchFromIPFS, uploadToIPFS } from "../blockchain/ipfs";
import { getActiveListingsForMembers, memberBuyEnergy } from "../blockchain/contracts";

export default function EnergyMarketplace() {
  const { user } = useAuth();
  useWallet();

  // Society admins should not access this page — redirect them to society trading
  if (user?.role === 'society') {
    return <Navigate to="/dashboard/society-trading" replace />;
  }

  const [listings, setListings]               = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [modalOpen, setModalOpen]             = useState(false);
  const [amount, setAmount]                   = useState("10");
  const [priceRange, setPriceRange]           = useState([0.03, 0.05]);
  const [timeSlotFilter, setTimeSlotFilter]   = useState("all");
  const [isProcessing, setIsProcessing]       = useState(false);

  useEffect(() => {
    if (user?.societyId) {
      loadListings();
    }
  }, [user?.societyId]);

  // ─── LOAD LISTINGS ───
  // Fetches FOR_MEMBERS listings for this member's society from blockchain
  // Each listing's IPFS hash holds the timeSlot and other display details
  const loadListings = async () => {
    setIsLoadingListings(true);
    try {
      const societyIdNum = parseInt(user!.societyId);
      const rawListings = await getActiveListingsForMembers(societyIdNum);

      const enriched = await Promise.all(rawListings.map(async (l: any) => {
        let timeSlot = "N/A";
        try {
          const ipfs = await fetchFromIPFS(l.ipfsHash);
          timeSlot = ipfs.timeSlot || timeSlot;
        } catch {}
        return {
          id:             Number(l.id),
          society:        user!.societyName,
          available:      Number(l.availableKwh),
          pricePerKwhWei: l.pricePerKwh,
          price:          parseFloat(ethers.formatEther(l.pricePerKwh)),
          timeSlot,
          verified:       true,
        };
      }));

      setListings(enriched);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load listings", { description: err?.message });
    } finally {
      setIsLoadingListings(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const priceMatch = listing.price >= priceRange[0] && listing.price <= priceRange[1];
    const timeMatch  = timeSlotFilter === "all" || listing.timeSlot === timeSlotFilter;
    return priceMatch && timeMatch;
  });

  const handleBuyEnergy = (listing: any) => {
    setSelectedListing(listing);
    setAmount("10");
    setModalOpen(true);
  };

  // ─── CONFIRM PURCHASE ───
  // Sends real ETH to the society via the EnergyTrade contract
  const handleConfirmPurchase = async () => {
    if (!selectedListing) return;
    const kWh = parseInt(amount);
    if (!kWh || kWh <= 0 || kWh > selectedListing.available) {
      toast.error("Invalid amount");
      return;
    }
    setIsProcessing(true);
    try {
      const ipfsHash = await uploadToIPFS({
        type:        "member_buy",
        listingId:   selectedListing.id,
        buyerWallet: user?.walletAddress,
        society:     selectedListing.society,
        kWh,
        pricePerKwh: selectedListing.price,
        totalPaid:   (kWh * selectedListing.price).toFixed(6),
        timeSlot:    selectedListing.timeSlot,
        timestamp:   new Date().toISOString(),
      });
      await memberBuyEnergy(selectedListing.id, kWh, selectedListing.pricePerKwhWei, ipfsHash);
      setModalOpen(false);
      toast.success("Transaction Successful!", {
        description: `You purchased ${kWh} kWh from ${selectedListing.society}`,
      });
      await loadListings();
    } catch (err: any) {
      if (err?.code === 4001) {
        toast.error("Transaction rejected");
      } else {
        toast.error("Purchase failed", { description: err?.message });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingListings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-3 text-gray-600">Loading listings from blockchain...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Buy Energy</h1>
        <p className="text-gray-600 mt-1">Purchase surplus energy from your society</p>
      </div>

      {/* Society info banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
        <div className="bg-green-100 p-2 rounded-full">
          <Building2 className="w-5 h-5 text-green-700" />
        </div>
        <div>
          <p className="font-semibold text-green-800">{user?.societyName}</p>
          <p className="text-sm text-green-600">
            You can only purchase energy listed by your society.
            {listings.length === 0 && " No surplus energy is available right now."}
          </p>
        </div>
      </div>

      {listings.length > 0 ? (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label>Time Slot</Label>
                  <Select value={timeSlotFilter} onValueChange={setTimeSlotFilter}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time Slots</SelectItem>
                      <SelectItem value="Morning (6AM-12PM)">Morning (6AM-12PM)</SelectItem>
                      <SelectItem value="Afternoon (12PM-6PM)">Afternoon (12PM-6PM)</SelectItem>
                      <SelectItem value="Evening (6PM-12AM)">Evening (6PM-12AM)</SelectItem>
                      <SelectItem value="All Day">All Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Price Range (ETH/kWh): {priceRange[0].toFixed(3)} - {priceRange[1].toFixed(3)}</Label>
                  <Slider
                    min={0.03}
                    max={0.05}
                    step={0.001}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="mt-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listing Cards */}
          {filteredListings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing, idx) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all border-2 hover:border-green-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{listing.society}</h3>
                        </div>
                        {listing.verified && (
                          <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Sun className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">Available Energy</span>
                          </div>
                          <span className="font-bold text-green-600">{listing.available} kWh</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Zap className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">Price per kWh</span>
                          </div>
                          <span className="font-bold text-gray-900">{listing.price.toFixed(4)} ETH</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">Time Slot</span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{listing.timeSlot}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min((listing.available / 100) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{listing.available} kWh</span>
                      </div>

                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleBuyEnergy(listing)}
                      >
                        Buy Energy
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No listings match your current filters.
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Energy Available</h3>
            <p className="text-gray-500">
              Your society ({user?.societyName}) has no surplus energy listed right now.
              Check back later.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Purchase Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Energy Purchase</DialogTitle>
          </DialogHeader>

          {selectedListing && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Society</span>
                  <span className="font-medium">{selectedListing.society}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Energy</span>
                  <span className="font-medium text-green-600">{selectedListing.available} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per kWh</span>
                  <span className="font-medium">{selectedListing.price.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Slot</span>
                  <span className="font-medium">{selectedListing.timeSlot}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Energy Amount (kWh)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2"
                  max={selectedListing.available}
                  min="1"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Price</span>
                  <span className="text-2xl font-bold text-green-600">
                    {(parseFloat(amount || "0") * selectedListing.price).toFixed(4)} ETH
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 gap-2"
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Transaction...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Confirm with MetaMask
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                This will open MetaMask to confirm the transaction
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
