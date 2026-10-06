import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Database, Server, CheckCircle, AlertTriangle, Wifi, HardDrive, Cpu, RefreshCw, Bell } from 'lucide-react';

export default function MonitoringPage() {
  const systemHealth = [
    { name: 'Database', status: 'healthy', uptime: '99.9%', responseTime: '12ms', icon: Database, usage: 65 },
    { name: 'API Server', status: 'healthy', uptime: '99.8%', responseTime: '245ms', icon: Server, usage: 45 },
    { name: 'Mobile App', status: 'warning', uptime: '98.5%', responseTime: '1.2s', icon: Activity, usage: 85 },
    { name: 'Web Portal', status: 'healthy', uptime: '99.7%', responseTime: '180ms', icon: Wifi, usage: 55 },
  ];

  const serverMetrics = [
    { name: 'CPU Usage', value: 45, max: 100, unit: '%', status: 'normal' },
    { name: 'Memory Usage', value: 68, max: 100, unit: '%', status: 'warning' },
    { name: 'Disk Usage', value: 32, max: 100, unit: '%', status: 'normal' },
    { name: 'Network I/O', value: 23, max: 100, unit: 'Mbps', status: 'normal' },
  ];

  const recentEvents = [
    { type: 'info', message: 'Database backup completed successfully', time: '2 minutes ago', icon: CheckCircle },
    { type: 'warning', message: 'High memory usage detected on server-02', time: '15 minutes ago', icon: AlertTriangle },
    { type: 'info', message: 'New user registration spike detected', time: '1 hour ago', icon: Activity },
    { type: 'info', message: 'System maintenance completed', time: '3 hours ago', icon: Server },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground text-sm md:text-base">Real-time platform health and performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Alerts (2)
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {systemHealth.map((system) => (
          <Card key={system.name} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{system.name}</CardTitle>
              <system.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-2">
                {system.status === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <Badge variant={system.status === 'healthy' ? 'default' : 'secondary'}>
                  {system.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Uptime</span>
                  <span className="font-medium">{system.uptime}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Response</span>
                  <span className="font-medium">{system.responseTime}</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Load</span>
                    <span>{system.usage}%</span>
                  </div>
                  <Progress value={system.usage} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="h-5 w-5" />
              <span>Server Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serverMetrics.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{metric.value}{metric.unit}</span>
                      <Badge 
                        variant={metric.status === 'warning' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={metric.value} 
                    className={`h-2 ${metric.status === 'warning' ? 'bg-yellow-100' : ''}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    event.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{event.message}</p>
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                  </div>
                  <event.icon className={`h-4 w-4 ${
                    event.type === 'warning' ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Database Connections</span>
                <span className="text-sm font-medium">45/100</span>
              </div>
              <Progress value={45} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">API Connections</span>
                <span className="text-sm font-medium">156/500</span>
              </div>
              <Progress value={31} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">WebSocket Connections</span>
                <span className="text-sm font-medium">89/200</span>
              </div>
              <Progress value={44} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Error Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">API Errors (5xx)</span>
                <span className="text-sm font-medium text-green-600">0.02%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Client Errors (4xx)</span>
                <span className="text-sm font-medium text-yellow-600">2.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Database Errors</span>
                <span className="text-sm font-medium text-green-600">0.01%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Timeout Errors</span>
                <span className="text-sm font-medium text-green-600">0.05%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Response Time</span>
                <span className="text-sm font-medium">245ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Requests/min</span>
                <span className="text-sm font-medium">1,234</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cache Hit Rate</span>
                <span className="text-sm font-medium text-green-600">94.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Transfer</span>
                <span className="text-sm font-medium">2.3 GB/hr</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}