'use client'
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AddResearcherPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "active",
    qualification: "",
    position: "",
    hIndex: 0,
    i10Index: 0,
    citations: 0,
    teamId: "",
    orcidId: "",
    joinDate: "",
    leaveDate: "",
    biography: "",
    researchInterests: "",
    dblpUrl: "",
    googleScholarUrl: "",
    researchGateUrl: "",
    linkedinUrl: "",
    personalWebsite: "",
    password: "TempPassword123!", // Default password that meets requirements
    role: "researcher"
  })

  const [showDialog, setShowDialog] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: ['hIndex', 'i10Index', 'citations'].includes(name) 
        ? Number(value) || 0 
        : value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!form.firstName.trim()) {
      toast.error("First name is required")
      return false
    }
    if (!form.lastName.trim()) {
      toast.error("Last name is required")
      return false
    }
    if (!form.email.trim()) {
      toast.error("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Invalid email format")
      return false
    }
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setShowDialog(true)
    }
  }

  const confirmSubmit = async () => {
    try {
      const payload = {
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        password: form.password,
        role: form.role,
        researcherData: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          status: form.status,
          qualification: form.qualification,
          position: form.position,
          hIndex: form.hIndex,
          i10Index: form.i10Index,
          citations: form.citations,
          teamId: form.teamId,
          orcidId: form.orcidId,
          joinDate: form.joinDate,
          leaveDate: form.leaveDate,
          biography: form.biography,
          researchInterests: form.researchInterests,
          dblpUrl: form.dblpUrl,
          googleScholarUrl: form.googleScholarUrl,
          researchGateUrl: form.researchGateUrl,
          linkedinUrl: form.linkedinUrl,
          personalWebsite: form.personalWebsite
        }
      };
  
      // Step 1: Create researcher + user
      const createResponse = await fetch('/api/admin/researchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.expires}`
        },
        body: JSON.stringify(payload)
      });
  
      const createResult = await createResponse.json();
  
      if (!createResponse.ok) {
        throw new Error(createResult.error || 'Failed to create researcher');
      }
  
      const researcherId = createResult.researcher?.id;
      if (!researcherId) {
        throw new Error('Researcher created, but ID not returned');
      }
  
      // Step 2: Trigger publication update
        try {
          const updateResponse = await fetch('/api/publications/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.expires}`
            },
            body: JSON.stringify({ ids: [researcherId] })
          });
  
          const updateResult = await updateResponse.json();
  
          if (!updateResponse.ok) {
            toast.warning('Researcher created, but publication scraping failed');
            console.warn('Scraping error:', updateResult.error);
          } else if (updateResult.totalPublications > 0) {
            toast.success(`Researcher created with ${updateResult.totalPublications} publications`);
          } else {
            toast.success('Researcher created (no publications found)');
          }
        } catch (scrapeError) {
          console.warn('Scraping request failed:', scrapeError);
          toast.warning('Researcher created but scraping failed');
        }
  
      router.push('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(message);
      console.error('Add researcher failed:', error);
    } finally {
      setShowDialog(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="rounded-lg border border-[#e2e8f0] shadow-sm">
        <CardHeader className="border-b border-[#e2e8f0] bg-[#f8fafc]">
          <CardTitle className="text-xl font-semibold text-[#1e293b]">Add New Researcher</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">First Name *</label>
                  <Input 
                    name="firstName" 
                    value={form.firstName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Last Name *</label>
                  <Input 
                    name="lastName" 
                    value={form.lastName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Email *</label>
                  <Input 
                    name="email" 
                    type="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">ORCID ID</label>
                  <Input 
                    name="orcidId" 
                    value={form.orcidId} 
                    onChange={handleChange} 
                    placeholder="0000-0000-0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Phone</label>
                  <Input 
                    name="phone" 
                    value={form.phone} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Status</label>
                  <Select 
                    value={form.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

{/* Qualification Select */}
<div>
  <label className="block text-sm font-medium text-[#475569] mb-1">Qualification</label>
  <Select
    value={form.qualification}
    onValueChange={(value) => handleSelectChange("qualification", value)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select qualification" />
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

{/* Position Select */}
<div>
  <label className="block text-sm font-medium text-[#475569] mb-1">Position</label>
  <Select
    value={form.position}
    onValueChange={(value) => handleSelectChange("position", value)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select position" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="director">Director</SelectItem>
      <SelectItem value="department_head">Department Head</SelectItem>
      <SelectItem value="principal_investigator">Principal Investigator</SelectItem>
      <SelectItem value="senior_researcher">Senior Researcher</SelectItem>
      <SelectItem value="researcher">Researcher</SelectItem>
      <SelectItem value="assistant">Assistant</SelectItem>
    </SelectContent>
  </Select>
</div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Join Date</label>
                  <Input 
                    name="joinDate" 
                    type="date" 
                    value={form.joinDate} 
                    onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Leave Date</label>
                  <Input 
                    name="leaveDate" 
                    type="date" 
                    value={form.leaveDate} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">H-index</label>
                <Input 
                  name="hIndex" 
                  type="number" 
                  min="0"
                  value={form.hIndex} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">i10-index</label>
                <Input 
                  name="i10Index" 
                  type="number" 
                  min="0"
                  value={form.i10Index} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">Citations</label>
                <Input 
                  name="citations" 
                  type="number" 
                  min="0"
                  value={form.citations} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">Biography</label>
                <Input 
                  name="biography" 
                  value={form.biography} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">Research Interests</label>
                <Input 
                  name="researchInterests" 
                  value={form.researchInterests} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">DBLP URL</label>
                <Input 
                  name="dblpUrl" 
                  value={form.dblpUrl} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">Google Scholar URL</label>
                <Input 
                  name="googleScholarUrl" 
                  value={form.googleScholarUrl} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">ResearchGate URL</label>
                <Input 
                  name="researchGateUrl" 
                  value={form.researchGateUrl} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">Personal Website</label>
                <Input 
                  name="personalWebsite" 
                  value={form.personalWebsite} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            {session?.user.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">Role</label>
                <Select 
                  value={form.role}
                  onValueChange={(value) => handleSelectChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="admin">Admin</SelectItem> */}
                    {/* <SelectItem value="director">Director</SelectItem> */}
                    <SelectItem value="researcher">Researcher</SelectItem>
                    {/* <SelectItem value="assistant">Assistant</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-4">
              <Button type="submit" className="w-full">
                Add Researcher
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to add this researcher?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSubmit}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}