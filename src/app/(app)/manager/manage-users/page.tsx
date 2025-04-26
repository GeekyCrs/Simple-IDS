"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, UserCog, Trash2, UserPlus, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";


// Placeholder Type - Define based on your user structure
type UserRole = 'client' | 'chef' | 'manager';
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string; // ISO String or Timestamp
  status: 'active' | 'inactive'; // Example statuses
  imageUrl?: string;
}

// Placeholder Data - Replace with API call to fetch users
const initialUsers: User[] = [
  { id: 'user001', name: 'Alice Smith', email: 'alice@example.com', role: 'client', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'active', imageUrl: 'https://picsum.photos/seed/alice/40/40' },
  { id: 'user002', name: 'Bob Johnson', email: 'bob@example.com', role: 'client', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'active' },
  { id: 'user003', name: 'Charlie Chef', email: 'chef.charlie@example.com', role: 'chef', createdAt: new Date(Date.now() - 86400000 * 20).toISOString(), status: 'active' },
  { id: 'user004', name: 'Diana Manager', email: 'manager.diana@example.com', role: 'manager', createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), status: 'active', imageUrl: 'https://picsum.photos/seed/diana/40/40' },
   { id: 'user005', name: 'Evan Employee', email: 'evan@example.com', role: 'client', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'inactive' },
];

const possibleRoles: UserRole[] = ['client', 'chef', 'manager'];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all'); // 'all', 'client', 'chef', 'manager'
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'active', 'inactive'
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
   const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
   const [userToModify, setUserToModify] = useState<User | null>(null);
   const [modificationType, setModificationType] = useState<'role' | 'status' | 'delete' | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // TODO: Fetch users from backend
    setIsLoading(true);
    setTimeout(() => {
      setUsers(initialUsers);
      setFilteredUsers(initialUsers);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
      let filtered = users;
      const lowerCaseSearch = searchTerm.toLowerCase();

      filtered = filtered.filter(user =>
          user.name.toLowerCase().includes(lowerCaseSearch) ||
          user.email.toLowerCase().includes(lowerCaseSearch)
      );

      if (roleFilter !== 'all') {
          filtered = filtered.filter(user => user.role === roleFilter);
      }
       if (statusFilter !== 'all') {
           filtered = filtered.filter(user => user.status === statusFilter);
       }

      setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, statusFilter, users]);

  const getInitials = (name: string) => {
     return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

 const openConfirmationDialog = (user: User, type: 'role' | 'status' | 'delete') => {
     setUserToModify(user);
     setModificationType(type);
     if (type === 'role') {
         setSelectedRole(user.role); // Set initial role for the select dropdown
     }
     setIsConfirmDialogOpen(true);
 };


 const handleConfirmation = async () => {
    if (!userToModify || !modificationType) return;

    setIsLoading(true); // Use isLoading for confirmation action
    try {
        if (modificationType === 'role') {
            // TODO: Update user role in backend
            console.log(`Updating role for ${userToModify.email} to ${selectedRole}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            setUsers(prev => prev.map(u => u.id === userToModify.id ? { ...u, role: selectedRole } : u));
            toast({ title: "User Role Updated", description: `${userToModify.name}'s role set to ${selectedRole}.` });
        } else if (modificationType === 'status') {
            const newStatus = userToModify.status === 'active' ? 'inactive' : 'active';
            // TODO: Update user status in backend
            console.log(`Updating status for ${userToModify.email} to ${newStatus}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            setUsers(prev => prev.map(u => u.id === userToModify.id ? { ...u, status: newStatus } : u));
             toast({ title: "User Status Updated", description: `${userToModify.name}'s status set to ${newStatus}.` });
        } else if (modificationType === 'delete') {
             // TODO: Delete user from backend (consider soft delete)
            console.log(`Deleting user ${userToModify.email}`);
             await new Promise(resolve => setTimeout(resolve, 500));
             setUsers(prev => prev.filter(u => u.id !== userToModify.id));
             toast({ title: "User Deleted", description: `${userToModify.name} has been removed.` });
        }
    } catch (error) {
        console.error(`Error during ${modificationType}:`, error);
        toast({ variant: "destructive", title: "Action Failed", description: `Could not perform action on ${userToModify.name}.` });
    } finally {
        setIsLoading(false);
        setIsConfirmDialogOpen(false);
        setUserToModify(null);
        setModificationType(null);
    }
 };


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Users /> Manage Users</h1>

      {/* Filters and Add User Button */}
       <Card className="mb-6 shadow-sm">
           <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
             <div className="relative flex-grow w-full md:w-1/3">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input
                 type="search"
                 placeholder="Search by name or email..."
                 className="pl-10 w-full"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm text-muted-foreground mr-2 hidden md:inline">Filter:</span>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[150px] h-9">
                        <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {possibleRoles.map(role => (
                            <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                     <SelectTrigger className="w-full md:w-[150px] h-9">
                         <SelectValue placeholder="Status" />
                     </SelectTrigger>
                     <SelectContent>
                         <SelectItem value="all">All Statuses</SelectItem>
                         <SelectItem value="active">Active</SelectItem>
                         <SelectItem value="inactive">Inactive</SelectItem>
                     </SelectContent>
                 </Select>
             </div>
             {/* <Button className="w-full md:w-auto">
                <UserPlus className="mr-2 h-4 w-4" /> Add User
             </Button> */}
           </CardContent>
       </Card>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>View and manage user accounts and roles.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center py-12"><p className="text-muted-foreground">Loading users...</p></div>
           ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                     <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No users found matching your filters.</p>
                </div>
            ) : (
             <Table>
               <TableCaption>List of registered users.</TableCaption>
               <TableHeader>
                 <TableRow>
                   <TableHead>User</TableHead>
                   <TableHead>Email</TableHead>
                   <TableHead>Role</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredUsers.map((user) => (
                   <TableRow key={user.id} className={user.status === 'inactive' ? 'opacity-60' : ''}>
                     <TableCell>
                       <div className="flex items-center gap-3">
                         <Avatar className="h-9 w-9">
                           <AvatarImage src={user.imageUrl} alt={user.name} />
                           <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                         </Avatar>
                         <span className="font-medium">{user.name}</span>
                       </div>
                     </TableCell>
                     <TableCell>{user.email}</TableCell>
                     <TableCell className="capitalize">
                         <Badge variant={user.role === 'manager' ? 'default' : user.role === 'chef' ? 'secondary' : 'outline'}>
                            {user.role}
                         </Badge>
                     </TableCell>
                      <TableCell>
                         <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status}
                         </Badge>
                     </TableCell>
                     <TableCell className="text-right space-x-1">
                       <Button variant="ghost" size="icon" className="h-8 w-8" title="Change Role/Status" onClick={() => openConfirmationDialog(user, 'role')}>
                         <UserCog className="h-4 w-4" />
                       </Button>
                         {/* Combine status toggle into the role dialog or keep separate */}
                        <Button variant="ghost" size="icon" className="h-8 w-8" title={user.status === 'active' ? 'Deactivate User' : 'Activate User'} onClick={() => openConfirmationDialog(user, 'status')}>
                             {user.status === 'active' ? <AlertTriangle className="h-4 w-4 text-orange-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                         </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete User" onClick={() => openConfirmationDialog(user, 'delete')}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
            )}
        </CardContent>
      </Card>

       {/* Confirmation / Edit Dialog */}
       <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
           <DialogContent>
               <DialogHeader>
                    <DialogTitle>
                        {modificationType === 'role' && `Change Role for ${userToModify?.name}`}
                        {modificationType === 'status' && `${userToModify?.status === 'active' ? 'Deactivate' : 'Activate'} User ${userToModify?.name}`}
                        {modificationType === 'delete' && `Delete User ${userToModify?.name}`}
                    </DialogTitle>
                   <DialogDescription>
                       {modificationType === 'role' && "Select the new role for this user."}
                        {modificationType === 'status' && `Are you sure you want to ${userToModify?.status === 'active' ? 'deactivate' : 'activate'} this user's account?`}
                       {modificationType === 'delete' && "This action cannot be undone. Are you sure you want to permanently delete this user?"}
                   </DialogDescription>
               </DialogHeader>

                {modificationType === 'role' && userToModify && (
                   <div className="py-4">
                       <Label htmlFor="role-select">New Role</Label>
                       <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                           <SelectTrigger id="role-select">
                               <SelectValue placeholder="Select role" />
                           </SelectTrigger>
                           <SelectContent>
                               {possibleRoles.map(role => (
                                   <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                               ))}
                           </SelectContent>
                       </Select>
                   </div>
               )}

               <DialogFooter>
                   <DialogClose asChild>
                       <Button type="button" variant="outline">Cancel</Button>
                   </DialogClose>
                   <Button
                       type="button"
                        onClick={handleConfirmation}
                        disabled={isLoading}
                        variant={modificationType === 'delete' ? 'destructive' : 'default'}
                        className={modificationType !== 'delete' ? "bg-primary hover:bg-primary/90" : ""}
                     >
                       {isLoading ? 'Processing...' : 'Confirm'}
                   </Button>
               </DialogFooter>
           </DialogContent>
       </Dialog>

    </div>
  );
}

// Helper component needed for ShadCN Dialog
import { CheckCircle } from "lucide-react";
