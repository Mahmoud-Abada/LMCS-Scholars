// components/UpdateProfileForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type Researcher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  orcidId?: string;
  position?: string;
  qualification?: string;
  researchInterests?: string;
  biography?: string;
  dblpUrl?: string;
  googleScholarUrl?: string;
  researchGateUrl?: string;
  linkedinUrl?: string;
  personalWebsite?: string;
};

export function UpdateProfileForm({ 
  researcher, 
  onSuccess 
}: { 
  researcher: Researcher;
  onSuccess: (updatedResearcher: Researcher) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: researcher.firstName || '',
    lastName: researcher.lastName || '',
    email: researcher.email || '',
    phone: researcher.phone || '',
    orcidId: researcher.orcidId || '',
    position: researcher.position || '',
    qualification: researcher.qualification || '',
    researchInterests: researcher.researchInterests || '',
    biography: researcher.biography || '',
    dblpUrl: researcher.dblpUrl || '',
    googleScholarUrl: researcher.googleScholarUrl || '',
    researchGateUrl: researcher.researchGateUrl || '',
    linkedinUrl: researcher.linkedinUrl || '',
    personalWebsite: researcher.personalWebsite || '',
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show loading state immediately
    setLoading(true);
    
    // Show loading toast
    const toastId = toast.loading('Updating profile...');

    try {
      const response = await fetch(`/api/researchers/${researcher.id}/modify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Update toast to success
      toast.success('Profile updated successfully!', { id: toastId });
      
      // Call success handler
      onSuccess(result.data);

    } catch (error) {
      // Update toast to error
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile', 
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="orcidId">ORCID ID</Label>
        <Input
          id="orcidId"
          value={formData.orcidId}
          onChange={(e) => setFormData({ ...formData, orcidId: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="position">Position</Label>
          <Select
            value={formData.position}
            onValueChange={(value) => setFormData({ ...formData, position: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professor">Professor</SelectItem>
              <SelectItem value="associate_professor">Associate Professor</SelectItem>
              <SelectItem value="assistant_professor">Assistant Professor</SelectItem>
              <SelectItem value="postdoc">Postdoc</SelectItem>
              <SelectItem value="phd_candidate">PhD Candidate</SelectItem>
              <SelectItem value="research_scientist">Research Scientist</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="qualification">Qualification</Label>
          <Select
            value={formData.qualification}
            onValueChange={(value) => setFormData({ ...formData, qualification: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select qualification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phd">PhD</SelectItem>
              <SelectItem value="msc">MSc</SelectItem>
              <SelectItem value="bsc">BSc</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="researchInterests">Research Interests</Label>
        <Input
          id="researchInterests"
          value={formData.researchInterests}
          onChange={(e) => setFormData({ ...formData, researchInterests: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="biography">Biography</Label>
        <textarea
          id="biography"
          value={formData.biography}
          onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dblpUrl">DBLP URL</Label>
          <Input
            id="dblpUrl"
            type="url"
            value={formData.dblpUrl}
            onChange={(e) => setFormData({ ...formData, dblpUrl: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="googleScholarUrl">Google Scholar URL</Label>
          <Input
            id="googleScholarUrl"
            type="url"
            value={formData.googleScholarUrl}
            onChange={(e) => setFormData({ ...formData, googleScholarUrl: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="researchGateUrl">ResearchGate URL</Label>
          <Input
            id="researchGateUrl"
            type="url"
            value={formData.researchGateUrl}
            onChange={(e) => setFormData({ ...formData, researchGateUrl: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <Input
            id="linkedinUrl"
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="personalWebsite">Personal Website</Label>
          <Input
            id="personalWebsite"
            type="url"
            value={formData.personalWebsite}
            onChange={(e) => setFormData({ ...formData, personalWebsite: e.target.value })}
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
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </div>
    </form>
  );
}