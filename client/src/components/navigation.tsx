import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import boostlyLogo from "@assets/boostlylogo_1752026376541.png";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a 
              href="https://boostly.com" 
              className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity cursor-pointer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img 
                src={boostlyLogo} 
                alt="Boostly Logo" 
                className="h-8 w-auto mr-3"
              />
              <span className="text-xl font-bold text-gray-900">Boostly Restaurant Health Scan</span>
            </a>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-[#28008F] transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-[#28008F] transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-gray-700 hover:text-[#28008F] transition-colors">
              About
            </a>
            <Button className="bg-[#28008F] hover:bg-[#28008F]/90">
              Get Started
            </Button>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-[#28008F]">
              Features
            </a>
            <a href="#pricing" className="block px-3 py-2 text-gray-700 hover:text-[#28008F]">
              Pricing
            </a>
            <a href="#about" className="block px-3 py-2 text-gray-700 hover:text-[#28008F]">
              About
            </a>
            <Button className="w-full mt-2 bg-[#28008F] hover:bg-[#28008F]/90">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
