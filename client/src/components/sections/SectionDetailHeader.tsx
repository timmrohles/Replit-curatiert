/**
 * ==================================================================
 * SECTION DETAIL HEADER
 * ==================================================================
 * 
 * Wiederverwendbare Header-Komponente für alle Section Detail Pages
 * - Navigation zurück zur Section Library
 * - Navigation zum Admin Content Manager
 * - Section Info (Name, Status, Component Path)
 * 
 * ==================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Layout, Settings, FileCode } from 'lucide-react';

interface SectionDetailHeaderProps {
  sectionName: string;
  componentPath: string;
  status?: 'ready' | 'wip' | 'planned';
  description?: string;
  category?: string;
}

export function SectionDetailHeader({
  sectionName,
  componentPath,
  status = 'ready',
  description,
  category
}: SectionDetailHeaderProps) {
  const statusConfig = {
    ready: { bg: '#70c1b3', label: 'Production Ready' },
    wip: { bg: '#FFE066', label: 'Work in Progress', textColor: '#2a2a2a' },
    planned: { bg: '#E5E7EB', label: 'Planned', textColor: '#2a2a2a' }
  };

  const statusStyle = statusConfig[status];

  return (
    <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top Row: Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link 
              to="/dashboard/sections" 
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">Section Library</span>
            </Link>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <Link 
              to="/sys-mgmt-xK9/content-manager?tab=sections" 
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="font-semibold">Content Manager</span>
            </Link>
          </div>

          {/* Status Badge */}
          <div
            className="px-4 py-2 rounded-full font-semibold text-sm"
            style={{ 
              backgroundColor: statusStyle.bg,
              color: statusStyle.textColor || '#ffffff'
            }}
          >
            {statusStyle.label}
          </div>
        </div>

        {/* Bottom Row: Section Info */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Layout className="w-6 h-6 text-coral" />
            <h1 
              className="text-3xl font-bold text-gray-900" 
              style={{ fontFamily: 'Fjalla One' }}
            >
              {sectionName}
            </h1>
            {category && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                {category}
              </span>
            )}
          </div>

          {description && (
            <p className="text-gray-600 mb-3 max-w-3xl">
              {description}
            </p>
          )}

          {/* Component Path */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg inline-flex">
            <FileCode className="w-4 h-4 text-gray-500" />
            <code className="text-sm text-gray-700 font-mono">
              {componentPath}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
