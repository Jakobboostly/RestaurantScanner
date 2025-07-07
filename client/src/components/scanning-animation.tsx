import { motion } from "framer-motion";
import { Search, Zap, TrendingUp, Users, Smartphone, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScanningAnimationProps {
  progress: number;
  status: string;
  restaurantName: string;
}

export default function ScanningAnimation({ progress, status, restaurantName }: ScanningAnimationProps) {
  const steps = [
    { icon: Search, label: "Finding restaurant website", threshold: 10 },
    { icon: Zap, label: "Analyzing performance", threshold: 30 },
    { icon: TrendingUp, label: "Checking search rankings", threshold: 50 },
    { icon: Smartphone, label: "Evaluating mobile experience", threshold: 70 },
    { icon: Users, label: "Scanning competitor websites", threshold: 90 },
    { icon: Globe, label: "Generating recommendations", threshold: 95 },
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Scanning {restaurantName}
              </h2>
              <p className="text-gray-600">{status}</p>
            </div>

            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Scanning Steps */}
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
                      className={`flex items-center space-x-4 p-4 rounded-xl transition-all ${
                        isComplete
                          ? "bg-green-50 border border-green-200"
                          : isActive
                          ? "bg-[#F6F3FE] border border-[#28008F]/20"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isComplete
                            ? "bg-green-500"
                            : isActive
                            ? "bg-[#28008F]"
                            : "bg-gray-300"
                        }`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-medium ${
                            isActive ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </h3>
                        {isActive && !isComplete && (
                          <p className="text-sm text-gray-500">In progress...</p>
                        )}
                      </div>
                      {isComplete && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto"
                        >
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
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
      </div>
    </div>
  );
}
