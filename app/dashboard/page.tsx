import type { Metadata } from "next";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { StatsGrid } from "@/components/stats-grid";
import ResearchersTable from "@/components/researchers-table";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LMCS Dashboard",
};

export default function Page() {
  return (
    <div className="flex w-4xl bg-gray-50">
      <SidebarProvider>
        {/* Main content area with proper spacing */}
        <div className="flex-1 w-full min-w-0"> {/* Crucial: min-w-0 prevents overflow */}
          <SidebarInset className="px-4 md:px-6 lg:px-8 mx-auto w-full max-w-screen-2xl"> {/* Wider max-width */}
            <div className="flex flex-col gap-6 py-6">
              {/* Page Header - unchanged but properly spaced */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-gray-800">Bienvenue, Admin !</h1>
                  <p className="text-sm text-gray-500">
                    Voici un aperçu de votre laboratoire. Gérez les publications et les chercheurs en toute simplicité !
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    className="px-4 w-full sm:w-auto border-blue-200 bg-white hover:bg-blue-50 text-blue-600"
                  >
                    Ajouter une publication
                  </Button>
                  <Link href="/addResearcher" passHref>
                    <Button className="px-4 w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                      Ajouter un chercheur
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats Section - Fixed spacing and layout */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance de la recherche</h2>
  
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {/* Researchers Card */}
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">CHERCHEURS</span>
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
          <svg width={20} height={20} fill="currentColor">
            <path d="M9 0v2.013a8.001 8.001 0 1 0 5.905 14.258l1.424 1.422A9.958 9.958 0 0 1 10 19.951c-5.523 0-10-4.478-10-10C0 4.765 3.947.5 9 0Zm10.95 10.95a9.954 9.954 0 0 1-2.207 5.329l-1.423-1.423a7.96 7.96 0 0 0 1.618-3.905h2.013ZM11.002 0c4.724.47 8.48 4.227 8.95 8.95h-2.013a8.004 8.004 0 0 0-6.937-6.937V0Z" />
          </svg>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-800">52</span>
        <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">+2% vs l'année passée</span>
      </div>
    </div>

    {/* Publications Card */}
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">PUBLICATIONS</span>
        <div className="p-2 rounded-lg bg-green-100 text-green-600">
          <svg width={18} height={19} fill="currentColor">
            <path d="M2 9.5c0 .313.461.858 1.53 1.393C4.914 11.585 6.877 12 9 12c2.123 0 4.086-.415 5.47-1.107C15.538 10.358 16 9.813 16 9.5V7.329C14.35 8.349 11.827 9 9 9s-5.35-.652-7-1.671V9.5Zm14 2.829C14.35 13.349 11.827 14 9 14s-5.35-.652-7-1.671V14.5c0 .313.461.858 1.53 1.393C4.914 16.585 6.877 17 9 17c2.123 0 4.086-.415 5.47-1.107 1.069-.535 1.53-1.08 1.53-1.393v-2.171ZM0 14.5v-10C0 2.015 4.03 0 9 0s9 2.015 9 4.5v10c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5ZM9 7c2.123 0 4.086-.415 5.47-1.107C15.538 5.358 16 4.813 16 4.5c0-.313-.461-.858-1.53-1.393C13.085 2.415 11.123 2 9 2c-2.123 0-4.086.415-5.47 1.107C2.461 3.642 2 4.187 2 4.5c0 .313.461.858 1.53 1.393C4.914 6.585 6.877 7 9 7Z" />
          </svg>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-800">429</span>
        <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">+7% vs l'année passée</span>
      </div>
    </div>

    {/* Funding Card */}
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">FINANCEMENTS</span>
        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
          <svg width={20} height={20} fill="currentColor">
            <path d="M10 0c5.523 0 10 4.477 10 10s-4.477 10-10 10S0 15.523 0 10 4.477 0 10 0Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.833 3.337a.596.596 0 0 1 .763.067.59.59 0 0 1 .063.76c-2.18 3.046-3.38 4.678-3.598 4.897a1.5 1.5 0 0 1-2.122-2.122c.374-.373 2.005-1.574 4.894-3.602ZM15.5 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm-11 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm2.318-3.596a1 1 0 1 1-1.414 1.414 1 1 0 0 1 1.414-1.414ZM10 3.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
          </svg>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-800">$52,439</span>
        <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">+37% vs l'année passée</span>
      </div>
    </div>

    {/* Collaborations Card */}
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">COLLABORATIONS</span>
        <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
          <svg width={21} height={21} fill="currentColor">
            <path d="m14.142.147 6.347 6.346a.5.5 0 0 1-.277.848l-1.474.23-5.656-5.657.212-1.485a.5.5 0 0 1 .848-.282ZM2.141 19.257c3.722-3.33 7.995-4.327 12.643-5.52l.446-4.017-4.297-4.298-4.018.447c-1.192 4.648-2.189 8.92-5.52 12.643L0 17.117c2.828-3.3 3.89-6.953 5.303-13.081l6.364-.708 5.657 5.657-.707 6.364c-6.128 1.415-9.782 2.475-13.081 5.304L2.14 19.258Zm5.284-6.029a2 2 0 1 1 2.828-2.828 2 2 0 0 1-2.828 2.828Z" />
          </svg>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-800">32</span>
        <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">+17% vs l'année passée</span>
      </div>
    </div>
  </div>
</div>

              {/* Researchers Table - Fixed scrolling */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Chercheurs</h2>
                  <p className="text-sm text-gray-500">Gérez les chercheurs de votre laboratoire</p>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]"> {/* Reduced from 1024px */}
                    <ResearchersTable />
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}