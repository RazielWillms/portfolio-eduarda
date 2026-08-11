import { AtendimentoForm } from "@/components/registros/atendimento-form"

export default function NovoAtendimentoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo atendimento</h1>
        <p className="text-sm text-muted-foreground mt-1">Registre uma sessão realizada com um paciente.</p>
      </div>
      <AtendimentoForm />
    </div>
  )
}
