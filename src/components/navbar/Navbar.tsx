import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Recycle, 
  Truck, 
  MapPin, 
  Award, 
  AlertTriangle, 
  User,
  Menu,
  X
} from 'lucide-react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Segregation', path: '/waste-classification', icon: <Recycle className="w-5 h-5" /> },
    { name: 'Collection', path: '/collection', icon: <Truck className="w-5 h-5" /> },
    { name: 'Location', path: '/location', icon: <MapPin className="w-5 h-5" /> },
    { name: 'Rewards', path: '/rewards', icon: <Award className="w-5 h-5" /> },
    { name: 'Report', path: '/report', icon: <AlertTriangle className="w-5 h-5" /> },
    { name: 'Profile', path: '/profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        {/* Decorative header background with gradient and pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10" 
               style={{ 
                 backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
               }}>
          </div>
          {/* Subtle geometric shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        </div>
        
        {/* Navbar content with improved alignment */}
        <div className="relative container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 group-hover:bg-white/30 relative">
              {/* Glowing effect */}
              <div className="absolute inset-0 rounded-full bg-white/30 blur-md animate-pulse"></div>
              {/* Logo with updated size and circular mask */}
              <div className="w-9 h-9 relative z-10 overflow-hidden rounded-full">
                <img src="/1.png" alt="EcoTrack Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg text-white">EcoTrack</span>
              <p className="text-xs text-white/80 -mt-1">Sustainable waste management</p>
            </div>
          </Link>
          
          <button 
            className="md:hidden relative z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
          
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  isActive(item.path)
                    ? "bg-white/20 text-white font-medium backdrop-blur-sm"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Subtle shadow/gradient at the bottom of navbar */}
        <div className="h-4 bg-gradient-to-b from-primary/10 to-transparent"></div>
      </nav>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-16 bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex flex-col p-4 space-y-2 animate-slide-down">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors animate-slide-left`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className={`p-2 rounded-full ${isActive(item.path) ? "bg-primary text-white" : "bg-muted"}`}>
                  {item.icon}
                </div>
                <span className={`${isActive(item.path) ? "font-medium" : ""}`}>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass z-50 flex justify-around items-center">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center p-2 ${
              isActive(item.path) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
};

export default Navbar;
