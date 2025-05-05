// src/components/admin/AddResearcherDialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddResearcherForm } from './AddResearcherForm';

export function AddResearcherDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Ajouter un chercheur</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau chercheur</DialogTitle>
        </DialogHeader>
        <AddResearcherForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}