import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCheck, Plus, MoreHorizontal } from 'lucide-react';

export default function AdminUsersPage() {
  const adminUsers = [
    { id: '1', name: 'John Doe', email: 'john@alumzi.com', role: 'super_admin', status: 'active' },
    { id: '2', name: 'Jane Smith', email: 'jane@alumzi.com', role: 'admin', status: 'active' },
    { id: '3', name: 'Bob Wilson', email: 'bob@alumzi.com', role: 'moderator', status: 'inactive' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground text-sm md:text-base">Manage administrative access</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrative Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adminUsers.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={admin.status === 'active' ? 'default' : 'secondary'}>
                    {admin.status}
                  </Badge>
                  <Badge variant="outline">
                    {admin.role.replace('_', ' ')}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}