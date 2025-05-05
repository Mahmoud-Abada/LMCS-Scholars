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
      toast.error("Le Prenom est obligatoire")
      return false
    }
    if (!form.lastName.trim()) {
      toast.error("Le Nom est obligatoire")
      return false
    }
    if (!form.email.trim()) {
      toast.error("l'Email est obligatoire")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Format d'email invalide")
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
      }
      // const response2 = await fetch('/api/admin/users', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${session?.accessToken}`
      //   },
      //   body: JSON.stringify(payload)
      // })

      // if (!response2.ok) {
      //   const errorData = await response2.json()
      //   throw new Error(errorData.error || 'Failed to add user')
      // }

      const response = await fetch('/api/admin/researchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add researcher')
      }

      toast.success("Chercheur ajouté avec succés!")
      router.push('/')
    } catch (error: any) {
      toast.error(error.message)
      console.error('Error adding researcher:', error)
    } finally {
      setShowDialog(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="rounded-lg border border-[#e2e8f0] shadow-sm">
        <CardHeader className="border-b border-[#e2e8f0] bg-[#f8fafc]">
          <CardTitle className="text-xl font-semibold text-[#1e293b]">Ajouter un nouveau chercheur</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Prénom *</label>
                  <Input 
                    name="firstName" 
                    value={form.firstName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Nom *</label>
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
                  <label className="block text-sm font-medium text-[#475569] mb-1">ID ORCID</label>
                  <Input 
                    name="orcidId" 
                    value={form.orcidId} 
                    onChange={handleChange} 
                    placeholder="0000-0000-0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Téléphone</label>
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
      <SelectValue placeholder="Sélectionnez la qualification" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="professor">Professeur</SelectItem>
      <SelectItem value="associate_professor">Professeur associé</SelectItem>
      <SelectItem value="assistant_professor">Professeur assistant</SelectItem>
      <SelectItem value="postdoc">Postdoctorant</SelectItem>
      <SelectItem value="phd_candidate">Doctorant</SelectItem>
      <SelectItem value="research_scientist">Chercheur scientifique</SelectItem>
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
      <SelectValue placeholder="Sélectionnez le poste" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="director">Directeur</SelectItem>
      <SelectItem value="department_head">Chef de département</SelectItem>
      <SelectItem value="principal_investigator">Chercheur principal</SelectItem>
      <SelectItem value="senior_researcher">Chercheur senior</SelectItem>
      <SelectItem value="researcher">Chercheur</SelectItem>
      <SelectItem value="assistant">Assistant</SelectItem>
    </SelectContent>
  </Select>
</div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Date d'entrée</label>
                  <Input 
                    name="joinDate" 
                    type="date" 
                    value={form.joinDate} 
                    onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Date de sortie</label>
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
                <label className="block text-sm font-medium text-[#475569] mb-1">Biographie</label>
                <Input 
                  name="biography" 
                  value={form.biography} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">Domaines de recherche</label>
                <Input 
                  name="researchInterests" 
                  value={form.researchInterests} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">URL DBLP</label>
                <Input 
                  name="dblpUrl" 
                  value={form.dblpUrl} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">URL Google Scholar</label>
                <Input 
                  name="googleScholarUrl" 
                  value={form.googleScholarUrl} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">URL ResearchGate</label>
                <Input 
                  name="researchGateUrl" 
                  value={form.researchGateUrl} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">Site personnel</label>
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
                Ajouter un chercheur
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la soumission</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir ajouter ce chercheur ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={confirmSubmit}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}