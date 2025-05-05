"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Users, FileText, Award, Globe, BookOpen, Link2, ExternalLink } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Mock data for researchers
const mockResearchers = [
  {
    id: "1",
    userId: "admin1",
    name: "Prof. Nadia Benmansour",
    position: "Laboratory Director",
    department: "Computer Science",
    bio: "Prof. Benmansour specializes in artificial intelligence and machine learning with over 15 years of research experience...",
    researchInterests: ["Artificial Intelligence", "Machine Learning", "Blockchain"],
    education: ["Ph.D. in Computer Science, MIT", "M.Sc. in Computer Science, Stanford University"],
    contactInfo: {
      email: "n.benmansour@esi.dz",
      phone: "+213 123 456 789",
      website: "https://example.com/nbenmansour",
      socialMedia: {
        linkedin: "https://linkedin.com/in/nadiabenmansour",
        googleScholar: "https://scholar.google.com/citations?user=abc123",
        researchGate: "https://researchgate.net/profile/Nadia_Benmansour"
      }
    },
    publications: ["4", "6"],
    createdAt: "2020-01-01T00:00:00Z",
    updatedAt: "2023-12-01T00:00:00Z",
    stats: {
      publicationsByYear: [
        { year: 2020, count: 2 },
        { year: 2021, count: 3 },
        { year: 2022, count: 4 },
        { year: 2023, count: 1 }
      ],
      citationCount: 1245,
      researchFocusDistribution: [
        { topic: "AI", percentage: 60 },
        { topic: "ML", percentage: 30 },
        { topic: "Blockchain", percentage: 10 }
      ],
      collaborations: [
        { institution: "MIT", projects: 5 },
        { institution: "Stanford", projects: 3 },
        { institution: "ETH Zurich", projects: 2 }
      ],
      currentYearStats: {
        publications: 9,
        citations: 1100,
        projects: 12
      }
    }
  }
];

// Mock data for charts
const publicationData = [
  { year: 2018, publications: 8, citations: 120 },
  { year: 2019, publications: 12, citations: 180 },
  { year: 2020, publications: 15, citations: 320 },
  { year: 2021, publications: 18, citations: 450 },
  { year: 2022, publications: 22, citations: 680 },
  { year: 2023, publications: 9, citations: 1100 },
];

const researchAreaData = [
  { name: "Machine Learning", value: 35 },
  { name: "Computer Vision", value: 25 },
  { name: "NLP", value: 20 },
  { name: "Robotics", value: 15 },
  { name: "Systems", value: 5 },
];

const collaborationData = [
  { institution: "MIT", count: 15 },
  { institution: "Stanford", count: 12 },
  { institution: "ETH Zurich", count: 8 },
  { institution: "Cambridge", count: 6 },
  { institution: "Berkeley", count: 5 },
];

const publications = [
  {
    title: "Deep Learning for Computer Vision: A Comprehensive Review",
    authors: "John Smith, Jane Doe, Michael Johnson",
    venue: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
    year: 2023,
    citations: 124,
    dblp: "https://dblp.org/rec/journals/pami/SmithDJ23",
    doi: "https://doi.org/10.1109/TPAMI.2023.1234567"
  },
  {
    title: "Transformers in Natural Language Processing: Advances and Applications",
    authors: "John Smith, Robert Brown",
    venue: "ACL",
    year: 2022,
    citations: 98,
    dblp: "https://dblp.org/rec/conf/acl/SmithB22",
    doi: "https://doi.org/10.18653/v1/2022.acl-long.123"
  },
  {
    title: "Self-Supervised Learning: The Next Frontier in AI",
    authors: "John Smith, Emily Wilson, David Lee",
    venue: "NeurIPS",
    year: 2021,
    citations: 215,
    dblp: "https://dblp.org/rec/conf/nips/SmithWL21",
    doi: "https://doi.org/10.48550/arXiv.2110.12345"
  }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ResearcherProfilePage() {
  const { t } = useTranslation()

  return (
    <>
    
    <div className="flex min-h-screen bg-background">
  {/* Sidebar */}
  <SidebarProvider>
    <div className=" bg-gray-100">
    
    </div>

  {/* Main content - NO extra margin or padding */}
  <div className=" bg-white">
    <div className="border-b">
      {/* Removed mx-auto and max-w to eliminate center alignment */}
      <div className="px-0 ">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                />
                <div className="ml-6">
                  <h1 className="text-3xl font-bold text-gray-900">Dr. John Smith</h1>
                  <p className="text-lg text-gray-600">Professor of Computer Science</p>
                  <p className="text-sm text-gray-500">Stanford University</p>
                  <div className="flex gap-4 mt-2">
                    <a href="https://dblp.org/pid/s/JohnSmith" target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <FileText className="h-4 w-4 mr-1" /> DBLP Profile
                    </a>
                    <a href="https://scholar.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <Award className="h-4 w-4 mr-1" /> Google Scholar
                    </a>
                    <a href="https://johnsmith.stanford.edu" target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <Globe className="h-4 w-4 mr-1" /> Website
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-4 md:mt-0">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-600">1.2K Collaborators</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-600">156 Publications</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-600">h-index: 45</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
              <TabsTrigger value="publications">Publications</TabsTrigger>
              <TabsTrigger value="citations">Impact & Métriques</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="p-6 col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Tendances des publications & citations</h3>
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
                  <h3 className="text-lg font-semibold mb-4">Domaines de recherche</h3>
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
                  <h3 className="text-lg font-semibold mb-4">Principales institutions collaboratrices</h3>
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
                  <h3 className="text-lg font-semibold mb-4">Statistiques rapides</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Publications cette année</div>
                      <div className="text-2xl font-bold mt-1">9</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Citations cette année</div>
                      <div className="text-2xl font-bold mt-1">1,100</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Projets actifs</div>
                      <div className="text-2xl font-bold mt-1">12</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="publications">
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Publications récentes</h3>
                  <div className="space-y-6">
                    {publications.map((pub, index) => (
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                              {pub.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{pub.authors}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {pub.venue} • {pub.year}
                            </p>
                            <div className="flex gap-4 mt-2">
                              <a href={pub.dblp} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                                <FileText className="h-4 w-4 mr-1" /> DBLP
                              </a>
                              <a href={pub.doi} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                                <Link2 className="h-4 w-4 mr-1" /> DOI
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{pub.citations} citations</span>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="citations">
              <div className="grid gap-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Métriques de citations</h3>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Total des citations</div>
                      <div className="text-3xl font-bold mt-1">4,521</div>
                      <div className="text-sm text-green-600 mt-1">+15% cette année</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">h-index</div>
                      <div className="text-3xl font-bold mt-1">45</div>
                      <div className="text-sm text-green-600 mt-1">+3 depuis 2022</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">i10-index</div>
                      <div className="text-3xl font-bold mt-1">98</div>
                      <div className="text-sm text-green-600 mt-1">+8 depuis 2022</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Distribution des citations par année</h3>
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
  </SidebarProvider>
    </div>

 </> );
}