import { useState, useEffect } from "react";
import { TrendingUp, Users, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
      
      // Get restaurant details if no domain provided
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
      <div className="min-h-screen bg-gray-50">
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
        
        {/* CTA Section */}
        <section className="bg-[#28008F] py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Fix These Issues?</h2>
            <p className="text-lg text-purple-100 mb-8">
              Get a custom action plan to improve your restaurant's online presence and drive more customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-[#28008F] hover:bg-gray-100 px-8 py-3 font-medium">
                Get Your Action Plan
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-[#28008F] px-8 py-3 font-medium"
                onClick={handleStartOver}
              >
                Scan Another Restaurant
              </Button>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <img 
                    src="/attached_assets/Screenshot 2025-07-07 at 4.07.02 PM_1751926038267.png" 
                    alt="Boostly Logo" 
                    className="h-8 w-auto mr-3"
                  />
                  <span className="text-xl font-bold">Restaurant Scanner</span>
                </div>
                <p className="text-gray-400">
                  Helping restaurants improve their online presence and drive more customers.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-4">Product</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Website Scanner</a></li>
                  <li><a href="#" className="hover:text-white">SEO Analysis</a></li>
                  <li><a href="#" className="hover:text-white">Performance Audit</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-4">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">About</a></li>
                  <li><a href="#" className="hover:text-white">Blog</a></li>
                  <li><a href="#" className="hover:text-white">Careers</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-4">Support</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Contact</a></li>
                  <li><a href="#" className="hover:text-white">Privacy</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Restaurant Scanner. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#F6F3FE] to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-[#28008F]/10 rounded-full mb-6">
              <Zap className="w-4 h-4 text-[#28008F] mr-2" />
              <span className="text-sm font-semibold text-[#28008F]">Free Instant Analysis</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Free Restaurant Website Scanner
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              See why you're losing customers online. Get instant analysis of your restaurant's 
              website performance, SEO, and customer experience.
            </p>
          </div>

          <RestaurantSearch onRestaurantSelect={handleRestaurantSelect} />

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-600">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-[#28008F] mr-2" />
              <span className="font-semibold">14,385</span>
              <span className="ml-1">Restaurants Analyzed</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-[#28008F] mr-2" />
              <span className="font-semibold">47%</span>
              <span className="ml-1">Average Traffic Increase</span>
            </div>
            <div className="flex items-center">
              <Award className="w-5 h-5 text-[#28008F] mr-2" />
              <span className="font-semibold">4.9/5</span>
              <span className="ml-1">Customer Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Website Analysis
            </h2>
            <p className="text-xl text-gray-600">
              Get insights that help you compete and win more customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#28008F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-[#28008F]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Analysis</h3>
              <p className="text-gray-600">
                See exactly how fast your website loads and what's slowing it down
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#28008F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-[#28008F]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">SEO & Rankings</h3>
              <p className="text-gray-600">
                Discover why competitors rank higher and how to beat them
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#28008F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#28008F]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Experience</h3>
              <p className="text-gray-600">
                Find out what's frustrating customers and losing you business
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#28008F] py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to See What's Holding You Back?
          </h2>
          <p className="text-lg text-purple-100 mb-8">
            Get your free website analysis in under 30 seconds. No signup required.
          </p>
          <Button 
            className="bg-white text-[#28008F] hover:bg-gray-100 px-8 py-3 font-medium"
            onClick={() => document.querySelector('#restaurant-search')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Start Free Analysis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/attached_assets/Screenshot 2025-07-07 at 4.07.02 PM_1751926038267.png" 
                  alt="Boostly Logo" 
                  className="h-8 w-auto mr-3"
                />
                <span className="text-xl font-bold">Restaurant Scanner</span>
              </div>
              <p className="text-gray-400">
                Helping restaurants improve their online presence and drive more customers.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Website Scanner</a></li>
                <li><a href="#" className="hover:text-white">SEO Analysis</a></li>
                <li><a href="#" className="hover:text-white">Performance Audit</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Restaurant Scanner. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
