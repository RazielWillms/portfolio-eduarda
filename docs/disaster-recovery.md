# Recuperação de desastre

## Responsabilidades

O responsável técnico deve manter acesso administrativo ao Supabase, Vercel, DNS, repositório e cofre de secrets. Pelo menos duas pessoas autorizadas devem conhecer o processo de recuperação, sem compartilhar credenciais individuais.

## Backup

- Confirmar no painel Supabase a frequência e retenção efetivamente disponíveis no plano contratado; não presumir Point-in-Time Recovery.
- Antes de migrations sensíveis, gerar backup verificável e registrar responsável/data.
- Testar restauração periodicamente em projeto separado. Backup não testado não é recuperação garantida.

## Procedimento

1. Conter o incidente: suspender deploys, revogar tokens/credenciais comprometidos e preservar evidências.
2. Criar projeto de recuperação isolado.
3. Restaurar o backup e aplicar, em ordem, as migrations posteriores ao ponto restaurado.
4. Reconfigurar Auth URLs, variáveis server-only e chaves públicas.
5. Fazer deploy pelo commit aprovado e executar smoke tests de autenticação, RLS, pacientes, atendimentos e tokens.
6. Validar contagens e integridade antes de trocar DNS/tráfego.
7. Documentar perda estimada, decisões e ações preventivas.

## Secrets

Secrets devem vir do cofre da plataforma, nunca do Git. Em perda ou suspeita de exposição, rotacionar chaves Supabase, tokens de deploy e credenciais administrativas; atualizar ambientes e invalidar sessões quando aplicável.

## Limitações atuais

A baseline das tabelas-base anteriores à Etapa 2.1 ainda precisa ser exportada e validada para reconstrução integral somente por migrations.
