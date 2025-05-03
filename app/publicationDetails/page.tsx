'use client';

import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
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
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Link as LinkIcon, Users, Award, BookOpen, ChevronLeft } from "lucide-react";

export default function PublicationDetails() {
  const router = useRouter();

  const publication = {
    publication_id: 'pub123',
    titre_publication: 'Deep Learning for Scientific Discovery',
    nombre_pages: 12,
    volumes: 'Vol. 34',
    lien: 'https://example.com/publication.pdf',
    annee: 2024,
    authors: [
      { chercheur_id: 'c1', nom_complet: 'Dr. Fatima Zahra', hindex: 18 },
      { chercheur_id: 'c2', nom_complet: 'Dr. Ahmed Benali', hindex: 24 },
    ],
    venue: {
      id: 'ICML2024',
      nom: 'International Conference on Machine Learning',
      type: 'Conference',
      thematique: 'AI & ML',
      scope: 'International',
      lieu: 'Paris, France',
      periode: 'June 10–14, 2024',
      periodicite: 'Annual',
    },
    classifications: [
      {
        class_id: 'cls1',
        nom: 'CORE',
        classement: 'A*',
        lien: 'https://core.edu.au',
      },
    ],
    stats: {
      citationsByYear: [
        { year: 2024, citations: 45 },
        { year: 2025, citations: 78 },
        { year: 2026, citations: 112 },
      ],
      authorContributions: [
        { name: 'Dr. Fatima Zahra', contribution: 60 },
        { name: 'Dr. Ahmed Benali', contribution: 40 },
      ],
      citationComparison: [
        { name: 'This Publication', citations: 235 },
        { name: 'Venue Average', citations: 180 },
        { name: 'Field Average', citations: 150 },
      ],
      keywords: [
        { keyword: 'Deep Learning', count: 42 },
        { keyword: 'Scientific Discovery', count: 38 },
        { keyword: 'Neural Networks', count: 28 },
        { keyword: 'AI Applications', count: 22 },
      ],
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    
    <SidebarProvider>
    
  
  <Head>
    <title>{publication.titre_publication} | Publications LMCS</title>
  </Head>

  {/* Remove ml-* class completely and add pl-[sidebar-width] */}
  <div className="min-h-screen  pl-16"> {/* Assuming sidebar is 64px wide */}
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header with back button - now flush with sidebar */}
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="mr-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Détails de la Publication</h1>
      </div>

          {/* Main content with tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Aperçu</TabsTrigger>
              <TabsTrigger value="authors">Auteurs</TabsTrigger>
              <TabsTrigger value="impact">Impact</TabsTrigger>
              <TabsTrigger value="venue">Lieu</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Publication Info Card */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">{publication.titre_publication}</CardTitle>
                    <CardDescription>Publié en {publication.annee}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Pages</p>
                        <p className="text-xl font-semibold">{publication.nombre_pages}</p>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Volume</p>
                        <p className="text-xl font-semibold">{publication.volumes}</p>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Classement du Lieu</p>
                        <p className="text-xl font-semibold">{publication.classifications[0].classement}</p>
                      </div>
                    </div>

                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={publication.stats.keywords}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="keyword" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" name="Mentions" />
                        </BarChart>
                      </ResponsiveContainer>
                      <p className="text-center text-sm text-gray-500 mt-2">Fréquence des Mots-clés</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statistiques Rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">Citations Totales</p>
                      <p className="text-2xl font-bold">235</p>
                      <p className="text-xs text-blue-500">+32% par rapport à l'année dernière</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Classement du Lieu</p>
                      <p className="text-2xl font-bold">A*</p>
                      <p className="text-xs text-green-500">Top 5% dans le domaine</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Auteurs</p>
                      <p className="text-2xl font-bold">2</p>
                      <p className="text-xs text-purple-500">H-index moyen : 21</p>
                    </div>
                    <Button asChild className="w-full">
                      <a href={publication.lien} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Voir la Publication Complète
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="authors">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Authors List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Auteurs</CardTitle>
                    <CardDescription>Les chercheurs ayant contribué à cette publication</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {publication.authors.map(author => (
                        <div key={author.chercheur_id} className="flex items-center p-4 border rounded-lg">
                          <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-12 h-12 flex items-center justify-center mr-4">
                            {author.nom_complet.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-semibold">{author.nom_complet}</p>
                            <p className="text-sm text-gray-500">H-index : {author.hindex}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Author Contributions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contributions des Auteurs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={publication.stats.authorContributions}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="contribution"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {publication.stats.authorContributions.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="impact">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Citation Trends */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Tendances des Citations</CardTitle>
                    <CardDescription>Citations au fil du temps</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={publication.stats.citationsByYear}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="citations" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Citation Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comparaison des Citations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={publication.stats.citationComparison}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="citations" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="venue">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Venue Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations sur le Lieu</CardTitle>
                    <CardDescription>{publication.venue.nom}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Type</span>
                        <span className="font-medium">{publication.venue.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Lieu</span>
                        <span className="font-medium">{publication.venue.lieu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Période</span>
                        <span className="font-medium">{publication.venue.periode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Périodicité</span>
                        <span className="font-medium">{publication.venue.periodicite}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Portée</span>
                        <span className="font-medium">{publication.venue.scope}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Classement</span>
                        <span className="font-medium">{publication.classifications[0].classement}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Venue Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance du Lieu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Rank', A: 95 },
                          { subject: 'Impact', A: 85 },
                          { subject: 'Acceptance', A: 70 },
                          { subject: 'Citations', A: 90 },
                          { subject: 'Reputation', A: 88 },
                        ]}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="ICML" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </SidebarProvider>
      
  );
}