import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Building2, Zap, TrendingUp, Plus, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";
import { useWallet } from "../contexts/WalletContext";
import { uploadToIPFS, fetchFromIPFS } from "../blockchain/ipfs";
import {
  getSocietyIdByAddress,
  getSociety,
  getActiveListingsForSocieties,
  getSocietyListingIds,
  getListing,
  createListing,
  cancelListing,
  societyBuyEnergy,
} from "../blockchain/contracts";

export default function SocietyTrading() {
  const { walletAddress, isConnected } = useWallet();

  const [mySocietyId, setMySocietyId]               = useState(0);
  const [mySocietyName, setMySocietyName]             = useState("");
  const [marketplaceListings, setMarketplaceListings] = useState<any[]>([]);
  const [myListings, setMyListings]                   = useState<any[]>([]);
  const [isLoading, setIsLoading]                     = useState(true);
  const [isCreating, setIsCreating]                   = useState(false);
  const [isBuying, setIsBuying]                       = useState(false);
  const [isCancelling, setIsCancelling]               = useState<number | null>(null);
  const [selectedListing, setSelectedListing]         = useState<any>(null);
  const [buyModalOpen, setBuyModalOpen]               = useState(false);
  const [buyAmount, setBuyAmount]                     = useState("10");
  const [currentStep, setCurrentStep]                 = useState("");
  const [formData, setFormData]                       = useState({
    energyAmount:   "",
    pricePerUnit:   "",
    timeSlot:       "Morning (6AM-12PM)",
    listingTypeStr: "for_societies",
  });

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadData();
    }
  }, [isConnected, walletAddress]);

  // ─── LOAD ALL DATA ───
  // Gets society info, marketplace listings and our own listings from blockchain
  const loadData = async () => {
    setIsLoading(true);
    try {
      const societyIdBN = await getSocietyIdByAddress(walletAddress!);
      const sId = Number(societyIdBN);
      setMySocietyId(sId);

      // Get name from IPFS using the hash stored on blockchain
      const societyData = await getSociety(sId);
      const ipfsData = await fetchFromIPFS(societyData.ipfsHash);
      setMySocietyName(ipfsData.name);

      // Load both sections in parallel
      await Promise.all([
        loadMarketplace(sId),
        loadMyListings(sId),
      ]);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load data", { description: err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── MARKETPLACE ───
  // Loads FOR_SOCIETIES listings from all OTHER societies (not our own)
  const loadMarketplace = async (mySocId: number) => {
    const listings = await getActiveListingsForSocieties();

    // For each listing, fetch IPFS to get societyName and timeSlot
    const enriched = await Promise.all(listings.map(async (l: any) => {
      let societyName = `Society #${Number(l.societyId)}`;
      let timeSlot    = "N/A";
      try {
        const ipfs = await fetchFromIPFS(l.ipfsHash);
        societyName  = ipfs.societyName || societyName;
        timeSlot     = ipfs.timeSlot    || timeSlot;
      } catch {}
      return {
        id:             Number(l.id),
        societyId:      Number(l.societyId),
        availableKwh:   Number(l.availableKwh),
        pricePerKwhWei: l.pricePerKwh,
        pricePerKwhEth: parseFloat(ethers.formatEther(l.pricePerKwh)),
        societyName,
        timeSlot,
      };
    }));

    // Hide our own listings from the marketplace — can't buy from yourself
    setMarketplaceListings(enriched.filter(l => l.societyId !== mySocId));
  };

  // ─── MY LISTINGS ───
  // Loads all active listings we have created (both FOR_MEMBERS and FOR_SOCIETIES)
  const loadMyListings = async (mySocId: number) => {
    const ids = await getSocietyListingIds(mySocId);
    if (ids.length === 0) {
      setMyListings([]);
      return;
    }

    const listings = await Promise.all(ids.map(async (id: any) => {
      const l = await getListing(Number(id));
      let timeSlot = "N/A";
      try {
        const ipfs = await fetchFromIPFS(l.ipfsHash);
        timeSlot = ipfs.timeSlot || timeSlot;
      } catch {}
      return {
        id:            Number(l.id),
        availableKwh:  Number(l.availableKwh),
        pricePerKwhEth: parseFloat(ethers.formatEther(l.pricePerKwh)),
        listingType:   Number(l.listingType),
        isActive:      l.isActive,
        timeSlot,
        createdAt:     new Date(Number(l.createdAt) * 1000).toLocaleString(),
      };
    }));

    setMyListings(listings.filter(l => l.isActive));
  };

  // ─── CREATE LISTING ───
  // Uploads details to IPFS then creates listing on blockchain
  const handleCreateListing = async () => {
    if (!formData.energyAmount || !formData.pricePerUnit) return;
    setIsCreating(true);
    try {
      setCurrentStep("Uploading listing details to IPFS...");
      const ipfsHash = await uploadToIPFS({
        societyName: mySocietyName,
        timeSlot:    formData.timeSlot,
        createdAt:   new Date().toISOString(),
      });

      // listingType: 0 = FOR_MEMBERS, 1 = FOR_SOCIETIES
      const listingTypeNum = formData.listingTypeStr === "for_societies" ? 1 : 0;

      setCurrentStep("Creating listing on blockchain... Check MetaMask");
      await createListing(
        parseInt(formData.energyAmount),
        formData.pricePerUnit,
        ipfsHash,
        listingTypeNum
      );

      toast.success("Energy listed successfully!");
      setFormData({ energyAmount: "", pricePerUnit: "", timeSlot: "Morning (6AM-12PM)", listingTypeStr: "for_societies" });
      await loadMyListings(mySocietyId);

    } catch (err: any) {
      if (err?.code === 4001) {
        toast.error("Transaction rejected");
      } else {
        toast.error("Failed to create listing", { description: err?.message });
      }
    } finally {
      setIsCreating(false);
      setCurrentStep("");
    }
  };

  // ─── BUY ENERGY ───
  // Sends ETH to the selling society via the EnergyTrade contract
  const handleBuy = async () => {
    if (!selectedListing) return;
    const kWh = parseInt(buyAmount);
    if (!kWh || kWh <= 0 || kWh > selectedListing.availableKwh) {
      toast.error("Invalid amount");
      return;
    }
    setIsBuying(true);
    try {
      setCurrentStep("Sending ETH... Check MetaMask");
      // Pass the raw Wei price — no floating point conversion needed
      await societyBuyEnergy(selectedListing.id, kWh, selectedListing.pricePerKwhWei);
      toast.success("Energy purchased!", {
        description: `Bought ${kWh} kWh from ${selectedListing.societyName}`,
      });
      setBuyModalOpen(false);
      await loadMarketplace(mySocietyId);

    } catch (err: any) {
      if (err?.code === 4001) {
        toast.error("Transaction rejected");
      } else {
        toast.error("Purchase failed", { description: err?.message });
      }
    } finally {
      setIsBuying(false);
      setCurrentStep("");
    }
  };

  // ─── CANCEL LISTING ───
  const handleCancelListing = async (listingId: number) => {
    setIsCancelling(listingId);
    try {
      await cancelListing(listingId);
      toast.success("Listing cancelled");
      await loadMyListings(mySocietyId);
    } catch (err: any) {
      if (err?.code === 4001) {
        toast.error("Transaction rejected");
      } else {
        toast.error("Failed to cancel listing", { description: err?.message });
      }
    } finally {
      setIsCancelling(null);
    }
  };

  const totalAvailableKwh = marketplaceListings.reduce((s, l) => s + l.availableKwh, 0);
  const avgPrice = marketplaceListings.length > 0
    ? marketplaceListings.reduce((s, l) => s + l.pricePerKwhEth, 0) / marketplaceListings.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-3 text-gray-600">Loading blockchain data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Society-to-Society Trading</h1>
        <p className="text-gray-600 mt-1">Trade energy with other societies on the blockchain</p>
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="sell">Sell Energy</TabsTrigger>
        </TabsList>

        {/* ─── MARKETPLACE TAB ─── */}
        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Active Listings</p>
                <p className="text-3xl font-bold text-gray-900">{marketplaceListings.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Available Energy</p>
                <p className="text-3xl font-bold text-green-600">{totalAvailableKwh} kWh</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Avg. Price</p>
                <p className="text-3xl font-bold text-teal-600">
                  {avgPrice > 0 ? `${avgPrice.toFixed(4)} ETH/kWh` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {marketplaceListings.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Listings Available</h3>
                <p className="text-gray-500">
                  No other societies have listed energy for trading yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Available Society Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Society</TableHead>
                        <TableHead>Energy Available</TableHead>
                        <TableHead>Price per kWh</TableHead>
                        <TableHead>Time Slot</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketplaceListings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-medium">{listing.societyName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">{listing.availableKwh} kWh</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{listing.pricePerKwhEth.toFixed(4)} ETH</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{listing.timeSlot}</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedListing(listing);
                                setBuyAmount("10");
                                setBuyModalOpen(true);
                              }}
                            >
                              <Zap className="w-4 h-4 mr-1" />
                              Buy
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── SELL ENERGY TAB ─── */}
        <TabsContent value="sell" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                List Energy for Sale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="energyAmount">Energy Amount (kWh)</Label>
                    <Input
                      id="energyAmount"
                      type="number"
                      min="1"
                      placeholder="Enter amount in kWh"
                      value={formData.energyAmount}
                      onChange={(e) => setFormData(p => ({ ...p, energyAmount: e.target.value }))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pricePerUnit">Price per kWh (ETH)</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      step="0.001"
                      placeholder="0.042"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData(p => ({ ...p, pricePerUnit: e.target.value }))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Time Slot</Label>
                    <Select value={formData.timeSlot} onValueChange={(v) => setFormData(p => ({ ...p, timeSlot: v }))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning (6AM-12PM)">Morning (6AM-12PM)</SelectItem>
                        <SelectItem value="Afternoon (12PM-6PM)">Afternoon (12PM-6PM)</SelectItem>
                        <SelectItem value="Evening (6PM-12AM)">Evening (6PM-12AM)</SelectItem>
                        <SelectItem value="All Day">All Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Listing Type</Label>
                    <Select value={formData.listingTypeStr} onValueChange={(v) => setFormData(p => ({ ...p, listingTypeStr: v }))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="for_members">For My Members</SelectItem>
                        <SelectItem value="for_societies">For Other Societies</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.listingTypeStr === "for_members"
                        ? "Only your society's members can buy this"
                        : "Only other registered societies can buy this"}
                    </p>
                  </div>
                </div>

                {formData.energyAmount && formData.pricePerUnit && (
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">Total Value</span>
                      <span className="text-2xl font-bold text-green-600">
                        {(parseFloat(formData.energyAmount) * parseFloat(formData.pricePerUnit)).toFixed(4)} ETH
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Energy to List</span>
                      <span>{formData.energyAmount} kWh</span>
                    </div>
                  </div>
                )}

                {currentStep && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <p className="text-sm text-blue-700">{currentStep}</p>
                  </div>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 gap-2"
                  onClick={handleCreateListing}
                  disabled={isCreating || !formData.energyAmount || !formData.pricePerUnit}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {currentStep || "Processing..."}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Confirm Listing
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Listings */}
          <Card>
            <CardHeader>
              <CardTitle>Your Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              {myListings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  You have no active listings. Create one above.
                </p>
              ) : (
                <div className="space-y-4">
                  {myListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg text-gray-900">{listing.availableKwh} kWh</p>
                          <p className="text-sm text-gray-600">
                            {listing.pricePerKwhEth.toFixed(4)} ETH/kWh • {listing.timeSlot}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{listing.createdAt}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={listing.listingType === 0 ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}>
                            {listing.listingType === 0 ? "For Members" : "For Societies"}
                          </Badge>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={isCancelling === listing.id}
                            onClick={() => handleCancelListing(listing.id)}
                          >
                            {isCancelling === listing.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── BUY MODAL ─── */}
      <Dialog open={buyModalOpen} onOpenChange={setBuyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buy Energy from {selectedListing?.societyName}</DialogTitle>
          </DialogHeader>

          {selectedListing && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Energy</span>
                  <span className="font-medium text-green-600">{selectedListing.availableKwh} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per kWh</span>
                  <span className="font-medium">{selectedListing.pricePerKwhEth.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Slot</span>
                  <span className="font-medium">{selectedListing.timeSlot}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="buyAmount">Energy Amount (kWh)</Label>
                <Input
                  id="buyAmount"
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  className="mt-2"
                  min="1"
                  max={selectedListing.availableKwh}
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Cost</span>
                  <span className="text-2xl font-bold text-green-600">
                    {(parseFloat(buyAmount || "0") * selectedListing.pricePerKwhEth).toFixed(4)} ETH
                  </span>
                </div>
              </div>

              {currentStep && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-700">{currentStep}</p>
                </div>
              )}

              <Button
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 gap-2"
                onClick={handleBuy}
                disabled={isBuying}
              >
                {isBuying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Confirm with MetaMask
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
