"use client"

import type React from "react"

import { ArrowLeft, Mail, MapPin, Send } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: "", email: "", subject: "", message: "" })
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative blob shapes */}
      <div className="blob-shape w-[600px] h-[600px] -top-48 -left-48" />
      <div className="blob-shape w-[500px] h-[500px] -bottom-32 -right-32" />
      <div className="blob-shape w-[400px] h-[400px] top-1/2 -right-48" />

      <div className="relative z-10 p-4 md:p-8">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 mb-4 md:mb-6 border border-border/50">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Portfolio</span>
            </Link>
            <nav className="flex items-center gap-8">
              <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-primary">
                Contact
              </Link>
            </nav>
          </div>
        </header>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-border/50 space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Get in Touch</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Have a project in mind or just want to chat about design? I'd love to hear from you.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Email</h3>
                    <a
                      href="mailto:hello@fonsmans.com"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      hello@fonsmans.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Location</h3>
                    <p className="text-muted-foreground">Rotterdam, The Netherlands</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50">
                <h3 className="font-medium mb-4">Connect</h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="bg-muted/50 hover:bg-muted transition-colors px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    LinkedIn
                  </a>
                  <a
                    href="#"
                    className="bg-muted/50 hover:bg-muted transition-colors px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Twitter
                  </a>
                  <a
                    href="#"
                    className="bg-muted/50 hover:bg-muted transition-colors px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Dribbble
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-border/50">
              {submitted ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Send className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold">Message Sent!</h3>
                    <p className="text-muted-foreground">Thank you for reaching out. I'll get back to you soon.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-input/50 border-border/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-input/50 border-border/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="bg-input/50 border-border/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      placeholder="Tell me about your project..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-input/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
