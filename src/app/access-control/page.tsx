
import { UserRoles } from '@/components/dashboard/user-roles';
import { Users } from 'lucide-react';

export default function AccessControlPage() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground p-4 lg:p-6">
       <div className="w-full">
            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Users className="h-8 w-8 text-accent" />
                    Access Control
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage user roles and permissions for your team members. This module is running in a standalone window.
                </p>
            </header>
            <main>
                <UserRoles />
            </main>
       </div>
    </div>
  );
}
