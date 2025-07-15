import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, TrendingUp, Users, Smartphone, Globe, Wifi, Shield, BarChart3, Star, MessageCircle } from "lucide-react";
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

export default function ScanningAnimation({ progress, status, restaurantName, currentReview }: ScanningAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; color: string }>>([]);
  const [scanBeams, setScanBeams] = useState<Array<{ id: number; delay: number }>>([]);
  const [dataStreams, setDataStreams] = useState<Array<{ id: number; delay: number; direction: 'left' | 'right' }>>([]);

  const steps = [
    { icon: Search, label: "Finding restaurant website", threshold: 16.67, color: "from-blue-500 to-cyan-500", shadowColor: "shadow-blue-500/20" },
    { icon: Zap, label: "Analyzing performance", threshold: 33.33, color: "from-yellow-500 to-orange-500", shadowColor: "shadow-yellow-500/20" },
    { icon: TrendingUp, label: "Checking search rankings", threshold: 50, color: "from-green-500 to-emerald-500", shadowColor: "shadow-green-500/20" },
    { icon: Smartphone, label: "Evaluating mobile experience", threshold: 66.67, color: "from-purple-500 to-violet-500", shadowColor: "shadow-purple-500/20" },
    { icon: Users, label: "Scanning competitor websites", threshold: 83.33, color: "from-pink-500 to-rose-500", shadowColor: "shadow-pink-500/20" },
    { icon: Globe, label: "Generating recommendations", threshold: 100, color: "from-indigo-500 to-blue-500", shadowColor: "shadow-indigo-500/20" },
  ];

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
    <div className="py-16 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 min-h-screen relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}>
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0px 0px', '50px 50px']
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>

      {/* Enhanced Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${Math.random() * 20 + 10}px ${particle.color}`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.8, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
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
          <Card className="backdrop-blur-lg bg-gray-900/80 shadow-2xl border border-purple-500/30 relative overflow-hidden">
            {/* Holographic border effect */}
            <div className="absolute inset-0 rounded-lg">
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(45deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
                }}
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>

            <CardContent className="p-8 relative z-10">
              <div className="text-center mb-8">
                {/* 3D Holographic Scanner */}
                <motion.div
                  className="relative inline-block mb-6"
                  animate={{ 
                    rotateY: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    rotateY: { duration: 6, repeat: Infinity, ease: "linear" },
                    scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Outer ring */}
                  <div className="w-20 h-20 border-4 border-cyan-500/40 rounded-full relative">
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"></div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 animate-pulse"></div>
                  </div>
                  
                  {/* Inner ring */}
                  <motion.div
                    className="absolute inset-3 w-14 h-14 border-2 border-purple-500/60 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-purple-400 animate-spin"></div>
                  </motion.div>

                  {/* Center core */}
                  <motion.div
                    className="absolute inset-6 w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(34, 211, 238, 0.5)',
                        '0 0 40px rgba(168, 85, 247, 0.8)',
                        '0 0 20px rgba(34, 211, 238, 0.5)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Scanning line */}
                  <motion.div
                    className="absolute inset-0 w-20 h-20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 left-0 transform -translate-y-1/2"></div>
                  </motion.div>
                </motion.div>
                
                <motion.h2 
                  className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    textShadow: [
                      '0 0 10px rgba(34, 211, 238, 0.3)',
                      '0 0 20px rgba(168, 85, 247, 0.5)',
                      '0 0 10px rgba(34, 211, 238, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Scanning {restaurantName}
                </motion.h2>
                
                <motion.p 
                  className="text-gray-300 text-lg font-medium"
                  key={status}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {status}
                </motion.p>
              </div>

              <div className="space-y-8">
                {/* Holographic Progress Bar */}
                <div className="space-y-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-cyan-400 font-medium bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      Scanning Progress
                    </span>
                    <motion.span 
                      className="font-bold text-2xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                      key={progress}
                      initial={{ scale: 1.3, rotateY: 180 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      transition={{ duration: 0.4, type: "spring" }}
                    >
                      {progress}%
                    </motion.span>
                  </div>
                  
                  <div className="relative">
                    {/* Background track */}
                    <div className="w-full h-4 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-900/20 to-transparent animate-pulse"></div>
                    </div>
                    
                    {/* Progress fill */}
                    <motion.div
                      className="absolute top-0 left-0 h-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{
                        boxShadow: '0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)',
                      }}
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
                      
                      {/* Pulsing core */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-purple-400/30"
                        animate={{
                          opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                    
                    {/* Holographic progress indicator */}
                    <motion.div
                      className="absolute top-0 w-4 h-4 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full shadow-lg"
                      style={{ 
                        left: `calc(${progress}% - 8px)`,
                        boxShadow: '0 0 15px rgba(34, 211, 238, 0.8), 0 0 30px rgba(168, 85, 247, 0.6)',
                      }}
                      animate={{
                        scale: [1, 1.4, 1],
                        rotate: [0, 360],
                      }}
                      transition={{ 
                        scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                      }}
                    />
                  </div>
                </div>

                {/* Futuristic Scanning Steps */}
                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = progress >= step.threshold;
                    const isComplete = progress >= step.threshold + 10;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -30, rotateY: -90 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                        className={`relative overflow-hidden flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 backdrop-blur-sm ${
                          isComplete
                            ? "bg-gradient-to-r from-emerald-900/40 to-green-900/40 border border-emerald-400/50 shadow-lg shadow-emerald-500/20"
                            : isActive
                            ? "bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-purple-400/50 shadow-lg shadow-purple-500/20"
                            : "bg-gray-900/40 border border-gray-700/50"
                        }`}
                        style={{
                          boxShadow: isActive ? `0 0 30px ${isComplete ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)'}` : 'none'
                        }}
                      >
                        {/* Holographic scanning line for active step */}
                        {isActive && !isComplete && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-12"
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
                          className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            isComplete
                              ? "bg-gradient-to-br from-emerald-500 to-green-600"
                              : isActive
                              ? `bg-gradient-to-br ${step.color}`
                              : "bg-gray-700/50"
                          }`}
                          animate={isActive && !isComplete ? {
                            scale: [1, 1.15, 1],
                            rotate: [0, 10, -10, 0],
                            boxShadow: [
                              '0 0 20px rgba(139, 92, 246, 0.3)',
                              '0 0 40px rgba(34, 211, 238, 0.5)',
                              '0 0 20px rgba(139, 92, 246, 0.3)',
                            ],
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{
                            boxShadow: isComplete ? '0 0 25px rgba(16, 185, 129, 0.5)' : 
                                     isActive ? '0 0 25px rgba(139, 92, 246, 0.5)' : 'none'
                          }}
                        >
                          <Icon className="w-7 h-7 text-white" />
                          
                          {/* Holographic pulse for active step */}
                          {isActive && !isComplete && (
                            <motion.div
                              className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/30 to-purple-400/30"
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.6, 0, 0.6],
                              }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                        </motion.div>

                        <div className="flex-1 relative z-10">
                          <motion.h3
                            className={`font-semibold text-lg transition-colors duration-300 ${
                              isComplete ? "text-emerald-400" :
                              isActive ? "text-cyan-400" : "text-gray-500"
                            }`}
                            animate={isActive ? { 
                              x: [0, 3, 0],
                              textShadow: [
                                '0 0 10px rgba(34, 211, 238, 0.5)',
                                '0 0 20px rgba(139, 92, 246, 0.7)',
                                '0 0 10px rgba(34, 211, 238, 0.5)',
                              ],
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
                                className="flex items-center space-x-2 mt-2"
                              >
                                <motion.div
                                  className="flex space-x-1"
                                  animate={{ x: [0, 5, 0] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" 
                                       style={{boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)'}} />
                                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-75" 
                                       style={{boxShadow: '0 0 10px rgba(139, 92, 246, 0.8)'}} />
                                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-150" 
                                       style={{boxShadow: '0 0 10px rgba(236, 72, 153, 0.8)'}} />
                                </motion.div>
                                <span className="text-sm text-cyan-400 font-medium">Analyzing...</span>
                              </motion.div>
                            )}
                            
                            {isComplete && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-2 mt-2"
                              >
                                <div className="w-2 h-2 bg-emerald-400 rounded-full" 
                                     style={{boxShadow: '0 0 15px rgba(16, 185, 129, 0.8)'}} />
                                <span className="text-sm text-emerald-400 font-medium">Complete</span>
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
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"
                                 style={{boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)'}}>
                              <motion.svg
                                className="w-6 h-6 text-white"
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
          
          {/* Holographic Data Visualization Panels */}
          <motion.div
            className="mt-8 grid grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {[
              { 
                icon: Wifi, 
                label: "Network Analysis", 
                active: progress > 20,
                metric: `${Math.min(progress * 2, 100)}%`,
                color: "cyan",
                glowColor: "rgba(34, 211, 238, 0.3)"
              },
              { 
                icon: Shield, 
                label: "Security Check", 
                active: progress > 50,
                metric: `${Math.min(Math.max(progress - 30, 0) * 1.5, 100)}%`,
                color: "emerald",
                glowColor: "rgba(16, 185, 129, 0.3)"
              },
              { 
                icon: BarChart3, 
                label: "Performance Metrics", 
                active: progress > 80,
                metric: `${Math.min(Math.max(progress - 60, 0) * 2.5, 100)}%`,
                color: "purple",
                glowColor: "rgba(139, 92, 246, 0.3)"
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className={`relative p-6 rounded-xl backdrop-blur-lg transition-all duration-500 border ${
                  item.active 
                    ? `bg-${item.color}-900/30 border-${item.color}-400/50 shadow-lg` 
                    : "bg-gray-900/30 border-gray-700/50"
                }`}
                animate={item.active ? {
                  scale: [1, 1.02, 1],
                  boxShadow: [`0 0 20px ${item.glowColor}`, `0 0 30px ${item.glowColor}`, `0 0 20px ${item.glowColor}`],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  boxShadow: item.active ? `0 0 25px ${item.glowColor}` : 'none'
                }}
              >
                {/* Holographic scanning line */}
                {item.active && (
                  <motion.div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-${item.color}-400/20 to-transparent`}
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
                    className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      item.active ? `bg-gradient-to-br from-${item.color}-500 to-${item.color}-600` : "bg-gray-700/50"
                    }`}
                    animate={item.active ? { 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{ 
                      rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                    style={{
                      boxShadow: item.active ? `0 0 20px ${item.glowColor}` : 'none'
                    }}
                  >
                    <item.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  
                  <motion.div
                    className={`text-2xl font-bold mb-2 ${
                      item.active ? `text-${item.color}-400` : "text-gray-500"
                    }`}
                    animate={item.active ? {
                      textShadow: [
                        `0 0 10px ${item.glowColor}`,
                        `0 0 20px ${item.glowColor}`,
                        `0 0 10px ${item.glowColor}`,
                      ],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {item.metric}
                  </motion.div>
                  
                  <p className={`text-sm font-medium ${
                    item.active ? `text-${item.color}-300` : "text-gray-400"
                  }`}>
                    {item.label}
                  </p>
                  
                  {/* Data stream visualization */}
                  {item.active && (
                    <motion.div
                      className="mt-3 flex justify-center space-x-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {[0, 1, 2, 3, 4].map((bar) => (
                        <motion.div
                          key={bar}
                          className={`w-1 bg-${item.color}-400 rounded-full`}
                          animate={{
                            height: [4, Math.random() * 20 + 8, 4],
                          }}
                          transition={{
                            duration: 1 + Math.random(),
                            repeat: Infinity,
                            delay: bar * 0.1,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
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
                <Card className="w-80 bg-white/95 backdrop-blur-sm border-l-4 border-l-[#28008F] shadow-xl">
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
      </div>
    </div>
  );
}