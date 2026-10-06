import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAssociationById, getAssociationMembers } from '@/lib/actions/associations';
import { ArrowLeft, Users, DollarSign, Calendar, MapPin, Globe, Mail, Phone, Settings, Edit, Ban, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default async function AssociationDetailPage({ params }: { params: { id: string } }) {
  const [associationData, membersData] = await Promise.all([
    getAssociationById(params.id),
    getAssociationMembers(params.id, 1, 20)
  ]);

  if (!associationData) {
    return <div>Association not found</div>;
  }

  const { association, stats, recentActivity } = associationData;
  const { members } = membersData;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/associations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">{association.name}</h1>
          <p className="text-muted-foreground">{association.description}</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant={association.status === 'approved' ? 'default' : 
                        association.status === 'pending' ? 'secondary' :
                        association.status === 'blocked' ? 'destructive' : 'outline'}>
            {association.status}
          </Badge>
          <Badge variant="outline">{association.type}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalMembers}</div>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">GH₵{stats.totalIncome.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total Income</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">GH₵{stats.balance.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.activeMembers}</div>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Association Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p className="text-sm text-muted-foreground capitalize">{association.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Code</p>
                    <p className="text-sm text-muted-foreground font-mono">{association.code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{association.city}, {association.country}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Currency</p>
                    <p className="text-sm text-muted-foreground">{association.currency}</p>
                  </div>
                </div>
                
                {association.schoolInfo && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">School Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Established</p>
                        <p className="text-muted-foreground">{association.schoolInfo.establishedYear}</p>
                      </div>
                      <div>
                        <p className="font-medium">Type</p>
                        <p className="text-muted-foreground capitalize">{association.schoolInfo.schoolType}</p>
                      </div>
                      <div>
                        <p className="font-medium">Capacity</p>
                        <p className="text-muted-foreground">{association.schoolInfo.studentCapacity}</p>
                      </div>
                    </div>
                  </div>
                )}

                {association.communityInfo && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Community Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Founded</p>
                        <p className="text-muted-foreground">{association.communityInfo.foundedYear}</p>
                      </div>
                      <div>
                        <p className="font-medium">Type</p>
                        <p className="text-muted-foreground capitalize">{association.communityInfo.organizationType}</p>
                      </div>
                      <div>
                        <p className="font-medium">Membership Fee</p>
                        <p className="text-muted-foreground">GH₵{association.communityInfo.membershipFee}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Creator Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-medium">{association.createdBy?.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{association.createdBy?.name}</p>
                    <p className="text-sm text-muted-foreground">{association.createdBy?.email}</p>
                    <p className="text-xs text-muted-foreground">Created {new Date(association.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {association.moderatedBy && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Moderation History</h4>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{association.moderatedBy?.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{association.moderatedBy?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {association.status} on {new Date(association.moderatedAt).toLocaleDateString()}
                        </p>
                        {association.moderationReason && (
                          <p className="text-xs text-muted-foreground mt-1">{association.moderationReason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member: any) => (
                  <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-medium">{member.userId?.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{member.userId?.name}</p>
                        <p className="text-sm text-muted-foreground">{member.userId?.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                        {member.role}
                      </Badge>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Visibility Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Public Association</span>
                  <Badge variant={association.settings?.isPublic ? 'default' : 'secondary'}>
                    {association.settings?.isPublic ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Require Approval</span>
                  <Badge variant={association.settings?.requireApproval ? 'default' : 'secondary'}>
                    {association.settings?.requireApproval ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Show Member List</span>
                  <Badge variant={association.settings?.showMemberList ? 'default' : 'secondary'}>
                    {association.settings?.showMemberList ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Member Contributions</span>
                  <Badge variant={association.settings?.financial?.allowMemberContributions ? 'default' : 'secondary'}>
                    {association.settings?.financial?.allowMemberContributions ? 'Allowed' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Expense Approval Limit</span>
                  <span className="text-sm font-medium">GH₵{association.settings?.financial?.expenseApprovalLimit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dues Enabled</span>
                  <Badge variant={association.settings?.dues?.enabled ? 'default' : 'secondary'}>
                    {association.settings?.dues?.enabled ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                {association.status === 'pending' && (
                  <>
                    <Button className="text-green-600 hover:text-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {association.status === 'approved' && (
                  <Button variant="outline" className="text-yellow-600 hover:text-yellow-700">
                    <Ban className="h-4 w-4 mr-2" />
                    Block
                  </Button>
                )}
                {association.status === 'blocked' && (
                  <Button className="text-green-600 hover:text-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Unblock
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}