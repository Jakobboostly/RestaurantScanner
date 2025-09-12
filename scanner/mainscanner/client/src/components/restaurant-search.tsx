import { useState, useEffect } from "react";
import { Search, Star, MapPin, Clock, Users, DollarSign, Utensils, Zap, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { searchRestaurants } from "@/lib/api";
import { RestaurantSearchResult } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface RestaurantSearchProps {
  onRestaurantSelect: (restaurant: RestaurantSearchResult) => void;
}

export default function RestaurantSearch({ onRestaurantSelect }: RestaurantSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [hoveredRestaurant, setHoveredRestaurant] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: restaurants = [], isLoading, error } = useQuery({
    queryKey: ["/api/restaurants/search", debouncedQuery],
    queryFn: () => searchRestaurants(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  const getPriceLevel = (level?: number) => {
    if (!level) return { text: "$", color: "bg-gray-100 text-gray-600" };
    const levels = [
      { text: "$", color: "bg-green-100 text-green-700" },
      { text: "$$", color: "bg-yellow-100 text-yellow-700" },
      { text: "$$$", color: "bg-orange-100 text-orange-700" },
      { text: "$$$$", color: "bg-red-100 text-red-700" }
    ];
    return levels[level - 1] || levels[0];
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 4.0) return "text-green-500";
    if (score >= 3.5) return "text-yellow-600";
    if (score >= 3.0) return "text-orange-600";
    return "text-red-600";
  };


  // Handle restaurant selection - always start scan immediately now
  const handleStartScan = (restaurant: RestaurantSearchResult) => {
    onRestaurantSelect(restaurant);
  };


  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hero Search Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-4"
      >
        <div className="bg-gradient-to-br from-[#28008F] via-[#4a1fb8] to-[#6b46c1] rounded-2xl p-4 md:p-6 shadow-2xl">
          <div className="text-center mb-3">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
              Find Your Restaurant
            </h2>
            <p className="text-purple-200 text-base">
              Get instant website analysis and competitor insights
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full max-w-2xl mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search restaurant name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 md:py-6 text-base md:text-lg border-0 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg focus:ring-4 focus:ring-white/30 focus:bg-white transition-all duration-300 text-center min-h-[48px]"
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 text-gray-400 transform -translate-y-1/2" />
                {isLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center mt-3 text-purple-200 text-base">
                <Zap className="h-4 w-4 mr-1" />
                No signup required • Get results in 30 seconds
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center text-red-700">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              Error: {error.message}
            </div>
          </motion.div>
        )}

        {restaurants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {restaurants.map((restaurant, index) => {
              const priceLevel = getPriceLevel(restaurant.priceLevel);
              return (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden ${
                    hoveredRestaurant === restaurant.id ? 'ring-2 ring-[#28008F] ring-opacity-50' : ''
                  }`}
                  onMouseEnter={() => setHoveredRestaurant(restaurant.id)}
                  onMouseLeave={() => setHoveredRestaurant(null)}
                >
                  <div className="p-3 md:p-6">
                    {/* Mobile Layout */}
                    <div className="block md:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={`https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60&q=80`}
                              alt={`${restaurant.name} restaurant`}
                              className="w-12 h-12 rounded-lg object-cover shadow-md"
                            />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Utensils className="h-2.5 w-2.5 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#28008F] transition-colors truncate">
                              {restaurant.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              {restaurant.rating && (
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 fill-current text-yellow-400 mr-1" />
                                  <span className={`text-sm font-semibold ${getScoreColor(restaurant.rating)}`}>
                                    {restaurant.rating}
                                  </span>
                                </div>
                              )}
                              <Badge className={`px-2 py-0.5 text-xs font-medium ${priceLevel.color}`}>
                                {priceLevel.text}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          className="bg-gradient-to-r from-[#28008F] to-[#4a1fb8] hover:from-[#1f0068] hover:to-[#28008F] text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-2 text-sm"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartScan(restaurant);
                          }}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Scan
                        </Button>
                      </div>
                      
                      <p className="text-gray-600 text-sm flex items-center truncate">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                        {restaurant.address}
                      </p>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={`https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80`}
                            alt={`${restaurant.name} restaurant`}
                            className="w-16 h-16 rounded-xl object-cover shadow-md"
                          />
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Utensils className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-[#28008F] transition-colors">
                              {restaurant.name}
                            </h3>
                            <Badge className={`px-2 py-1 text-xs font-medium ${priceLevel.color}`}>
                              {priceLevel.text}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 flex items-center mb-2">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            {restaurant.address}
                          </p>
                          
                          <div className="flex items-center space-x-4">
                            {restaurant.rating && (
                              <div className="flex items-center">
                                <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                                <span className={`font-semibold ${getScoreColor(restaurant.rating)}`}>
                                  {restaurant.rating}
                                </span>
                                {restaurant.totalRatings && (
                                  <span className="text-gray-500 text-sm ml-1">
                                    ({restaurant.totalRatings.toLocaleString()} reviews)
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center text-gray-500 text-sm">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Ready to analyze
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Button
                          className="bg-gradient-to-r from-[#28008F] to-[#4a1fb8] hover:from-[#1f0068] hover:to-[#28008F] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          size="lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartScan(restaurant);
                          }}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Start Scan
                        </Button>
                        
                        <div className="text-xs text-gray-500 text-right">
                          <Clock className="h-3 w-3 inline mr-1" />
                          ~30 seconds
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Effect Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#28008F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {debouncedQuery.length > 2 && !isLoading && restaurants.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
          <p className="text-gray-600">
            Try searching for a different restaurant name or location
          </p>
        </motion.div>
      )}

    </div>
  );
}