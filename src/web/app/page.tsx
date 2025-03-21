import Image from 'next/image'; // next/image ^14.0.0
import Link from 'next/link'; // next/link ^14.0.0
import { ArrowRight, CheckCircle, Users, Calendar, Shield } from 'lucide-react'; // lucide-react ^0.284.0

import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';
import { Button } from '../components/ui/button';
import { siteConfig } from '../config/site';

/**
 * The main landing page component that introduces the Revolucare platform
 * @returns Rendered landing page component
 */
const HomePage: React.FC = () => {
  return (
    <>
      {/* Render the Header component for navigation and authentication */}
      <Header />

      {/* Render the hero section with platform introduction and call-to-action buttons */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-indigo-700 mb-4">
            {siteConfig.name}: Transforming Care with AI
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            {siteConfig.description}
          </p>
          <div>
            <Link href="/register">
              <Button size="lg" className="mr-4">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Render the features section highlighting key platform capabilities */}
      <section className="py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold text-center text-indigo-700 mb-8">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature cards */}
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                AI-Powered Care Plans
              </h3>
              <p className="text-gray-600">
                Personalized care plans generated using advanced AI to match
                individual needs.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Provider Matching
              </h3>
              <p className="text-gray-600">
                Intelligent matching of clients with the most suitable care
                providers.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <Calendar className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Real-Time Availability
              </h3>
              <p className="text-gray-600">
                Track provider availability in real-time for efficient
                scheduling.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <Shield className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Comprehensive Analytics
              </h3>
              <p className="text-gray-600">
                Data-driven insights to improve care outcomes and efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Render the benefits section showing value for different user roles */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold text-center text-indigo-700 mb-8">
            Benefits for Everyone
          </h2>
          {/* Placeholder for tabbed interface */}
          <p className="text-gray-600 text-center">
            [Tabbed interface showing benefits for clients, providers, and case
            managers]
          </p>
        </div>
      </section>

      {/* Render the testimonials section with user success stories */}
      <section className="py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold text-center text-indigo-700 mb-8">
            Testimonials
          </h2>
          {/* Placeholder for testimonial carousel */}
          <p className="text-gray-600 text-center">
            [Carousel of testimonial cards with quotes, names, and photos]
          </p>
        </div>
      </section>

      {/* Render the call-to-action section encouraging sign-up */}
      <section className="py-12 bg-indigo-100">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-indigo-700 mb-4">
            Ready to Transform Care?
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Join Revolucare today and experience the future of care management.
          </p>
          <Link href="/register">
            <Button size="lg">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Render the FAQ section addressing common questions */}
      <section className="py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold text-center text-indigo-700 mb-8">
            Frequently Asked Questions
          </h2>
          {/* Placeholder for FAQ accordion */}
          <p className="text-gray-600 text-center">
            [Accordion of questions and answers]
          </p>
        </div>
      </section>

      {/* Render the Footer component with site information and links */}
      <Footer />
    </>
  );
};

export default HomePage;