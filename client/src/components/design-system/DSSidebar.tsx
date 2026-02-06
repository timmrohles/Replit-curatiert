import { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { DSText } from './DSTypography';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, active = false, collapsed = false, onClick }: SidebarItemProps) {
  const baseStyles = "flex items-center gap-3 px-4 h-12 rounded-[var(--ds-radius-md)] transition-all duration-200 cursor-pointer";
  const stateStyles = active
    ? "bg-[var(--ds-accent-slate-blue)] text-white"
    : "text-[var(--ds-text-secondary)] hover:bg-[var(--ds-hover-overlay)] hover:text-[var(--ds-text-primary)]";

  return (
    <div
      className={`${baseStyles} ${stateStyles}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      <div className="w-5 h-5 flex-shrink-0">{icon}</div>
      {!collapsed && (
        <DSText variant="label" color={active ? 'inverse' : 'secondary'} as="span">
          {label}
        </DSText>
      )}
    </div>
  );
}

interface DSSidebarProps {
  defaultCollapsed?: boolean;
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

export function DSSidebar({ defaultCollapsed = false, activeItem = 'dashboard', onItemClick }: DSSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { id: 'buchreihen', icon: <BookOpen />, label: 'Meine Buchreihen' },
    { id: 'analytics', icon: <BarChart3 />, label: 'Analytics' },
    { id: 'settings', icon: <Settings />, label: 'Einstellungen' },
    { id: 'help', icon: <HelpCircle />, label: 'Hilfe' },
  ];

  return (
    <aside
      className={`h-screen bg-[var(--ds-bg-primary)] border-r border-[var(--ds-border-default)] flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[var(--ds-sidebar-collapsed-width)]' : 'w-[var(--ds-sidebar-width)]'
      }`}
    >
      {/* Logo / Brand */}
      <div className="h-[var(--ds-header-height)] flex items-center px-4 border-b border-[var(--ds-border-default)]">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--ds-brand-deep-blue)] rounded-[var(--ds-radius-md)] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <DSText variant="label" color="primary" as="span">
              Creator Dashboard
            </DSText>
          </div>
        ) : (
          <div className="w-8 h-8 bg-[var(--ds-brand-deep-blue)] rounded-[var(--ds-radius-md)] flex items-center justify-center mx-auto">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeItem === item.id}
            collapsed={collapsed}
            onClick={() => onItemClick?.(item.id)}
          />
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[var(--ds-border-default)] space-y-1">
        <SidebarItem
          icon={<LogOut />}
          label="Abmelden"
          collapsed={collapsed}
        />
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center h-10 rounded-[var(--ds-radius-md)] hover:bg-[var(--ds-hover-overlay)] transition-colors"
          aria-label={collapsed ? "Sidebar erweitern" : "Sidebar einklappen"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-[var(--ds-text-secondary)]" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-[var(--ds-text-secondary)]" />
          )}
        </button>
      </div>
    </aside>
  );
}