
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Shield, Save, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  name: string;
  role: string;
};

const initialUsers: User[] = [
  { id: 'user-1', name: 'Admin User', role: 'Admin' },
  { id: 'user-2', name: 'Sample User 1', role: 'Twitch Mod' },
  { id: 'user-3', name: 'Sample User 2', role: 'Discord Mod' },
  { id: 'user-4', name: 'Sample User 3', role: 'Limited Access' },
];

const roles = ['Admin', 'Discord Mod', 'Twitch Mod', 'Limited Access', 'None'];

// This is a placeholder function. In a real app, this would be an API call.
async function manageUserRoles(users: { id: string, name: string, role: string }[]): Promise<{status: string, message: string}> {
    console.log('Simulating role update for:', users);
    // Here you would typically make a fetch call to your backend API,
    // which would then interact with services like the Discord API.
    return new Promise(resolve => {
        setTimeout(() => {
            const message = `Successfully processed role updates for ${users.length} user(s). Check console for details.`;
            resolve({
                status: 'Success',
                message: message,
            });
        }, 1000); // Simulate network delay
    });
}

interface UserRolesProps {
  isPoppedOut?: boolean;
}

export function UserRoles({ isPoppedOut = false }: UserRolesProps) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const result = await manageUserRoles(users.map(u => ({ id: u.id, name: u.name, role: u.role })));
      toast({
        title: "Changes Processed",
        description: result.message,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving the changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
           <div className="flex justify-between items-start">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-accent" />
                Access Control
              </CardTitle>
              <CardDescription>
                Assign roles and manage permissions for your team members.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="avatar abstract" alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value)}>
                      <SelectTrigger className="w-[180px]">
                         <div className="flex items-center gap-2">
                           <Shield className="h-4 w-4 text-muted-foreground" />
                           <SelectValue placeholder="Select a role" />
                         </div>
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(user)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                 <Avatar>
                  <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="avatar abstract" alt={selectedUser.name} />
                  <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                </Avatar>
                {selectedUser.name}
              </DialogTitle>
              <DialogDescription>
                Details and granular permissions for this user.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p className="text-sm text-muted-foreground mt-4">
                More detailed, module-specific permissions can be configured here in the future.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
