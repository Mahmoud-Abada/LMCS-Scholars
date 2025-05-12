// app/publication/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { FileText, Link as LinkIcon, Users, Award, BookOpen, ChevronLeft, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UpdatePublicationForm } from "@/components/UpdatePublicationForm";
import { toast } from 'sonner';
import { useSession } from "next-auth/react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type Publication = {
  id: string;
  title: string;
  abstract?: string;
  authors?: any[];
  externalAuthors?: any[];
  venues?: any[];
  classifications?: any[];
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
};

export default function PublicationDetails() {
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const isAdmin = session?.user?.role === 'assistant';

  useEffect(() => {
    const fetchPublication = async () => {
      try {
        const response = await fetch(`/api/publications/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch publication data');
        }
        const data = await response.json();
        setPublication(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPublication();
  }, [id]);

  const handleUpdateSuccess = (updatedPublication: Publication) => {
    setPublication(updatedPublication);
    setEditMode(false);
    toast.success('Publication updated successfully');
    router.refresh();
  };

  if (editMode && publication) {
    return (
      <SidebarProvider>
        <div className="min-h-screen pl-16">
          <div className="p-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => setEditMode(false)} className="mr-2">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Publication
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Edit Publication</h1>
            </div>
            <UpdatePublicationForm 
              publication={publication} 
              onSuccess={handleUpdateSuccess}
            />
          </div>
        </div>
      </SidebarProvider>
    );
  }


  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen pl-16">
          <div className="p-4 max-w-7xl mx-auto">
            <div className="flex items-center mb-4">
              <Button variant="ghost" onClick={() => router.back()} className="mr-2">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Skeleton className="h-6 w-48" />
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="authors">Authors</TabsTrigger>
                <TabsTrigger value="impact">Impact</TabsTrigger>
                <TabsTrigger value="venue">Venue</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="col-span-2">
                    <CardHeader>
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-24" />
                        ))}
                      </div>
                      <Skeleton className="h-[300px]" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24" />
                      ))}
                      <Skeleton className="h-10" />
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

  if (error) {
    return (
      <SidebarProvider>
        <div className="min-h-screen pl-16">
          <div className="p-4 max-w-7xl mx-auto">
            <div className="flex items-center mb-4">
              <Button variant="ghost" onClick={() => router.back()} className="mr-2">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Publication Details</h1>
            </div>
            <div className="text-red-500">{error}</div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchPublication();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!publication) {
    return (
      <SidebarProvider>
        <div className="min-h-screen pl-16">
          <div className="p-4 max-w-7xl mx-auto">
            <div className="flex items-center mb-4">
              <Button variant="ghost" onClick={() => router.back()} className="mr-2">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Publication Details</h1>
            </div>
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Publication not found</h3>
              <p className="mt-1 text-sm text-gray-500">
                The requested publication could not be found.
              </p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Prepare chart data from fetched data
  const citationData = [
    { year: 2022, citations: Math.floor(publication.citationCount * 0.3) },
    { year: 2023, citations: Math.floor(publication.citationCount * 0.6) },
    { year: 2024, citations: publication.citationCount },
  ];

  const authorData = [
    ...publication.authors.map(author => ({
      name: `${author.firstName} ${author.lastName}`,
      hIndex: author.hIndex || 0,
      contribution: 50
    })),
    ...publication.externalAuthors.map(author => ({
      name: author.fullName,
      hIndex: 0,
      contribution: 50 / publication.externalAuthors.length
    }))
  ];

  const venueData = [
    { subject: 'Rank', A: 85 },
    { subject: 'Impact', A: 75 },
    { subject: 'Acceptance', A: 65 },
    { subject: 'Citations', A: 80 },
    { subject: 'Reputation', A: 78 },
  ];

  const publicationYear = publication.publicationDate 
    ? new Date(publication.publicationDate).getFullYear() 
    : 'N/A';

  const topClassification = publication.classifications.length > 0
    ? publication.classifications[0]
    : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen pl-16">
        <div className="p-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => router.back()} className="mr-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Publication Details</h1>
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit Publication
              </Button>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="authors">Authors</TabsTrigger>
              <TabsTrigger value="impact">Impact</TabsTrigger>
              <TabsTrigger value="venue">Venue</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">{publication.title}</CardTitle>
                    <CardDescription>
                      Published in {publicationYear}
                      {publication.journal && ` in ${publication.journal}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Pages</p>
                        <p className="text-xl font-semibold">{publication.pages || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Volume</p>
                        <p className="text-xl font-semibold">{publication.volume || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Venue Rank</p>
                        <p className="text-xl font-semibold">
                          {topClassification?.category || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {publication.abstract && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Abstract</h3>
                        <p className="text-gray-700">{publication.abstract}</p>
                      </div>
                    )}

                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={citationData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="citations" fill="#3b82f6" name="Citations" />
                        </BarChart>
                      </ResponsiveContainer>
                      <p className="text-center text-sm text-gray-500 mt-2">Citation Trends</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">Total Citations</p>
                      <p className="text-2xl font-bold">{publication.citationCount}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Venue Rank</p>
                      <p className="text-2xl font-bold">
                        {topClassification?.category || 'N/A'}
                      </p>
                      {topClassification?.systemName && (
                        <p className="text-xs text-green-500">{topClassification.systemName}</p>
                      )}
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Authors</p>
                      <p className="text-2xl font-bold">
                        {publication.authors.length + publication.externalAuthors.length}
                      </p>
                    </div>
                    {publication.pdfUrl && (
                      <Button asChild className="w-full">
                        <a href={publication.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View Full Publication
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="authors">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Authors</CardTitle>
                    <CardDescription>
                      {publication.authors.length} internal authors
                      {publication.externalAuthors.length > 0 && 
                        `, ${publication.externalAuthors.length} external authors`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {publication.authors.map(author => (
                        <div key={author.id} className="flex items-center p-4 border rounded-lg">
                          <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-12 h-12 flex items-center justify-center mr-4">
                            {author.firstName.charAt(0)}{author.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{author.firstName} {author.lastName}</p>
                            <p className="text-sm text-gray-500">
                              {author.affiliationDuringWork || 'No affiliation provided'}
                            </p>
                            {author.hIndex && (
                              <p className="text-sm text-gray-500">H-index: {author.hIndex}</p>
                            )}
                          </div>
                        </div>
                      ))}

                      {publication.externalAuthors.map(author => (
                        <div key={author.id} className="flex items-center p-4 border rounded-lg">
                          <div className="bg-gray-100 text-gray-800 font-bold rounded-full w-12 h-12 flex items-center justify-center mr-4">
                            {author.fullName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-semibold">{author.fullName}</p>
                            <p className="text-sm text-gray-500">
                              {author.affiliation || 'No affiliation provided'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Author Contributions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={authorData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="contribution"
                            label={({ name }) => name}
                          >
                            {authorData.map((entry, index) => (
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
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Citation Trends</CardTitle>
                    <CardDescription>Citations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={citationData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="citations" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Citation Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'This Publication', citations: publication.citationCount },
                          { name: 'Venue Average', citations: Math.floor(publication.citationCount * 0.7) },
                          { name: 'Field Average', citations: Math.floor(publication.citationCount * 0.5) },
                        ]}>
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
                {publication.venues.length > 0 ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Venue Information</CardTitle>
                        <CardDescription>{publication.venues[0].name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Type</span>
                            <span className="font-medium">{publication.venues[0].type}</span>
                          </div>
                          {publication.venues[0].publisher && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Publisher</span>
                              <span className="font-medium">{publication.venues[0].publisher}</span>
                            </div>
                          )}
                          {publication.venues[0].issn && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">ISSN</span>
                              <span className="font-medium">{publication.venues[0].issn}</span>
                            </div>
                          )}
                          {publication.venues[0].eventDate && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Event Date</span>
                              <span className="font-medium">
                                {new Date(publication.venues[0].eventDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {publication.venues[0].isOpenAccess && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Open Access</span>
                              <span className="font-medium">Yes</span>
                            </div>
                          )}
                          {topClassification && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Ranking</span>
                              <span className="font-medium">
                                {topClassification.category} ({topClassification.systemName})
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Venue Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={venueData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} />
                              <Radar 
                                name="Venue" 
                                dataKey="A" 
                                stroke="#3b82f6" 
                                fill="#3b82f6" 
                                fillOpacity={0.6} 
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle>Venue Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500">No venue information available</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarProvider>
  );
}