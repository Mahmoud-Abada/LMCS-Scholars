// app/researchers/[id]/publications/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Link2, ExternalLink, BookOpen } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type Publication = {
  publication_id: string
  title: string
  abstract?: string
  publication_type?: string
  publication_date?: string
  doi?: string
  url?: string
  pdf_url?: string
  scholar_link?: string
  dblp_link?: string
  citation_count: number
  pages?: string
  volume?: string
  issue?: string
  publisher?: string
  journal?: string
  language?: string
  authors: Array<{
    id: string
    name: string
    affiliation?: string
    is_external: boolean
  }>
  external_authors: Array<{
    id: string
    name: string
    affiliation?: string
    is_external: boolean
  }>
  venues: Array<{
    id: string
    name: string
    type: string
    pages?: string
    volume?: string
    issue?: string
  }>
  classifications: Array<{
    system_id: string
    system_name: string
    category: string
    year: number
  }>
}

export default function ResearcherPublicationsPage() {
  const { id } = useParams()
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  })

  const fetchPublications = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `/api/publications?researcherId=${id}&page=${page}&pageSize=${pagination.pageSize}`;
      console.log("Fetching publications from:", url);
      
      const response = await fetch(url);
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("API response data:", data);
      
      // Validate response structure
      if (!data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format: data.data is not an array');
      }
      
      setPublications(data.data);
      setPagination({
        page,
        pageSize: data.pagination?.pageSize || pagination.pageSize,
        totalItems: data.pagination?.totalItems || 0,
        totalPages: data.pagination?.totalPages || 1,
      });
    } catch (err) {
      console.error("Error fetching publications:", err);
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications()
  }, [id])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return
    fetchPublications(newPage)
  }

  if (loading && publications.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => fetchPublications()}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (publications.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No publications found</h3>
        <p className="mt-1 text-sm text-gray-500">
          This researcher hasn't published any papers yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {publications.map((pub) => (
          <Card key={pub.publication_id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">
                <Link 
                  href={pub.url || pub.pdf_url || '#'} 
                  target="_blank"
                  className="hover:text-blue-600"
                >
                  {pub.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Authors */}
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  {[...pub.authors, ...pub.external_authors].map((author, idx) => (
                    <span key={`${author.id}-${idx}`}>
                      {author.name}
                      {author.affiliation && ` (${author.affiliation})`}
                      {idx < pub.authors.length + pub.external_authors.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>

                {/* Publication details */}
                <div className="text-sm text-gray-500">
                  {pub.journal && (
                    <span className="font-medium">{pub.journal}</span>
                  )}
                  {pub.publication_date && (
                    <span> • {new Date(pub.publication_date).getFullYear()}</span>
                  )}
                  {pub.volume && pub.issue && (
                    <span> • Vol. {pub.volume}, Iss. {pub.issue}</span>
                  )}
                  {pub.citation_count > 0 && (
                    <span> • {pub.citation_count} citations</span>
                  )}
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-4 pt-2">
                  {pub.doi && (
                    <Link 
                      href={`https://doi.org/${pub.doi}`} 
                      target="_blank"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Link2 className="h-4 w-4 mr-1" /> DOI
                    </Link>
                  )}
                  {pub.dblp_link && (
                    <Link 
                      href={pub.dblp_link} 
                      target="_blank"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4 mr-1" /> DBLP
                    </Link>
                  )}
                  {pub.pdf_url && (
                    <Link 
                      href={pub.pdf_url} 
                      target="_blank"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4 mr-1" /> PDF
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(pagination.page - 1)}
                isDisabled={pagination.page === 1}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(pagination.page + 1)}
                isDisabled={pagination.page === pagination.totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}