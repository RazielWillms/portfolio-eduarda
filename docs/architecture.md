# Arquitetura técnica

Aplicação Next.js 14 com Server Components, Server Actions e Supabase Auth/Postgres. A área `/registros` exige sessão e perfil ativo. O navegador usa apenas a chave pública; `service_role` existe somente no módulo `server-only` usado para administração de contas.

## Autorização

- RLS é a fronteira de segurança; ocultação de botões não concede nem remove acesso.
- Pacientes são globais e acessíveis ao profissional somente por `paciente_psicologos`.
- Atendimentos pertencem ao autor original. Outros profissionais vinculados recebem apenas avaliações sanitizadas pelas RPCs clínicas, nunca observações.
- Habilidades globais são geridas por administradores; vínculos por paciente são geridos pelos profissionais vinculados.
- O portal externo valida hash, expiração e revogação no banco e recebe um DTO específico.

## Regras clínicas

As funções puras em `lib/registros/clinico` calculam progresso, tendência, aquisição e séries históricas. Valores derivados não são persistidos. Soft delete de atendimento retira o registro das RPCs e o recálculo ocorre na leitura seguinte.

## Limitação de reconstrução

As migrations versionam as Etapas 2.1–6, mas as tabelas-base originais das Etapas 1–2 foram criadas antes do versionamento atual. Antes de considerar recuperação integral automatizada, deve-se capturar uma baseline declarativa do schema remoto e validá-la em um projeto Supabase vazio.
