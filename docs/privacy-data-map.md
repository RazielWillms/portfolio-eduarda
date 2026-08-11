# Mapa técnico de dados e finalidade

Este documento apoia governança; não constitui parecer jurídico nem declaração de conformidade LGPD.

| Grupo | Local | Finalidade | Acesso | Retenção inicial |
|---|---|---|---|---|
| Perfis profissionais | `profiles`, Supabase Auth | autenticação e atribuição de responsabilidade | próprio usuário e administração autorizada | enquanto houver relação e registros vinculados |
| Paciente e responsável | `pacientes` | identificação e acompanhamento terapêutico; CPF do responsável apenas para evitar duplicidade | profissionais explicitamente vinculados | não excluir automaticamente; avaliar anonimização mediante solicitação |
| Vínculos | `paciente_psicologos`, `paciente_habilidades` | autorização e plano de acompanhamento | vinculados e administração conforme policy | preservar histórico; desativar antes de remover |
| Avaliações e observações | `atendimentos` | acompanhamento de evolução | autor vê registro completo; série sanitizada pode compor indicadores compartilhados | soft delete; prazo jurídico/assistencial requer definição da organização |
| Solicitações | `solicitacoes_acesso` | formalizar concessão de acesso | solicitante, vinculados autorizadores e administração | definir prazo operacional após encerramento |
| Portal externo | `acessos_responsavel` | compartilhamento explícito somente leitura | profissional vinculado; token válido recebe DTO mínimo | revogar quando desnecessário; remover hashes expirados conforme política futura |
| Auditoria | `audit_logs` | segurança, responsabilização e investigação | somente administrador | definir prazo proporcional ao risco e obrigações aplicáveis |

## Minimização

Não existe CPF da criança obrigatório. Observações clínicas não são copiadas para auditoria nem portal externo. Tokens puros, senhas e secrets não são persistidos no banco da aplicação. Dados sensíveis não devem ser enviados a analytics ou incluídos em URLs.

## Direitos e descarte

Pedidos de correção, anonimização e exclusão exigem análise de identidade, base legal, obrigações de retenção e dependências relacionais. Não automatizar exclusão clínica antes dessa decisão. Preferir anonimização controlada e registrar a operação em auditoria.
