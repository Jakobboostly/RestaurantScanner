import React, { useState, useEffect } from 'react';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  companyName: string;
  websiteUrl: string;
  pointOfSale: string;
  smsOptIn: boolean;
}

const HUBSPOT_API_URL = 'https://api.hsforms.com/submissions/v3/integration/submit/3776858/d107313e-621e-4006-8993-db7f248d6cb3';

export function BoostlyDemoLanding() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: typeof window !== 'undefined' ? localStorage.getItem('email') || '' : '',
    companyName: '',
    websiteUrl: '',
    pointOfSale: '',
    smsOptIn: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Capture tracking params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const keys = ['gclid', 'fbclid', 'utm_source', 'utm_medium'];

    keys.forEach((key) => {
      const val = params.get(key);
      if (val) localStorage.setItem(key, val);
    });

    // Store landing page URL
    localStorage.setItem('landing_page', window.location.href);
  }, []);

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    // Add https:// if no protocol is present
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  const isValidUrl = (url: string) => {
    if (!url) return false;
    try {
      const normalizedUrl = normalizeUrl(url);
      new URL(normalizedUrl);
      // Basic check that it has a domain with extension
      return /^https?:\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}/i.test(normalizedUrl);
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Please enter your name.';
    if (!formData.lastName.trim()) newErrors.lastName = 'Please enter your last name.';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your phone number.';
    } else if (!/^[0-9+\s]{7,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.companyName.trim()) newErrors.companyName = 'Please enter your company name.';
    if (!formData.websiteUrl.trim()) {
      newErrors.websiteUrl = 'Please enter your website URL.';
    } else if (!isValidUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid website URL.';
    }
    if (!formData.pointOfSale.trim()) newErrors.pointOfSale = 'Please enter your point of sale system.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmissionError(false);

    try {
      // Get tracking parameters from localStorage
      const submissionPageURL = window.location.href;
      const landingPageURL = localStorage.getItem('landing_page') || '';
      const gclid = localStorage.getItem('gclid') || '';
      const fbclid = localStorage.getItem('fbclid') || '';
      const utmSource = localStorage.getItem('utm_source') || '';
      const utmMedium = localStorage.getItem('utm_medium') || '';

      // Prepare HubSpot submission data - normalize URL before sending
      const data = {
        fields: [
          { name: 'email', value: formData.email },
          { name: 'firstname', value: formData.firstName },
          { name: 'lastname', value: formData.lastName },
          { name: 'phone', value: formData.phone },
          { name: 'company', value: formData.companyName },
          { name: 'website', value: normalizeUrl(formData.websiteUrl) },
          { name: 'point_of_sale', value: formData.pointOfSale },
          { name: 'sms_opt_in', value: formData.smsOptIn },
          { name: 'landing_page', value: landingPageURL },
          { name: 'submission_page', value: submissionPageURL },
          { name: 'gclid', value: gclid },
          { name: 'fbclid', value: fbclid },
          { name: 'utm_source', value: utmSource || 'lead_scanner' },
          { name: 'utm_medium', value: utmMedium || 'web_app' },
          { name: 'lead_source', value: 'restaurant_lead_scanner' },
          { name: 'form_source', value: 'boostly_scanner_demo' },
        ]
      };

      const response = await fetch(HUBSPOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.status === 200) {
        // Redirect to thank you page on success
        window.location.replace('/thank-you');
      } else {
        setSubmissionError(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmissionError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/boostlylogo.png" alt="Boostly" className="h-8 w-8" />
            <span className="font-bold text-xl text-gray-900">Boostly</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">How it Works</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Reviews</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Blog</a>
            <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Podcast</a>
            <Button variant="outline" className="border-gray-300 text-gray-700">Login</Button>
            <Button className="bg-[#1A0057] hover:bg-[#0f0033] text-white">Get Free Demo</Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-[#3A0CA3] via-[#28008F] to-[#1A0057] rounded-2xl mx-4 md:mx-6 my-4 md:my-6 p-8 md:p-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Left Side - Content */}
          <div className="text-white space-y-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Drive more orders and reviews.<br />
                Guaranteed.
              </h1>
              <p className="text-lg text-white/90 max-w-xl">
                We'll show you how Boostly's text marketing platform increases orders, drives reviews & more—all without lifting a finger.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-base">Automated, Customized Campaigns</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-base">Works with any POS</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-base">Transparent reporting</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-base">10x your 5-star reviews</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Capterra</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-white text-white" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-[#28008F] font-bold text-xs">G</span>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-white text-white" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:pl-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Names Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="text-white text-sm mb-1 block">
                    First name
                  </label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    className={`bg-white border-gray-300 ${errors.firstName ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.firstName && (
                    <p className="text-red-300 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="text-white text-sm mb-1 block">
                    Last name
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    className={`bg-white border-gray-300 ${errors.lastName ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.lastName && (
                    <p className="text-red-300 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Phone & Email Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="text-white text-sm mb-1 block">
                    Phone number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="123456789"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    className={`bg-white border-gray-300 ${errors.phone ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-red-300 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="text-white text-sm mb-1 block">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="me@boostly.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className={`bg-white border-gray-300 ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-red-300 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="companyName" className="text-white text-sm mb-1 block">
                  Company name
                </label>
                <Input
                  id="companyName"
                  placeholder="E.g. Boostly Pizzeria"
                  value={formData.companyName}
                  onChange={handleInputChange('companyName')}
                  className={`bg-white border-gray-300 ${errors.companyName ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.companyName && (
                  <p className="text-red-300 text-xs mt-1">{errors.companyName}</p>
                )}
              </div>

              {/* Website URL */}
              <div>
                <label htmlFor="websiteUrl" className="text-white text-sm mb-1 block">
                  Website URL
                </label>
                <Input
                  id="websiteUrl"
                  type="text"
                  placeholder="example.com"
                  value={formData.websiteUrl}
                  onChange={handleInputChange('websiteUrl')}
                  className={`bg-white border-gray-300 ${errors.websiteUrl ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.websiteUrl && (
                  <p className="text-red-300 text-xs mt-1">{errors.websiteUrl}</p>
                )}
              </div>

              {/* Point of Sale */}
              <div>
                <label htmlFor="pointOfSale" className="text-white text-sm mb-1 block">
                  Point of Sale System
                </label>
                <Input
                  id="pointOfSale"
                  placeholder="E.g. Square, Toast, Clover"
                  value={formData.pointOfSale}
                  onChange={handleInputChange('pointOfSale')}
                  className={`bg-white border-gray-300 ${errors.pointOfSale ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.pointOfSale && (
                  <p className="text-red-300 text-xs mt-1">{errors.pointOfSale}</p>
                )}
              </div>

              {/* SMS Opt-in */}
              <div className="flex items-start gap-2 mt-4">
                <Checkbox
                  id="smsOptIn"
                  checked={formData.smsOptIn}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, smsOptIn: checked as boolean }))
                  }
                  className="mt-1 border-white bg-white/20 data-[state=checked]:bg-white data-[state=checked]:text-[#28008F]"
                />
                <label
                  htmlFor="smsOptIn"
                  className="text-xs text-white/90 cursor-pointer leading-tight"
                >
                  Yes, send me SMS for meetings, offers, and info about Boostly. Rates may apply.
                </label>
              </div>

              {/* Error message */}
              {submissionError && (
                <div className="text-red-300 text-sm">
                  An error occurred while submitting. Please try again.
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-[#C8B6FF] hover:bg-[#B8A6EF] text-[#28008F] font-semibold py-5 text-base transition-all duration-200 mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scheduling...
                  </span>
                ) : (
                  'Schedule a Demo'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/boostlylogo.png" alt="Boostly" className="h-6 w-6" />
                <span className="font-bold text-lg">Boostly</span>
              </div>
              <p className="text-sm text-gray-600">
                Helping restaurants grow with automated text marketing.
              </p>
            </div>

            {/* Sitemap */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Sitemap</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Home</a></li>
                <li><a href="#" className="hover:text-gray-900">How it Works</a></li>
                <li><a href="#" className="hover:text-gray-900">Reviews</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>support@boostly.com</li>
                <li>1-800-BOOSTLY</li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-600">
            © 2025 Boostly. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}