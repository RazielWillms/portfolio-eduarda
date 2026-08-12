# Validação integrada do Supabase

O conjunto unitário valida contratos e trechos críticos das migrations, mas a garantia real de RLS exige um projeto Supabase isolado. Nunca execute o roteiro abaixo em produção.

## Preparação

1. Crie um projeto Supabase descartável ou use a instância local.
2. Aplique a baseline das tabelas originais e todas as migrations em ordem cronológica.
3. Copie `.env.rls.example` para um arquivo local não versionado e carregue as variáveis no terminal.
4. Confirme que a URL pertence ao projeto isolado.

No PowerShell:

```powershell
$env:RLS_TEST_CONFIRM="isolated"
$env:RLS_TEST_SUPABASE_URL="https://projeto-de-teste.supabase.co"
$env:RLS_TEST_SUPABASE_ANON_KEY="..."
$env:RLS_TEST_SUPABASE_SERVICE_ROLE_KEY="..."
npm run test:rls
```

O teste cria dois profissionais temporários e um paciente marcado, verifica isolamento de leitura, bloqueio de vínculo direto, isolamento da síntese, token válido e token desconhecido, e remove os dados no bloco final.

## Verificações manuais após as migrations 12350000-12370000

- Profissional A registra sessão pré-planejamento sem alvo.
- Profissional A conclui uma síntese usando somente sessões próprias.
- Profissional B vinculado ao mesmo paciente não vê a síntese ou as observações privadas de A.
- Cada tipo de medição produz gráfico com unidade correta.
- Token profissional contém apenas registros do criador.
- Token de equipe contém somente alvos explicitamente permitidos pela configuração.
- Critérios, fases, integridade e contextos somem do payload quando desabilitados.
- Token revogado, expirado ou aleatório retorna acesso indisponível.

## Limitação atual

As migrations existentes começam na Etapa 2.1 e pressupõem tabelas-base anteriores. Para recriação integral automatizada ainda é necessário exportar uma baseline declarativa do schema remoto e validá-la em um projeto vazio.
