export function Footer() {
  return (
    <footer className="bg-foreground text-background py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-extrabold text-lg">Eduarda</p>
          <p className="text-sm opacity-60">Psicóloga Infantil · Especialista em TEA</p>
        </div>
        <p className="text-xs opacity-40 text-center">
          © {new Date().getFullYear()} Todos os direitos reservados. CRP em registro.
        </p>
        <div className="flex items-center gap-4 text-xs opacity-60">
          <a href="#sobre" className="hover:opacity-100 transition-opacity">Sobre</a>
          <a href="#especialidades" className="hover:opacity-100 transition-opacity">Especialidades</a>
          <a href="#contato" className="hover:opacity-100 transition-opacity">Contato</a>
        </div>
      </div>
    </footer>
  )
}
