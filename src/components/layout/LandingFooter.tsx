import { Link } from "react-router-dom";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Beta Program", href: "/beta-program" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Discord Community", href: "/discord" },
      { label: "Support", href: "/support" },
      { label: "Beta Feedback", href: "/beta-feedback" },
    ],
  },
];

/**
 * Landing page footer with links and branding
 * Uses semantic design tokens for consistent styling
 */
export const LandingFooter = () => {
  return (
    <footer className="border-t bg-surface py-12" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">
                  IO
                </span>
              </div>
              <span className="font-bold text-foreground">Inner Odyssey</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering every child through emotional intelligence, academic
              excellence, and life skills.
            </p>
          </div>

          {/* Link Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="font-semibold mb-4 text-foreground">{column.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Flashfusion, Inc. | Inner Odyssey
            is a product of Flashfusion. All rights reserved. COPPA Compliant.
          </p>
        </div>
      </div>
    </footer>
  );
};
