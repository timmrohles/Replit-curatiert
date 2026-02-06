/**
 * SECTION DETAIL PAGE: Footer Component
 */

import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { Footer } from '../../components/layout/Footer';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';

export default function FooterPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Footer Component"
        componentPath="/components/Footer.tsx"
        status="ready"
        description="Website footer with links, social media, newsletter signup, and legal information."
        category="Header/Footer"
      />

      {/* View Mode Controls */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Preview Mode</div>
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

      {/* Live Preview */}
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Component Display - Clean, no preview borders */}
          <div className="bg-white">
            <div 
              className={`mx-auto transition-all ${
                viewMode === 'mobile' ? 'max-w-[600px]' : 'max-w-[1400px]'
              }`}
            >
              <div className={viewMode === 'mobile' ? 'px-4 py-4' : 'px-6 py-6'}>
                <Footer />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <h3 className="font-bold mb-2 text-yellow-900">📝 Implementation Notes</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Multi-Column Layout mit Navigation</li>
              <li>• Social Media Links</li>
              <li>• Newsletter Signup Form</li>
              <li>• Copyright & rechtliche Links (Impressum, Datenschutz)</li>
              <li>• Responsive Design</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}