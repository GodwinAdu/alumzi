import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, Lock, AlertTriangle, CheckCircle, Eye, Ban, Search, Download, RefreshCw } from 'lucide-react';

export default function SecurityPage() {
  const securityMetrics = [
    { title: 'Failed Login Attempts', value: '23', status: 'warning', icon: AlertTriangle, change: '+5 from yesterday' },
    { title: 'Active Sessions', value: '156', status: 'normal', icon: CheckCircle, change: '+12 from yesterday' },
    { title: 'Blocked IPs', value: '8', status: 'normal', icon: Shield, change: '+2 from yesterday' },
    { title: 'Security Alerts', value: '2', status: 'warning', icon: Lock, change: 'New alerts today' },
  ];

  const securityEvents = [
    { type: 'warning', message: 'Multiple failed login attempts from IP 192.168.1.100', time: '2 minutes ago', severity: 'high' },
    { type: 'info', message: 'Security scan completed successfully', time: '1 hour ago', severity: 'low' },
    { type: 'warning', message: 'Suspicious activity detected from user account', time: '3 hours ago', severity: 'medium' },
    { type: 'info', message: 'Password policy updated', time: '1 day ago', severity: 'low' },
    { type: 'critical', message: 'Potential brute force attack blocked', time: '2 days ago', severity: 'critical' },
  ];

  const blockedIPs = [
    { ip: '192.168.1.100', reason: 'Brute force attack', blocked: '2 hours ago', attempts: 25 },
    { ip: '10.0.0.45', reason: 'Suspicious activity', blocked: '1 day ago', attempts: 15 },
    { ip: '172.16.0.23', reason: 'Multiple failed logins', blocked: '3 days ago', attempts: 18 },
  ];

  const activeSessions = [
    { user: 'john.doe@example.com', ip: '192.168.1.50', location: 'Accra, Ghana', device: 'Chrome on Windows', lastActive: '2 min ago' },
    { user: 'jane.smith@example.com', ip: '10.0.0.25', location: 'Kumasi, Ghana', device: 'Safari on iPhone', lastActive: '15 min ago' },
    { user: 'admin@alumzi.com', ip: '172.16.0.10', location: 'Tema, Ghana', device: 'Firefox on Mac', lastActive: '1 hour ago' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Security</h1>
          <p className="text-muted-foreground text-sm md:text-base">Platform security overview and threat monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {securityMetrics.map((metric) => (
          <Card key={metric.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.status === 'warning' ? 'text-yellow-500' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
              <Badge 
                variant={metric.status === 'warning' ? 'secondary' : 'default'} 
                className="mt-2"
              >
                {metric.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Security Events</span>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityEvents.map((event, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    event.type === 'critical' ? 'bg-red-500' :
                    event.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{event.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                      <Badge 
                        variant={event.severity === 'critical' ? 'destructive' : 
                                event.severity === 'high' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {event.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Blocked IP Addresses</span>
              <Button variant="ghost" size="sm">
                Manage
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {blockedIPs.map((blocked, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{blocked.ip}</p>
                    <p className="text-xs text-muted-foreground">{blocked.reason}</p>
                    <p className="text-xs text-muted-foreground">{blocked.attempts} attempts • {blocked.blocked}</p>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active User Sessions</span>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search sessions..." className="pl-10 w-64" />
              </div>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeSessions.map((session, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{session.user.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{session.user}</p>
                    <p className="text-xs text-muted-foreground">{session.ip} • {session.location}</p>
                    <p className="text-xs text-muted-foreground">{session.device}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {session.lastActive}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Ban className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Two-Factor Auth</span>
                <Badge variant="default">Enabled</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Password Policy</span>
                <Badge variant="default">Strong</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Session Timeout</span>
                <Badge variant="outline">30 minutes</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">IP Whitelist</span>
                <Badge variant="secondary">Disabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Threat Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Brute Force Protection</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">DDoS Protection</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Anomaly Detection</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Rate Limiting</span>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">GDPR Compliance</span>
                <Badge variant="default">Compliant</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Encryption</span>
                <Badge variant="default">AES-256</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Audit Logging</span>
                <Badge variant="default">Enabled</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Backup Encryption</span>
                <Badge variant="default">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}