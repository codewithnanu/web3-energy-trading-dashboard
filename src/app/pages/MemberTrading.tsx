import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { User, MapPin, Zap, TrendingUp, Plus, Star } from "lucide-react";
import { toast } from "sonner";

const memberListings = [
  { id: 1, name: "Alice Johnson", location: "Downtown District", available: 12.5, price: 0.043, rating: 4.9, trades: 45, verified: true },
  { id: 2, name: "Bob Smith", location: "Westside", available: 8.0, price: 0.040, rating: 4.7, trades: 32, verified: true },
  { id: 3, name: "Carol Williams", location: "North Park", available: 15.5, price: 0.045, rating: 4.8, trades: 58, verified: true },
  { id: 4, name: "David Brown", location: "East End", available: 10.2, price: 0.041, rating: 4.6, trades: 28, verified: false },
  { id: 5, name: "Emma Davis", location: "Central City", available: 18.5, price: 0.044, rating: 4.9, trades: 67, verified: true },
  { id: 6, name: "Frank Miller", location: "Southside", available: 6.8, price: 0.039, rating: 4.5, trades: 21, verified: true },
];

export default function MemberTrading() {
  const [formData, setFormData] = useState({
    energyAmount: "",
    pricePerUnit: "",
    availableFrom: "",
    availableTo: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleListEnergy = () => {
    toast.success("Energy Listed Successfully!", {
      description: `Listed ${formData.energyAmount} kWh at ${formData.pricePerUnit} ETH/kWh`,
    });
    setFormData({
      energyAmount: "",
      pricePerUnit: "",
      availableFrom: "",
      availableTo: "",
    });
  };

  const handleTrade = (member: typeof memberListings[0]) => {
    toast.success("Trade Initiated!", {
      description: `Initiated trade with ${member.name}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Member-to-Member Trading</h1>
        <p className="text-gray-600 mt-1">Trade energy directly with other community members</p>
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="sell">Sell Energy</TabsTrigger>
        </TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Active Members</p>
                <p className="text-3xl font-bold text-gray-900">156</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Available Energy</p>
                <p className="text-3xl font-bold text-green-600">71.5 kWh</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Avg. Price</p>
                <p className="text-3xl font-bold text-teal-600">0.042 ETH</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-1">Today's Trades</p>
                <p className="text-3xl font-bold text-blue-600">23</p>
              </CardContent>
            </Card>
          </div>

          {/* Member Listings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Available Member Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Energy Available</TableHead>
                      <TableHead>Price per kWh</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Trades</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberListings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white">
                                {listing.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{listing.name}</p>
                              {listing.verified && (
                                <span className="text-xs text-green-600">✓ Verified</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {listing.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-green-600">{listing.available} kWh</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{listing.price.toFixed(3)} ETH</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{listing.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-600">{listing.trades}</span>
                        </TableCell>
                        <TableCell>
                          {listing.verified ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleTrade(listing)}
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            Trade
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sell Energy Tab */}
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
                      placeholder="Enter amount in kWh"
                      value={formData.energyAmount}
                      onChange={(e) => handleInputChange("energyAmount", e.target.value)}
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
                      onChange={(e) => handleInputChange("pricePerUnit", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="availableFrom">Available From</Label>
                    <Input
                      id="availableFrom"
                      type="datetime-local"
                      value={formData.availableFrom}
                      onChange={(e) => handleInputChange("availableFrom", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="availableTo">Available To</Label>
                    <Input
                      id="availableTo"
                      type="datetime-local"
                      value={formData.availableTo}
                      onChange={(e) => handleInputChange("availableTo", e.target.value)}
                      className="mt-2"
                    />
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

                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 gap-2"
                  onClick={handleListEnergy}
                  disabled={!formData.energyAmount || !formData.pricePerUnit}
                >
                  <TrendingUp className="w-4 h-4" />
                  Confirm Listing
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Your Active Listings */}
          <Card>
            <CardHeader>
              <CardTitle>Your Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, amount: 12.5, price: 0.043, from: "2026-03-16 08:00", to: "2026-03-16 18:00", status: "Active" },
                  { id: 2, amount: 8.0, price: 0.041, from: "2026-03-17 06:00", to: "2026-03-17 12:00", status: "Active" },
                ].map((listing) => (
                  <div 
                    key={listing.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg text-gray-900">{listing.amount} kWh</p>
                        <p className="text-sm text-gray-600">
                          {listing.price.toFixed(3)} ETH/kWh • {listing.from} - {listing.to}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700">
                          {listing.status}
                        </Badge>
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
