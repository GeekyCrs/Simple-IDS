"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Create context for sidebar state
type SidebarState = 'expanded' | 'collapsed';

interface SidebarContextType {
  state: SidebarState;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

// Provider component
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SidebarState>('expanded');

  const toggleSidebar = () => {
    setState(prev => prev === 'expanded' ? 'collapsed' : 'expanded');
  };

  return (
    <SidebarContext.Provider value={{ state, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Custom hook for accessing sidebar state
export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

// Sidebar component
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
  collapsible?: "static" | "icon" | "wide";
  variant?: "sidebar";
  children?: React.ReactNode;
}

export function Sidebar({
  side = "left",
  collapsible = "static",
  variant,
  className,
  children,
  ...props
}: SidebarProps) {
  const { state } = useSidebar();
  
  return (
    <aside
      className={cn(
        "flex flex-col",
        variant === "sidebar" && "w-64 h-screen",
        state === 'collapsed' && collapsible === "icon" && "w-16",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

// Sidebar Header
export function SidebarHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center", className)} {...props}>
      {children}
    </div>
  );
}

// Sidebar Content
export function SidebarContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1", className)} {...props}>
      {children}
    </div>
  );
}

// Sidebar Footer
export function SidebarFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

// Sidebar Menu
export function SidebarMenu({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <nav className={cn("space-y-1", className)} {...props}>
      {children}
    </nav>
  );
}

// Sidebar Menu Item
export function SidebarMenuItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

// Sidebar Menu Button
interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

export function SidebarMenuButton({
  className,
  children,
  isActive,
  ...props
}: SidebarMenuButtonProps) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md group transition-colors",
        isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Sidebar Trigger
export function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar();
  
  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
      aria-label="Toggle sidebar"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-menu"
      >
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
      </svg>
    </button>
  );
}