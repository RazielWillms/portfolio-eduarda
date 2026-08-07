"use client"

import { Search, ChevronRight, Menu, X, Globe, Youtube, Instagram, Facebook, Twitter } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import Link from "next/link"

const portfolioData = {
  "Web Design": [
    {
      name: "Alternative Paint.png",
      thumbnail: "/abstract-paint.jpg",
      size: "2.1 MB",
      created: "May 2025",
      client: "Self-initiated",
      tags: "Bold, Experimental",
    },
    {
      name: "God Rays.png",
      thumbnail: "/light-rays.jpg",
      size: "1.8 MB",
      created: "April 2025",
      client: "Tech Startup",
      tags: "Minimal, Clean",
    },
    {
      name: "Inner Creativity.png",
      thumbnail: "/creative-abstract.jpg",
      size: "2.3 MB",
      created: "March 2025",
      client: "Creative Agency",
      tags: "Artistic, Bold",
    },
  ],
  "Product Design": [
    {
      name: "Gradient Fluid.png",
      thumbnail: "/fluid-gradient.jpg",
      size: "1.9 MB",
      created: "June 2025",
      client: "SaaS Company",
      tags: "Modern, Sleek",
    },
    {
      name: "Fire Glow.png",
      thumbnail: "/fire-glow.jpg",
      size: "2.0 MB",
      created: "May 2025",
      client: "Gaming Studio",
      tags: "Dynamic, Vibrant",
    },
    {
      name: "Foil.png",
      thumbnail: "/metallic-foil.jpg",
      size: "2.2 MB",
      created: "April 2025",
      client: "Luxury Brand",
      tags: "Premium, Elegant",
    },
  ],
  "Visual Design": [
    {
      name: "Warmth.png",
      thumbnail: "/warm-colors.jpg",
      size: "1.7 MB",
      created: "July 2025",
      client: "Wellness App",
      tags: "Warm, Inviting",
    },
    {
      name: "Greenery.png",
      thumbnail: "/lush-green-nature.png",
      size: "2.4 MB",
      created: "June 2025",
      client: "Eco Brand",
      tags: "Natural, Fresh",
    },
    {
      name: "Into the Fold.png",
      thumbnail: "/folded-paper.jpg",
      size: "1.6 MB",
      created: "May 2025",
      client: "Design Studio",
      tags: "Abstract, Geometric",
    },
  ],
  Experiments: [
    {
      name: "Blurred Ovals.png",
      thumbnail: "/blurred-shapes.jpg",
      size: "1.5 MB",
      created: "August 2025",
      client: "Personal",
      tags: "Experimental, Abstract",
    },
    {
      name: "Micro Objects.png",
      thumbnail: "/small-objects.jpg",
      size: "2.1 MB",
      created: "July 2025",
      client: "Personal",
      tags: "Detailed, Intricate",
    },
    {
      name: "Pink Layers.png",
      thumbnail: "/pink-layers.jpg",
      size: "1.9 MB",
      created: "June 2025",
      client: "Personal",
      tags: "Layered, Colorful",
    },
    {
      name: "Dream Glow.png",
      thumbnail: "/dreamy-glow.jpg",
      size: "2.0 MB",
      created: "May 2025",
      client: "Personal",
      tags: "Dreamy, Soft",
    },
  ],
  "Don't open": [
    {
      name: "Toggle This.png",
      thumbnail: "/toggle-switch.jpg",
      size: "1.4 MB",
      created: "April 2025",
      client: "Secret Project",
      tags: "Interactive, Fun",
    },
    {
      name: "Dimensional.png",
      thumbnail: "/3d-dimensional.jpg",
      size: "2.5 MB",
      created: "March 2025",
      client: "Secret Project",
      tags: "3D, Dimensional",
    },
    {
      name: "Gradient Collective.png",
      thumbnail: "/gradient-collection.jpg",
      size: "2.2 MB",
      created: "February 2025",
      client: "Secret Project",
      tags: "Gradient, Collection",
    },
  ],
}

const folders = Object.keys(portfolioData)

export default function PortfolioPage() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const displayFiles = selectedFolder
    ? portfolioData[selectedFolder as keyof typeof portfolioData]
    : Object.values(portfolioData).flat()

  const filteredFiles = displayFiles.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative blob shapes */}
      <div className="blob-shape w-[600px] h-[600px] -top-48 -left-48" />
      <div className="blob-shape w-[500px] h-[500px] -bottom-32 -right-32" />
      <div className="blob-shape w-[400px] h-[400px] top-1/2 -right-48" />
      <div className="blob-shape w-[450px] h-[450px] -bottom-48 left-1/4" />

      <div className="relative z-10 p-4 md:p-8">
        {/* Hero Section */}
        <section className="bg-card/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 lg:p-16 mb-6 border border-border/50 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Main Heading */}
              <div>
                <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-none tracking-tight mb-0">
                  visual
                </h1>
                <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-none tracking-tight">
                  poetry
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-base md:text-lg max-w-md leading-relaxed text-foreground/80">
                Welcome to a visual journey that transcends time and space. Discover the artistry of moments captured in
                motion
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center hover:border-foreground/40 hover:bg-muted/50 transition-all"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center hover:border-foreground/40 hover:bg-muted/50 transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center hover:border-foreground/40 hover:bg-muted/50 transition-all"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center hover:border-foreground/40 hover:bg-muted/50 transition-all"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                <div>
                  <div className="text-4xl md:text-5xl font-bold mb-2">+250k</div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Videos that reaching a wide audience and give lasting impression
                  </p>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold mb-2">+800k</div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Hours watched, engaging storytelling that captivates viewers
                  </p>
                </div>
              </div>
            </div>

            {/* Right Content - Orange Card */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-[#F5A623] to-[#FF8C00] rounded-[3rem] p-8 md:p-12 w-full lg:w-[500px] xl:w-[600px] aspect-[4/5] overflow-hidden">
                {/* Globe Icon */}
                <div className="absolute top-6 right-6 w-14 h-14 bg-black rounded-full flex items-center justify-center">
                  <Globe className="w-7 h-7 text-white" />
                </div>

                {/* Signature Text */}
                <div className="absolute top-8 left-8 right-20">
                  <svg viewBox="0 0 300 80" className="w-full max-w-[250px]">
                    <text
                      x="10"
                      y="50"
                      fill="white"
                      fontSize="48"
                      fontFamily="'Brush Script MT', cursive"
                      style={{ fontStyle: "italic" }}
                    >
                      Creativity
                    </text>
                  </svg>
                </div>

                {/* Main Image */}
                <div className="absolute inset-0 flex items-end justify-end">
                  <img
                    src="/hero-photographer.png"
                    alt="Creative professional with vintage camera"
                    className="h-full w-auto object-contain object-bottom"
                  />
                </div>

                {/* Side Icons */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#FFB84D] flex items-center justify-center overflow-hidden border-2 border-white/20">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-[#FFB84D] overflow-hidden border-2 border-white/20">
                    <img src="/diverse-group.png" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center">
                    <ChevronRight className="w-7 h-7 text-white rotate-45" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Header */}
        <header className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 mb-4 md:mb-6 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Profile" />
                <AvatarFallback>FM</AvatarFallback>
              </Avatar>
              <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
                Contact
              </Link>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-input/50 border-border/50"
                />
              </div>
            </nav>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden bg-card/80 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-border/50">
            <nav className="flex flex-col gap-4">
              <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors text-left">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors text-left">
                Contact
              </Link>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full bg-input/50 border-border/50"
                />
              </div>
            </nav>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_400px] gap-4 md:gap-6">
          {/* Left Sidebar - Intro & Folders */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-border/50">
              <h1 className="text-2xl md:text-3xl font-semibold leading-tight mb-2">
                Fons Mans is a designer based in Rotterdam, The Netherlands
              </h1>
            </div>

            <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/50 space-y-1">
              <button
                onClick={() => {
                  setSelectedFolder(null)
                  setSelectedFile(null)
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors group ${
                  selectedFolder === null ? "bg-muted/70" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl opacity-60">📂</span>
                  <span className="text-sm font-medium">All Files</span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 transition-opacity ${
                    selectedFolder === null ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </button>
              {folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => {
                    setSelectedFolder(folder)
                    setSelectedFile(null)
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors group ${
                    selectedFolder === folder ? "bg-muted/70" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl opacity-60">📁</span>
                    <span className="text-sm font-medium">{folder}</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 transition-opacity ${
                      selectedFolder === folder ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Center - File List */}
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/50 max-h-[600px] overflow-y-auto">
            <div className="space-y-1">
              {selectedFolder && (
                <div className="p-3 mb-2">
                  <h2 className="text-lg font-semibold">{selectedFolder}</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredFiles.length} {searchQuery ? "results" : "items"}
                  </p>
                </div>
              )}
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file, index) => (
                  <button
                    key={`${file.name}-${index}`}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors group ${
                      selectedFile?.name === file.name ? "bg-muted/70" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted/50 overflow-hidden flex-shrink-0">
                        <img
                          src={file.thumbnail || "/placeholder.svg"}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-left">{file.name}</span>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 transition-opacity ${
                        selectedFile?.name === file.name ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No files found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Preview */}
          <div className={`space-y-4 ${selectedFile ? "block" : "hidden xl:block"}`}>
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-primary/20 to-primary/40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full h-full p-8">
                    <div className="absolute top-8 left-8 right-8 text-[80px] md:text-[120px] font-bold text-primary leading-none">
                      aura
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-64 md:w-64 md:h-80 rounded-[3rem] overflow-hidden border-4 border-primary/30">
                        <img
                          src={selectedFile?.thumbnail || "/placeholder.svg?height=600&width=400"}
                          alt={selectedFile?.name || "Preview"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-8 left-8 text-xs md:text-sm text-primary-foreground/80">
                      aura glow effect
                    </div>
                    <div className="absolute bottom-8 right-8 text-xs md:text-sm text-primary-foreground/80">
                      made in figma
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{selectedFile?.name || "Aura.png"}</h2>
                <p className="text-sm text-muted-foreground">{selectedFile?.size || "2.1 MB"}</p>
              </div>
            </div>

            <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 border border-border/50 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{selectedFile?.created || "May 2025"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{selectedFile?.client || "Self-initiated"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tags</span>
                <span className="font-medium">{selectedFile?.tags || "Bold, Experimental"}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedFile(null)}
              className="xl:hidden w-full bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/50 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Back to Files
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
