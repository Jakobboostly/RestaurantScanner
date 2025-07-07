import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, TrendingUp, Users, Smartphone, Globe, Wifi, Shield, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface ScanningAnimationProps {
  progress: number;
  status: string;
  restaurantName: string;
}

export default function ScanningAnimation({ progress, status, restaurantName }: ScanningAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [scanBeams, setScanBeams] = useState<Array<{ id: number; delay: number }>>([]);

  const steps = [
    { icon: Search, label: "Finding restaurant website", threshold: 10, color: "from-blue-500 to-cyan-500" },
    { icon: Zap, label: "Analyzing performance", threshold: 30, color: "from-yellow-500 to-orange-500" },
    { icon: TrendingUp, label: "Checking search rankings", threshold: 50, color: "from-green-500 to-emerald-500" },
    { icon: Smartphone, label: "Evaluating mobile experience", threshold: 70, color: "from-purple-500 to-violet-500" },
    { icon: Users, label: "Scanning competitor websites", threshold: 90, color: "from-pink-500 to-rose-500" },
    { icon: Globe, label: "Generating recommendations", threshold: 95, color: "from-indigo-500 to-blue-500" },
  ];

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
      }));
      setParticles(newParticles);
    };

    const generateScanBeams = () => {
      const newBeams = Array.from({ length: 3 }, (_, i) => ({
        id: i,
        delay: i * 0.5,
      }));
      setScanBeams(newBeams);
    };

    generateParticles();
    generateScanBeams();
  }, []);

  return (
    <div className="py-16 bg-gradient-to-br from-gray-50 to-[#F6F3FE] min-h-screen relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-[#28008F]/20 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
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

      {/* Scanning Beam Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {scanBeams.map((beam) => (
          <motion.div
            key={beam.id}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#28008F]/10 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: beam.delay,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <motion.div
                  className="relative inline-block mb-6"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-16 h-16 border-4 border-[#28008F]/20 border-t-[#28008F] rounded-full"></div>
                  <motion.div
                    className="absolute inset-2 w-12 h-12 border-2 border-transparent border-b-[#28008F]/60 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-bold text-gray-900 mb-4"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Scanning {restaurantName}
                </motion.h2>
                
                <motion.p 
                  className="text-gray-600 text-lg"
                  key={status}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {status}
                </motion.p>
              </div>

              <div className="space-y-8">
                {/* Enhanced Progress Bar */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Scanning Progress</span>
                    <motion.span 
                      className="font-bold text-[#28008F] text-lg"
                      key={progress}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {progress}%
                    </motion.span>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#28008F] to-purple-600 rounded-full relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      </motion.div>
                    </div>
                    
                    {/* Progress indicator dot */}
                    <motion.div
                      className="absolute top-0 w-3 h-3 bg-white border-2 border-[#28008F] rounded-full shadow-lg"
                      style={{ left: `calc(${progress}% - 6px)` }}
                      animate={{
                        scale: [1, 1.2, 1],
                        boxShadow: ["0 0 0 0 rgba(40, 0, 143, 0.4)", "0 0 0 8px rgba(40, 0, 143, 0)", "0 0 0 0 rgba(40, 0, 143, 0)"],
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </div>
                </div>

                {/* Enhanced Scanning Steps */}
                <div className="space-y-4">
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
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-md"
                            : isActive
                            ? "bg-gradient-to-r from-[#F6F3FE] to-purple-50 border border-[#28008F]/20 shadow-lg"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        {/* Animated background effect for active step */}
                        {isActive && !isComplete && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#28008F]/5 to-transparent"
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
                          className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            isComplete
                              ? "bg-gradient-to-br from-green-500 to-emerald-600"
                              : isActive
                              ? `bg-gradient-to-br ${step.color}`
                              : "bg-gray-300"
                          }`}
                          animate={isActive && !isComplete ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                          
                          {/* Pulse effect for active step */}
                          {isActive && !isComplete && (
                            <motion.div
                              className="absolute inset-0 rounded-xl bg-white/20"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0, 0.5],
                              }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                        </motion.div>

                        <div className="flex-1 relative z-10">
                          <motion.h3
                            className={`font-semibold transition-colors duration-300 ${
                              isActive ? "text-gray-900" : "text-gray-400"
                            }`}
                            animate={isActive ? { x: [0, 2, 0] } : {}}
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
                                  <div className="w-1 h-1 bg-[#28008F] rounded-full animate-pulse" />
                                  <div className="w-1 h-1 bg-[#28008F] rounded-full animate-pulse delay-75" />
                                  <div className="w-1 h-1 bg-[#28008F] rounded-full animate-pulse delay-150" />
                                </motion.div>
                                <span className="text-sm text-[#28008F] font-medium">Analyzing...</span>
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
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="ml-auto relative z-10"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                              <motion.svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
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
          
          {/* Floating Action Indicators */}
          <motion.div
            className="mt-8 grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { icon: Wifi, label: "Network Analysis", active: progress > 20 },
              { icon: Shield, label: "Security Check", active: progress > 50 },
              { icon: BarChart3, label: "Performance Metrics", active: progress > 80 },
            ].map((item, index) => (
              <motion.div
                key={index}
                className={`text-center p-4 rounded-lg transition-all duration-500 ${
                  item.active 
                    ? "bg-white/80 shadow-lg border border-[#28008F]/20" 
                    : "bg-white/40"
                }`}
                animate={item.active ? {
                  scale: [1, 1.05, 1],
                  boxShadow: ["0 4px 6px rgba(0,0,0,0.1)", "0 8px 15px rgba(40,0,143,0.15)", "0 4px 6px rgba(0,0,0,0.1)"],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    item.active ? "bg-[#28008F] text-white" : "bg-gray-300 text-gray-500"
                  }`}
                  animate={item.active ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <item.icon className="w-4 h-4" />
                </motion.div>
                <p className={`text-xs font-medium ${
                  item.active ? "text-gray-900" : "text-gray-500"
                }`}>
                  {item.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}