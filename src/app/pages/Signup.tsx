import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { Zap, Loader2, Mail, Lock, User, Building2, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { uploadToIPFS, fetchFromIPFS } from "../blockchain/ipfs";
import {
  registerSociety,
  registerMember,
  getSocietyCount,
  getSociety,
  connectWallet as connectMetaMask,
} from "../blockchain/contracts";

export default function Signup() {
  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole]                       = useState<'member' | 'society'>('member');
  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [isLoading, setIsLoading]             = useState(false);

  // ─── BLOCKCHAIN SOCIETIES ───
  // Fetched from SocietyRegistry contract — real registered societies
  const [blockchainSocieties, setBlockchainSocieties] = useState<
    { id: number; name: string }[]
  >([]);
  const [loadingSocieties, setLoadingSocieties] = useState(false);

  // ─── STEP TRACKING ───
  // Shows user what is happening during blockchain registration
  const [currentStep, setCurrentStep] = useState("");

  const { signup } = useAuth();
  const { isConnected, walletAddress, connectWallet } = useWallet();
  const navigate = useNavigate();

  // ─── FETCH SOCIETIES FROM BLOCKCHAIN ───
  // When member tab is selected, load all registered societies from SocietyRegistry contract
  useEffect(() => {
    if (role === 'member') {
      loadSocietiesFromBlockchain();
    }
  }, [role]);

  const loadSocietiesFromBlockchain = async () => {
    setLoadingSocieties(true);
    try {
      // Get total count of registered societies from blockchain
      const count = await getSocietyCount();
      const total = Number(count);

      if (total === 0) {
        setBlockchainSocieties([]);
        return;
      }

      // Fetch each society by ID and get their name from IPFS
      const societies = [];
      for (let i = 1; i <= total; i++) {
        const society = await getSociety(i);

        // Fetch full details from IPFS using the stored hash
        const ipfsData = await fetchFromIPFS(society.ipfsHash);
        societies.push({ id: i, name: ipfsData.name });
      }

      setBlockchainSocieties(societies);
    } catch (err) {
      console.error("Failed to load societies:", err);
      toast.error("Could not load societies from blockchain");
    } finally {
      setLoadingSocieties(false);
    }
  };

  // ─── FORM SUBMIT ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (role === 'member' && !selectedSocietyId) {
      toast.error("Please select your society");
      return;
    }

    // ─── WALLET CHECK ───
    // User must have MetaMask connected to register on blockchain
    if (!isConnected || !walletAddress) {
      toast.error("Please connect your MetaMask wallet first", {
        description: "Your wallet is needed to register on the blockchain",
      });
      return;
    }

    setIsLoading(true);

    try {

      if (role === 'society') {

        // ─── SOCIETY REGISTRATION FLOW ───
        // Step 1: Upload society details to IPFS
        setCurrentStep("Uploading details to IPFS...");
        const ipfsHash = await uploadToIPFS({
          name,
          email,
          role: "society",
          registeredAt: new Date().toISOString(),
        });

        toast.info("Details uploaded to IPFS", { description: `Hash: ${ipfsHash.slice(0, 20)}...` });

        // Step 2: Register on blockchain — MetaMask popup will appear
        setCurrentStep("Registering on blockchain... Check MetaMask");
        await registerSociety(ipfsHash);

        toast.success("Society registered on blockchain!");

        // Step 3: Save to local auth context for UI
        await signup(name, email, password, 'society', undefined, name);

      } else {

        // ─── MEMBER REGISTRATION FLOW ───
        const societyIdNumber = parseInt(selectedSocietyId);
        const society = blockchainSocieties.find(s => s.id === societyIdNumber);

        // Step 1: Upload member details to IPFS
        setCurrentStep("Uploading details to IPFS...");
        const ipfsHash = await uploadToIPFS({
          name,
          email,
          role: "member",
          societyId: societyIdNumber,
          societyName: society?.name,
          registeredAt: new Date().toISOString(),
        });

        toast.info("Details uploaded to IPFS", { description: `Hash: ${ipfsHash.slice(0, 20)}...` });

        // Step 2: Register on blockchain — MetaMask popup will appear
        setCurrentStep("Registering on blockchain... Check MetaMask");
        await registerMember(ipfsHash, societyIdNumber);

        toast.success("Member registered on blockchain!");

        // Step 3: Save to local auth context for UI
        await signup(
          name,
          email,
          password,
          'member',
          selectedSocietyId,
          society?.name
        );
      }

      toast.success("Account created!", {
        description: "Welcome to EnerChain!",
      });

      navigate("/dashboard");

    } catch (err: any) {
      // User rejected MetaMask or something went wrong
      if (err?.code === 4001) {
        toast.error("Transaction rejected", {
          description: "You rejected the MetaMask transaction",
        });
      } else {
        toast.error("Registration failed", {
          description: err?.message || "Please try again",
        });
      }
    } finally {
      setIsLoading(false);
      setCurrentStep("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              EnerChain
            </span>
          </Link>
          <p className="text-gray-600">Join the decentralized energy revolution</p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Your Account</CardTitle>
          </CardHeader>
          <CardContent>

            {/* ─── WALLET CONNECTION BANNER ─── */}
            {/* Blockchain registration requires MetaMask to be connected */}
            {!isConnected ? (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="font-medium text-amber-800">Wallet Required</p>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  Connect MetaMask to register on the blockchain.
                </p>
                <Button
                  type="button"
                  onClick={connectWallet}
                  className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
                >
                  <Wallet className="w-4 h-4" />
                  Connect MetaMask
                </Button>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="text-sm text-green-700 font-medium">
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)} connected
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Account type toggle */}
              <div>
                <Label>Account Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setRole('member')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      role === 'member' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="font-medium text-sm">Member</p>
                    <p className="text-xs text-gray-500 mt-1">Buy energy from your society</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('society')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      role === 'society' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="w-6 h-6 mx-auto mb-2 text-teal-600" />
                    <p className="font-medium text-sm">Society</p>
                    <p className="text-xs text-gray-500 mt-1">Trade energy with other societies</p>
                  </button>
                </div>
              </div>

              {/* Society picker — only for members, loads from blockchain */}
              {role === 'member' && (
                <div>
                  <Label htmlFor="society">Your Society</Label>
                  {loadingSocieties ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 p-3 border rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading societies from blockchain...
                    </div>
                  ) : blockchainSocieties.length === 0 ? (
                    <div className="mt-2 p-3 bg-gray-50 border rounded-lg text-sm text-gray-600">
                      No societies registered yet. A society must register first before members can join.
                    </div>
                  ) : (
                    <>
                      <Select value={selectedSocietyId} onValueChange={setSelectedSocietyId}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select your society..." />
                        </SelectTrigger>
                        <SelectContent>
                          {blockchainSocieties.map(s => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        You can only purchase energy from your own society.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Current step indicator shown during blockchain registration */}
              {currentStep && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-700">{currentStep}</p>
                </div>
              )}

              <div className="flex items-start gap-2">
                <input type="checkbox" id="terms" className="mt-1 rounded" required />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{" "}
                  <a href="#" className="text-green-600 hover:text-green-700">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-green-600 hover:text-green-700">Privacy Policy</a>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                disabled={isLoading || !isConnected}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {currentStep || "Processing..."}
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
