'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { adminCreateUser } from '@/actions/admin';
import { UserPlus } from 'lucide-react';

export default function RegisterEditorPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', 'EDITOR'); // Explicit role for editors

      const res = await adminCreateUser(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Editor account created successfully!`);
        setName('');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          Register Editor
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Create a new editorial board member account.
        </p>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader className="bg-card px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-bold text-foreground uppercase flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary shrink-0" />
            <span>New Editor Credentials</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="editor-name">Full Name</Label>
              <Input
                id="editor-name"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editor-email">Email Address</Label>
              <Input
                id="editor-email"
                type="email"
                placeholder="editor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editor-password">Temporary Password</Label>
              <Input
                id="editor-password"
                type="password"
                placeholder="Enter temporary password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Editor'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
