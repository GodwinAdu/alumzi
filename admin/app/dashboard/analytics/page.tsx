import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRevenueAnalytics, getUserGrowthAnalytics } from '@/lib/actions/analytics';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, RefreshCw } from 'lucide-react';

export default async function AnalyticsPage() {
  const [revenueData, growthData] = await Promise.all([
    getRevenueAnalytics('30d'),
    getUserGrowthAnalytics('30d')
  ]);

  const totalRevenue = revenueData.reduce((sum: number, item: any) => sum + item.total, 0);
  const totalNewUsers = growthData.reduce((sum: number, item: any) => sum + item.count, 0);
  const avgDailyRevenue = totalRevenue / 30;
  const avgDailyUsers = totalNewUsers / 30;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm md:text-base">Platform performance insights</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="30d">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
            <div className="mt-2 text-xs text-green-600">
              +15.3% from previous period
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{totalNewUsers}
            </div>
            <p className="text-xs text-muted-foreground">New users this month</p>
            <div className="mt-2 text-xs text-blue-600">
              +8.2% from previous period
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵{avgDailyRevenue.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per day average</p>
            <div className="mt-2 text-xs text-purple-600">
              +12.1% from previous period
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{avgDailyUsers.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per day average</p>
            <div className="mt-2 text-xs text-orange-600">
              +5.7% from previous period
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Revenue Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Daily revenue breakdown for the last 30 days
              </div>
              <div className="space-y-2">
                {revenueData.slice(0, 7).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{new Date(item.date).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(item.total / Math.max(...revenueData.map((d: any) => d.total))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">GH₵{item.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Growth</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Daily user registrations for the last 30 days
              </div>
              <div className="space-y-2">
                {growthData.slice(0, 7).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{new Date(item.date).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(item.count / Math.max(...growthData.map((d: any) => d.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">+{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performing Associations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Alumni Association', 'Professional Network', 'Social Club', 'Religious Group'].map((name, index) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm">{name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">GH₵{(1000 - index * 200).toLocaleString()}</span>
                    <span className="text-xs text-green-600">+{15 - index * 2}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily Active Users</span>
                <span className="text-sm font-medium">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Weekly Active Users</span>
                <span className="text-sm font-medium">5,678</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Monthly Active Users</span>
                <span className="text-sm font-medium">12,345</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Session Duration</span>
                <span className="text-sm font-medium">8m 32s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">System Uptime</span>
                <span className="text-sm font-medium text-green-600">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Response Time</span>
                <span className="text-sm font-medium">245ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Error Rate</span>
                <span className="text-sm font-medium text-green-600">0.02%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Connections</span>
                <span className="text-sm font-medium">156</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}