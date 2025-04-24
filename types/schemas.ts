import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../lib/api-utils";

// Schema for creating/updating researchers
export const researcherSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  status: z.enum(['active', 'on_leave', 'inactive', 'retired']).optional(),
  qualification: z.enum([
    'professor',
    'associate_professor',
    'assistant_professor',
    'postdoc',
    'phd_candidate',
    'research_scientist',
  ]).optional(),
  position: z.enum([
    'director',
    'department_head',
    'principal_investigator',
    'senior_researcher',
    'researcher',
    'assistant',
  ]).optional(),
  teamId: z.string().uuid().optional().nullable(),
  joinDate: z.string().date().optional(),
  leaveDate: z.string().date().optional(),
  biography: z.string().optional(),
  researchInterests: z.string().optional(),
  orcidId: z.string().max(19).optional(),
  dblpUrl: z.string().url().max(512).optional(),
  googleScholarUrl: z.string().url().max(512).optional(),
  researchGateUrl: z.string().url().max(512).optional(),
  linkedinUrl: z.string().url().max(512).optional(),
  personalWebsite: z.string().url().max(512).optional(),
});

export const queryParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: z.string().optional(),
  status: z.enum(['active', 'on_leave', 'inactive', 'retired']).optional(),
  teamId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'hIndex', 'citations', 'joinDate']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});