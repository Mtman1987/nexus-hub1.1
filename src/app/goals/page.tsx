'use client';

import { useContext, useState } from 'react';
import { AppContext } from '@/contexts/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { iconList, getIcon, IconName } from '@/components/icons';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import type { Goal } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const goalSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  icon: z.string().refine((val) => iconList.includes(val as IconName), {
    message: 'Invalid icon selected.',
  }),
});

function GoalForm({ goal, onSave, onOpenChange }: { goal?: Goal, onSave: (data: z.infer<typeof goalSchema>) => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal?.name || '',
      icon: goal?.icon || 'smile',
    },
  });

  function onSubmit(data: z.infer<typeof goalSchema>) {
    onSave(data);
    onOpenChange(false);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Career" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {iconList.map((iconName) => {
                    const Icon = getIcon(iconName);
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{iconName.charAt(0).toUpperCase() + iconName.slice(1)}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit">Save Goal</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useContext(AppContext);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);

  const handleSave = (data: z.infer<typeof goalSchema>) => {
    if (editingGoal) {
      updateGoal({ ...editingGoal, ...data, icon: data.icon as IconName });
    } else {
      addGoal({ ...data, icon: data.icon as IconName });
    }
    setEditingGoal(undefined);
  };
  
  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  }
  
  const openNewDialog = () => {
    setEditingGoal(undefined);
    setIsFormOpen(true);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Manage Goal Areas</h1>
          <p className="text-muted-foreground">Add, edit, or remove your 'apo' life areas.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add a New Goal'}</DialogTitle>
            </DialogHeader>
            <GoalForm goal={editingGoal} onSave={handleSave} onOpenChange={setIsFormOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const Icon = getIcon(goal.icon);
          return (
            <Card key={goal.id} className="shadow-md hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-8 h-8 text-primary" />
                  <CardTitle className="font-headline text-xl">{goal.name}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(goal)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the "{goal.name}" goal and all its journal entries. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteGoal(goal.id)} className="bg-destructive hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Created on: {new Date(goal.createdAt).toLocaleDateString()}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
