// components/UpdatePublicationForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type Publication = {
  id: string;
  title: string;
  abstract?: string;
  publicationType?: string;
  publicationDate?: string;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  scholarLink?: string;
  dblpLink?: string;
  pages?: string;
  volume?: string;
  issue?: string;
  publisher?: string;
  journal?: string;
  language?: string;
};

export function UpdatePublicationForm({ 
  publication,
  onSuccess
}: { 
  publication: Publication;
  onSuccess: (updatedPublication: Publication) => void;
}) {
  const [formData, setFormData] = useState({
    title: publication.title || '',
    abstract: publication.abstract || '',
    publicationType: publication.publicationType || '',
    publicationDate: publication.publicationDate || '',
    doi: publication.doi || '',
    url: publication.url || '',
    pdfUrl: publication.pdfUrl || '',
    scholarLink: publication.scholarLink || '',
    dblpLink: publication.dblpLink || '',
    pages: publication.pages || '',
    volume: publication.volume || '',
    issue: publication.issue || '',
    publisher: publication.publisher || '',
    journal: publication.journal || '',
    language: publication.language || '',
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    const toastId = toast.loading('Updating publication...');

    try {
      const response = await fetch(`/api/publications/${publication.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update publication');
      }

      toast.success('Publication updated successfully!', { id: toastId });
      onSuccess(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update publication', 
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="abstract">Abstract</Label>
        <Textarea
          id="abstract"
          value={formData.abstract}
          onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
          rows={5}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="publicationType">Publication Type</Label>
          <Select
            value={formData.publicationType}
            onValueChange={(value) => setFormData({ ...formData, publicationType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="journal_article">Journal Article</SelectItem>
              <SelectItem value="conference_paper">Conference Paper</SelectItem>
              <SelectItem value="book_chapter">Book Chapter</SelectItem>
              <SelectItem value="patent">Patent</SelectItem>
              <SelectItem value="technical_report">Technical Report</SelectItem>
              <SelectItem value="thesis">Thesis</SelectItem>
              <SelectItem value="preprint">Preprint</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="publicationDate">Publication Date</Label>
          <Input
            id="publicationDate"
            type="date"
            value={formData.publicationDate}
            onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="journal">Journal</Label>
          <Input
            id="journal"
            value={formData.journal}
            onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="publisher">Publisher</Label>
          <Input
            id="publisher"
            value={formData.publisher}
            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="language">Language</Label>
          <Input
            id="language"
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="volume">Volume</Label>
          <Input
            id="volume"
            value={formData.volume}
            onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="issue">Issue</Label>
          <Input
            id="issue"
            value={formData.issue}
            onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="pages">Pages</Label>
          <Input
            id="pages"
            value={formData.pages}
            onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="doi">DOI</Label>
          <Input
            id="doi"
            value={formData.doi}
            onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pdfUrl">PDF URL</Label>
          <Input
            id="pdfUrl"
            type="url"
            value={formData.pdfUrl}
            onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="dblpLink">DBLP Link</Label>
          <Input
            id="dblpLink"
            type="url"
            value={formData.dblpLink}
            onChange={(e) => setFormData({ ...formData, dblpLink: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Publication'}
        </Button>
      </div>
    </form>
  );
}