
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { PurchaseRequest, CreatePurchaseRequestInput, User, UpdatePurchaseRequestStatusInput, PurchaseRequestStatus } from '../../server/src/schema';

function App() {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for creating purchase requests
  const [formData, setFormData] = useState<CreatePurchaseRequestInput>({
    employee_id: 0,
    ebay_url: '',
    amazon_asin: ''
  });

  // Load data on component mount
  const loadData = useCallback(async () => {
    try {
      const [purchaseRequestsResult, usersResult] = await Promise.all([
        trpc.getPurchaseRequests.query(),
        trpc.getUsers.query()
      ]);
      
      setPurchaseRequests(purchaseRequestsResult);
      setUsers(usersResult);
      
      // Find the first employee user and set as current user
      const employeeUser = usersResult.find((user: User) => user.role === 'employee');
      if (employeeUser) {
        setCurrentUser(employeeUser);
        setFormData(prev => ({ ...prev, employee_id: employeeUser.id }));
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // Submit the request - backend will handle enrichment
      await trpc.createPurchaseRequest.mutate(formData);
      
      // Refresh the list of purchase requests from the server
      const updatedRequests = await trpc.getPurchaseRequests.query();
      setPurchaseRequests(updatedRequests);
      
      // Reset form
      setFormData({
        employee_id: currentUser.id,
        ebay_url: '',
        amazon_asin: ''
      });
    } catch (error) {
      console.error('Failed to create purchase request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: number, status: 'approved' | 'rejected') => {
    if (!currentUser || currentUser.role !== 'approver') return;

    setIsLoading(true);
    try {
      const updateInput: UpdatePurchaseRequestStatusInput = {
        id: requestId,
        status: status,
        approver_id: currentUser.id
      };
      
      await trpc.updatePurchaseRequestStatus.mutate(updateInput);
      
      // Update local state
      setPurchaseRequests((prev: PurchaseRequest[]) => 
        prev.map((request: PurchaseRequest) => 
          request.id === requestId 
            ? { 
                ...request, 
                status: status,
                approver_id: currentUser.id,
                approved_at: new Date(),
                updated_at: new Date()
              }
            : request
        )
      );
    } catch (error) {
      console.error('Failed to update request status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: PurchaseRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">PENDING</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">APPROVED</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">REJECTED</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return 'N/A';
    const user = users.find((u: User) => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="border-b-4 border-black pb-4 mb-8">
          <h1 className="text-4xl font-black uppercase tracking-wider">
            Purchase Request System
          </h1>
          <p className="text-lg font-mono mt-2 text-gray-600">
            UTILITARIAN APPROVAL MANAGEMENT PLATFORM
          </p>
        </div>

        {/* User Switcher - For Demo */}
        <div className="mb-8 p-4 bg-white border-2 border-black">
          <Label className="text-sm font-mono uppercase tracking-wide mb-2 block">
            Current User (Demo Mode)
          </Label>
          <Select 
            value={currentUser?.id.toString() || ''} 
            onValueChange={(value: string) => {
              const user = users.find((u: User) => u.id === parseInt(value));
              setCurrentUser(user || null);
              if (user) {
                setFormData(prev => ({ ...prev, employee_id: user.id }));
              }
            }}
          >
            <SelectTrigger className="w-full max-w-sm border-2 border-black">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user: User) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name} ({user.role.toUpperCase()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-black text-white">
            <TabsTrigger value="requests" className="data-[state=active]:bg-white data-[state=active]:text-black font-mono uppercase">
              All Requests
            </TabsTrigger>
            <TabsTrigger value="submit" className="data-[state=active]:bg-white data-[state=active]:text-black font-mono uppercase">
              Submit Request
            </TabsTrigger>
          </TabsList>

          {/* All Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <div className="bg-white border-2 border-black p-4">
              <h2 className="text-2xl font-black uppercase mb-4">Purchase Requests</h2>
              
              {purchaseRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-mono">NO REQUESTS FOUND</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchaseRequests.map((request: PurchaseRequest) => (
                    <Card key={request.id} className="border-2 border-black">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl font-black uppercase">
                              {request.item_name || 'ITEM NAME PENDING'}
                            </CardTitle>
                            <CardDescription className="font-mono text-sm">
                              Request #{request.id} • Employee: {getUserName(request.employee_id)}
                            </CardDescription>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="font-mono text-xs uppercase tracking-wide">Product URLs</Label>
                            <div className="space-y-1 text-sm">
                              <div>eBay: <a href={request.ebay_url} className="text-blue-600 underline font-mono break-all" target="_blank" rel="noopener noreferrer">{request.ebay_url}</a></div>
                              <div>Amazon ASIN: <span className="font-mono bg-gray-100 px-1">{request.amazon_asin}</span></div>
                            </div>
                          </div>
                          <div>
                            <Label className="font-mono text-xs uppercase tracking-wide">Item Details</Label>
                            <div className="space-y-1 text-sm">
                              <div>Price: <span className="font-mono font-bold">${request.item_price?.toFixed(2) || 'N/A'}</span></div>
                              <div>Images: <span className="font-mono">{request.item_images?.length || 0} available</span></div>
                            </div>
                          </div>
                        </div>

                        {request.item_description && (
                          <div>
                            <Label className="font-mono text-xs uppercase tracking-wide">Description</Label>
                            <p className="text-sm mt-1 p-2 bg-gray-50 border">{request.item_description}</p>
                          </div>
                        )}

                        <Separator className="border-gray-300" />

                        <div className="flex justify-between items-center">
                          <div className="text-xs font-mono text-gray-500">
                            Created: {request.created_at.toLocaleDateString()} • 
                            Updated: {request.updated_at.toLocaleDateString()}
                            {request.approver_id && (
                              <> • Approver: {getUserName(request.approver_id)}</>
                            )}
                          </div>
                          
                          {currentUser?.role === 'approver' && request.status === 'pending' && (
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white font-mono uppercase"
                                  >
                                    Approve
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-2 border-black">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-black uppercase">Approve Request</AlertDialogTitle>
                                    <AlertDialogDescription className="font-mono">
                                      Are you sure you want to approve this purchase request?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="font-mono uppercase">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleUpdateStatus(request.id, 'approved')}
                                      className="bg-green-600 hover:bg-green-700 font-mono uppercase"
                                    >
                                      Approve
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    className="font-mono uppercase"
                                  >
                                    Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-2 border-black">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-black uppercase">Reject Request</AlertDialogTitle>
                                    <AlertDialogDescription className="font-mono">
                                      Are you sure you want to reject this purchase request?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="font-mono uppercase">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleUpdateStatus(request.id, 'rejected')}
                                      className="bg-red-600 hover:bg-red-700 font-mono uppercase"
                                    >
                                      Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Submit Request Tab */}
          <TabsContent value="submit" className="space-y-4">
            <div className="bg-white border-2 border-black p-4">
              <h2 className="text-2xl font-black uppercase mb-4">Submit Purchase Request</h2>
              
              {currentUser?.role === 'employee' ? (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <Label htmlFor="ebay-url" className="font-mono text-xs uppercase tracking-wide">
                      eBay URL *
                    </Label>
                    <Input
                      id="ebay-url"
                      type="url"
                      value={formData.ebay_url}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreatePurchaseRequestInput) => ({ ...prev, ebay_url: e.target.value }))
                      }
                      placeholder="https://www.ebay.com/itm/..."
                      className="mt-1 border-2 border-black font-mono"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amazon-asin" className="font-mono text-xs uppercase tracking-wide">
                      Amazon ASIN *
                    </Label>
                    <Input
                      id="amazon-asin"
                      type="text"
                      value={formData.amazon_asin}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreatePurchaseRequestInput) => ({ ...prev, amazon_asin: e.target.value }))
                      }
                      placeholder="B08N5WRWNW"
                      className="mt-1 border-2 border-black font-mono"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      Item details will be automatically populated from Amazon API
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-black hover:bg-gray-800 text-white font-mono uppercase tracking-wide h-12"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-mono">
                    ONLY EMPLOYEES CAN SUBMIT PURCHASE REQUESTS
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-black">
          <p className="text-center font-mono text-sm text-gray-500">
            PURCHASE REQUEST APPROVAL SYSTEM
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
