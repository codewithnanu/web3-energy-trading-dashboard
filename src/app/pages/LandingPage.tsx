import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { WalletConnectButton } from "../components/WalletConnectButton";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "motion/react";
import { 
  Sun, 
  Zap, 
  ShoppingCart, 
  Shield, 
  TrendingUp, 
  Users,
  ChevronRight,
  Globe,
  Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useWallet } from "../contexts/WalletContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const handleGetStarted = () => {
    if (isConnected) {
      navigate('/dashboard');
    } else {
      // Scroll to connect section or show connect modal
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              EnerChain
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-green-600 transition">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-green-600 transition">How It Works</a>
            <a href="#benefits" className="text-gray-600 hover:text-green-600 transition">Benefits</a>
            <Link to="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-green-600">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                Sign Up
              </Button>
            </Link>
            <WalletConnectButton />
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Powered by Ethereum Blockchain</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
            EnerChain
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            Decentralized Energy Trading Platform
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Trade solar energy securely using blockchain technology. Join societies and their members in creating a sustainable energy future.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-lg px-8 py-6"
              onClick={handleGetStarted}
            >
              <Zap className="w-5 h-5" />
              Get Started
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              asChild
            >
              <Link to="/dashboard/marketplace">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Explore Energy Market
              </Link>
            </Button>
          </div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 relative"
          >
            <div className="bg-gradient-to-br from-green-500/10 via-teal-500/10 to-blue-500/10 rounded-2xl p-8 border border-green-200">
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
                  <Sun className="w-12 h-12 text-yellow-500 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">Solar Energy</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-teal-100">
                  <Zap className="w-12 h-12 text-green-500 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">Blockchain</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
                  <Globe className="w-12 h-12 text-blue-500 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">Global Network</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gradient-to-b from-white to-slate-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">How EnerChain Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to start trading energy</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sun className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">1. Generate Energy</h3>
                  <p className="text-gray-600">
                    Install solar panels and generate clean, renewable energy for your society
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">2. List Energy</h3>
                  <p className="text-gray-600">
                    List your excess energy on the blockchain marketplace with transparent pricing
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">3. Trade Energy</h3>
                  <p className="text-gray-600">
                    Buy and sell energy using ETH with secure, instant blockchain transactions
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Platform Benefits</h2>
            <p className="text-xl text-gray-600">Why choose EnerChain for energy trading</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border border-green-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Shield className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-gray-900">Blockchain Security</h3>
                <p className="text-gray-600">
                  All transactions are secured and verified on the Ethereum blockchain
                </p>
              </CardContent>
            </Card>

            <Card className="border border-teal-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <TrendingUp className="w-12 h-12 text-teal-600 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-gray-900">Transparent Pricing</h3>
                <p className="text-gray-600">
                  Real-time market prices with complete transparency in all transactions
                </p>
              </CardContent>
            </Card>

            <Card className="border border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-gray-900">Community-Driven</h3>
                <p className="text-gray-600">
                  Connect with societies and members to build a sustainable energy network
                </p>
              </CardContent>
            </Card>

            <Card className="border border-green-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Sun className="w-12 h-12 text-yellow-600 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-gray-900">Clean Energy</h3>
                <p className="text-gray-600">
                  Support renewable energy and reduce your carbon footprint
                </p>
              </CardContent>
            </Card>

            <Card className="border border-teal-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Zap className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-gray-900">Instant Transactions</h3>
                <p className="text-gray-600">
                  Fast and efficient energy trading with MetaMask integration
                </p>
              </CardContent>
            </Card>

            <Card className="border border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Globe className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-gray-900">Decentralized Network</h3>
                <p className="text-gray-600">
                  No central authority - peer-to-peer energy trading platform
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Start Trading Energy?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of users already trading clean energy on the blockchain
            </p>
            <WalletConnectButton />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">EnerChain</span>
              </div>
              <p className="text-gray-400">
                Decentralized energy trading powered by blockchain
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition">Dashboard</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Marketplace</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Analytics</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-green-400 transition">API</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition">About</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Careers</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 EnerChain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}