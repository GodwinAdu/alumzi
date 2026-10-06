import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, HardDrive, Activity, Download, Upload, RefreshCw, Settings, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DatabasePage() {
  const dbStats = [
    { title: 'Total Records', value: '1.2M', icon: Database, change: '+12K today' },
    { title: 'Storage Used', value: '2.4 GB', icon: HardDrive, change: '+45 MB today' },
    { title: 'Active Connections', value: '45', icon: Activity, change: 'Peak: 67' },
    { title: 'Query Performance', value: '12ms', icon: CheckCircle, change: 'Avg response' },
  ];

  const collections = [
    { name: 'users', documents: 15420, size: '245 MB', indexes: 8, status: 'healthy' },
    { name: 'associations', documents: 1250, size: '89 MB', indexes: 6, status: 'healthy' },
    { name: 'members', documents: 45680, size: '156 MB', indexes: 5, status: 'healthy' },
    { name: 'payments', documents: 8920, size: '67 MB', indexes: 7, status: 'warning' },
    { name: 'transactions', documents: 23450, size: '134 MB', indexes: 9, status: 'healthy' },
  ];

  const recentBackups = [
    { date: '2024-01-15 02:00', size: '2.1 GB', status: 'completed', duration: '12 min' },
    { date: '2024-01-14 02:00', size: '2.0 GB', status: 'completed', duration: '11 min' },
    { date: '2024-01-13 02:00', size: '1.9 GB', status: 'completed', duration: '10 min' },
    { date: '2024-01-12 02:00', size: '1.9 GB', status: 'failed', duration: '5 min' },
  ];

  const performanceMetrics = [
    { metric: 'Read Operations/sec', value: 1250, max: 2000, status: 'normal' },
    { metric: 'Write Operations/sec', value: 340, max: 1000, status: 'normal' },
    { metric: 'Index Usage', value: 85, max: 100, status: 'good' },
    { metric: 'Cache Hit Ratio', value: 94, max: 100, status: 'excellent' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground text-sm md:text-base">Database monitoring, backup, and optimization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Backup Now
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {dbStats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Database Collections</span>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collections.map((collection) => (
                <div key={collection.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{collection.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {collection.documents.toLocaleString()} docs • {collection.size} • {collection.indexes} indexes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={collection.status === 'healthy' ? 'default' : 'secondary'}>
                      {collection.status}
                    </Badge>
                    {collection.status === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Performance Metrics</span>
              <Button variant="ghost" size="sm">
                Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric) => (
                <div key={metric.metric} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{metric.metric}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{metric.value}{metric.metric.includes('Ratio') || metric.metric.includes('Usage') ? '%' : ''}</span>
                      <Badge 
                        variant={metric.status === 'excellent' ? 'default' : 
                                metric.status === 'good' ? 'outline' : 'secondary'}
                        className="text-xs"
                      >
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={(metric.value / metric.max) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Database className="h-6 w-6 mb-2" />
                <span>Run Maintenance</span>
                <span className="text-xs text-muted-foreground">Optimize indexes</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Download className="h-6 w-6 mb-2" />
                <span>Export Data</span>
                <span className="text-xs text-muted-foreground">Full database</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Upload className="h-6 w-6 mb-2" />
                <span>Import Data</span>
                <span className="text-xs text-muted-foreground">Restore backup</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Activity className="h-6 w-6 mb-2" />
                <span>Query Analyzer</span>
                <span className="text-xs text-muted-foreground">Performance</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Backups</span>
              <Button variant="ghost" size="sm">
                Schedule
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBackups.map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      backup.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium">{backup.date}</p>
                      <p className="text-xs text-muted-foreground">
                        {backup.size} • {backup.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={backup.status === 'completed' ? 'default' : 'destructive'}>
                      {backup.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Files</span>
                <span className="text-sm font-medium">1.8 GB</span>
              </div>
              <Progress value={75} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">Index Files</span>
                <span className="text-sm font-medium">0.4 GB</span>
              </div>
              <Progress value={40} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">Log Files</span>
                <span className="text-sm font-medium">0.2 GB</span>
              </div>
              <Progress value={20} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connection Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Connections</span>
                <span className="text-sm font-medium">45/100</span>
              </div>
              <Progress value={45} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">Idle Connections</span>
                <span className="text-sm font-medium">15/50</span>
              </div>
              <Progress value={30} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">Queue Length</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Database Status</span>
                <Badge variant="default">Online</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Replication</span>
                <Badge variant="default">Healthy</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Last Backup</span>
                <Badge variant="outline">2 hours ago</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Maintenance</span>
                <Badge variant="secondary">Scheduled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}