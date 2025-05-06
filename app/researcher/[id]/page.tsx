// app/researchers/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { FileText, Award, Globe, Users, BookOpen, Link2, ExternalLink, Pencil } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { UpdateProfileForm } from "@/components/UpdateProfileForm"
import { useSession } from "next-auth/react"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

type Researcher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  orcidId?: string;
  phone?: string;
  status: string;
  qualification?: string;
  position?: string;
  hIndex: number;
  i10Index: number;
  citations: number;
  teamId?: string;
  joinDate?: string;
  leaveDate?: string;
  biography?: string;
  researchInterests?: string;
  dblpUrl?: string;
  googleScholarUrl?: string;
  researchGateUrl?: string;
  linkedinUrl?: string;
  personalWebsite?: string;
  createdAt: string;
  updatedAt: string;
  team?: {
    id: string;
    name: string;
    description?: string;
    establishedDate?: string;
    websiteUrl?: string;
  };
  user?: {
    id: string;
    email: string;
    role: string;
    lastLogin?: string;
    isActive: boolean;
  };
  publications: Array<{
    id: string;
    title: string;
    abstract?: string;
    authors?: string[];
    publicationType?: string;
    publicationDate?: string;
    doi?: string;
    url?: string;
    pdfUrl?: string;
    scholarLink?: string;
    dblpLink?: string;
    citationCount: number;
    pages?: string;
    volume?: string;
    issue?: string;
    publisher?: string;
    journal?: string;
    language?: string;
  }>;
  metrics: {
    totalPublications: number;
    totalCitations: number;
    hIndex: number;
    i10Index: number;
  };
};

export default function ResearcherProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [researcher, setResearcher] = useState<Researcher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    const fetchResearcher = async () => {
      try {
        const response = await fetch(`/api/researchers/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch researcher data')
        }
        const data = await response.json()
        setResearcher(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchResearcher()
  }, [id])

  const handleUpdateSuccess = (updatedResearcher: Researcher) => {
    setResearcher(updatedResearcher)
    setEditMode(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-6">
            <Skeleton className="h-96 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  if (!researcher) {
    router.push(`/researcher/${id}`)
  }

  // Prepare chart data
  const publicationData = [
    { year: 2020, publications: 2, citations: 45 },
    { year: 2021, publications: 4, citations: 120 },
    { year: 2022, publications: 6, citations: 210 },
    { year: 2023, publications: 3, citations: 95 },
  ];

  const researchAreaData = [
    { name: "Machine Learning", value: 35 },
    { name: "Computer Vision", value: 25 },
    { name: "NLP", value: 20 },
    { name: "Robotics", value: 15 },
    { name: "Systems", value: 5 },
  ];

  const collaborationData = [
    { institution: "esi", count: 15 },
    { institution: "esi", count: 12 },
    { institution: "esi", count: 8 },
    { institution: "esi", count: 6 },
    { institution: "esi", count: 5 },
  ];

  const isCurrentUser = session?.user?.email === researcher.email;

  if (editMode) {
    return (
      <div className="bg-white min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <Button 
              variant="outline" 
              onClick={() => setEditMode(false)}
            >
              Cancel
            </Button>
          </div>
          <UpdateProfileForm 
            researcher={researcher} 
            onSuccess={handleUpdateSuccess} 
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Profile Header */}
      <div className="border-b">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex items-center">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">
                  {researcher.firstName.charAt(0)}{researcher.lastName.charAt(0)}
                </span>
              </div>
              <div className="ml-6">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {researcher.firstName} {researcher.lastName}
                  </h1>
                  {isCurrentUser && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
                <p className="text-lg text-gray-600">
                  {researcher.position && `${researcher.position}, `}
                  {researcher.qualification}
                </p>
                {researcher.team && (
                  <p className="text-sm text-gray-500">Team: {researcher.team.name}</p>
                )}
                <div className="flex gap-4 mt-2">
                  {researcher.orcidId && (
                    <Link 
                      href={`https://orcid.org/${researcher.orcidId}`} 
                      target="_blank" 
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4 mr-1" /> ORCID
                    </Link>
                  )}
                  {researcher.googleScholarUrl && (
                    <Link 
                      href={researcher.googleScholarUrl} 
                      target="_blank" 
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Award className="h-4 w-4 mr-1" /> Google Scholar
                    </Link>
                  )}
                  {researcher.personalWebsite && (
                    <Link 
                      href={researcher.personalWebsite} 
                      target="_blank" 
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Globe className="h-4 w-4 mr-1" /> Website
                    </Link>
                  )}
                  {researcher?.dblpUrl && (
                    <Link 
                      href={researcher.dblpUrl} 
                      target="_blank" 
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Globe className="h-4 w-4 mr-1" /> DBLP
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 md:mt-0">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">
                  {researcher.metrics?.totalCitations || 0} Citations
                </span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">
                  {researcher.metrics?.totalPublications || 0} Publications
                </span>
              </div>
              <div className="flex items-center">
                <Award className="h-5 w-5 text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">
                  h-index: {researcher.metrics?.hIndex || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
            <TabsTrigger value="metrics">Impact & Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="p-6 col-span-2">
                <h3 className="text-lg font-semibold mb-4">Publication & Citation Trends</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={publicationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line yAxisId="left" type="monotone" dataKey="publications" stroke="#2563eb" strokeWidth={2} name="Publications" />
                      <Line yAxisId="right" type="monotone" dataKey="citations" stroke="#16a34a" strokeWidth={2} name="Citations" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Research Areas</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={researchAreaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {researchAreaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 col-span-2">
                <h3 className="text-lg font-semibold mb-4">Top Collaborating Institutions</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={collaborationData}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="institution" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Total Publications</div>
                    <div className="text-2xl font-bold mt-1">{researcher.metrics?.totalPublications || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Total Citations</div>
                    <div className="text-2xl font-bold mt-1">{researcher.metrics?.totalCitations || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">i10-index</div>
                    <div className="text-2xl font-bold mt-1">{researcher.metrics?.i10Index || 0}</div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="publications">
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-6">Recent Publications</h3>
                <div className="space-y-6">
                  {researcher.publications.length > 0 ? (
                    researcher.publications.map((pub) => (
                      <div key={pub.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                              {pub.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{pub.authors?.join(', ')}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {pub.journal} • {pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : ''}
                            </p>
                            <div className="flex gap-4 mt-2">
                              {pub.dblpLink && (
                                <a href={pub.dblpLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                                  <FileText className="h-4 w-4 mr-1" /> DBLP
                                </a>
                              )}
                              {pub.doi && (
                                <a href={pub.doi} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                                  <Link2 className="h-4 w-4 mr-1" /> DOI
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{pub.citationCount} citations</span>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No publications found</p>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <div className="grid gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-6">Citation Metrics</h3>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Total Citations</div>
                    <div className="text-3xl font-bold mt-1">{researcher.metrics?.totalCitations || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">h-index</div>
                    <div className="text-3xl font-bold mt-1">{researcher.metrics?.hIndex || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">i10-index</div>
                    <div className="text-3xl font-bold mt-1">{researcher.metrics?.i10Index || 0}</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-6">Citation Distribution by Year</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={publicationData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="citations" fill="#16a34a" name="Citations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}