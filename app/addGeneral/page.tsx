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

export default function AddGeneralPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({
    name: "",
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
    password: generatePassword(),
    role: "assistant",
    isActive: true,
    image: "",
    researcherId: ""
  })

  const [showDialog, setShowDialog] = useState(false)

  function generatePassword() {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

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
    setForm(prev => ({ 
      ...prev, 
      [name]: value,
      // Reset researcher-specific fields if role changes from researcher
      ...(name === 'role' && value !== 'researcher' ? {
        firstName: "",
        lastName: "",
        qualification: "",
        position: "",
        hIndex: 0,
        i10Index: 0,
        citations: 0,
        orcidId: "",
        biography: "",
        researchInterests: "",
        dblpUrl: "",
        googleScholarUrl: "",
        researchGateUrl: ""
      } : {})
    }))
  }

  const validateForm = () => {
    if (!form.email.trim()) {
      toast.error("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Invalid email format")
      return false
    }
    
    if (form.role === "researcher") {
      if (!form.firstName.trim()) {
        toast.error("First name is required for researchers")
        return false
      }
      if (!form.lastName.trim()) {
        toast.error("Last name is required for researchers")
        return false
      }
    } else {
      if (!form.name.trim()) {
        toast.error("Name is required")
        return false
      }
    }
    
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setShowDialog(true)
    }
  }

  const sendWelcomeEmail = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: "nh_rafa@esi.dz",
          subject: form.role === 'researcher' 
            ? 'Welcome to Our Research Platform' 
            : 'Your Account Has Been Created',
          text: `Dear ${name},\n\n${form.role === 'researcher' 
            ? 'You have been added to our research platform.' 
            : 'Your account has been created on our platform.'}\n\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after logging in.\n\nBest regards,\nThe Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a365d;">${form.role === 'researcher' 
                ? 'Welcome to Our Research Platform' 
                : 'Your Account Has Been Created'}</h2>
              <p>Dear ${name},</p>
              <p>${form.role === 'researcher' 
                ? 'You have been added to our research platform.' 
                : 'Your account has been created on our platform.'}</p>
              <div style="background: #f7fafc; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
              </div>
              <p style="color: #e53e3e;">Please change your password after logging in.</p>
              <p>Best regards,<br>The Team</p>
            </div>
          `,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send welcome email')
      }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      throw error
    }
  }

  const confirmSubmit = async () => {
    try {
      let payload;
      
      if (form.role === "researcher") {
        payload = {
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          password: form.password,
          role: form.role,
          isActive: form.isActive,
          image: form.image,
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
      } else {
        payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          isActive: form.isActive,
          image: form.image,
          researcherId: form.researcherId || null
        };
      }

      // Create the user/researcher
      const endpoint = form.role === "researcher" 
        ? '/api/admin/researchers' 
        : '/api/admin/users';
        
      const createResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.expires}`
        },
        body: JSON.stringify(payload)
      });

      const createResult = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createResult.error || 'Failed to create record');
      }

      // For researchers, try to fetch publications
      if (form.role === "researcher") {
        const researcherId = createResult.researcher?.id;
        if (researcherId) {
          try {
            const updateResponse = await fetch('/api/publications/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.expires}`
              },
              body: JSON.stringify({ ids: [researcherId] })
            });

            if (!updateResponse.ok) {
              toast.warning('Researcher created, but publication scraping failed');
            } else {
              const updateResult = await updateResponse.json();
              if (updateResult.totalPublications > 0) {
                toast.success(`Researcher created with ${updateResult.totalPublications} publications`);
              } else {
                toast.success('Researcher created (no publications found)');
              }
            }
          } catch (scrapeError) {
            console.warn('Scraping request failed:', scrapeError);
            toast.warning('Researcher created but scraping failed');
          }
        }
      }

      // Send welcome email
      await sendWelcomeEmail(
        form.email,
        form.password,
        form.role === "researcher" ? `${form.firstName} ${form.lastName}` : form.name
      );

      toast.success(`${form.role === "researcher" ? "Researcher" : "User"} created successfully`);
      router.push('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(message);
      console.error('Creation failed:', error);
    } finally {
      setShowDialog(false);
    }
  };

  const isResearcher = form.role === "researcher";

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="rounded-lg border border-[#e2e8f0] shadow-sm">
        <CardHeader className="border-b border-[#e2e8f0] bg-[#f8fafc]">
          <CardTitle className="text-xl font-semibold text-[#1e293b]">
            Add New {isResearcher ? "Researcher" : "User"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Role *</label>
                  <Select 
                    value={form.role}
                    onValueChange={(value) => handleSelectChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="researcher">Researcher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isResearcher ? (
                  <>
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
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-1">Full Name *</label>
                    <Input 
                      name="name" 
                      value={form.name} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                )}

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
                  <label className="block text-sm font-medium text-[#475569] mb-1">Status</label>
                  <Select 
                    value={form.isActive ? "active" : "inactive"}
                    onValueChange={(value) => handleSelectChange("isActive", value === "active")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Profile Image URL</label>
                  <Input 
                    name="image" 
                    value={form.image} 
                    onChange={handleChange} 
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                {!isResearcher && (
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-1">Researcher ID (optional)</label>
                    <Input 
                      name="researcherId" 
                      value={form.researcherId} 
                      onChange={handleChange} 
                      placeholder="Leave empty if not associated with a researcher"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Researcher-specific fields */}
            {isResearcher && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </>
            )}

            <div className="pt-4">
              <Button type="submit" className="w-full">
                Add {isResearcher ? "Researcher" : "User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {isResearcher ? "Researcher" : "User"} Creation</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p>Are you sure you want to create this {isResearcher ? "researcher" : "user"}?</p>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="font-medium">
                {isResearcher ? `${form.firstName} ${form.lastName}` : form.name}
              </p>
              <p className="text-sm text-gray-600">{form.email}</p>
              <p className="text-sm mt-2">
                Role: <span className="font-medium capitalize">{form.role}</span>
              </p>
              <p className="text-sm">
                Status: <span className="font-medium">{form.isActive ? "Active" : "Inactive"}</span>
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              An email with login credentials will be sent to {form.email}
            </p>
          </div>
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