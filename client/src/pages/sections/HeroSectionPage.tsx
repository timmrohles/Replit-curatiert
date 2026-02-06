/**
 * ==================================================================
 * HERO SECTION - DETAIL PAGE
 * ==================================================================
 */

import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { HeroSection } from '../../components/sections/HeroSection.section';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';

export default function HeroSectionPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Hero Section"
        componentPath="/components/sections/HeroSection.tsx"
        status="ready"
        description="Large hero banner with gradient background, stats, and CTA button. Perfect for landing pages and above-the-fold content."
        category="Above the Fold"
      />

      {/* View Mode Controls */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Preview Mode
            </div>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-semibold">Desktop</span>
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-semibold">Mobile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Component Display */}
      <div className="bg-white">
        <div 
          className={`mx-auto transition-all ${
            viewMode === 'mobile' ? 'max-w-[600px]' : 'max-w-[1400px]'
          }`}
          style={{ 
            boxShadow: viewMode === 'mobile' ? '0 0 50px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <HeroSection 
            onNavigateToCreatorDashboard={() => console.log('Navigate to creator dashboard')}
          />
        </div>
      </div>
    </div>
  );
}