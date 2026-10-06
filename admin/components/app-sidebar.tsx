"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CreditCard, 
  BarChart3, 
  Settings,
  Database,
  Activity,
  UserCheck,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';

const adminSections = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
      { title: 'System Health', url: '/dashboard/monitoring', icon: Activity },
    ]
  },
  {
    title: 'Management',
    items: [
      { title: 'Users', url: '/dashboard/users', icon: Users },
      { title: 'Associations', url: '/dashboard/associations', icon: Building2 },
      { title: 'Payments', url: '/dashboard/payments', icon: CreditCard },
    ]
  },
  {
    title: 'Administration',
    items: [
      { title: 'Admin Users', url: '/dashboard/admin-users', icon: UserCheck },
      { title: 'Security', url: '/dashboard/security', icon: Shield },
      { title: 'Database', url: '/dashboard/database', icon: Database },
      { title: 'Settings', url: '/dashboard/settings', icon: Settings },
    ]
  }
];

export function AppSidebar() {
  const { user, logout } = useAuth();

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 p-3 md:p-6">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="h-4 w-4 md:h-6 md:w-6 text-white" />
          </div>
          <div className="hidden md:block">
            <h2 className="font-bold text-lg text-gray-900">Alumzi Admin</h2>
            <p className="text-xs text-gray-500 font-medium">Control Center</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 md:px-4 py-3 md:py-6">
        {adminSections.map((section) => (
          <SidebarGroup key={section.title} className="mb-4 md:mb-8">
            <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 md:mb-3 hidden md:block">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="group">
                      <Link 
                        href={item.url}
                        className="flex items-center space-x-2 md:space-x-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 font-medium"
                      >
                        <item.icon className="h-4 w-4 md:h-5 md:w-5 text-gray-500 group-hover:text-gray-700 flex-shrink-0" />
                        <span className="text-xs md:text-sm hidden md:block">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-2 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs md:text-sm font-semibold text-gray-700">
                {user?.name?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0 hidden md:block">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {user?.role?.replace('_', ' ')}
                </Badge>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full mt-2 md:mt-3 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-left"
        >
          <span className="hidden md:inline">Sign out</span>
          <span className="md:hidden">Exit</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}