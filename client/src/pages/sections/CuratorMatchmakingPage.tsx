/**
 * SECTION DETAIL PAGE: Curator Matchmaking
 */

import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { CuratorMatchmaking } from '../../components/homepage/CuratorMatchmaking';
import { SectionDetailHeader } from '../../components/sections/SectionDetailHeader';

export default function CuratorMatchmakingPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <SectionDetailHeader
        sectionName="Curator Matchmaking"
        componentPath="/components/homepage/CuratorMatchmaking.tsx"
        status="ready"
        description="Interactive quiz to match users with curators based on their reading preferences."
        category="Special"
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
              <div className={viewMode === 'mobile' ? 'px-4 py-6' : 'px-8 py-8'}>
                <CuratorMatchmaking />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h3 className="font-bold mb-2 text-green-900">✨ Features</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Multi-Step Matching Flow (Mood/Genre/Preferences)</li>
              <li>• Swipe Cards mit Like/Dislike</li>
              <li>• Tag-basiertes Matching-Algorithmus</li>
              <li>• Motion Animations (Framer Motion)</li>
              <li>• Personalisierte Buch-Empfehlungen</li>
              <li>• Cart & Favorites Integration</li>
            </ul>
          </div>

          {/* Notes */}
          <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <h3 className="font-bold mb-2 text-yellow-900">📝 Implementation Notes</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Nutzt motion/react für Card Animations</li>
              <li>• Matching-Logik basiert auf Tag-Overlap</li>
              <li>• State Management für User Preferences</li>
              <li>• Mobile-First Design</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}