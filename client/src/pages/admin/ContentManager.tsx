import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSafeNavigate } from '../../utils/routing';
import { ArrowLeft, Settings, ExternalLink, LogOut, Layout, Plus, X, Upload, Save, Edit2, Trash2 } from 'lucide-react';
import { getErrorMessage, logError } from '../../utils/errorHelpers';

// ✅ LAZY LOAD: Heavy admin components
const AdminNavigationV2 = lazy(() => import('../../components/admin/AdminNavigationV2').then(m => ({ default: m.AdminNavigationV2 })));
const PagesTabContent = lazy(() => import('../../components/admin/PagesTabContent').then(m => ({ default: m.PagesTabContent })));
const AdminSettings = lazy(() => import('../../components/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const CategoryCardsManager = lazy(() => import('../../components/admin/CategoryCardsManager').then(m => ({ default: m.CategoryCardsManager })));
const AdminAwardsNeon = lazy(() => import('../../components/admin/AdminAwardsNeon').then(m => ({ default: m.AdminAwardsNeon })));
const AdminTagsNeon = lazy(() => import('../../components/admin/AdminTagsNeon').then(m => ({ default: m.AdminTagsNeon })));
const AdminPersons = lazy(() => import('../../components/admin/AdminPersons').then(m => ({ default: m.AdminPersons })));
const AdminBooksNeon = lazy(() => import('../../components/admin/AdminBooksNeon').then(m => ({ default: m.AdminBooksNeon })));
const CuratorsManager = lazy(() => import('../../components/admin/CuratorsManager').then(m => ({ default: m.CuratorsManager })));
const AdminStorefronts = lazy(() => import('../../components/admin/AdminStorefronts').then(m => ({ default: m.AdminStorefronts })));
const Diagnostics = lazy(() => import('../admin/Diagnostics').then(m => ({ default: m.Diagnostics })));
const UserModulesManager = lazy(() => import('../../components/admin/UserModulesManager').then(m => ({ default: m.UserModulesManager })));
const PasswordWarningBanner = lazy(() => import('../../components/admin/PasswordWarningBanner').then(m => ({ default: m.PasswordWarningBanner })));
const SiteBannerTab = lazy(() => import('../../components/admin/SiteBannerTab').then(m => ({ default: m.SiteBannerTab })));
const AdminAffiliate = lazy(() => import('../../components/admin/AdminAffiliate').then(m => ({ default: m.AdminAffiliate })));
const AdminAuthorRequests = lazy(() => import('../../components/admin/AdminAuthorRequests').then(m => ({ default: m.AdminAuthorRequests })));
const ContentReportsTab = lazy(() => import('../../components/admin/ContentReportsTab').then(m => ({ default: m.ContentReportsTab })));
const AdminEventsTab = lazy(() => import('../../components/admin/AdminEventsTab').then(m => ({ default: m.AdminEventsTab })));
const AdminContentSources = lazy(() => import('../../components/admin/AdminContentSources').then(m => ({ default: m.AdminContentSources })));

// ✅ Import types and API functions
import type { Book, Curator, Tag, ONIXTag, MenuItem, Section, Page } from '../../utils/api';
import { 
  getAllBooks, 
  getAllCurators, 
  getAllONIXTags, 
  getAllMenuItems, 
  getAllPages,
  saveBook,
  saveCurator,
  deleteCurator,
  uploadCuratorAvatar,
  saveMenuItem,
  deleteMenuItem,
  saveSection,
  deleteSection,
  savePage,
  deletePage,
  getAllSections,
  moveSection
} from '../../utils/api';
import { TabErrorBoundary } from '../../components/admin/TabErrorBoundary';

/**
 * Content Manager - Admin Dashboard
 * Hier können Admins Bücher, Kuratoren, Tags und Navigation verwalten
 * 
 * VERSION: 3.0.0 - SECTIONS TAB V3 CACHE-BUSTING (2026-01-19)
 */

// Drag and Drop Item Types
const ItemTypes = {
  SUBCATEGORY: 'subcategory',
  MENU_ITEM: 'menu_item'
};

export function ContentManager() {
  const safeNav = useSafeNavigate(); // ✅ SAFE ROUTING
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ✅ CRASH-SAFE: Simple auth check without external hook
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
    // Check for NEON token (new system) or fallback to old token
    const token = localStorage.getItem('admin_neon_token') || localStorage.getItem('admin_token');
    if (!token) {
      console.log('⚠️ ContentManager: No token found - redirecting to login...');
      // 🔧 FIX: Immediate redirect to avoid unnecessary rendering
      setAuthLoading(false);
      safeNav('/sys-mgmt-xK9/login');
      return;
    }
    console.log('✅ ContentManager: Token found, user authenticated');
    setIsAuthenticated(true);
    setAuthLoading(false);
  }, []); // ✅ EMPTY DEPS - only run once on mount, not on every safeNav change
  
  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_neon_token');
    localStorage.removeItem('admin_neon_expires');
    localStorage.removeItem('admin_last_activity');
    safeNav('/sys-mgmt-xK9/login'); // ✅ SAFE ROUTING
  };
  
  // ✅ URL-based tab navigation
  type TabType = 'books' | 'curators' | 'storefronts' | 'navigation' | 'pages' | 'category-cards' | 'awards' | 'tags' | 'persons' | 'user-modules' | 'author-requests' | 'settings' | 'diagnostics' | 'affiliates' | 'sections' | 'site-banner' | 'meldungen' | 'events' | 'content-sources';
  const validTabs: TabType[] = ['books', 'curators', 'storefronts', 'navigation', 'pages', 'category-cards', 'awards', 'tags', 'persons', 'user-modules', 'author-requests', 'settings', 'diagnostics', 'affiliates', 'sections', 'site-banner', 'meldungen', 'events', 'content-sources'];
  
  const tabParam = searchParams.get('tab') as TabType;
  const activeTab: TabType = tabParam && validTabs.includes(tabParam) ? tabParam : 'books';
  
  // ✅ FIXED: Initialize URL with default tab ONLY ONCE on mount
  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'books' }, { replace: true });
    }
  }, []); // ✅ EMPTY DEPS - runs only once on mount
  
  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab });
  };
  const [books, setBooks] = useState<Book[]>([]);
  const [curators, setCurators] = useState<Curator[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [onixTags, setOnixTags] = useState<ONIXTag[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit Mode States
  const [editingBook, setEditingBook] = useState<Partial<Book> | null>(null);
  const [editingCurator, setEditingCurator] = useState<Partial<Curator> | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<Partial<MenuItem> | null>(null);
  const [editingSection, setEditingSection] = useState<Partial<Section> | null>(null);
  const [editingPage, setEditingPage] = useState<Partial<Page> | null>(null);
  
  // Avatar Upload States
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // 📂 Extract all categories from menu structure
  const getAllCategoryOptions = (): Array<{ value: string; label: string; isSubcategory: boolean }> => {
    const categories: Array<{ value: string; label: string; isSubcategory: boolean }> = [];
    
    menuItems
      // Removed .filter(item => item.enabled) to show all categories in sections dropdown
      .forEach((item) => {
        // Add main category
        categories.push({
          value: item.name,
          label: item.enabled ? item.name : `${item.name} (deaktiviert)`,
          isSubcategory: false
        });
        
        // Add subcategories
        item.subcategories?.forEach((sub) => {
          categories.push({
            value: sub.title,
            label: `${item.name} → ${sub.title}`,
            isSubcategory: true
          });
        });
      });
    
    return categories;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'books') {
        // ⚡ Parallel loading for better performance
        const [booksData, onixData] = await Promise.all([
          getAllBooks(),
          getAllONIXTags()
        ]);
        setBooks(booksData);
        setOnixTags(onixData);
      } else if (activeTab === 'curators') {
        const data = await getAllCurators();
        setCurators(data);
      } else if (activeTab === 'navigation') {
        // ⚡ Parallel loading for better performance
        const [menuData, pagesData] = await Promise.all([
          getAllMenuItems(),
          getAllPages()
        ]);
        // Ensure items are sorted by order
        const sortedData = [...menuData].sort((a, b) => (a.order || 0) - (b.order || 0));
        setMenuItems(sortedData);
        setPages(pagesData);
      } else if (activeTab === 'pages') {
        const data = await getAllPages();
        setPages(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  // ✅ FIXED: Load data when tab changes, but prevent infinite loops
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated, authLoading]); // loadData is stable, safe to omit

  const handleSaveBook = async () => {
    if (!editingBook || !editingBook.title || !editingBook.author) {
      alert('Bitte Titel und Autor ausfüllen');
      return;
    }

    const bookData: Book = {
      id: editingBook.id || `book-${Date.now()}`,
      title: editingBook.title,
      author: editingBook.author,
      publisher: editingBook.publisher || '',
      year: editingBook.year || '',
      isbn: editingBook.isbn || '',
      coverUrl: editingBook.coverUrl || '',
      tags: [], // Deprecated: Use onixTagIds instead
      onixTagIds: editingBook.onixTagIds || [],
      availability: editingBook.availability || 'Verfügbar',
      price: editingBook.price || '',
      curatorId: editingBook.curatorId || '',
      createdAt: editingBook.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await saveBook(bookData);
    if (result) {
      alert('Buch gespeichert!');
      setEditingBook(null);
      loadData();
    }
  };

  const handleAvatarUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Ungültiges Dateiformat. Nur JPEG, PNG und WebP sind erlaubt.');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Datei zu groß. Maximale Größe ist 2MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadCuratorAvatar(file);
      setEditingCurator({ ...editingCurator, avatar: url });
      setAvatarPreview(url);
      alert('✅ Avatar erfolgreich hochgeladen!');
    } catch (error: unknown) {
      logError('Avatar upload error', error);
      alert(`❌ Fehler beim Hochladen: ${getErrorMessage(error, 'Unbekannter Fehler')}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveCurator = async () => {
    if (!editingCurator || !editingCurator.name) {
      alert('Bitte Name ausfüllen');
      return;
    }

    const curatorData: any = {
      id: editingCurator.id || `curator-${Date.now()}`,
      name: editingCurator.name,
      avatar_url: editingCurator.avatar_url || editingCurator.avatar || '',
      bio: editingCurator.bio || '',
      focus: editingCurator.focus || '',
      visible: editingCurator.visible ?? true,
      display_order: editingCurator.display_order ?? 0,
      follower_count: editingCurator.follower_count ?? 0,
      curation_count: editingCurator.curation_count ?? 0,
      book_count: editingCurator.book_count ?? 0,
    };

    const result = await saveCurator(curatorData);
    if (result) {
      alert('Kurator gespeichert!');
      setEditingCurator(null);
      setAvatarPreview(null);
      loadData();
    }
  };

  const handleDeleteCurator = async (id: string) => {
    if (confirm('Möchtest du diesen Kurator wirklich löschen?')) {
      const result = await deleteCurator(id);
      if (result) {
        alert('Kurator gelöscht!');
        loadData();
      }
    }
  };

  const handleSaveMenuItem = async () => {
    if (!editingMenuItem || !editingMenuItem.name) {
      alert('Bitte Name ausfüllen');
      return;
    }

    const menuItemData: MenuItem = {
      id: editingMenuItem.id || `nav-${Date.now()}`,
      name: editingMenuItem.name,
      order: editingMenuItem.order || 0,
      enabled: editingMenuItem.enabled !== undefined ? editingMenuItem.enabled : true,
      pageId: editingMenuItem.pageId, // ✅ FIX: pageId wird jetzt gespeichert
      subcategories: editingMenuItem.subcategories || [],
      createdAt: editingMenuItem.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await saveMenuItem(menuItemData);
    if (result) {
      alert('Menüpunkt gespeichert!');
      setEditingMenuItem(null);
      loadData();
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (confirm('Möchtest du diesen Menüpunkt wirklich löschen?')) {
      const result = await deleteMenuItem(id);
      if (result) {
        alert('Menüpunkt gelöscht!');
        loadData();
      }
    }
  };

  const handleMoveMenuItem = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = menuItems.findIndex(item => item.id === id);
    
    if (currentIndex === -1) return;

    // Can't move up if first, can't move down if last
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === menuItems.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    console.log(`🔄 Verschiebe "${menuItems[currentIndex].name}" von Position ${currentIndex + 1} → ${newIndex + 1}`);
    
    // Create a copy of the array
    const newMenuItems = [...menuItems];
    
    // Swap the items
    const temp = newMenuItems[currentIndex];
    newMenuItems[currentIndex] = newMenuItems[newIndex];
    newMenuItems[newIndex] = temp;
    
    // Update order property for ALL items based on their new position
    const reorderedItems = newMenuItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    // Immediately update UI optimistically
    setMenuItems(reorderedItems);
    
    // Save ALL items to backend to ensure consistency
    try {
      // Save all items in parallel
      await Promise.all(
        reorderedItems.map(item => saveMenuItem(item))
      );
      
      console.log('✅ Reihenfolge gespeichert!');
      
      // Refresh the data to ensure sync with backend
      const freshData = await getAllMenuItems();
      const sortedData = [...freshData].sort((a, b) => (a.order || 0) - (b.order || 0));
      setMenuItems(sortedData);
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      // Reload to revert to backend state
      await loadData();
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection || !editingSection.id || !editingSection.title || !editingSection.sectionType) {
      alert('Bitte ID, Titel und Section-Typ ausfüllen');
      return;
    }

    const sectionData: Section = {
      id: editingSection.id,
      title: editingSection.title,
      curatorId: editingSection.curatorId || null,
      curatorType: editingSection.curatorType || 'redaktion',
      reason: editingSection.reason || '',
      category: editingSection.category || '',
      tags: editingSection.tags || [],
      bookIds: editingSection.bookIds || [],
      sectionType: editingSection.sectionType,
      status: editingSection.status || 'active',
      publishDate: editingSection.publishDate || new Date().toISOString(),
      archiveDate: editingSection.archiveDate || null,
      order: editingSection.order || sections.length + 1,
      createdAt: editingSection.createdAt || new Date().toISOString(),
      updatedAt: editingSection.updatedAt || new Date().toISOString()
    };

    const result = await saveSection(sectionData);
    if (result) {
      alert('Section gespeichert!');
      setEditingSection(null);
      loadData();
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (confirm('Möchtest du diesen Abschnitt wirklich löschen?')) {
      const result = await deleteSection(id);
      if (result) {
        alert('Abschnitt gelöscht!');
        loadData();
      }
    }
  };

  const handleSavePage = async () => {
    if (!editingPage || !editingPage.slug) {
      alert('Bitte Slug ausfüllen');
      return;
    }

    // 🔍 DEBUG: Log the editing page state
    console.log('🔍 DEBUG handleSavePage - editingPage:', editingPage);
    console.log('🔍 DEBUG handleSavePage - editingPage.id:', editingPage.id);

    // ✅ Nur die Felder senden, die das Backend erwartet
    const pageData: Partial<Page> = {
      slug: editingPage.slug,
      type: editingPage.type || 'composed',
      template_key: editingPage.template_key || null,
      status: editingPage.status || 'draft',
      visibility: editingPage.visibility || 'visible',
      seo_title: editingPage.seo_title || null,
      seo_description: editingPage.seo_description || null,
      canonical_url: editingPage.canonical_url || null,
      robots: editingPage.robots || 'index,follow',
    };

    // ✅ FIX: Include ID for updates!
    if (editingPage.id) {
      pageData.id = editingPage.id;
    }

    // 🔍 DEBUG: Log the page data being sent
    console.log('🔍 DEBUG handleSavePage - pageData:', pageData);
    console.log('🔍 DEBUG handleSavePage - pageData.id:', pageData.id);

    const result = await savePage(pageData);
    if (result) {
      alert('Seite gespeichert!');
      setEditingPage(null);
      loadData();
    }
  };

  const handleDeletePage = async (id: number) => {
    if (confirm('Möchtest du diese Seite wirklich löschen?')) {
      const result = await deletePage(String(id));
      if (result) {
        alert('Seite gelöscht!');
        loadData();
      }
    }
  };

  const handleMoveSection = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(item => item.id === id);
    
    if (currentIndex === -1) return;

    // Can't move up if first, can't move down if last
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === sections.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    console.log(`🔄 Verschiebe "${sections[currentIndex].name}" von Position ${currentIndex + 1} → ${newIndex + 1}`);
    
    // Create a copy of the array
    const newSections = [...sections];
    
    // Swap the items
    const temp = newSections[currentIndex];
    newSections[currentIndex] = newSections[newIndex];
    newSections[newIndex] = temp;
    
    // Update order property for ALL items based on their new position
    const reorderedItems = newSections.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    // Immediately update UI optimistically
    setSections(reorderedItems);
    
    // Save ALL items to backend to ensure consistency
    try {
      // Save all items in parallel
      await Promise.all(
        reorderedItems.map(item => saveSection({ ...item, displayOrder: item.order }))
      );
      
      console.log('✅ Reihenfolge gespeichert!');
      
      // Refresh the data to ensure sync with backend
      const freshData = await getAllSections();
      setSections(freshData);
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      // Reload to revert to backend state
      await loadData();
    }
  };

  if (authLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}
      >
        <p style={{ color: '#3A3A3A' }}>Lade...</p>
      </div>
    );
  }

  // ❌ BUILD-BLOCKER REMOVED: All DnD components removed for Figma Make publishing
  // DraggableSubcategory and DraggableItem components have been removed
  // Use arrow buttons for reordering instead

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Navigation */}
        <div className="flex gap-3 mb-6 justify-between items-center">
          <button
            onClick={() => safeNav('/')}
            className="px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: '#3A3A3A' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Website
          </button>
          <button
            onClick={() => safeNav('/sys-mgmt-xK9/setup')}
            className="px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: '#3A3A3A' }}
          >
            <Settings className="w-4 h-4" />
            Setup
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: '#3A3A3A' }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                Content Manager
              </h1>
              <p style={{ color: '#3A3A3A' }}>Verwalte Bücher, Kuratoren, Themen und Navigation</p>
            </div>
          </div>
        </div>

        {/* Password Warning */}
        <Suspense fallback={<div />}>
          <PasswordWarningBanner onChangePasswordClick={() => setActiveTab('settings')} />
        </Suspense>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('books')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'books' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            Bücher
          </button>
          <button
            onClick={() => setActiveTab('curators')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'curators' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            Kuratoren
          </button>
          <button
            onClick={() => setActiveTab('storefronts')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'storefronts' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            Bookstores
          </button>
          <button
            onClick={() => setActiveTab('navigation')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'navigation' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            Navigation
          </button>
          <button
            onClick={() => {
              setSearchParams({ tab: 'pages' });
            }}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'pages' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            Seiten
          </button>
          
          <button
            onClick={() => setActiveTab('affiliates')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'affiliates' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            💼 Affiliates
          </button>

          <button
            onClick={() => setActiveTab('content-sources')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'content-sources' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            📻 Content-Quellen
          </button>
          
          <button
            onClick={() => setActiveTab('sections')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'sections' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            📐 Section Library
          </button>
          
          <button
            onClick={() => setActiveTab('awards')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'awards' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            🏆 Auszeichnungen
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'tags' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            🏷️ Themen
          </button>
          <button
            onClick={() => setActiveTab('persons')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'persons' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            👤 Persons
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'settings' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            Einstellungen
          </button>
          <button
            onClick={() => setActiveTab('user-modules')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'user-modules' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            👥 Modul-Anfragen
          </button>
          <button
            onClick={() => setActiveTab('author-requests')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'author-requests' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            Autoren-Anträge
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'diagnostics' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            🔧 Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('site-banner')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'site-banner' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
          >
            🎯 Site Banner
          </button>
          <button
            onClick={() => setActiveTab('meldungen')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'meldungen' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
            data-testid="button-tab-meldungen"
          >
            📋 Meldungen
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className="px-4 py-2 rounded-lg transition-all text-sm"
            style={{
              backgroundColor: activeTab === 'events' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              color: '#3A3A3A',
              fontFamily: 'Fjalla One'
            }}
            data-testid="button-tab-events"
          >
            📅 Veranstaltungen
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl p-6">
          {/* Books Tab */}
          {activeTab === 'books' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Bücher...</div>}>
              <TabErrorBoundary tabName="Bücher">
                <AdminBooksNeon />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Curators Tab */}
          {activeTab === 'curators' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Kuratoren...</div>}>
              <TabErrorBoundary tabName="Kuratoren">
                <CuratorsManager />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Storefronts Tab */}
          {activeTab === 'storefronts' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Bookstores...</div>}>
              <TabErrorBoundary tabName="Bookstores">
                <AdminStorefronts />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Navigation Tab */}
          {activeTab === 'navigation' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Navigation...</div>}>
              <AdminNavigationV2 />
            </Suspense>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Seiten...</div>}>
              <PagesTabContent
                pages={pages}
                loading={loading}
                editingPage={editingPage}
                setEditingPage={setEditingPage}
                handleSavePage={handleSavePage}
                handleDeletePage={handleDeletePage}
                onPagesCreated={loadData}
              />
            </Suspense>
          )}

          {/* Category Cards Tab */}
          {activeTab === 'category-cards' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Karten...</div>}>
              <CategoryCardsManager pages={pages as any} />
            </Suspense>
          )}

          {/* Awards Tab */}
          {activeTab === 'awards' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Awards...</div>}>
              <TabErrorBoundary tabName="Awards">
                <AdminAwardsNeon />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Themen...</div>}>
              <TabErrorBoundary tabName="Themen">
                <AdminTagsNeon />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Persons Tab */}
          {activeTab === 'persons' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Persons...</div>}>
              <TabErrorBoundary tabName="Persons">
                <AdminPersons />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Einstellungen...</div>}>
              <TabErrorBoundary tabName="Settings">
                <AdminSettings />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* User Modules Tab */}
          {activeTab === 'user-modules' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Module...</div>}>
              <TabErrorBoundary tabName="User Modules">
                <UserModulesManager />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Author Requests Tab */}
          {activeTab === 'author-requests' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Autoren-Anträge...</div>}>
              <TabErrorBoundary tabName="Autoren-Anträge">
                <AdminAuthorRequests />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Diagnostics Tab */}
          {activeTab === 'diagnostics' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Diagnostics...</div>}>
              <TabErrorBoundary tabName="Diagnostics">
                <Diagnostics />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Affiliates Tab */}
          {activeTab === 'affiliates' && (
            <Suspense fallback={<div className="p-8 text-center">Lade Affiliate-Verwaltung...</div>}>
              <AdminAffiliate />
            </Suspense>
          )}

          {/* Content Sources Tab */}
          {activeTab === 'content-sources' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Content-Quellen...</div>}>
              <TabErrorBoundary tabName="Content-Quellen">
                <AdminContentSources />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Section Library Tab */}
          {activeTab === 'sections' && (
            <div className="p-8 text-center" style={{ color: '#666666' }}>
              <h2 className="text-2xl mb-4" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                📐 Section Library
              </h2>
              <p className="mb-4">Verwalte wiederverwendbare Sections für deine Homepage.</p>
              <button
                onClick={() => safeNav('/dashboard/sections')}
                className="px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                style={{ backgroundColor: '#FFE066', color: '#2a2a2a' }}
              >
                <Layout className="w-5 h-5" />
                Zur Section Library
              </button>
            </div>
          )}

          {/* Site Banner Tab */}
          {activeTab === 'site-banner' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Banner...</div>}>
              <TabErrorBoundary tabName="Site Banner">
                <SiteBannerTab />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Meldungen Tab */}
          {activeTab === 'meldungen' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Meldungen...</div>}>
              <TabErrorBoundary tabName="Meldungen">
                <ContentReportsTab />
              </TabErrorBoundary>
            </Suspense>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#666666' }}>Lädt Veranstaltungen...</div>}>
              <TabErrorBoundary tabName="Veranstaltungen">
                <AdminEventsTab />
              </TabErrorBoundary>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

// Default export for lazy loading
export default ContentManager;