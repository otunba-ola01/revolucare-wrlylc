import React from "react"; // v18.2.0
import Link from "next/link"; // v14.0.0
import { Facebook, Twitter, Linkedin, Instagram, Youtube } from "lucide-react"; // v0.284.0

import { siteConfig, siteLinks, contactInfo, socialLinks, copyrightInfo } from "../../config/site";
import { cn } from "../../lib/utils/color";

/**
 * Props interface for the Footer component
 */
interface FooterProps {
  className?: string;
}

/**
 * Props interface for the SocialIcon component
 */
interface SocialIconProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

/**
 * Helper component to render social media icons with links
 */
const SocialIcon = ({ href, icon: Icon, label }: SocialIconProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition-colors hover:bg-primary-100 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <Icon className="h-5 w-5" />
      <span className="sr-only">{label}</span>
    </a>
  );
};

/**
 * Footer component that displays site information, navigation links,
 * social media links, and copyright information.
 */
export const Footer: React.FC<FooterProps> = ({ className }) => {
  // Get current year for copyright notice
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("bg-white border-t border-slate-200", className)}>
      <div className="container mx-auto px-4 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company information section */}
          <div className="space-y-4">
            <div className="text-2xl font-bold">{siteConfig.name}</div>
            <p className="text-slate-600 max-w-xs">
              {siteConfig.description}
            </p>
          </div>

          {/* Navigation links section */}
          <div>
            <h3 className="font-bold text-lg mb-4">Important Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href={siteLinks.home}
                  className="text-slate-600 hover:text-primary-600 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href={siteLinks.about}
                  className="text-slate-600 hover:text-primary-600 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href={siteLinks.help}
                  className="text-slate-600 hover:text-primary-600 transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  href={siteLinks.faq}
                  className="text-slate-600 hover:text-primary-600 transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  href={siteLinks.contact}
                  className="text-slate-600 hover:text-primary-600 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact information section */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <address className="not-italic space-y-2 text-slate-600">
              <p>{contactInfo.address.street}</p>
              <p>
                {contactInfo.address.city}, {contactInfo.address.state} {contactInfo.address.zipCode}
              </p>
              <p className="pt-2">
                <span className="font-medium">Email: </span>
                <a 
                  href={`mailto:${contactInfo.email}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  {contactInfo.email}
                </a>
              </p>
              <p>
                <span className="font-medium">Phone: </span>
                <a 
                  href={`tel:${contactInfo.phone.replace(/[^\d+]/g, '')}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  {contactInfo.phone}
                </a>
              </p>
              <p className="pt-2 text-sm">{contactInfo.supportHours}</p>
            </address>
          </div>

          {/* Social media links section */}
          <div>
            <h3 className="font-bold text-lg mb-4">Connect With Us</h3>
            <div className="flex flex-wrap gap-3">
              <SocialIcon 
                href={socialLinks.facebook} 
                icon={Facebook} 
                label="Follow us on Facebook" 
              />
              <SocialIcon 
                href={socialLinks.twitter} 
                icon={Twitter} 
                label="Follow us on Twitter" 
              />
              <SocialIcon 
                href={socialLinks.linkedin} 
                icon={Linkedin} 
                label="Connect with us on LinkedIn" 
              />
              <SocialIcon 
                href={socialLinks.instagram} 
                icon={Instagram} 
                label="Follow us on Instagram" 
              />
              <SocialIcon 
                href={socialLinks.youtube} 
                icon={Youtube} 
                label="Subscribe to our YouTube channel" 
              />
            </div>
          </div>
        </div>

        {/* Bottom section with copyright and legal links */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            {/* Copyright information */}
            <div className="text-slate-500 text-sm">
              &copy; {currentYear} {copyrightInfo.company}. {copyrightInfo.rights}.
            </div>

            {/* Legal links */}
            <div className="flex gap-6">
              <Link 
                href={siteLinks.privacyPolicy}
                className="text-sm text-slate-500 hover:text-primary-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href={siteLinks.termsOfService}
                className="text-sm text-slate-500 hover:text-primary-600 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;