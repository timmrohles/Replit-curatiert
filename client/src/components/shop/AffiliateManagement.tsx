import React, { useState, useEffect, useCallback } from 'react';
import { useSafeNavigate } from '../../utils/routing';

interface AffiliatePartner {
  id: string;
  name: string;
  logoUrl: string;
  urlTemplate: string;
  partnerId: string;
  type: 'new' | 'used';
  visible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export function AffiliateManagement() {
  const navigate = useSafeNavigate();
  const [affiliates, setAffiliates] = useState<AffiliatePartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<AffiliatePartner>>({
    name: '',
    logoUrl: '',
    urlTemplate: '',
    partnerId: '',
    type: 'new',
    visible: true,
    order: 0
  });

  const apiUrl = '/api';

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/affiliates`, {
        headers: {
        }
      });
      const data = await response.json();
      if (data.success) {
        setAffiliates(data.data);
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      name: '',
      logoUrl: '',
      urlTemplate: '',
      partnerId: '',
      type: 'new',
      visible: true,
      order: Math.max(...affiliates.map(a => a.order), 0) + 1
    });
  };

  const handleEdit = (affiliate: AffiliatePartner) => {
    setEditingId(affiliate.id);
    setIsCreating(false);
    setFormData(affiliate);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${apiUrl}/affiliates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchAffiliates();
        setEditingId(null);
        setIsCreating(false);
        setFormData({
          name: '',
          logoUrl: '',
          urlTemplate: '',
          partnerId: '',
          type: 'new',
          visible: true,
          order: 0
        });
      }
    } catch (error) {
      console.error('Error saving affiliate:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Affiliate-Partner wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/affiliates/${id}`, {
        method: 'DELETE',
        headers: {
        }
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchAffiliates();
      }
    } catch (error) {
      console.error('Error deleting affiliate:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      name: '',
      logoUrl: '',
      urlTemplate: '',
      partnerId: '',
      type: 'new',
      visible: true,
      order: 0
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-600">Lade Affiliate-Partner...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/sys-mgmt-xK9/content-manager')}
        className="mb-6 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zum Admin
      </button>
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 
            className="text-[32px] text-[#3A3A3A] mb-2"
            style={{ fontFamily: 'Fjalla One', letterSpacing: '0.02em' }}
          >
            Affiliate Partner Verwaltung
          </h1>
          <p className="text-gray-600 text-sm">
            Verwalten Sie alle Affiliate-Partner für neue und gebrauchte Bücher
          </p>
        </div>
        
        {!isCreating && !editingId && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#247ba0] text-white rounded-lg hover:bg-[#1e6485] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Neuer Partner
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="mb-6 p-6 bg-white rounded-lg border-2 border-[#247ba0]">
          <h3 
            className="text-[20px] text-[#3A3A3A] mb-4"
            style={{ fontFamily: 'Fjalla One', letterSpacing: '0.02em' }}
          >
            {isCreating ? 'Neuer Affiliate-Partner' : 'Partner bearbeiten'}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#247ba0]"
                placeholder="z.B. Bücher.de"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="text"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#247ba0]"
                placeholder="https://example.com/logo.svg"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL Template *
              </label>
              <input
                type="text"
                value={formData.urlTemplate || ''}
                onChange={(e) => setFormData({ ...formData, urlTemplate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#247ba0]"
                placeholder="https://example.com/shop/{ISBN}"
              />
              <p className="text-xs text-gray-500 mt-1">
                Verwenden Sie {'{ISBN}'} als Platzhalter für die ISBN (ohne Bindestriche)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Partner-ID
              </label>
              <input
                type="text"
                value={formData.partnerId || ''}
                onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#247ba0]"
                placeholder="Ihre Partner/Affiliate-ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Typ
              </label>
              <select
                value={formData.type || 'new'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'new' | 'used' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#247ba0]"
              >
                <option value="new">Neu</option>
                <option value="used">Gebraucht</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sortierung
              </label>
              <input
                type="number"
                value={formData.order || 0}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#247ba0]"
              />
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.visible ?? true}
                  onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                  className="w-5 h-5 text-[#247ba0] border-gray-300 rounded focus:ring-[#247ba0]"
                />
                <span className="ml-2 text-sm font-semibold text-gray-700">
                  Sichtbar
                </span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-[#247ba0] text-white rounded-lg hover:bg-[#1e6485] transition-colors"
            >
              <Save className="w-4 h-4" />
              Speichern
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Affiliates List */}
      <div className="space-y-4">
        {/* New Affiliates */}
        <div>
          <h2 
            className="text-[24px] text-[#3A3A3A] mb-3"
            style={{ fontFamily: 'Fjalla One', letterSpacing: '0.02em' }}
          >
            Neue Bücher
          </h2>
          <div className="space-y-2">
            {affiliates
              .filter(a => a.type === 'new' && a.visible)
              .map(affiliate => (
                <AffiliateCard
                  key={affiliate.id}
                  affiliate={affiliate}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isEditing={editingId === affiliate.id}
                />
              ))}
            {affiliates.filter(a => a.type === 'new' && a.visible).length === 0 && (
              <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
                Keine Partner für neue Bücher vorhanden
              </p>
            )}
          </div>
        </div>
        
        {/* Used Affiliates */}
        <div>
          <h2 
            className="text-[24px] text-[#3A3A3A] mb-3"
            style={{ fontFamily: 'Fjalla One', letterSpacing: '0.02em' }}
          >
            Gebrauchte Bücher
          </h2>
          <div className="space-y-2">
            {affiliates
              .filter(a => a.type === 'used' && a.visible)
              .map(affiliate => (
                <AffiliateCard
                  key={affiliate.id}
                  affiliate={affiliate}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isEditing={editingId === affiliate.id}
                />
              ))}
            {affiliates.filter(a => a.type === 'used' && a.visible).length === 0 && (
              <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
                Keine Partner für gebrauchte Bücher vorhanden
              </p>
            )}
          </div>
        </div>
        
        {/* Hidden Affiliates */}
        {affiliates.filter(a => !a.visible).length > 0 && (
          <div>
            <h2 
              className="text-[24px] text-[#3A3A3A] mb-3"
              style={{ fontFamily: 'Fjalla One', letterSpacing: '0.02em' }}
            >
              Ausgeblendet
            </h2>
            <div className="space-y-2 opacity-60">
              {affiliates
                .filter(a => !a.visible)
                .map(affiliate => (
                  <AffiliateCard
                    key={affiliate.id}
                    affiliate={affiliate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isEditing={editingId === affiliate.id}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AffiliateCardProps {
  affiliate: AffiliatePartner;
  onEdit: (affiliate: AffiliatePartner) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
}

function AffiliateCard({ affiliate, onEdit, onDelete, isEditing }: AffiliateCardProps) {
  return (
    <div 
      className={`p-4 bg-white rounded-lg border-2 ${
        isEditing ? 'border-[#247ba0]' : 'border-gray-200'
      } hover:border-gray-300 transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {affiliate.logoUrl && (
            <img 
              src={affiliate.logoUrl} 
              alt={affiliate.name}
              className="h-8 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{affiliate.name}</h3>
            <p className="text-xs text-gray-500 font-mono truncate">
              {affiliate.urlTemplate}
            </p>
            {affiliate.partnerId && (
              <p className="text-xs text-gray-600 mt-1">
                Partner-ID: <span className="font-mono">{affiliate.partnerId}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${
              affiliate.type === 'new' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {affiliate.type === 'new' ? 'Neu' : 'Gebraucht'}
            </span>
            <span className="text-xs text-gray-500">#{affiliate.order}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onEdit(affiliate)}
            className="p-2 text-gray-600 hover:text-[#247ba0] hover:bg-gray-100 rounded transition-colors"
            title="Bearbeiten"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(affiliate.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Löschen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}