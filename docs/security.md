# Segurança operacional

## Controles implementados

- Sessão Supabase validada no servidor; perfil inativo bloqueado no layout e nas funções RLS auxiliares.
- RLS forçada nas tabelas sensíveis e mutações críticas por funções controladas.
- Propriedade imutável de atendimentos, soft delete e auditoria sanitizada.
- Token externo de 256 bits armazenado somente como SHA-256, revogável e expirável.
- CSP, `nosniff`, política de referenciador, restrição de permissões e bloqueio de framing.
- Mensagens de erro genéricas para recursos protegidos e tokens externos.

## Checklist antes de produção

1. Aplicar migrations em staging e executar testes com dois profissionais reais.
2. Rotacionar qualquer secret que tenha sido compartilhado fora do cofre operacional.
3. Configurar MFA para administradores do Supabase/Vercel e menor privilégio nas equipes.
4. Configurar rate limiting na borda para login, portal externo e ações repetitivas.
5. Ativar alertas de autenticação, erros e volume anormal sem registrar dados clínicos.
6. Revisar CSP em staging e remover exceções se a plataforma permitir nonces.
7. Realizar revisão jurídica das bases legais, retenção, termos e atendimento de titulares.

## Testes de autorização obrigatórios

- Profissional sem vínculo não lê paciente por ID nem via REST.
- Profissional vinculado não edita, exclui ou restaura atendimento de outro autor.
- Usuário inativo não lê pacientes, cria atendimento, vínculo ou token.
- Não administrador não altera habilidade global nem papel de usuário.
- Token inválido, expirado e revogado retornam a mesma resposta externa.

Os testes de RLS precisam de um projeto Supabase isolado no CI; testes unitários não substituem essa verificação integrada.
