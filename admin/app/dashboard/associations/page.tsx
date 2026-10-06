import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getAssociations, getAssociationStats, moderateAssociation } from '@/lib/actions/associations';
import { Search, MoreHorizontal, Building2, Filter, Download, Plus, Eye, Edit, Trash2, Users, CheckCircle, XCircle, Ban, Clock } from 'lucide-react';
import Link from 'next/link';

interface SearchParams {
  page?: string;
  search?: string;
  status?: string;
  type?: string;
}

export default async function AssociationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const status = searchParams.status || 'all';
  const type = searchParams.type || 'all';
  
  const [{ associations, total, pages }, stats] = await Promise.all([
    getAssociations(page, 10, search, status, type),
    getAssociationStats()
  ]);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Associations</h1>
          <p className="text-muted-foreground text-sm md:text-base">Manage platform associations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Association
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalAssociations}</div>
            <p className="text-xs text-muted-foreground">Total Associations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.activeAssociations}</div>
            <p className="text-xs text-muted-foreground">Active Associations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingAssociations}</div>
            <p className="text-xs text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.blockedAssociations}</div>
            <p className="text-xs text-muted-foreground">Blocked/Banned</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search associations by name or description..."
                className="pl-10"
                defaultValue={search}
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue={status}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue={type}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="religious">Religious</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {associations.map((association: any) => (
              <div key={association._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <Checkbox />
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{association.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{association.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(association.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span className="text-xs">{association.memberCount || 0} members</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={association.status === 'approved' ? 'default' : 
                                association.status === 'pending' ? 'secondary' :
                                association.status === 'blocked' ? 'destructive' : 'outline'}>
                    {association.status}
                  </Badge>
                  <Badge variant="outline">
                    {association.type || 'General'}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/associations/${association._id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {association.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {association.status === 'approved' && (
                      <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700">
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox />
              <span className="text-sm text-muted-foreground">Select all</span>
              <Button variant="outline" size="sm" className="ml-4">
                Bulk Actions
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} associations
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled={page <= 1}>
                  Previous
                </Button>
                <span className="text-sm px-3 py-1 bg-muted rounded">
                  {page} of {pages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= pages}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}