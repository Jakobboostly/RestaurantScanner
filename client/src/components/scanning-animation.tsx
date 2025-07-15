import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, TrendingUp, Users, Smartphone, Globe, Wifi, Shield, BarChart3, Star, MessageCircle, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface ScanningAnimationProps {
  progress: number;
  status: string;
  restaurantName: string;
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

export default function ScanningAnimation({ progress, status, restaurantName, currentReview }: ScanningAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; color: string }>>([]);
  const [scanBeams, setScanBeams] = useState<Array<{ id: number; delay: number }>>([]);
  const [dataStreams, setDataStreams] = useState<Array<{ id: number; delay: number; direction: 'left' | 'right' }>>([]);
  const [funFacts, setFunFacts] = useState<FunFact[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [showFunFact, setShowFunFact] = useState(false);
  const [factPosition, setFactPosition] = useState({ side: 'right', top: '50%' });

  const steps = [
    { icon: Search, label: "Finding restaurant website", threshold: 16.67, color: "from-blue-500 to-cyan-500", shadowColor: "shadow-blue-500/20" },
    { icon: Zap, label: "Analyzing performance", threshold: 33.33, color: "from-yellow-500 to-orange-500", shadowColor: "shadow-yellow-500/20" },
    { icon: TrendingUp, label: "Checking search rankings", threshold: 50, color: "from-green-500 to-emerald-500", shadowColor: "shadow-green-500/20" },
    { icon: Smartphone, label: "Evaluating mobile experience", threshold: 66.67, color: "from-purple-500 to-violet-500", shadowColor: "shadow-purple-500/20" },
    { icon: Users, label: "Scanning competitor websites", threshold: 83.33, color: "from-pink-500 to-rose-500", shadowColor: "shadow-pink-500/20" },
    { icon: Globe, label: "Generating recommendations", threshold: 100, color: "from-indigo-500 to-blue-500", shadowColor: "shadow-indigo-500/20" },
  ];

  // Fetch fun facts when component mounts
  useEffect(() => {
    const fetchFunFacts = async () => {
      try {
        // Extract city from restaurant name (simple heuristic)
        const cityMatch = restaurantName.match(/\b(New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Washington|Boston|Nashville|Baltimore|Louisville|Portland|Oklahoma City|Memphis|Las Vegas|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Mesa|Kansas City|Atlanta|Long Beach|Colorado Springs|Raleigh|Miami|Virginia Beach|Omaha|Oakland|Minneapolis|Tulsa|Arlington|Tampa|New Orleans|Wichita|Cleveland|Bakersfield|Aurora|Anaheim|Honolulu|Santa Ana|Riverside|Corpus Christi|Lexington|Stockton|Henderson|Saint Paul|St. Louis|Cincinnati|Pittsburgh|Greensboro|Anchorage|Plano|Lincoln|Orlando|Irvine|Newark|Toledo|Durham|Chula Vista|Fort Wayne|Jersey City|St. Petersburg|Laredo|Madison|Chandler|Buffalo|Lubbock|Scottsdale|Reno|Glendale|Gilbert|Winston-Salem|North Las Vegas|Norfolk|Chesapeake|Garland|Irving|Hialeah|Fremont|Boise|Richmond|Baton Rouge|Spokane|Des Moines|Modesto|Fayetteville|Tacoma|Oxnard|Fontana|Columbus|Montgomery|Moreno Valley|Shreveport|Aurora|Yonkers|Akron|Huntington Beach|Little Rock|Augusta|Amarillo|Glendale|Mobile|Grand Rapids|Salt Lake City|Tallahassee|Huntsville|Grand Prairie|Knoxville|Worcester|Newport News|Brownsville|Overland Park|Santa Clarita|Providence|Garden Grove|Chattanooga|Oceanside|Jackson|Fort Lauderdale|Santa Rosa|Rancho Cucamonga|Port St. Lucie|Tempe|Ontario|Vancouver|Cape Coral|Sioux Falls|Springfield|Peoria|Pembroke Pines|Elk Grove|Salem|Lancaster|Corona|Eugene|Palmdale|Salinas|Springfield|Pasadena|Fort Collins|Hayward|Pomona|Cary|Rockford|Alexandria|Escondido|McKinney|Kansas City|Joliet|Sunnyvale|Torrance|Bridgeport|Lakewood|Hollywood|Paterson|Naperville|Syracuse|Mesquite|Dayton|Savannah|Clarksville|Orange|Pasadena|Fullerton|Killeen|Frisco|Hampton|McAllen|Warren|Bellevue|West Valley City|Columbia|Olathe|Sterling Heights|New Haven|Miramar|Waco|Thousand Oaks|Cedar Rapids|Charleston|Visalia|Topeka|Elizabeth|Gainesville|Thornton|Roseville|Carrollton|Coral Springs|Stamford|Simi Valley|Concord|Hartford|Kent|Lafayette|Midland|Surprise|Denton|Victorville|Evansville|Santa Clara|Abilene|Athens|Vallejo|Allentown|Norman|Beaumont|Independence|Murfreesboro|Ann Arbor|Fargo|Wilmington|Provo|Syracuse|Miami Gardens|Clearwater|Reading|Westminster|Yonkers|Pearland|Richardson|Broken Arrow|Richmond|League City|Lakeland|Solon|Odessa|High Point|Greeley|Inglewood|Lowell|Elgin|Miami Beach|Waterbury|Downey|Pompano Beach|Miami Gardens|Largo|Sandy Springs|Hillsboro|Arvada|Pueblo|Sandy|West Jordan|Inglewood|Centennial|Gresham|Fairfield|Billings|Lowell|San Mateo|Norwalk|Danbury|Toms River|Yakima|Westminster|Livermore|Daly City|Bloomington|Merced|Redding|Bethlehem|Duluth|Clifton|Levittown|Nashua|Albany|Longmont|Trenton|Wichita Falls|Green Bay|San Angelo|Huntington|Appleton|Hoover|Laredo|Roanoke|Spokane Valley|Davenport|Joliet|Burbank|Denton|Wyoming|Lakeland|Tuscaloosa|Chico|Edinburg|Cranston|Parma|New Bedford|Quincy|Brockton|Warwick|Broken Arrow|Rialto|Beaverton|Compton|Bloomington|Carson|Renton|Tracy|Whittier|Lacey|Clovis|Woodbridge|Cicero|Gary|Lawrence|Hamilton|Roswell|Scranton|Evanston|Springfield|Palmdale|Peoria|Antioch|Richmond|Everett|West Palm Beach|Provo|Ventura|Norwalk|Arvada|Inglewood|Lansing|Ann Arbor|Flint|Cedar Falls|Janesville|Napa|Redwood City|Chico|Danbury|Eau Claire|Appleton|Racine|Kalamazoo|St. Cloud|Bloomington|Billings|Missoula|Bismarck|Casper|Cheyenne|Pueblo|Fort Collins|Boulder|Lakewood|Thornton|Westminster|Arvada|Centennial|Colorado Springs|Aurora|Denver|Colorado|Utah|Nevada|Arizona|California|Oregon|Washington|Idaho|Montana|Wyoming|New Mexico|Texas|Oklahoma|Kansas|Nebraska|South Dakota|North Dakota|Minnesota|Iowa|Missouri|Arkansas|Louisiana|Mississippi|Alabama|Tennessee|Kentucky|Illinois|Wisconsin|Michigan|Indiana|Ohio|West Virginia|Virginia|North Carolina|South Carolina|Georgia|Florida|Delaware|Maryland|Pennsylvania|New Jersey|New York|Connecticut|Rhode Island|Massachusetts|Vermont|New Hampshire|Maine|Alaska|Hawaii)\b/i);
        const city = cityMatch ? cityMatch[1] : 'Local Area';
        
        console.log('Fetching fun facts for:', city, restaurantName);
        const response = await fetch(`/api/fun-facts?city=${encodeURIComponent(city)}&restaurantName=${encodeURIComponent(restaurantName)}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fun facts received:', data.funFacts);
          setFunFacts(data.funFacts);
        }
      } catch (error) {
        console.error('Error fetching fun facts:', error);
      }
    };

    if (restaurantName) {
      fetchFunFacts();
    }
  }, [restaurantName]);

  // Cycle through fun facts during scanning
  useEffect(() => {
    console.log('Fun facts cycling effect:', { funFactsLength: funFacts.length, progress, showFunFact });
    
    if (funFacts.length > 0 && progress > 0 && progress < 100) {
      // Show first fact immediately
      setShowFunFact(true);
      
      const interval = setInterval(() => {
        setCurrentFactIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % funFacts.length;
          console.log('Cycling to fun fact:', newIndex, funFacts[newIndex]);
          
          // Generate random position for next fact
          const positions = [
            { side: 'left', top: '20%' },
            { side: 'right', top: '25%' },
            { side: 'left', top: '40%' },
            { side: 'right', top: '45%' },
            { side: 'left', top: '65%' },
            { side: 'right', top: '70%' },
            { side: 'left', top: '85%' },
            { side: 'right', top: '30%' },
            { side: 'left', top: '55%' },
            { side: 'right', top: '80%' }
          ];
          
          setFactPosition(positions[Math.floor(Math.random() * positions.length)]);
          
          return newIndex;
        });
      }, 3000); // Change fact every 3 seconds for more action

      return () => clearInterval(interval);
    } else {
      setShowFunFact(false);
    }
  }, [funFacts, progress]);

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
    <div className="py-16 bg-gradient-to-br from-[#F6F3FE] via-purple-100 to-[#E8E2FF] min-h-screen relative overflow-hidden">
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
      {/* Subtle Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
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
      {/* Data Stream Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {dataStreams.map((stream) => (
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
      {/* Holographic Scanning Beams */}
      <div className="absolute inset-0 overflow-hidden">
        {scanBeams.map((beam) => (
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
      {/* Pulsing Radar Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-96 h-96 border border-purple-500/30 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-64 h-64 border border-cyan-500/40 rounded-full"
          animate={{
            scale: [1.2, 1.8, 1.2],
            opacity: [0.4, 0.1, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="backdrop-blur-sm bg-white/90 shadow-xl border border-[#5F5FFF]/20 relative overflow-hidden">

            <CardContent className="p-8 relative z-10">
              <div className="text-center mb-8">
                {/* Professional Scanner */}
                <motion.div
                  className="relative inline-block mb-6"
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  {/* Outer ring */}
                  <div className="w-16 h-16 border-4 border-[#5F5FFF]/30 rounded-full relative">
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#5F5FFF] animate-spin"></div>
                  </div>
                  
                  {/* Inner ring */}
                  <motion.div
                    className="absolute inset-2 w-12 h-12 border-2 border-[#9090FD]/60 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-[#9090FD]"></div>
                  </motion.div>

                  {/* Center core */}
                  <div className="absolute inset-4 w-8 h-8 bg-gradient-to-r from-[#5F5FFF] to-[#9090FD] rounded-full animate-pulse" />
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-bold text-gray-800 mb-4"
                  animate={{ 
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Scanning {restaurantName}
                </motion.h2>
                
                <motion.p 
                  className="text-[#5F5FFF] text-lg font-medium"
                  key={status}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {status}
                </motion.p>
              </div>

              <div className="space-y-8">
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
                    const isActive = progress >= step.threshold;
                    const isComplete = progress >= step.threshold + 10;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative overflow-hidden flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
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
                          className={`relative w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                            isComplete
                              ? "bg-gradient-to-br from-green-500 to-emerald-600"
                              : isActive
                              ? "bg-gradient-to-br from-[#5F5FFF] to-[#9090FD]"
                              : "bg-gray-300"
                          }`}
                          animate={isActive && !isComplete ? {
                            scale: [1, 1.05, 1],
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </motion.div>

                        <div className="flex-1 relative z-10">
                          <motion.h3
                            className={`font-semibold transition-colors duration-300 ${
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
                            {isActive && !isComplete && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex items-center space-x-2 mt-1"
                              >
                                <motion.div
                                  className="flex space-x-1"
                                  animate={{ x: [0, 3, 0] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  <div className="w-1 h-1 bg-[#5F5FFF] rounded-full animate-pulse" />
                                  <div className="w-1 h-1 bg-[#9090FD] rounded-full animate-pulse delay-75" />
                                  <div className="w-1 h-1 bg-[#5F5FFF] rounded-full animate-pulse delay-150" />
                                </motion.div>
                                <span className="text-sm text-[#5F5FFF] font-medium">Analyzing...</span>
                              </motion.div>
                            )}
                            
                            {isComplete && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-2 mt-1"
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-sm text-green-600 font-medium">Complete</span>
                              </motion.div>
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
          
          {/* Professional Data Visualization Panels */}
          <motion.div
            className="mt-8 grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { 
                icon: Wifi, 
                label: "Network Analysis", 
                active: progress > 20,
                metric: `${Math.min(progress * 2, 100)}%`,
              },
              { 
                icon: Shield, 
                label: "Security Check", 
                active: progress > 50,
                metric: `${Math.min(Math.max(progress - 30, 0) * 1.5, 100)}%`,
              },
              { 
                icon: BarChart3, 
                label: "Performance Metrics", 
                active: progress > 80,
                metric: `${Math.min(Math.max(progress - 60, 0) * 2.5, 100)}%`,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className={`relative p-4 rounded-lg transition-all duration-500 border ${
                  item.active 
                    ? "bg-white/80 border-[#5F5FFF]/20 shadow-lg" 
                    : "bg-white/40 border-gray-200"
                }`}
                animate={item.active ? {
                  scale: [1, 1.02, 1],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Subtle scanning indicator */}
                {item.active && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-[#5F5FFF]/5 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}

                <div className="text-center relative z-10">
                  <motion.div
                    className={`w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      item.active ? "bg-gradient-to-br from-[#5F5FFF] to-[#9090FD]" : "bg-gray-300"
                    }`}
                    animate={item.active ? { 
                      scale: [1, 1.05, 1],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <item.icon className="w-5 h-5 text-white" />
                  </motion.div>
                  
                  <motion.div
                    className={`text-lg font-bold mb-1 ${
                      item.active ? "text-[#5F5FFF]" : "text-gray-500"
                    }`}
                    key={item.metric}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.metric}
                  </motion.div>
                  
                  <p className={`text-xs font-medium ${
                    item.active ? "text-gray-600" : "text-gray-400"
                  }`}>
                    {item.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Review Streaming Display - Left Side */}
        <AnimatePresence>
          {currentReview && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="fixed left-6 top-1/3 transform -translate-y-1/2 z-50"
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

              {/* Review Streaming Display - Right Side */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="fixed right-6 top-2/3 transform -translate-y-1/2 z-50"
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

        {/* Fun Facts Display */}
        <AnimatePresence mode="wait">
          {funFacts.length > 0 && progress > 0 && progress < 100 && (
            <motion.div
              key={`${currentFactIndex}-${factPosition.side}-${factPosition.top}`}
              initial={{ 
                opacity: 0, 
                x: factPosition.side === 'left' ? -150 : 150, 
                y: Math.random() * 40 - 20,
                scale: 0.6,
                rotate: factPosition.side === 'left' ? -10 : 10
              }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                y: 0,
                scale: 1,
                rotate: 0
              }}
              exit={{ 
                opacity: 0, 
                x: factPosition.side === 'left' ? 150 : -150, 
                y: Math.random() * 60 - 30,
                scale: 0.8,
                rotate: factPosition.side === 'left' ? 15 : -15
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.8
              }}
              className={`fixed z-50 ${
                factPosition.side === 'left' ? 'left-6' : 'right-6'
              }`}
              style={{ top: factPosition.top, transform: 'translateY(-50%)' }}
            >
              <motion.div
                animate={{
                  y: [0, -8, 0],
                  rotateY: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Card className="w-72 bg-gradient-to-br from-[#5F5FFF] via-[#7B7BFF] to-[#9090FD] text-white border-0 shadow-2xl relative overflow-hidden">
                  {/* Animated background sparkles */}
                  <div className="absolute inset-0 opacity-20">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                      />
                    ))}
                  </div>
                  
                  <CardContent className="p-5 relative z-10">
                    <div className="flex items-start space-x-3">
                      <motion.div 
                        className="flex-shrink-0"
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm border border-white/30">
                          {funFacts[currentFactIndex]?.type === 'city' ? (
                            <MapPin className="w-5 h-5 text-white" />
                          ) : (
                            <Star className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <motion.div 
                          className="flex items-center space-x-2 mb-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="px-3 py-1 bg-white/25 rounded-full backdrop-blur-sm border border-white/30">
                            <span className="text-xs font-bold text-white uppercase tracking-wide">
                              Fun Fact About {funFacts[currentFactIndex]?.type === 'city' ? 'Your City' : 'This Restaurant'}
                            </span>
                          </div>
                        </motion.div>
                        <motion.p 
                          className="text-sm text-white/95 leading-relaxed font-medium"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          {funFacts[currentFactIndex]?.text}
                        </motion.p>
                      </div>
                    </div>
                    
                    {/* Progress dots */}
                    <motion.div 
                      className="flex justify-center space-x-1 mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
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
                    </motion.div>
                  </CardContent>
                  
                  {/* Animated border glow */}
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2 border-white/40"
                    animate={{
                      borderColor: ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)'],
                      boxShadow: [
                        '0 0 10px rgba(255,255,255,0.3)',
                        '0 0 20px rgba(255,255,255,0.6)',
                        '0 0 10px rgba(255,255,255,0.3)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}