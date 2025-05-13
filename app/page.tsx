"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpenText, Users, LineChart, Mail, Phone, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex-1 p-6 bg-[#f9fbfd]">
        <Skeleton className="h-96 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-40 w-full mb-8" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-[#f9fbfd]">
      {/* Hero Section */}
      <div className="relative bg-[#d2e8ff] rounded-xl overflow-hidden mb-8">
        <div className="p-8 md:p-12 lg:p-16 text-[#1a365d]">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">LMCS Research Laboratory</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl">
            Advancing scientific knowledge through cutting-edge research in computer science
          </p>
          
          {/* ✅ Reactive session-based buttons */}
          {session ? (
            <div className="flex gap-4">
              <Button asChild className="px-6 py-3 text-lg bg-[#1a365d] text-white hover:bg-[#2c4d8a]">
                <Link href="/dashboard">Go to Dashboard</Link>
               
              </Button>
              
              <div className="c text-red-500 ml-44">If there is an issue, please refresh the page.</div>

            </div>
          ) : (
            <div className="flex gap-4">
            <Button asChild className="px-6 py-3 text-lg bg-[#1a365d] text-white hover:bg-[#2c4d8a]">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
          )}
        </div>
      </div>

      {/* Rest of your page content remains exactly the same */}
      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-[#2d3748]">Explore Our Laboratory</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/publications" className="group">
            <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] hover:border-[#90cdf4] transition-all">
              <div className="flex items-center gap-4 mb-3">
                <BookOpenText className="h-5 w-5 text-[#3182ce]" />
                <h3 className="text-lg font-semibold text-[#2d3748]">Publications</h3>
              </div>
              <p className="text-[#4a5568] text-sm">
                Browse our research papers and journal articles
              </p>
            </div>
          </Link>

          <Link href="/researchers" className="group">
            <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] hover:border-[#90cdf4] transition-all">
              <div className="flex items-center gap-4 mb-3">
                <Users className="h-5 w-5 text-[#3182ce]" />
                <h3 className="text-lg font-semibold text-[#2d3748]">Researchers</h3>
              </div>
              <p className="text-[#4a5568] text-sm">
                Meet our team of professors and scientists
              </p>
            </div>
          </Link>

          <Link href="/dashboard" className="group">
            <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] hover:border-[#90cdf4] transition-all">
              <div className="flex items-center gap-4 mb-3">
                <LineChart className="h-5 w-5 text-[#3182ce]" />
                <h3 className="text-lg font-semibold text-[#2d3748]">Research Areas</h3>
              </div>
              <p className="text-[#4a5568] text-sm">
                Discover our key research domains
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-xl p-6 mb-8 border border-[#e2e8f0] shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-[#2d3748]">Laboratory at a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-[#3182ce]">30+</p>
            <p className="text-[#4a5568] text-sm">Researchers</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-[#3182ce]">400+</p>
            <p className="text-[#4a5568] text-sm">Publications</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-[#3182ce]">20+</p>
            <p className="text-[#4a5568] text-sm">Projects</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-[#3182ce]">30+</p>
            <p className="text-[#4a5568] text-sm">Collaborations</p>
          </div>
        </div>
      </div>

      {/* Recent News */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-[#2d3748]">Recent News</h2>
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg border-l-4 border-[#3182ce]">
            <h3 className="text-lg font-semibold mb-2 text-[#2d3748]">An Efficient Genetic Algorithm for Service Placement in Fog Computing</h3>
            <p className="text-[#4a5568] mb-3">
              
            </p>
            <Button variant="link" className="p-0 h-auto text-[#3182ce] hover:text-[#2c5282]" asChild>
              <Link href="/publication/3d1d85db-790b-4694-85fe-3176b6942cc2">Read more →</Link>
            </Button>
          </div>
          <div className="bg-white p-5 rounded-lg border-l-4 border-[#3182ce]">
            <h3 className="text-lg font-semibold mb-2 text-[#2d3748]">Efficient Disaster-Resilient Network Slicing for URLLC in UAV-Enabled MEC Using Federated Learning</h3>
            <p className="text-[#4a5568] mb-3">
              .
            </p>
            <Button variant="link" className="p-0 h-auto text-[#3182ce] hover:text-[#2c5282]" asChild>
              <Link href="/publication/791e4ee7-a79f-42e7-9c46-bdaed452a51a">Learn more →</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#d2e8ff] rounded-xl p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4 text-[#1a365d]">Contact Us</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-[#3182ce]" />
            <span className="text-[#4a5568]">contact@lmcs.dz</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-[#3182ce]" />
            <span className="text-[#4a5568]">+213 123 456 789</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-[#3182ce]" />
            <span className="text-[#4a5568]">ESI, Algiers, Algeria</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#b3d1ff] text-sm text-[#4a5568]">
          © {new Date().getFullYear()} LMCS Laboratory. All rights reserved.
        </div>
      </div>
    </div>
  );
}