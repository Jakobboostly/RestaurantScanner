import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, User, Building2, Sparkles, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadData) => Promise<void>;
  onAdminBypass?: () => void;
  onAdminRevenueLossGate?: () => void;
  restaurantName?: string;
  isSubmitting?: boolean;
}

export interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  restaurantName: string;
}

export function LeadCaptureModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onAdminBypass,
  onAdminRevenueLossGate,
  restaurantName = '',
  isSubmitting = false 
}: LeadCaptureModalProps) {
  const [formData, setFormData] = useState<LeadData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    restaurantName: restaurantName
  });
  const [errors, setErrors] = useState<Partial<LeadData>>({});
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  // Update restaurant name when prop changes
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, restaurantName }));
  }, [restaurantName]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateForm = () => {
    const newErrors: Partial<LeadData> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.restaurantName.trim()) {
      newErrors.restaurantName = 'Restaurant name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdminBypass = () => {
    if (adminCode === '55555') {
      // Admin bypass - close modal and start scan without webhook or form validation
      if (onAdminBypass) {
        onAdminBypass();
      } else {
        onClose();
      }
    } else {
      alert('Invalid admin code');
    }
  };

  const handleAdminRevenueLossGate = () => {
    if (adminCode === '55555') {
      // Admin Revenue Loss Gate - show Revenue Loss Gate for admin demo
      if (onAdminRevenueLossGate) {
        onAdminRevenueLossGate();
      } else {
        onClose();
      }
    } else {
      alert('Invalid admin code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    await onSubmit(formData);
  };

  const handleInputChange = (field: keyof LeadData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-[#28008F] to-[#4a1fb8] p-6 text-white">
                {/* Hidden admin trigger - click on logo area 5 times */}
                <div 
                  className="absolute left-4 top-4 w-12 h-12 cursor-pointer opacity-0 hover:opacity-10 transition-opacity"
                  onClick={() => setShowAdminInput(!showAdminInput)}
                  title="Admin access"
                />
                
                
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <img src="/boostlylogo.png" alt="Boostly" className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold">Get Your Free Analysis</h2>
                </div>
                
                <p className="text-white/90">
                  See how your restaurant performs online and get personalized recommendations to attract more customers
                </p>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Hidden Admin Panel */}
                {showAdminInput && (
                  <div className="border border-red-200 bg-red-50 rounded-lg p-3 mb-4">
                    <div className="text-xs text-red-600 mb-2 font-medium">Admin Access</div>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="Enter admin code..."
                        className="text-xs h-8"
                        disabled={isSubmitting}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAdminRevenueLossGate}
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                        >
                          Revenue Gate
                        </button>
                        <button
                          type="button"
                          onClick={handleAdminBypass}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          Bypass
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdminInput(false);
                            setAdminCode('');
                          }}
                          className="px-3 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-700 font-medium mb-1 flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      placeholder="John"
                      className={errors.firstName ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName" className="text-gray-700 font-medium mb-1 flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      placeholder="Doe"
                      className={errors.lastName ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium mb-1 flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-gray-400" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    placeholder="john@restaurant.com"
                    className={errors.email ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-medium mb-1 flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    Phone Number <span className="text-gray-400 ml-1">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    placeholder="(555) 123-4567"
                    className={errors.phone ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="restaurantName" className="text-gray-700 font-medium mb-1 flex items-center">
                    <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                    Restaurant Name
                  </Label>
                  <Input
                    id="restaurantName"
                    type="text"
                    value={formData.restaurantName}
                    onChange={handleInputChange('restaurantName')}
                    placeholder="Your Restaurant"
                    className={errors.restaurantName ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.restaurantName && (
                    <p className="text-red-500 text-xs mt-1">{errors.restaurantName}</p>
                  )}
                </div>
                
                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#28008F] to-[#4a1fb8] hover:from-[#1f0068] hover:to-[#28008F] text-white font-semibold py-3"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Starting Analysis...
                      </span>
                    ) : (
                      'Start Free Analysis'
                    )}
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Your information is secure and will never be shared. 
                    <br />
                    <span className="font-medium">100% free</span> • No credit card required
                  </p>
                </div>
              </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}