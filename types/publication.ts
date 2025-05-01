// types/publication.ts
export interface Publication {
    id: string;
    title: string;
    publicationType: string;
    publicationDate: string;
    doi?: string;
    url?: string;
    pdfUrl?: string;
    citationCount?: number;
    publisher?: string;
    volume?: string;
    issue?: string;
    pageCount?: number;
    // Add other fields from your schema
  }