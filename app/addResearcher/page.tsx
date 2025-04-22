'use client'
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export default function AddResearcherPage() {
  const { data: session } = useSession()

//   if (!session || !["admin", "directeur"].includes(session.user.role)) {
//     redirect("/unauthorized")
//   }

  const [form, setForm] = useState({
    chercheur_id: "",
    nom_complet: "",
    email: "",
    tel: "",
    diplome: "",
    etablissement: "",
    qualite: "",
    grade: "",
    statut: "Actif",
    hindex: "",
    equipe: "",
    url: ""
  })

  const [showDialog, setShowDialog] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const confirmSubmit = () => {
    console.log("Submitting Researcher:", form)
    setShowDialog(false)
    // Call API here
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowDialog(true)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="rounded-2xl shadow-xl bg-white dark:bg-[#c5c4c4]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Add New Researcher</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="chercheur_id" placeholder="Matricule ESI" value={form.chercheur_id} onChange={handleChange} required />
            <Input name="nom_complet" placeholder="Full Name" value={form.nom_complet} onChange={handleChange} required />
            <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <Input name="tel" placeholder="Phone Number" value={form.tel} onChange={handleChange} />
            <Input name="diplome" placeholder="Diploma" value={form.diplome} onChange={handleChange} />
            <Input name="etablissement" placeholder="Etablissement d’origine" value={form.etablissement} onChange={handleChange} />
            <Select onValueChange={(value) => setForm({ ...form, qualite: value })}>
              <SelectTrigger><SelectValue placeholder="Qualité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Enseignant-Chercheur">Enseignant-Chercheur</SelectItem>
                <SelectItem value="Chercheur">Chercheur</SelectItem>
                <SelectItem value="Doctorant">Doctorant</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setForm({ ...form, grade: value })}>
              <SelectTrigger><SelectValue placeholder="Grade de Recherche" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Attaché de recherche">Attaché de recherche</SelectItem>
                <SelectItem value="Chargé de recherche">Chargé de recherche</SelectItem>
                <SelectItem value="Directeur de recherche">Directeur de recherche</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setForm({ ...form, statut: value })}>
              <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Actif">Actif</SelectItem>
                <SelectItem value="Non actif">Non actif</SelectItem>
              </SelectContent>
            </Select>
            <Input name="hindex" type="number" placeholder="H-index" value={form.hindex} onChange={handleChange} />
            <Input name="equipe" placeholder="Équipe" value={form.equipe} onChange={handleChange} />
            <Input name="url" placeholder="Research Profile URL (DBLP, Google Scholar...)" value={form.url} onChange={handleChange} />
            <Button type="submit" className="w-full">Submit</Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <p>This action will add a new researcher to the database. Do you want to continue?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={confirmSubmit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
