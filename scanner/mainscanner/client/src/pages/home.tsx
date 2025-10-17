import { useState } from "react";
import { TrendingUp, Users, Award, Zap, ChefHat, Search, Target, Sparkles, BarChart3, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import RestaurantSearch from "@/components/restaurant-search";
import ScanningAnimation from "@/components/scanning-animation";
import EnhancedResultsDashboard from "@/components/enhanced-results-dashboard";
import { RevenueLossGate } from "@/components/revenue-loss-gate";
import { LeadCaptureModal, LeadData } from "@/components/lead-capture-modal";
import LiveActivityFeed from "@/components/live-activity-feed";
import { scanWebsite, getRestaurantDetails } from "@/lib/api";
import { RestaurantSearchResult, ScanResult } from "@shared/schema";

type ViewState = 'search' | 'scanning' | 'results';

export default function HomePage() {
  const [viewState, setViewState] = useState<ViewState>('search');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSearchResult | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [currentReview, setCurrentReview] = useState<{
    author: string;
    rating: number;
    text: string;
    platform: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  } | null>(null);
  const [businessPhotos, setBusinessPhotos] = useState<string[]>([]);
  const [showRevenueLossGate, setShowRevenueLossGate] = useState(false);
  const [isAdminFlow, setIsAdminFlow] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [isLeadCaptureSubmitting, setIsLeadCaptureSubmitting] = useState(false);
  const [pendingRestaurant, setPendingRestaurant] = useState<RestaurantSearchResult | null>(null);
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
          if (progress.review) {
            setCurrentReview(progress.review);
          }
          if (progress.businessPhotos) {
            setBusinessPhotos(progress.businessPhotos);
          }
        },
        restaurant.location?.lat,
        restaurant.location?.lng,
        false // forceRefresh - default to false to use cache
      );

      console.log('HomePage - setting scan result:', result);
      setScanResult(result);

      // Update status to show scan is complete
      setScanProgress(100);
      setScanStatus('Analysis complete! Preparing your results...');

      // Wait a moment for the scan animation to complete, then show lead capture
      setTimeout(() => {
        setPendingRestaurant(restaurant);
        setShowLeadCapture(true);
        // Don't set view state to results yet - wait for lead capture
      }, 2000); // Wait 2 seconds for scan animation to finish
      
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

  const handleLeadSubmit = async (leadData: LeadData) => {
    setIsLeadCaptureSubmitting(true);

    try {
      // Prepare HubSpot submission data
      const HUBSPOT_API_URL = 'https://api.hsforms.com/submissions/v3/integration/submit/3776858/d107313e-621e-4006-8993-db7f248d6cb3';

      const data = {
        fields: [
          { name: 'email', value: leadData.email },
          { name: 'firstname', value: leadData.name.split(' ')[0] || leadData.name },
          { name: 'lastname', value: leadData.name.split(' ').slice(1).join(' ') || '' },
          { name: 'phone', value: leadData.phone },
          { name: 'company', value: leadData.restaurantName },
          { name: 'lead_source', value: 'post_search_lead_gate' },
          { name: 'form_source', value: 'scanner_lead_capture' },
          { name: 'utm_source', value: 'lead_scanner' },
          { name: 'utm_medium', value: 'web_app' },
          { name: 'hubspot_owner_id', value: '75929557' },
        ]
      };

      const response = await fetch(HUBSPOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.status === 200) {
        // Lead captured successfully, close modal and show results
        setShowLeadCapture(false);
        console.log('HomePage - setting view state to results after lead capture');
        setViewState('results');
      } else {
        throw new Error('Failed to submit lead');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast({
        title: "Error",
        description: "Failed to submit information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLeadCaptureSubmitting(false);
    }
  };

  const handleAdminBypass = () => {
    // Admin bypass - close modal and show results without lead capture
    setShowLeadCapture(false);
    setViewState('results');
  };

  const handleAdminRevenueLossGate = () => {
    // Admin Revenue Loss Gate - for testing purposes
    setShowLeadCapture(false);
    setIsAdminFlow(true);
    setShowRevenueLossGate(true);
    setViewState('results');
  };

  const handleStartOver = () => {
    setViewState('search');
    setSelectedRestaurant(null);
    setScanResult(null);
    setScanProgress(0);
    setScanStatus('');
    setShowRevenueLossGate(false);
    setIsAdminFlow(false);
    setShowLeadCapture(false);
    setPendingRestaurant(null);
  };

  if (viewState === 'scanning' && selectedRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#F6F3FE]">
        <Navigation />
        <ScanningAnimation
          progress={scanProgress}
          status={scanStatus}
          restaurantName={selectedRestaurant.name}
          placeId={selectedRestaurant.placeId}
          businessPhotos={businessPhotos}
          currentReview={currentReview}
        />

        {/* Lead Capture Modal (shows after scan completes) */}
        <LeadCaptureModal
          isOpen={showLeadCapture}
          onClose={() => {
            setShowLeadCapture(false);
            setPendingRestaurant(null);
            // Go back to search if they close without submitting
            setViewState('search');
          }}
          onSubmit={handleLeadSubmit}
          onAdminBypass={handleAdminBypass}
          onAdminRevenueLossGate={handleAdminRevenueLossGate}
          restaurantName={selectedRestaurant.name}
          isSubmitting={isLeadCaptureSubmitting}
        />
      </div>
    );
  }



  console.log('HomePage render - viewState:', viewState, 'scanResult:', !!scanResult, 'selectedRestaurant:', !!selectedRestaurant);
  
  if (viewState === 'results' && scanResult && selectedRestaurant) {
    console.log('HomePage - rendering results view');
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <EnhancedResultsDashboard
          scanResult={scanResult}
          restaurantName={selectedRestaurant.name}
          placeId={selectedRestaurant.placeId}
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
                  <img 
                    src="/boostlylogo.png" 
                    alt="Boostly Logo" 
                    className="h-8 w-auto mr-3"
                  />
                  <span className="text-xl font-bold">Boostly Restaurant Health Scan</span>
                </div>
                <p className="text-gray-400 mb-6">
                  Helping restaurants improve their online presence and drive more customers through data-driven insights.
                </p>
                <div className="flex space-x-4">
                  <div className="flex items-center text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-base">All systems operational</span>
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
              <p className="text-gray-400 text-base">
                &copy; 2024 Boostly Restaurant Health Scan. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <span className="text-gray-400 text-base">Built with ❤️ for restaurants</span>
              </div>
            </div>
          </div>
        </footer>
        

        {/* Revenue Loss Gate - Admin Only (Updated for Render deployment) */}
        {showRevenueLossGate && scanResult && isAdminFlow && (
          <RevenueLossGate
            scanData={scanResult}
            placeId={selectedRestaurant?.placeId}
            onClose={() => {
              setShowRevenueLossGate(false);
              setIsAdminFlow(false);
            }}
            onContinue={() => {
              // Admin can optionally continue to regular results after viewing Revenue Loss Gate
              setShowRevenueLossGate(false);
              setIsAdminFlow(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <section className="relative bg-gradient-to-br from-[#F6F3FE] via-white to-[#F6F3FE] py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[#28008F]/5 pattern-dots"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#28008F]/10 to-purple-500/10 rounded-full mb-4 backdrop-blur-sm"
            >
              <div className="w-2 h-2 bg-[#28008F] rounded-full mr-3 animate-pulse"></div>
              <Zap className="w-4 h-4 text-[#28008F] mr-2" />
              <span className="text-base font-semibold text-[#28008F]">Free • No Signup • 30 Seconds</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight"
            >
              Restaurant
              <span className="bg-gradient-to-r from-[#28008F] to-purple-600 bg-clip-text text-transparent"> Health Scan</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 font-bold mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              See how your restaurant compares to local competitors.
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

          {/* Live Activity Feed */}
          <LiveActivityFeed />

          {/* Scan Preview Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 max-w-6xl mx-auto"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Here's What Your Scan Will Look Like
              </h3>
              <p className="text-lg text-gray-600">
                Get instant insights like these in 30 seconds
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Preview Header */}
              <div className="bg-gradient-to-r from-[#28008F] to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-lg">Your restaurant</h4>
                    <p className="text-purple-100 text-sm">City, State</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-white font-semibold">Score: 62/100</span>
                  </div>
                </div>
              </div>

              {/* Preview Content - Performance Scores */}
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-1">68</div>
                  <div className="text-sm text-gray-600">Performance</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">71</div>
                  <div className="text-sm text-gray-600">SEO Score</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-1">59</div>
                  <div className="text-sm text-gray-600">Mobile UX</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">4.2</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>

              {/* Preview - Key Insights */}
              <div className="px-6 pb-6">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-5">
                  <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#28008F]" />
                    Top Opportunities
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-gray-700 text-sm">You're not ranking for "best Italian restaurant near me" - 8,200 monthly searches</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-gray-700 text-sm">Your website loads 3.2x slower than top competitors</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-gray-700 text-sm">Missing 127 local citations compared to competitors</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <p className="text-center text-gray-600 text-sm">
                  <span className="font-semibold text-[#28008F]">Plus much more:</span> Keyword rankings, competitor analysis, review sentiment, and actionable recommendations
                </p>
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
              What We Analyze
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything that impacts your online success
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Performance</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Website speed analysis & optimization tips
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
                    Your search rankings vs competitors
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
                    Reviews, ratings & customer sentiment
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-[#28008F] to-purple-600 rounded-2xl p-8 md:p-12 shadow-2xl">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to See Your Restaurant's Health Score?
              </h3>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Let us walk you through it.
              </p>
              <Button
                size="lg"
                onClick={() => {
                  window.location.href = '/demo';
                }}
                className="bg-white text-[#28008F] hover:bg-gray-100 px-10 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Search className="w-5 h-5 mr-2" />
                Show Me My Results
              </Button>
            </div>
          </motion.div>
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
              Your Report Includes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Actionable insights to grow your business
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
                        Website, SEO, mobile & UX scores
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
                        Rankings for 10 key local searches
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
                        Side-by-side local competitor comparison
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
                        Prioritized fixes with impact scores
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
              <span className="text-white font-medium">Ready to Start</span>
            </div>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Ready to Get Started?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto"
          >
            Free analysis. No signup. 30 seconds.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="bg-white text-[#28008F] hover:bg-gray-100 px-10 py-4 font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              onClick={() => document.querySelector('#restaurant-search')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="w-5 h-5 mr-2" />
              Start Free Analysis
            </Button>

            <Button
              size="lg"
              className="border-2 border-white bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-[#28008F] px-10 py-4 font-semibold text-lg transition-all duration-300"
              onClick={() => window.location.href = '/demo'}
            >
              Schedule a Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => {
          setShowLeadCapture(false);
          setPendingRestaurant(null);
        }}
        onSubmit={handleLeadSubmit}
        onAdminBypass={handleAdminBypass}
        onAdminRevenueLossGate={handleAdminRevenueLossGate}
        restaurantName={pendingRestaurant?.name || ''}
        isSubmitting={isLeadCaptureSubmitting}
      />
    </div>
  );
}