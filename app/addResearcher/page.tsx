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
      <Card className="rounded-lg border border-[#e2e8f0] shadow-sm">
        <CardHeader className="border-b border-[#e2e8f0] bg-[#f8fafc]">
          <CardTitle className="text-xl font-semibold text-[#1e293b]">Ajouter un nouveau chercheur</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Matricule ESI</label>
                  <Input 
                    name="chercheur_id" 
                    value={form.chercheur_id} 
                    onChange={handleChange} 
                    required 
                    className="focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Nom complet</label>
                  <Input 
                    name="nom_complet" 
                    value={form.nom_complet} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Email</label>
                  <Input 
                    name="email" 
                    type="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Numéro de téléphone</label>
                  <Input 
                    name="tel" 
                    value={form.tel} 
                    onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Diplôme</label>
                  <Input 
                    name="diplome" 
                    value={form.diplome} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Établissement d'origine</label>
                  <Input 
                    name="etablissement" 
                    value={form.etablissement} 
                    onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Qualité</label>
                  <Select onValueChange={(value) => setForm({ ...form, qualite: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner Qualité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Enseignant-Chercheur">Enseignant-Chercheur</SelectItem>
                      <SelectItem value="Chercheur">Chercheur</SelectItem>
                      <SelectItem value="Doctorant">Doctorant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Grade de Recherche</label>
                  <Select onValueChange={(value) => setForm({ ...form, grade: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Attaché de recherche">Attaché de recherche</SelectItem>
                      <SelectItem value="Chargé de recherche">Chargé de recherche</SelectItem>
                      <SelectItem value="Directeur de recherche">Directeur de recherche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1">Statut</label>
                  <Select 
                    onValueChange={(value) => setForm({ ...form, statut: value })}
                    defaultValue="Actif"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Non actif">Non actif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">H-index</label>
                <Input 
                  name="hindex" 
                  type="number" 
                  value={form.hindex} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">Équipe</label>
                <Input 
                  name="equipe" 
                  value={form.equipe} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-1">URL du profil de recherche</label>
                <Input 
                  name="url" 
                  value={form.url} 
                  onChange={handleChange} 
                  placeholder="DBLP, Google Scholar..." 
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              >
                Ajouter Chercheur
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="border border-[#e2e8f0] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1e293b]">Confirmer la soumission</DialogTitle>
          </DialogHeader>
          <p className="text-[#475569]">Cette action ajoutera un nouveau chercheur à la base de données. Voulez-vous continuer ?</p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDialog(false)}
              className="border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9]"
            >
              Annuler
            </Button>
            <Button 
              onClick={confirmSubmit}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}