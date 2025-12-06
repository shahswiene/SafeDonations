import Link from "next/link";
import Image from "next/image";
import { Shield, QrCode, Users, BarChart3, Heart } from "lucide-react";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Header />

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-16">
          {/* Left: Banner Image */}
          <div className="w-full lg:w-1/2">
            <Image
              src="/icons/banner.jpg"
              alt="SafeDonations - Protect your donations"
              width={600}
              height={400}
              className="rounded-2xl shadow-xl w-full h-auto"
              priority
            />
          </div>
          
          {/* Right: Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            {/* Badge - Above title */}
            <div className="flex justify-center lg:justify-start mb-6">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                Protecting Malaysian Donors from Scams
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Verify Before You Donate
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Scammers create fake QR codes to hijack donations for funerals, charities, and disaster relief. 
              SafeDonations helps you verify that your money goes to the right place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/scan"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
              >
                <QrCode className="w-5 h-5" />
                Scan & Verify QR
              </Link>
              <Link
                href="/organizer"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <Users className="w-5 h-5" />
                Create Campaign
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Heart className="w-8 h-8 text-emerald-600" />}
            title="For Donors"
            description="Browse verified donation campaigns or scan any QR code to check if it's legitimate before donating."
            href="/campaigns"
            cta="View Campaigns"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-blue-600" />}
            title="For Organizers"
            description="Create a verified donation campaign for funerals, charities, or disaster relief. Get a secure QR code."
            href="/organizer"
            cta="Create Campaign"
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8 text-purple-600" />}
            title="For Banks"
            description="Monitor donation activity, flag suspicious patterns, and protect your customers from scams."
            href="/admin"
            cta="View Dashboard"
          />
        </div>

        {/* Real Case Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-xl">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Real Case: Funeral Donation Scam in Malaysia
              </h3>
              <p className="text-amber-800 mb-4">
                In October 2025, scammers exploited a teen&apos;s funeral by replacing legitimate QR codes with fake ones. 
                Donors thought they were helping the grieving family, but the money went to criminals.
              </p>
              <p className="text-amber-700 text-sm">
                SafeDonations prevents this by verifying every QR code against registered campaigns before you donate.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">
            Built for Cursor x Anthropic Hackathon Malaysia 2025 • Powered by Convex & Groq
          </p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}

function FeatureCard({ icon, title, description, href, cta }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
      >
        {cta} →
      </Link>
    </div>
  );
}
