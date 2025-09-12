import { useState, useEffect } from "react";
import { Users, MapPin, Clock, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanActivity } from "@shared/schema";

interface ActivityItem {
  id: string;
  restaurantName: string;
  location: string;
  timeAgo: string;
  action: string;
}

export default function LiveActivityFeed() {
  const [currentActivities, setCurrentActivities] = useState<ActivityItem[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(247); // Default fallback
  const [loading, setLoading] = useState(true);

  console.log('LiveActivityFeed component mounted');

  // Fetch real activity data
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        console.log('Fetching activities from /api/activity/recent');
        const response = await fetch('/api/activity/recent');
        console.log('Response status:', response.status);
        const data: ScanActivity[] = await response.json();
        console.log('Received activities:', data);
        
        if (data && data.length > 0) {
          // Convert to ActivityItem format
          const activities: ActivityItem[] = data.map(activity => ({
            id: activity.id.toString(),
            restaurantName: activity.restaurantName,
            location: activity.location || "Location, State",
            timeAgo: activity.createdAt, // Backend already formats this
            action: activity.action
          }));
          
          console.log('Processed activities:', activities);
          setAllActivities(activities);
          setTotalCount(data.length); // Use actual count
        } else {
          // Fallback to sample data if no real data yet
          const sampleActivities: ActivityItem[] = [
            { id: "1", restaurantName: "Mario's Italian Kitchen", location: "San Francisco, CA", timeAgo: "2 minutes ago", action: "analyzed" },
            { id: "2", restaurantName: "The Coffee Bean", location: "Los Angeles, CA", timeAgo: "3 minutes ago", action: "analyzed" },
            { id: "3", restaurantName: "Burger Palace", location: "Austin, TX", timeAgo: "5 minutes ago", action: "analyzed" },
            { id: "4", restaurantName: "Thai Garden", location: "Seattle, WA", timeAgo: "7 minutes ago", action: "analyzed" },
            { id: "5", restaurantName: "Pizza Corner", location: "Chicago, IL", timeAgo: "8 minutes ago", action: "analyzed" },
            { id: "6", restaurantName: "Sushi Zen", location: "Miami, FL", timeAgo: "12 minutes ago", action: "analyzed" },
          ];
          setAllActivities(sampleActivities);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        // Use fallback sample data
        const sampleActivities: ActivityItem[] = [
          { id: "1", restaurantName: "Mario's Italian Kitchen", location: "San Francisco, CA", timeAgo: "2 minutes ago", action: "analyzed" },
          { id: "2", restaurantName: "The Coffee Bean", location: "Los Angeles, CA", timeAgo: "3 minutes ago", action: "analyzed" },
          { id: "3", restaurantName: "Burger Palace", location: "Austin, TX", timeAgo: "5 minutes ago", action: "analyzed" },
        ];
        console.log('Using fallback sample activities:', sampleActivities);
        setAllActivities(sampleActivities);
      }
      setLoading(false);
    };

    fetchActivities();
    
    // Refresh activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through activities for display
  useEffect(() => {
    if (allActivities.length === 0) return;

    const updateDisplayedActivities = () => {
      const nextActivities = [];
      for (let i = 0; i < Math.min(3, allActivities.length); i++) {
        const activityIndex = (currentIndex + i) % allActivities.length;
        nextActivities.push({
          ...allActivities[activityIndex],
          id: `${activityIndex}-${Date.now()}`
        });
      }
      setCurrentActivities(nextActivities);
    };

    updateDisplayedActivities();

    // Only rotate if we have more than 3 activities
    if (allActivities.length > 3) {
      const rotateInterval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allActivities.length);
      }, 4000);
      
      return () => clearInterval(rotateInterval);
    }
  }, [currentIndex, allActivities]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-8 max-w-4xl mx-auto"
    >
      <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span className="text-sm md:text-base font-semibold text-gray-700">
                See what restaurants are being analyzed right now
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Live</span>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {currentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between py-2 md:py-3 px-3 bg-white/60 rounded-lg border border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#28008F]/10 to-purple-500/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-[#28008F]">
                      {activity.restaurantName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 text-sm md:text-base">
                        {activity.restaurantName}
                      </span>
                      <span className="text-gray-600 text-xs md:text-sm">
                        was {activity.action}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500 text-sm">
                      <MapPin className="w-3 h-3" />
                      <span>{activity.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-gray-400 text-sm">
                  <Clock className="w-3 h-3" />
                  <span>{activity.timeAgo}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-center">
            <span className="text-base text-gray-600">
              <span className="font-semibold text-[#28008F]">{Math.max(totalCount, 247)}</span> restaurants analyzed recently
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}