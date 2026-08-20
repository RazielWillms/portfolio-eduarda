# Papéis e autorizações — inventário da etapa 1

Este documento registra o comportamento de autorização existente antes da adoção de papéis configuráveis. Ele é o contrato de compatibilidade das próximas etapas: a migração não deve ampliar nem reduzir acessos existentes sem uma decisão explícita.

## Papéis atuais

| Papel | Escopo atual | Observações |
| --- | --- | --- |
| `admin` | Administração de usuários, visão administrativa e operações de coordenação | Algumas políticas clínicas também usam `usuario_admin()`. Isso deve ser migrado com cuidado, sem transformar permissão funcional em acesso clínico irrestrito por acidente. |
| `coordenacao` | Agenda, disponibilidade, frequência e cadastro administrativo de pacientes | Pode atender e receber vínculo, mas não recebe acesso ao prontuário apenas por ser coordenação. |
| `profissional` | Pacientes vinculados, sessões e registros clínicos próprios | Autoria e vínculo limitam leitura e escrita mesmo quando o paciente integra uma equipe. |

`admin_principal` não é um quarto papel. É uma proteção especial aplicada a exatamente um perfil administrativo ativo.

## Autorizações centrais existentes

| Função/regra | Significado atual |
| --- | --- |
| `usuario_ativo()` | Confirma que o perfil autenticado está ativo. |
| `usuario_admin()` | Perfil ativo com `papel = 'admin'`. |
| `usuario_admin_principal()` | Perfil ativo, administrativo e marcado como administrador principal. |
| `usuario_coordenacao()` | Perfil ativo com papel `admin` ou `coordenacao`. |
| `perfil_pode_atender(id)` | Perfil ativo com papel `profissional` ou `coordenacao`, excluindo usuário de demonstração. |
| `usuario_vinculado(paciente)` | Confirma vínculo explícito em `paciente_psicologos`. |

## Matriz funcional atual

| Capacidade | Admin | Coordenação | Profissional | Restrição adicional |
| --- | :---: | :---: | :---: | --- |
| Gerenciar usuários | Sim | Não | Não | Administrador principal é protegido; redefinição de senha é ainda mais restrita. |
| Criar e alterar papéis atuais | Sim | Não | Não | Atualmente limitado aos três valores fixos. |
| Criar agendamentos | Sim | Sim | Não | Paciente e responsável precisam estar ativos. |
| Gerenciar agenda da equipe | Sim | Sim | Não | Inclui edição, reagendamento e cancelamento. |
| Ver compromissos próprios | Sim | Sim | Sim | Profissional comum vê somente os próprios. |
| Gerenciar disponibilidade | Sim | Sim | Não | O profissional não altera nem consulta essa configuração. |
| Registrar frequência administrativa | Sim | Sim | Própria | Profissional depende do próprio atendimento e das regras de vínculo. |
| Cadastrar paciente administrativamente | Sim | Sim | Não | Não cria acesso clínico automático para coordenação. |
| Solicitar acesso ao paciente | Sim | Sim | Sim | Não revela prontuário e não substitui vínculo. |
| Decidir solicitação de acesso | Admin ou profissional vinculado | Somente se já vinculado | Somente se já vinculado | Coordenação, isoladamente, não aprova. |
| Acessar prontuário clínico | Conforme regras atuais | Somente com vínculo | Somente com vínculo | Vínculo não concede autoria sobre registros de outro profissional. |
| Registrar/editar sessão | Conforme políticas atuais | Se atender e estiver vinculada | Se vincululado | Edição permanece limitada à autoria. |
| Alterar foto de paciente | Admin principal ou vinculado | Se vinculada | Se vinculado | Exceção administrativa é exclusiva do principal. |

## Pontos encontrados no código

As verificações estão distribuídas em três camadas:

1. **Interface:** menu, páginas, filtros e botões verificam diretamente `profile.papel`.
2. **Ações do servidor:** ações traduzem recusas das RPCs e algumas operações administrativas usam cliente privilegiado.
3. **Supabase:** funções `security definer`, políticas RLS, triggers e vínculos garantem a autorização efetiva.

As áreas com maior concentração de decisões por papel são:

- usuários e proteção do administrador principal;
- agenda, recorrência e disponibilidade;
- frequência administrativa;
- cadastro e acesso a pacientes;
- políticas clínicas que usam `usuario_admin()`;
- fotos de perfil e paciente;
- modo de demonstração.

## Regras que o modelo configurável deve preservar

1. Permissão de módulo não substitui vínculo com paciente.
2. Permissão de leitura clínica não substitui autoria quando o dado é privado do profissional.
3. Somente o administrador principal pode criar, editar ou desativar papéis configuráveis.
4. Administradores comuns só podem atribuir papéis previamente autorizados e nunca acima do próprio alcance.
5. O administrador principal não pode ser desativado, rebaixado ou removido por outro usuário.
6. Permissões disponíveis formam um catálogo controlado pelo sistema; usuários não criam chaves arbitrárias.
7. Alterações de papel, permissões e atribuições devem gerar auditoria.
8. Interface e backend consultam a mesma semântica, mas o Supabase continua sendo a autoridade final.
9. Usuários e pacientes de demonstração permanecem fora dos fluxos operacionais reais.

## Sequência de migração definida

1. **Concluída neste documento:** inventário e contrato de compatibilidade.
2. **Concluída:** criar catálogo de permissões, papéis configuráveis, relações e funções centrais, sem alterar decisões existentes.
3. **Concluída:** migrar os três papéis atuais para registros equivalentes e associar os perfis.
4. **Concluída:** adaptar primeiro os módulos administrativos: usuários, agenda, disponibilidade e frequência.
5. **Concluída:** adaptar pacientes, solicitações e regras que combinam permissão com vínculo.
6. **Concluída:** adaptar políticas clínicas sensíveis, preservando autoria e privacidade profissional.
7. **Concluída:** criar a interface exclusiva do administrador principal, auditar e manter o legado apenas como fallback de compatibilidade enquanto a implantação é validada.

## Critério de aceite da etapa 1

- Todos os papéis e agregadores atuais estão identificados.
- Está explícito que coordenação não equivale a acesso clínico.
- Está explícito que o administrador principal é uma proteção, não um papel configurável.
- A ordem segura de migração está definida.
- Nenhuma permissão ou comportamento de produção foi alterado nesta etapa.
