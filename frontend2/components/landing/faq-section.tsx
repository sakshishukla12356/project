"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "How does Cloud Cost Guard help reduce my cloud costs?",
    answer:
      "Cloud Cost Guard uses AI-powered analytics to identify idle resources, rightsizing opportunities, reserved instance recommendations, and spot instance candidates. Our platform continuously monitors your cloud usage patterns and provides actionable recommendations that can typically reduce costs by 30-50%.",
  },
  {
    question: "Which cloud providers do you support?",
    answer:
      "We support all major cloud providers including AWS, Microsoft Azure, and Google Cloud Platform. Our unified dashboard provides cross-cloud visibility and cost comparison, making it easy to manage multi-cloud environments from a single interface.",
  },
  {
    question: "How secure is my cloud data with Cloud Cost Guard?",
    answer:
      "Security is our top priority. We use read-only API access to your cloud accounts, never storing sensitive credentials. All data is encrypted in transit and at rest. We're SOC 2 Type II certified and GDPR compliant, with regular third-party security audits.",
  },
  {
    question: "Can I integrate Cloud Cost Guard with my existing tools?",
    answer:
      "Yes! We offer native integrations with popular tools like Slack, Microsoft Teams, PagerDuty, Jira, and ServiceNow. Our REST API and webhooks allow you to build custom integrations with your existing workflows and CI/CD pipelines.",
  },
  {
    question: "How does the AI chatbot assistant work?",
    answer:
      "Our AI assistant uses natural language processing to understand your questions about cloud costs, security, and resources. You can ask questions like 'Why is my AWS bill high?' or 'Show me idle EC2 instances' and get instant, actionable insights without navigating complex dashboards.",
  },
  {
    question: "What is the carbon tracking feature?",
    answer:
      "Our carbon tracking feature monitors the environmental impact of your cloud infrastructure. We calculate carbon emissions based on your resource usage and the energy sources of your cloud regions, providing recommendations to reduce your carbon footprint while maintaining performance.",
  },
  {
    question: "How long does it take to see results?",
    answer:
      "Most customers see their first cost-saving recommendations within 24 hours of connecting their cloud accounts. Significant cost reductions are typically achieved within the first month as you implement our AI-powered recommendations.",
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "Yes! We offer a 14-day free trial with full access to all features. No credit card is required to start. You can connect your cloud accounts and start seeing insights immediately.",
  },
]

export function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6 text-balance">
            Frequently Asked <span className="text-primary neon-text">Questions</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Cloud Cost Guard. Can&apos;t find the answer 
            you&apos;re looking for? Contact our support team.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="glass-card rounded-xl px-6 border-none"
                >
                  <AccordionTrigger className="text-left text-foreground hover:text-primary transition-colors hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
