import { useState, useEffect } from "react";
import { Search, Star, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { searchRestaurants } from "@/lib/api";
import { RestaurantSearchResult } from "@shared/schema";

interface RestaurantSearchProps {
  onRestaurantSelect: (restaurant: RestaurantSearchResult) => void;
}

export default function RestaurantSearch({ onRestaurantSelect }: RestaurantSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ["/api/restaurants/search", debouncedQuery],
    queryFn: () => searchRestaurants(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8">
        <div className="mb-6">
          <Label htmlFor="restaurant-search" className="block text-sm font-medium text-gray-700 mb-2">
            Search for your restaurant
          </Label>
          <div className="relative">
            <Input
              id="restaurant-search"
              type="text"
              placeholder="Enter restaurant name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#28008F] focus:border-transparent"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            {isLoading && (
              <div className="absolute right-3 top-3">
                <div className="w-5 h-5 border-2 border-[#28008F] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        {restaurants.length > 0 && (
          <div className="space-y-3 mb-6">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onRestaurantSelect(restaurant)}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={`https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`}
                    alt={`${restaurant.name} restaurant exterior`}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{restaurant.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {restaurant.address}
                    </div>
                    {restaurant.rating && (
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{restaurant.rating}</span>
                        </div>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {restaurant.totalRatings?.toLocaleString()} reviews
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button className="bg-[#28008F] hover:bg-[#28008F]/90 text-white">
                  Scan Website
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length > 2 && restaurants.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No restaurants found. Try a different search term.
          </div>
        )}

        <div className="text-center">
          <Button
            className="bg-[#28008F] hover:bg-[#28008F]/90 text-white px-8 py-3 font-medium"
            disabled={restaurants.length === 0}
          >
            Start Free Scan
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            No signup required • Get results in 30 seconds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
