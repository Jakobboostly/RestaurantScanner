import { useState } from "react";
import { TrendingUp, Users, Award, Zap, ChefHat, Search, Target, Sparkles, BarChart3, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import RestaurantSearch from "@/components/restaurant-search";
import ScanningAnimation from "@/components/scanning-animation";
import ResultsDashboard from "@/components/results-dashboard";
import { scanWebsite, getRestaurantDetails } from "@/lib/api";
import { RestaurantSearchResult, ScanResult } from "@shared/schema";

type ViewState = 'search' | 'scanning' | 'results';

export default function HomePage() {
  const [viewState, setViewState] = useState<ViewState>('search');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSearchResult | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const { toast } = useToast();

  const handleRestaurantSelect = async (restaurant: RestaurantSearchResult) => {
    try {
      setSelectedRestaurant(restaurant);
      setViewState('scanning');
      setScanProgress(0);
      setScanStatus('Initializing scan...');

      let domain = restaurant.domain;
      
      if (!domain && restaurant.placeId) {
        const details = await getRestaurantDetails(restaurant.placeId);
        domain = details.website ? new URL(details.website).hostname : null;
      }

      if (!domain) {
        domain = `example-${restaurant.name.toLowerCase().replace(/\s+/g, '-')}.com`;
      }

      const result = await scanWebsite(
        domain,
        restaurant.name,
        restaurant.placeId,
        (progress) => {
          setScanProgress(progress.progress);
          setScanStatus(progress.status);
        }
      );

      setScanResult(result);
      setViewState('results');
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan website",
        variant: "destructive",
      });
      setViewState('search');
    }
  };

  const handleStartOver = () => {
    setViewState('search');
    setSelectedRestaurant(null);
    setScanResult(null);
    setScanProgress(0);
    setScanStatus('');
  };

  if (viewState === 'scanning' && selectedRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#F6F3FE]">
        <Navigation />
        <ScanningAnimation
          progress={scanProgress}
          status={scanStatus}
          restaurantName={selectedRestaurant.name}
        />
      </div>
    );
  }

  if (viewState === 'results' && scanResult && selectedRestaurant) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <ResultsDashboard
          scanResult={scanResult}
          restaurantName={selectedRestaurant.name}
        />
        
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#28008F] to-[#4a1fb8] py-20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm mb-4">
                <Sparkles className="w-4 h-4 text-white mr-2" />
                <span className="text-white font-medium">Ready to Improve?</span>
              </div>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-6"
            >
              Transform Your Restaurant's Online Presence
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto"
            >
              Get a custom action plan to fix these issues and drive more customers to your restaurant.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg"
                className="bg-white text-[#28008F] hover:bg-gray-100 px-8 py-4 font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Target className="w-5 h-5 mr-2" />
                Get Your Action Plan
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-[#28008F] px-8 py-4 font-semibold text-lg backdrop-blur-sm bg-white/10 transition-all duration-300"
                onClick={handleStartOver}
              >
                <Search className="w-5 h-5 mr-2" />
                Scan Another Restaurant
              </Button>
            </motion.div>
          </div>
        </motion.section>
        
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-[#28008F] rounded-lg mr-3">
                    <ChefHat className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">Restaurant Scanner</span>
                </div>
                <p className="text-gray-400 mb-6">
                  Helping restaurants improve their online presence and drive more customers through data-driven insights.
                </p>
                <div className="flex space-x-4">
                  <div className="flex items-center text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm">All systems operational</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-lg">Product</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Website Scanner</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">SEO Analysis</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Performance Audit</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Competitor Analysis</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-lg">Resources</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Best Practices</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-lg">Support</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                &copy; 2024 Restaurant Scanner. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <span className="text-gray-400 text-sm">Built with ❤️ for restaurants</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <section className="relative bg-gradient-to-br from-[#F6F3FE] via-white to-[#F6F3FE] py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[#28008F]/5 pattern-dots"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#28008F]/10 to-purple-500/10 rounded-full mb-8 backdrop-blur-sm"
            >
              <div className="w-2 h-2 bg-[#28008F] rounded-full mr-3 animate-pulse"></div>
              <Zap className="w-4 h-4 text-[#28008F] mr-2" />
              <span className="text-sm font-semibold text-[#28008F]">Free • No Signup Required • 30 Second Analysis</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight"
            >
              Restaurant Website
              <br />
              <span className="bg-gradient-to-r from-[#28008F] to-purple-600 bg-clip-text text-transparent">
                Performance Scanner
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              See why you're losing customers online. Get instant analysis of your restaurant's 
              website performance, SEO rankings, and customer experience.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            id="restaurant-search"
          >
            <RestaurantSearch onRestaurantSelect={handleRestaurantSelect} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#28008F]/10 rounded-lg">
                  <Users className="w-6 h-6 text-[#28008F]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">14,385</div>
                  <div className="text-sm text-gray-600">Restaurants Analyzed</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">47%</div>
                  <div className="text-sm text-gray-600">Average Traffic Increase</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">4.9/5</div>
                  <div className="text-sm text-gray-600">Customer Rating</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Complete Digital Health Check
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get comprehensive insights that help you compete and win more customers online
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="text-center p-8 h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Performance Analysis</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    See exactly how fast your website loads, what's slowing it down, and how to fix it for better customer experience.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="text-center p-8 h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">SEO & Rankings</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Discover why competitors rank higher in search results and get actionable steps to beat them.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-center p-8 h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Customer Experience</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Find out what's frustrating your customers and losing you business, with specific fixes to improve conversions.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What You'll Get
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive analysis that reveals exactly what's holding your restaurant back online
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-8 h-full border-0 shadow-lg">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-[#28008F]/10 rounded-xl">
                      <BarChart3 className="w-8 h-8 text-[#28008F]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Performance Scores</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Get your website's performance, SEO, mobile, and user experience scores with detailed breakdowns and priority issues.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-8 h-full border-0 shadow-lg">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Target className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Keyword Rankings</h3>
                      <p className="text-gray-600 leading-relaxed">
                        See how you rank for 10 key restaurant keywords and discover opportunities to improve your search visibility.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-8 h-full border-0 shadow-lg">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Competitor Analysis</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Compare your performance against local competitors and see exactly where you're falling behind.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-8 h-full border-0 shadow-lg">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Sparkles className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Action Plan</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Get prioritized recommendations with effort estimates and impact predictions to maximize your ROI.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#28008F] to-[#4a1fb8] py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm mb-4">
              <Globe className="w-4 h-4 text-white mr-2" />
              <span className="text-white font-medium">Start Your Analysis</span>
            </div>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Ready to See What's Holding You Back?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto"
          >
            Get your free comprehensive website analysis in under 30 seconds. No signup required.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              size="lg"
              className="bg-white text-[#28008F] hover:bg-gray-100 px-10 py-4 font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              onClick={() => document.querySelector('#restaurant-search')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="w-5 h-5 mr-2" />
              Start Free Analysis
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}