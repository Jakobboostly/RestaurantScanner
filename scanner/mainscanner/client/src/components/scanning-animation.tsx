import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, TrendingUp, Users, Smartphone, Globe, BarChart3, Star, MessageCircle, MapPin, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface ScanningAnimationProps {
  progress: number;
  status: string;
  restaurantName: string;
  placeId?: string;
  businessPhotos?: string[];
  currentReview?: {
    author: string;
    rating: number;
    text: string;
    platform: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  } | null;
}

interface FunFact {
  id: number;
  text: string;
  type: 'city' | 'restaurant';
}

export default function ScanningAnimation({ progress, status, restaurantName, placeId, businessPhotos = [], currentReview }: ScanningAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; color: string }>>([]);
  const [scanBeams, setScanBeams] = useState<Array<{ id: number; delay: number }>>([]);
  const [dataStreams, setDataStreams] = useState<Array<{ id: number; delay: number; direction: 'left' | 'right' }>>([]);
  const [funFacts, setFunFacts] = useState<FunFact[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [showFunFact, setShowFunFact] = useState(false);
  const [factPosition, setFactPosition] = useState({ side: 'right', top: '50%' });
  const [cityName, setCityName] = useState<string>('Local Area');
  const [actualCityName, setActualCityName] = useState<string>('Local Area');
  const [actualRestaurantName, setActualRestaurantName] = useState<string>('This Restaurant');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showPhoto, setShowPhoto] = useState(false);

  // Map progress percentages to detailed sub-tasks
  const getDetailedStatus = (stepIndex: number, currentProgress: number, mainStatus: string) => {
    // Step 1: Collecting business data (0-25%)
    if (stepIndex === 0) {
      if (currentProgress < 8) return "Initializing scan...";
      if (currentProgress < 12) return "Searching Google Maps...";
      if (currentProgress < 18) return "Loading business details...";
      if (currentProgress < 25) return "Fetching business photos...";
      return "Business data collected";
    }
    // Step 2: Analyzing online presence (25-50%)
    if (stepIndex === 1) {
      if (currentProgress < 30) return "Finding website...";
      if (currentProgress < 35) return "Scanning social media...";
      if (currentProgress < 42) return "Analyzing competitors...";
      if (currentProgress < 50) return "Checking online profiles...";
      return "Online presence analyzed";
    }
    // Step 3: Measuring local visibility (50-75%)
    if (stepIndex === 2) {
      if (currentProgress < 58) return "Finding top keywords...";
      if (currentProgress < 65) return "Checking local rankings...";
      if (currentProgress < 70) return "Measuring search visibility...";
      if (currentProgress < 75) return "Analyzing local competition...";
      return "Visibility measured";
    }
    // Step 4: Generating recommendations (75-100%)
    if (stepIndex === 3) {
      if (currentProgress < 80) return "Reading customer reviews...";
      if (currentProgress < 85) return "Analyzing sentiment...";
      if (currentProgress < 92) return "Building growth strategy...";
      if (currentProgress < 100) return "Finalizing recommendations...";
      return "Analysis complete";
    }
    return "Processing...";
  };

  const steps = [
    { 
      icon: Search, 
      label: "Collecting business data", 
      threshold: 0,
      endThreshold: 25,
      color: "from-blue-500 to-cyan-500", 
      shadowColor: "shadow-blue-500/20",
      subTasks: [
        { progress: 8, label: "Searching Google Maps" },
        { progress: 12, label: "Loading business details" },
        { progress: 18, label: "Fetching photos" },
        { progress: 25, label: "Collecting contact info" }
      ]
    },
    { 
      icon: Zap, 
      label: "Analyzing online presence", 
      threshold: 25,
      endThreshold: 50,
      color: "from-yellow-500 to-orange-500", 
      shadowColor: "shadow-yellow-500/20",
      subTasks: [
        { progress: 30, label: "Finding website" },
        { progress: 35, label: "Scanning social media" },
        { progress: 42, label: "Analyzing competitors" },
        { progress: 50, label: "Checking profiles" }
      ]
    },
    { 
      icon: TrendingUp, 
      label: "Measuring local visibility", 
      threshold: 50,
      endThreshold: 75,
      color: "from-green-500 to-emerald-500", 
      shadowColor: "shadow-green-500/20",
      subTasks: [
        { progress: 58, label: "Finding keywords" },
        { progress: 65, label: "Checking rankings" },
        { progress: 70, label: "Measuring visibility" },
        { progress: 75, label: "Analyzing competition" }
      ]
    },
    { 
      icon: Globe, 
      label: "Generating recommendations", 
      threshold: 75,
      endThreshold: 100,
      color: "from-indigo-500 to-blue-500", 
      shadowColor: "shadow-indigo-500/20",
      subTasks: [
        { progress: 80, label: "Reading reviews" },
        { progress: 85, label: "Analyzing sentiment" },
        { progress: 92, label: "Building strategy" },
        { progress: 100, label: "Finalizing insights" }
      ]
    },
  ];

  // Fetch fun facts and business photos when component mounts
  useEffect(() => {
    const fetchFunFacts = async () => {
      try {
        // If we have a placeId, let the API fetch the real city name from Google Places
        // Otherwise, try to extract city from restaurant name as fallback
        let city = 'Local Area';
        if (!placeId) {
          const cityMatch = restaurantName.match(/\b(New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Washington|Boston|Nashville|Baltimore|Louisville|Portland|Oklahoma City|Memphis|Las Vegas|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Mesa|Kansas City|Atlanta|Long Beach|Colorado Springs|Raleigh|Miami|Virginia Beach|Omaha|Oakland|Minneapolis|Tulsa|Arlington|Tampa|New Orleans|Wichita|Cleveland|Bakersfield|Aurora|Anaheim|Honolulu|Santa Ana|Riverside|Corpus Christi|Lexington|Stockton|Henderson|Saint Paul|St. Louis|Cincinnati|Pittsburgh|Greensboro|Anchorage|Plano|Lincoln|Orlando|Irvine|Newark|Toledo|Durham|Chula Vista|Fort Wayne|Jersey City|St. Petersburg|Laredo|Madison|Chandler|Buffalo|Lubbock|Scottsdale|Reno|Glendale|Gilbert|Winston-Salem|North Las Vegas|Norfolk|Chesapeake|Garland|Irving|Hialeah|Fremont|Boise|Richmond|Baton Rouge|Spokane|Des Moines|Modesto|Fayetteville|Tacoma|Oxnard|Fontana|Columbus|Montgomery|Moreno Valley|Shreveport|Aurora|Yonkers|Akron|Huntington Beach|Little Rock|Augusta|Amarillo|Glendale|Mobile|Grand Rapids|Salt Lake City|Tallahassee|Huntsville|Grand Prairie|Knoxville|Worcester|Newport News|Brownsville|Overland Park|Santa Clarita|Providence|Garden Grove|Chattanooga|Oceanside|Jackson|Fort Lauderdale|Santa Rosa|Rancho Cucamonga|Port St. Lucie|Tempe|Ontario|Vancouver|Cape Coral|Sioux Falls|Springfield|Peoria|Pembroke Pines|Elk Grove|Salem|Lancaster|Corona|Eugene|Palmdale|Salinas|Springfield|Pasadena|Fort Collins|Hayward|Pomona|Cary|Rockford|Alexandria|Escondido|McKinney|Kansas City|Joliet|Sunnyvale|Torrance|Bridgeport|Lakewood|Hollywood|Paterson|Naperville|Syracuse|Mesquite|Dayton|Savannah|Clarksville|Orange|Pasadena|Fullerton|Killeen|Frisco|Hampton|McAllen|Warren|Bellevue|West Valley City|Columbia|Olathe|Sterling Heights|New Haven|Miramar|Waco|Thousand Oaks|Cedar Rapids|Charleston|Visalia|Topeka|Elizabeth|Gainesville|Thornton|Roseville|Carrollton|Coral Springs|Stamford|Simi Valley|Concord|Hartford|Kent|Lafayette|Midland|Surprise|Denton|Victorville|Evansville|Santa Clara|Abilene|Athens|Vallejo|Allentown|Norman|Beaumont|Independence|Murfreesboro|Ann Arbor|Fargo|Wilmington|Provo|Syracuse|Miami Gardens|Clearwater|Reading|Westminster|Yonkers|Pearland|Richardson|Broken Arrow|Richmond|League City|Lakeland|Solon|Odessa|High Point|Greeley|Inglewood|Lowell|Elgin|Miami Beach|Waterbury|Downey|Pompano Beach|Miami Gardens|Largo|Sandy Springs|Hillsboro|Arvada|Pueblo|Sandy|West Jordan|Inglewood|Centennial|Gresham|Fairfield|Billings|Lowell|San Mateo|Norwalk|Danbury|Toms River|Yakima|Westminster|Livermore|Daly City|Bloomington|Merced|Redding|Bethlehem|Duluth|Clifton|Levittown|Nashua|Albany|Longmont|Trenton|Wichita Falls|Green Bay|San Angelo|Huntington|Appleton|Hoover|Laredo|Roanoke|Spokane Valley|Davenport|Joliet|Burbank|Denton|Wyoming|Lakeland|Tuscaloosa|Chico|Edinburg|Cranston|Parma|New Bedford|Quincy|Brockton|Warwick|Broken Arrow|Rialto|Beaverton|Compton|Bloomington|Carson|Renton|Tracy|Whittier|Lacey|Clovis|Woodbridge|Cicero|Gary|Lawrence|Hamilton|Roswell|Scranton|Evanston|Springfield|Palmdale|Peoria|Antioch|Richmond|Everett|West Palm Beach|Provo|Ventura|Norwalk|Arvada|Inglewood|Lansing|Ann Arbor|Flint|Cedar Falls|Janesville|Napa|Redwood City|Chico|Danbury|Eau Claire|Appleton|Racine|Kalamazoo|St. Cloud|Bloomington|Billings|Missoula|Bismarck|Casper|Cheyenne|Pueblo|Fort Collins|Boulder|Lakewood|Thornton|Westminster|Arvada|Centennial|Colorado Springs|Aurora|Denver|Colorado|Utah|Nevada|Arizona|California|Oregon|Washington|Idaho|Montana|Wyoming|New Mexico|Texas|Oklahoma|Kansas|Nebraska|South Dakota|North Dakota|Minnesota|Iowa|Missouri|Arkansas|Louisiana|Mississippi|Alabama|Tennessee|Kentucky|Illinois|Wisconsin|Michigan|Indiana|Ohio|West Virginia|Virginia|North Carolina|South Carolina|Georgia|Florida|Delaware|Maryland|Pennsylvania|New Jersey|New York|Connecticut|Rhode Island|Massachusetts|Vermont|New Hampshire|Maine|Alaska|Hawaii)\b/i);
          city = cityMatch ? cityMatch[1] : 'Local Area';
        }
        setCityName(city);
        
        console.log('Fetching fun facts for:', city, restaurantName, 'with placeId:', placeId);
        const placeIdParam = placeId ? `&placeId=${encodeURIComponent(placeId)}` : '';
        const response = await fetch(`/api/fun-facts?city=${encodeURIComponent(city)}&restaurant=${encodeURIComponent(restaurantName)}${placeIdParam}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fun facts received:', data.facts);
          setFunFacts(data.facts);
          if (data.actualCity) {
            setActualCityName(data.actualCity);
          }
          if (data.actualRestaurant) {
            setActualRestaurantName(data.actualRestaurant);
          }
          
          // Initialize position for first fact - keep above bottom squares
          const positions = [
            { side: 'left', top: '15%' },
            { side: 'right', top: '20%' },
            { side: 'left', top: '30%' },
            { side: 'right', top: '35%' },
            { side: 'left', top: '45%' },
            { side: 'right', top: '50%' },
            { side: 'left', top: '60%' },
            { side: 'right', top: '65%' },
            { side: 'left', top: '25%' },
            { side: 'right', top: '40%' }
          ];
          setFactPosition(positions[Math.floor(Math.random() * positions.length)]);
        }
      } catch (error) {
        console.error('Error fetching fun facts:', error);
      }
    };

    if (restaurantName) {
      fetchFunFacts();
    }
  }, [restaurantName, placeId]);

  // Show/hide fun facts based on scan progress
  useEffect(() => {
    console.log('Fun facts visibility effect:', { funFactsLength: funFacts.length, progress, showFunFact });
    
    if (funFacts.length > 0 && progress > 0 && progress <= 100) {
      setShowFunFact(true);
      
      // Set initial position if not already set
      if (!factPosition || factPosition.side === 'right' && factPosition.top === '50%') {
        const positions = [
          { side: 'left', top: '15%' },
          { side: 'right', top: '20%' },
          { side: 'left', top: '30%' },
          { side: 'right', top: '35%' },
          { side: 'left', top: '45%' },
          { side: 'right', top: '50%' },
          { side: 'left', top: '60%' },
          { side: 'right', top: '65%' },
          { side: 'left', top: '25%' },
          { side: 'right', top: '40%' }
        ];
        setFactPosition(positions[Math.floor(Math.random() * positions.length)]);
      }
    } else {
      setShowFunFact(false);
    }
  }, [funFacts, progress]);

  // Separate effect for cycling through fun facts with consistent timing
  useEffect(() => {
    if (funFacts.length > 0 && showFunFact) {
      console.log('Starting fun facts cycling timer at:', new Date().toLocaleTimeString());
      
      const interval = setInterval(() => {
        const timestamp = new Date().toLocaleTimeString();
        setCurrentFactIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % funFacts.length;
          console.log(`[${timestamp}] Cycling to fun fact ${newIndex} (${prevIndex} → ${newIndex}):`, funFacts[newIndex]);
          
          // Generate random position for next fact - keep above bottom squares
          const positions = [
            { side: 'left', top: '15%' },
            { side: 'right', top: '20%' },
            { side: 'left', top: '30%' },
            { side: 'right', top: '35%' },
            { side: 'left', top: '45%' },
            { side: 'right', top: '50%' },
            { side: 'left', top: '60%' },
            { side: 'right', top: '65%' },
            { side: 'left', top: '25%' },
            { side: 'right', top: '40%' }
          ];
          
          setFactPosition(positions[Math.floor(Math.random() * positions.length)]);
          
          return newIndex;
        });
        
        // Cycle through business photos at the same time
        if (businessPhotos && businessPhotos.length > 0) {
          setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % businessPhotos.length);
          setShowPhoto(true);
        }
      }, 5000); // Change fact every 5 seconds consistently

      return () => {
        console.log('Clearing fun facts cycling timer at:', new Date().toLocaleTimeString());
        clearInterval(interval);
      };
    }
  }, [funFacts.length, showFunFact]); // Only restart when facts change or visibility changes

  // Generate enhanced floating particles with colors
  useEffect(() => {
    const generateParticles = () => {
      const colors = ['#28008F', '#7C3AED', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setParticles(newParticles);
    };

    const generateScanBeams = () => {
      const newBeams = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        delay: i * 0.3,
      }));
      setScanBeams(newBeams);
    };

    const generateDataStreams = () => {
      const newStreams = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        delay: i * 0.2,
        direction: Math.random() > 0.5 ? 'left' : 'right' as 'left' | 'right',
      }));
      setDataStreams(newStreams);
    };

    generateParticles();
    generateScanBeams();
    generateDataStreams();
  }, []);

  return (
    <div className="py-4 md:py-16 bg-gradient-to-br from-[#F6F3FE] via-purple-100 to-[#E8E2FF] min-h-screen relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(95, 95, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(95, 95, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
      {/* Subtle Floating Particles - Reduced on Mobile */}
      <div className="absolute inset-0 overflow-hidden hidden md:block">
        {particles.slice(0, 8).map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: 3,
              height: 3,
              backgroundColor: '#5F5FFF',
              opacity: 0.3,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      {/* Data Stream Effects - Hidden on Mobile */}
      <div className="absolute inset-0 overflow-hidden hidden md:block">
        {dataStreams.slice(0, 4).map((stream) => (
          <motion.div
            key={stream.id}
            className="absolute h-0.5 w-20 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            style={{
              top: `${20 + stream.id * 8}%`,
              left: stream.direction === 'left' ? '100%' : '-80px',
            }}
            animate={{
              x: stream.direction === 'left' ? [0, -window.innerWidth - 80] : [0, window.innerWidth + 80],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: stream.delay,
              ease: "linear",
            }}
          />
        ))}
      </div>
      {/* Holographic Scanning Beams - Simplified on Mobile */}
      <div className="absolute inset-0 overflow-hidden hidden md:block">
        {scanBeams.slice(0, 2).map((beam) => (
          <motion.div
            key={beam.id}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)`,
              filter: 'blur(1px)',
            }}
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: beam.delay,
              ease: "linear",
            }}
          />
        ))}
      </div>
      {/* Pulsing Radar Effect - Hidden on Mobile for Performance */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none hidden md:block">
        <motion.div
          className="w-96 h-96 border border-purple-500/30 rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-64 h-64 border border-cyan-500/40 rounded-full"
          animate={{
            scale: [1.05, 1.2, 1.05],
            opacity: [0.4, 0.1, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>
      <div className="max-w-4xl mx-auto px-2 md:px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="backdrop-blur-sm bg-white/90 shadow-xl border border-[#5F5FFF]/20 relative overflow-hidden">

            <CardContent className="p-4 md:p-8 relative z-10">
              <div className="text-center mb-4 md:mb-8">
                {/* Professional Scanner - Simplified on Mobile */}
                <motion.div
                  className="relative inline-block mb-6"
                  animate={{ 
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ 
                    scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  {/* Outer ring */}
                  <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-[#5F5FFF]/30 rounded-full relative">
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#5F5FFF] animate-spin"></div>
                  </div>
                  
                  {/* Inner ring - Hidden on Mobile */}
                  <motion.div
                    className="hidden md:block absolute inset-2 w-8 h-8 md:w-12 md:h-12 border-2 border-[#9090FD]/60 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-[#9090FD]"></div>
                  </motion.div>

                  {/* Center core */}
                  <div className="absolute inset-2 md:inset-4 w-8 h-8 md:w-8 md:h-8 bg-gradient-to-r from-[#5F5FFF] to-[#9090FD] rounded-full animate-pulse" />
                </motion.div>
                
                <motion.h2 
                  className="text-xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-4"
                  animate={{ 
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Scanning {restaurantName}
                </motion.h2>
                
                <motion.p 
                  className="text-[#5F5FFF] text-sm md:text-lg font-medium"
                  key={status}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {status}
                </motion.p>
              </div>

              <div className="space-y-4 md:space-y-8">
                {/* Professional Progress Bar */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">
                      Scanning Progress
                    </span>
                    <motion.span 
                      className="font-bold text-lg text-[#5F5FFF]"
                      key={progress}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {progress}%
                    </motion.span>
                  </div>
                  
                  <div className="relative h-3">
                    {/* Clean purple progress bar */}
                    <motion.div
                      className="h-3 bg-gradient-to-r from-[#5F5FFF] to-[#9090FD] rounded-full relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      {/* Animated shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                        animate={{
                          x: ["-100%", "200%"],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Professional Scanning Steps */}
                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = progress >= step.threshold && progress < step.endThreshold;
                    const isComplete = progress >= step.endThreshold;
                    const isPending = progress < step.threshold;
                    
                    // Calculate step progress (0-100% within the step's range)
                    const stepProgress = isActive 
                      ? ((progress - step.threshold) / (step.endThreshold - step.threshold)) * 100
                      : isComplete ? 100 : 0;
                    
                    // Get current sub-task for this step
                    const currentSubTask = isActive 
                      ? step.subTasks.find(task => progress < task.progress)?.label || step.subTasks[step.subTasks.length - 1].label
                      : null;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative overflow-hidden flex items-center space-x-3 md:space-x-4 p-3 md:p-4 rounded-xl transition-all duration-500 ${
                          isComplete
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                            : isActive
                            ? "bg-gradient-to-r from-[#F6F3FE] to-purple-50 border border-[#5F5FFF]/30"
                            : "bg-white/50 border border-gray-200"
                        }`}
                      >
                        {/* Professional scanning indicator */}
                        {isActive && !isComplete && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#5F5FFF]/10 to-transparent"
                            animate={{
                              x: ["-100%", "100%"],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        )}

                        <motion.div
                          className={`relative w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                            isComplete
                              ? "bg-gradient-to-br from-green-500 to-emerald-600"
                              : isActive
                              ? "bg-gradient-to-br from-[#5F5FFF] to-[#9090FD]"
                              : "bg-gray-300"
                          }`}
                          animate={isActive && !isComplete ? {
                            scale: [1, 1.02, 1],
                          } : {}}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </motion.div>

                        <div className="flex-1 relative z-10 ml-4">
                          <motion.h3
                            className={`font-semibold mb-3 transition-colors duration-300 ${
                              isComplete ? "text-green-600" :
                              isActive ? "text-[#5F5FFF]" : "text-gray-500"
                            }`}
                            animate={isActive ? { 
                              x: [0, 2, 0],
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {step.label}
                          </motion.h3>
                          
                          <AnimatePresence mode="wait">
                            {isActive && (
                              <motion.div
                                key={currentSubTask}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-3"
                              >
                                <div className="flex items-center space-x-2">
                                  <motion.div
                                    className="w-6 h-6 border-2 border-[#5F5FFF] border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  />
                                  <span className="text-sm text-[#5F5FFF] font-medium">
                                    {currentSubTask || "Processing..."}
                                  </span>
                                </div>
                                
                                {/* Mini progress bar for step progress */}
                                <div className="relative">
                                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-gradient-to-r from-[#5F5FFF] to-[#9090FD] relative"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${stepProgress}%` }}
                                      transition={{ duration: 0.5, ease: "easeOut" }}
                                    >
                                      {/* Shimmer effect */}
                                      <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        animate={{
                                          x: ["-100%", "200%"],
                                        }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                          ease: "linear",
                                        }}
                                      />
                                    </motion.div>
                                  </div>
                                  
                                  {/* Sub-task dots */}
                                  <div className="absolute inset-0 flex items-center justify-between px-1">
                                    {step.subTasks.map((task, taskIndex) => {
                                      const taskComplete = progress >= task.progress;
                                      const taskActive = currentSubTask === task.label;
                                      return (
                                        <motion.div
                                          key={taskIndex}
                                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                            taskComplete 
                                              ? "bg-green-500" 
                                              : taskActive 
                                              ? "bg-[#5F5FFF] scale-125" 
                                              : "bg-gray-300"
                                          }`}
                                          initial={{ scale: 0 }}
                                          animate={{ 
                                            scale: taskActive ? 1.25 : 1,
                                          }}
                                          transition={{ duration: 0.3 }}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                                
                                {/* Completed sub-tasks */}
                                <div className="flex flex-wrap gap-1">
                                  {step.subTasks
                                    .filter(task => progress >= task.progress)
                                    .map((task, idx) => (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full"
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        <span className="text-xs text-green-700">{task.label}</span>
                                      </motion.div>
                                    ))
                                  }
                                </div>
                              </motion.div>
                            )}
                            
                            {isComplete && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap gap-1"
                              >
                                {step.subTasks.map((task, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                    <span className="text-xs text-green-700">{task.label}</span>
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                            
                            {isPending && (
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 bg-gray-300 rounded-full" />
                                <span className="text-sm text-gray-500 font-medium">Waiting...</span>
                              </div>
                            )}
                          </AnimatePresence>
                        </div>

                        {isComplete && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="ml-auto relative z-10"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                              <motion.svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </motion.svg>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Fun Facts and Photos Side by Side - Hidden on Mobile */}
          <motion.div
            className="mt-4 md:mt-8 hidden md:grid grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Fun Facts Section */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {funFacts.length > 0 && progress > 0 && progress <= 100 && (
                  <motion.div
                    key={`fact-${currentFactIndex}`}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-br from-[#5F5FFF] via-[#7B7BFF] to-[#9090FD] text-white rounded-2xl p-6 shadow-xl"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm border border-white/30">
                        {funFacts[currentFactIndex]?.type === 'city' ? (
                          <MapPin className="w-6 h-6 text-white" />
                        ) : (
                          <Star className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="px-3 py-1 bg-white/25 rounded-full backdrop-blur-sm border border-white/30 mb-3 inline-block">
                          <span className="text-xs font-bold text-white uppercase tracking-wide">
                            Fun Fact About {funFacts[currentFactIndex]?.type === 'city' ? actualCityName : actualRestaurantName}
                          </span>
                        </div>
                        <p className="text-sm text-white/95 leading-relaxed font-medium">
                          {funFacts[currentFactIndex]?.text}
                        </p>
                        
                        {/* Progress dots */}
                        <div className="flex justify-center space-x-1 mt-4">
                          {funFacts.map((_, index) => (
                            <motion.div
                              key={index}
                              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                index === currentFactIndex ? 'bg-white' : 'bg-white/40'
                              }`}
                              animate={{
                                scale: index === currentFactIndex ? [1, 1.3, 1] : 1,
                              }}
                              transition={{
                                duration: 0.6,
                                repeat: index === currentFactIndex ? Infinity : 0,
                                repeatType: "reverse",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Business Photos Section */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {businessPhotos && businessPhotos.length > 0 && showPhoto && progress > 0 && progress <= 100 && (
                  <motion.div
                    key={`photo-${currentPhotoIndex}`}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-br from-[#5F5FFF] via-[#7B7BFF] to-[#9090FD] rounded-2xl p-3 shadow-xl"
                  >
                    <div className="relative">
                      <img
                        src={businessPhotos[currentPhotoIndex]}
                        alt={`${restaurantName} photo ${currentPhotoIndex + 1}`}
                        className="w-full h-48 object-cover rounded-xl"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
                      
                      {/* Photo info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="flex items-center justify-between">
                          <div className="px-3 py-1 bg-white/90 rounded-full backdrop-blur-sm">
                            <span className="text-xs font-bold text-[#5F5FFF] uppercase tracking-wide">
                              {restaurantName}
                            </span>
                          </div>
                          <div className="px-2 py-1 bg-black/30 rounded-full backdrop-blur-sm">
                            <span className="text-xs font-medium text-white">
                              {currentPhotoIndex + 1}/{businessPhotos.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress dots */}
                    <div className="flex justify-center space-x-1 mt-3">
                      {businessPhotos && businessPhotos.slice(0, 8).map((_, index) => (
                        <motion.div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            index === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                          }`}
                          animate={{
                            scale: index === currentPhotoIndex ? [1, 1.3, 1] : 1,
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: index === currentPhotoIndex ? Infinity : 0,
                            repeatType: "reverse",
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* Review Streaming Display - Left Side - Hidden on Mobile */}
        <AnimatePresence>
          {currentReview && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="hidden lg:block fixed left-6 top-1/3 transform -translate-y-1/2 z-50"
              >
                <Card className="w-80 bg-white/95 backdrop-blur-sm border-l-4 border-l-[#5F5FFF] shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          currentReview.sentiment === 'positive' ? 'bg-green-100 text-green-600' :
                          currentReview.sentiment === 'negative' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <MessageCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {currentReview.author}
                          </p>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < currentReview.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2 capitalize">
                          {currentReview.platform}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {currentReview.text}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Review Streaming Display - Right Side - Hidden on Mobile */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="hidden lg:block fixed right-6 top-2/3 transform -translate-y-1/2 z-50"
                transition={{ delay: 0.5 }}
              >
                <Card className="w-80 bg-white/95 backdrop-blur-sm border-r-4 border-r-[#28008F] shadow-xl">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          currentReview.sentiment === 'positive' ? 'bg-green-100 text-green-600' :
                          currentReview.sentiment === 'negative' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <MessageCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Customer Review
                          </p>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < currentReview.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2 capitalize">
                          {currentReview.platform} Review
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          "{currentReview.text}"
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}