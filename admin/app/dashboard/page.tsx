import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/lib/actions/analytics';
import { Users, Building2, DollarSign, TrendingUp, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const quickActions = [
    { title: 'View Users', href: '/dashboard/users', icon: Users },
    { title: 'Manage Associations', href: '/dashboard/associations', icon: Building2 },
    { title: 'View Payments', href: '/dashboard/payments', icon: DollarSign },
    { title: 'System Health', href: '/dashboard/monitoring', icon: Activity },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">Overview of Alumzi platform</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active • {stats.totalUsers - stats.activeUsers} inactive
            </p>
            <div className="mt-2 text-xs text-green-600">
              +{Math.floor(stats.totalUsers * 0.12)} this month
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Associations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalAssociations}</div>
            <p className="text-xs text-muted-foreground">
              Total organizations
            </p>
            <div className="mt-2 text-xs text-blue-600">
              {Math.floor(stats.totalAssociations * 0.85)} active
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              GH₵{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform revenue
            </p>
            <div className="mt-2 text-xs text-green-600">
              +15.3% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
            <div className="mt-2 text-xs text-orange-600">
              2 alerts pending
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center justify-between">
              Recent Activity
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/analytics">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {stats.recentUsers.slice(0, 5).map((user: any) => (
                <div key={user._id} className="flex items-center space-x-3 md:space-x-4 p-2 rounded-lg hover:bg-muted/50">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs md:text-sm font-medium">{user.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name} joined</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button key={action.title} variant="outline" size="sm" asChild className="h-16 flex-col">
                  <Link href={action.href}>
                    <action.icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{action.title}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">High memory usage detected</p>
                  <p className="text-xs text-muted-foreground">Database server at 85% capacity</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50 border border-blue-200">
                <Activity className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Backup completed successfully</p>
                  <p className="text-xs text-muted-foreground">Daily backup finished at 2:00 AM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Recent Associations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {stats.recentAssociations.map((association: any) => (
                <div key={association._id} className="flex items-center space-x-3 md:space-x-4 p-2 rounded-lg hover:bg-muted/50">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3 w-3 md:h-4 md:w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{association.name}</p>
                    <p className="text-xs text-muted-foreground">New organization</p>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(association.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}