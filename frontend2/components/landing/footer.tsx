"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { Shield, Cloud, Github, Twitter, Linkedin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#security" },
    { label: "Integrations", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Case Studies", href: "#" },
    { label: "Webinars", href: "#" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Partners", href: "#" },
    { label: "Press Kit", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "GDPR", href: "#" },
    { label: "Security", href: "#" },
  ],
}

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "#", label: "Email" },
]

const complianceBadges = ["SOC 2", "ISO 27001", "HIPAA", "GDPR", "PCI DSS"]

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <footer ref={ref} className="relative pt-24 pb-8 border-t border-border">
      <div className="container mx-auto px-4 lg:px-8">
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-2xl p-8 lg:p-12 mb-16 text-center neon-glow"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 text-balance">
            Ready to optimize your cloud costs?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join hundreds of enterprises saving millions on their cloud infrastructure 
            with AI-powered optimization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="neon-glow">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <Cloud className="w-4 h-4 text-primary absolute -top-1 -right-1" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Cloud<span className="text-primary">Guard</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              AI-powered cloud cost optimization and security monitoring for 
              modern enterprises.
            </p>

            {/* Newsletter */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your email"
                  type="email"
                  className="bg-muted/50 border-border"
                />
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            >
              <h3 className="font-semibold text-foreground mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Compliance Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {complianceBadges.map((badge) => (
            <div
              key={badge}
              className="px-3 py-1.5 rounded-lg glass text-xs text-muted-foreground"
            >
              {badge} Compliant
            </div>
          ))}
        </motion.div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cloud Cost Guard. All rights reserved.
          </p>

          {/* Cloud Provider Logos */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Supports:</span>
            {["AWS", "Azure", "GCP"].map((provider) => (
              <span key={provider} className="text-xs text-muted-foreground">
                {provider}
              </span>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
