import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThankYouPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/boostlylogo.png" alt="Boostly" className="h-8 w-8" />
            <span className="font-bold text-xl text-gray-900">Boostly</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-gray-900">
            Thank You!
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your demo request has been received. One of our restaurant marketing experts will be in touch within the next 24 hours to schedule your personalized demo.
          </p>

          {/* What to expect */}
          <div className="mt-8 bg-gray-50 rounded-xl p-8 text-left max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              What happens next?
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Personalized Demo</p>
                  <p className="text-sm text-gray-600">We'll show you exactly how Boostly can help your restaurant grow</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Free Marketing Analysis</p>
                  <p className="text-sm text-gray-600">Get insights on your current online presence and opportunities</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Custom Strategy</p>
                  <p className="text-sm text-gray-600">Receive a tailored plan to increase orders and reviews</p>
                </div>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-[#28008F] hover:bg-[#1f0068] text-white px-6 py-3"
            >
              Return to Home
            </Button>
            <Button
              onClick={() => window.location.href = 'https://www.boostly.com'}
              variant="outline"
              className="border-gray-300 text-gray-700 px-6 py-3"
            >
              Visit Boostly.com
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}