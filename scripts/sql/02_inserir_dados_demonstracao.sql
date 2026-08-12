-- COMANDO 2 — CRIAR CENÁRIO DE DEMONSTRAÇÃO
-- Login: demo@registrosaba.local
-- Senha: Demo@2026!
-- Execute preferencialmente após o COMANDO 1.

-- Compatibilidade com ambientes que ainda possuem a primeira versão do
-- gatilho de auditoria de sessões.
create or replace function public.auditar_sessao_estruturada()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_novo jsonb := to_jsonb(new);
begin
  insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)
  values(
    auth.uid(),upper(tg_table_name||'_'||tg_op),tg_table_name,
    (v_novo->>'id')::uuid,
    case when tg_table_name='sessoes_clinicas' then jsonb_build_object(
      'paciente_id',v_novo->>'paciente_id','profissional_id',v_novo->>'profissional_id',
      'data',v_novo->>'data','status',v_novo->>'status')
    else jsonb_build_object(
      'sessao_id',v_novo->>'sessao_id','alvo_id',v_novo->>'alvo_id',
      'tipo_medicao',v_novo->>'tipo_medicao') end
  );
  return new;
end $$;

begin;
set local session_replication_role = replica;

do $$
declare
  v_usuario uuid;
  v_novo_usuario boolean := false;
  v_instancia uuid;
  v_paciente uuid := gen_random_uuid();
  v_plano uuid := gen_random_uuid();
  v_objetivo uuid := gen_random_uuid();
  v_alvo_comunicacao uuid := gen_random_uuid();
  v_alvo_espera uuid := gen_random_uuid();
  v_def_comunicacao uuid := gen_random_uuid();
  v_def_espera uuid := gen_random_uuid();
  v_config_comunicacao uuid := gen_random_uuid();
  v_config_espera uuid := gen_random_uuid();
  v_criterio_comunicacao uuid := gen_random_uuid();
  v_criterio_espera uuid := gen_random_uuid();
  v_protocolo_comunicacao uuid := gen_random_uuid();
  v_protocolo_espera uuid := gen_random_uuid();
  v_sessao uuid;
  v_registro uuid;
  v_indice integer;
  v_tentativa integer;
  v_datas date[] := array[
    current_date-133,current_date-126,current_date-119,current_date-112,current_date-105,
    current_date-98,current_date-91,current_date-84,current_date-77,current_date-70,
    current_date-63,current_date-56,current_date-49,current_date-42,current_date-35,
    current_date-28,current_date-21,current_date-14,current_date-7,current_date
  ];
  v_acertos integer[] := array[1,2,2,3,4,3,5,4,5,6,5,6,7,6,7,8,7,8,9,9];
  v_espera integer[] := array[5,8,10,8,12,15,18,16,20,24,22,28,32,30,36,40,38,45,52,60];
begin
  select id into v_usuario from auth.users
  where lower(email)='demo@registrosaba.local' limit 1;

  if v_usuario is null then
    v_usuario := gen_random_uuid();
    v_novo_usuario := true;
  else
    -- Recria somente o cenário fictício associado à conta demo. Nenhum dado
    -- de outro profissional ou paciente real é removido.
    delete from public.concordancia_referencias cr using public.solicitacoes_concordancia sc
      where cr.solicitacao_id=sc.id and (sc.solicitante_id=v_usuario or sc.observador_id=v_usuario);
    delete from public.solicitacoes_concordancia where solicitante_id=v_usuario or observador_id=v_usuario;
    delete from public.tentativas_individuais ti using public.registros_medicao r,public.sessoes_clinicas s
      where ti.registro_medicao_id=r.id and r.sessao_id=s.id and s.profissional_id=v_usuario;
    delete from public.integridade_procedimental ip using public.sessoes_clinicas s
      where ip.sessao_id=s.id and s.profissional_id=v_usuario;
    delete from public.observacoes_abc where profissional_id=v_usuario;
    delete from public.registros_medicao r using public.sessoes_clinicas s
      where r.sessao_id=s.id and s.profissional_id=v_usuario;
    delete from public.sessoes_clinicas where profissional_id=v_usuario;
    delete from public.registros_validade_social where profissional_id=v_usuario;
    delete from public.capacitacoes_aplicadores where profissional_id=v_usuario;
    delete from public.revisoes_clinicas_alvo where profissional_id=v_usuario;
    delete from public.planos_apoio_comportamental_alvo pa using public.alvos_clinicos a
      where pa.alvo_id=a.id and a.profissional_id=v_usuario;
    delete from public.protocolos_intervencao_alvo pi using public.alvos_clinicos a
      where pi.alvo_id=a.id and a.profissional_id=v_usuario;
    delete from public.historico_fases_alvo h using public.alvos_clinicos a
      where h.alvo_id=a.id and a.profissional_id=v_usuario;
    delete from public.criterios_dominio_alvo c using public.alvos_clinicos a
      where c.alvo_id=a.id and a.profissional_id=v_usuario;
    delete from public.configuracoes_medicao_alvo m using public.alvos_clinicos a
      where m.alvo_id=a.id and a.profissional_id=v_usuario;
    delete from public.definicoes_operacionais_alvo d using public.alvos_clinicos a
      where d.alvo_id=a.id and a.profissional_id=v_usuario;
    delete from public.alvos_clinicos where profissional_id=v_usuario;
    delete from public.objetivos_clinicos o using public.planos_clinicos p
      where o.plano_id=p.id and p.profissional_responsavel_id=v_usuario;
    delete from public.planos_clinicos where profissional_responsavel_id=v_usuario;
    delete from public.acessos_responsavel where criado_por=v_usuario;
    delete from public.solicitacoes_acesso where solicitante_id=v_usuario or destinatario_id=v_usuario or resolvido_por=v_usuario;
    delete from public.paciente_habilidades where profissional_id=v_usuario;
    delete from public.paciente_psicologos where psicologo_id=v_usuario;
    delete from public.pacientes where criado_por=v_usuario;
    delete from public.audit_logs where user_id=v_usuario;
  end if;

  select instance_id into v_instancia from auth.users order by created_at limit 1;
  v_instancia := coalesce(v_instancia,'00000000-0000-0000-0000-000000000000'::uuid);

  -- Cria a conta somente na primeira execução; nas próximas, ela é reutilizada.
  if v_novo_usuario then
    insert into auth.users (
    instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
    raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
    confirmation_token,recovery_token,email_change,email_change_token_new
  ) values (
    v_instancia,v_usuario,'authenticated','authenticated','demo@registrosaba.local',
    extensions.crypt('Demo@2026!',extensions.gen_salt('bf')),now(),
    '{"provider":"email","providers":["email"],"papel":"profissional","status":"ativo"}'::jsonb,
    '{"nome":"Marina Souza — Demonstração"}'::jsonb,now(),now(),'','','',''
    );

  -- Algumas versões do Auth exigem identidade explícita para login por senha.
    insert into auth.identities (
    id,user_id,provider_id,identity_data,provider,created_at,updated_at,last_sign_in_at
  ) values (
    gen_random_uuid(),v_usuario,v_usuario::text,
    jsonb_build_object('sub',v_usuario::text,'email','demo@registrosaba.local','email_verified',true),
    'email',now(),now(),now()
    );
  end if;

  -- O trigger de auth.users normalmente cria este perfil; o upsert torna o script portátil.
  insert into public.profiles (id,nome,email,papel,status,admin_principal)
  values (v_usuario,'Marina Souza — Demonstração','demo@registrosaba.local','profissional','ativo',false)
  on conflict (id) do update set
    nome=excluded.nome,email=excluded.email,papel='profissional',status='ativo',admin_principal=false;

  insert into public.pacientes (
    id,nome_completo,nome_responsavel,cpf_responsavel,cpf_paciente,data_nascimento,
    diagnostico,contatos,observacoes,status,criado_por
  ) values (
    v_paciente,'Lucas Almeida — Demonstração','Carla Almeida','52998224725','39053344705',
    date '2018-04-12','TEA — dados exclusivamente fictícios',
    'responsavel.demo@example.com · (11) 99999-0000',
    'Paciente fictício criado para apresentação do sistema.','ativo',v_usuario
  );

  insert into public.paciente_psicologos (paciente_id,psicologo_id)
  values (v_paciente,v_usuario);

  insert into public.planos_clinicos (
    id,paciente_id,profissional_responsavel_id,titulo,justificativa,status,iniciado_em,revisar_em
  ) values (
    v_plano,v_paciente,v_usuario,'Plano demonstrativo de comunicação e autonomia',
    'Cenário fictício para demonstrar planejamento, coleta e análise.','em_execucao',
    current_date-40,current_date+20
  );

  insert into public.objetivos_clinicos (id,plano_id,descricao,horizonte,ordem)
  values (v_objetivo,v_plano,'Ampliar comunicação funcional e tolerância à espera em atividades cotidianas.','curto_prazo',1);

  insert into public.alvos_clinicos (id,objetivo_id,profissional_id,nome,categoria,natureza,fase)
  values
    (v_alvo_comunicacao,v_objetivo,v_usuario,'Solicitar ajuda de forma funcional','Comunicação','aquisicao','ensino'),
    (v_alvo_espera,v_objetivo,v_usuario,'Aguardar acesso a item preferido','Autorregulação','aquisicao','ensino');

  insert into public.definicoes_operacionais_alvo (
    id,alvo_id,versao,descricao_observavel,resposta_esperada,condicoes_antecedentes,
    exemplos,nao_exemplos,materiais,instrucao_sd,resposta_correta,resposta_incorreta,criterios_interrupcao,criado_por
  ) values
    (v_def_comunicacao,v_alvo_comunicacao,1,
     'Diante de uma tarefa difícil, Lucas emite pedido vocal ou seleciona o cartão “ajuda” em até 10 segundos.',
     'Pedido vocal ou seleção independente do cartão.','Tarefa nova ou item fora de alcance.',
     'Dizer ajuda; entregar o cartão ajuda.','Chorar sem emitir pedido; puxar a mão do adulto.',
     'Cartão de comunicação e atividades funcionais.','Se precisar, peça ajuda.',
     'Pedido funcional dentro de 10 segundos.','Ausência de pedido ou resposta não relacionada.',
     'Interromper diante de sinais persistentes de desconforto.',v_usuario),
    (v_def_espera,v_alvo_espera,1,
     'Após ouvir “espere”, Lucas permanece no espaço combinado sem tentar alcançar o item durante o intervalo definido.',
     'Aguardar pelo período programado.','Item preferido visível e temporariamente indisponível.',
     'Mãos afastadas do item e permanência no local.','Tentar pegar o item ou abandonar o espaço.',
     'Temporizador visual e itens preferidos.','Espere.',
     'Aguardar até o sinal final.','Tocar no item antes do sinal.',
     'Reduzir o intervalo diante de sofrimento ou escalada comportamental.',v_usuario);

  insert into public.configuracoes_medicao_alvo (id,alvo_id,versao,tipo,unidade,parametros,criado_por)
  values
    (v_config_comunicacao,v_alvo_comunicacao,1,'tentativas_discretas','oportunidades','{"total_planejado":10}'::jsonb,v_usuario),
    (v_config_espera,v_alvo_espera,1,'duracao','segundos','{}'::jsonb,v_usuario);

  insert into public.criterios_dominio_alvo (
    id,alvo_id,versao,direcao,valor_alvo,sessoes_consecutivas,oportunidades_minimas,
    ambientes_minimos,aplicadores_minimos,dias_manutencao,configuracao,criado_por
  ) values
    (v_criterio_comunicacao,v_alvo_comunicacao,1,'aumentar',80,3,10,2,2,30,'{}'::jsonb,v_usuario),
    (v_criterio_espera,v_alvo_espera,1,'aumentar',45,3,null,2,2,30,'{}'::jsonb,v_usuario);

  insert into public.protocolos_intervencao_alvo (
    id,alvo_id,versao,estrategia_ensino,hierarquia_ajuda,procedimento_esvanecimento,
    reforcadores,esquema_reforcamento,correcao_erro,instrucoes_aplicacao,criado_por
  ) values
    (v_protocolo_comunicacao,v_alvo_comunicacao,1,'ensino_naturalistico',
     'Espera de 3 segundos, pista gestual, modelo vocal e ajuda física mínima.',
     'Aumentar gradualmente o tempo antes das pistas.','Acesso à ajuda solicitada e elogio descritivo.',
     'Reforçamento contínuo para pedidos independentes.','Representar a oportunidade com pista menos intrusiva.',
     'Variar tarefas, pessoas e ambientes ao longo da semana.',v_usuario),
    (v_protocolo_espera,v_alvo_espera,1,'ensino_naturalistico',
     'Temporizador visual, lembrete gestual e modelo verbal breve.',
     'Aumentar o tempo de espera em pequenos passos.','Acesso ao item e elogio pela espera.',
     'Reforçamento contínuo ao completar o intervalo.','Reduzir o intervalo e reapresentar após regulação.',
     'Começar com intervalos curtos e previsíveis.',v_usuario);

  insert into public.historico_fases_alvo (alvo_id,fase_anterior,nova_fase,motivo,alterado_por,created_at)
  values
    (v_alvo_comunicacao,'linha_de_base','ensino','Dados iniciais suficientes para iniciar intervenção.',v_usuario,current_date-38),
    (v_alvo_espera,'linha_de_base','ensino','Dados iniciais suficientes para iniciar intervenção.',v_usuario,current_date-38);

  -- Vinte sessões semanais, com variabilidade realista e progressão visível.
  for v_indice in 1..20 loop
    v_sessao := gen_random_uuid();
    insert into public.sessoes_clinicas (
      id,paciente_id,profissional_id,data,contexto,ambiente_tipo,aplicador_tipo,
      observacoes_privadas,status
    ) values (
      v_sessao,v_paciente,v_usuario,v_datas[v_indice],
      case when v_indice % 2=0 then 'Atividade estruturada em mesa' else 'Rotina naturalística com brinquedos' end,
      case when v_indice%5=0 then 'casa' when v_indice%7=0 then 'escola' else 'clinica' end,
      case when v_indice%5=0 then 'cuidador' when v_indice%7=0 then 'educador' else 'profissional' end,
      'Registro fictício para demonstração.','finalizada'
    );

    v_registro := gen_random_uuid();
    insert into public.registros_medicao (
      id,sessao_id,alvo_id,definicao_operacional_id,configuracao_medicao_id,
      criterio_dominio_id,protocolo_intervencao_id,tipo_medicao,dados,observacao
    ) values (
      v_registro,v_sessao,v_alvo_comunicacao,v_def_comunicacao,v_config_comunicacao,
      v_criterio_comunicacao,v_protocolo_comunicacao,'tentativas_discretas',
      jsonb_build_object('oportunidades',10,'respostas_independentes',v_acertos[v_indice]),
      'O nível de ajuda foi reduzido gradualmente.'
    );
    insert into public.integridade_procedimental (
      sessao_id,registro_medicao_id,protocolo_intervencao_id,itens,itens_previstos,itens_realizados
    ) values (
      v_sessao,v_registro,v_protocolo_comunicacao,
      '{"hierarquia_ajuda":true,"reforcamento":true,"correcao_erro":true}'::jsonb,3,3
    );
    for v_tentativa in 1..10 loop
      insert into public.tentativas_individuais(registro_medicao_id,profissional_id,ordem,resultado,nivel_ajuda,latencia_segundos,observacao)
      values(v_registro,v_usuario,v_tentativa,
        case when v_tentativa<=v_acertos[v_indice]+least(2,10-v_acertos[v_indice])then'correta'when v_tentativa=10 then'sem_resposta'else'incorreta'end,
        case when v_tentativa<=v_acertos[v_indice]then'independente'when v_indice<=5 then'fisica_parcial'when v_indice<=10 then'modelo'when v_indice<=15 then'verbal'else'gestual'end,
        greatest(0.8,round((6.5-v_indice*0.22+v_tentativa*0.04)::numeric,2)),null);
    end loop;

    v_registro := gen_random_uuid();
    insert into public.registros_medicao (
      id,sessao_id,alvo_id,definicao_operacional_id,configuracao_medicao_id,
      criterio_dominio_id,protocolo_intervencao_id,tipo_medicao,dados,observacao
    ) values (
      v_registro,v_sessao,v_alvo_espera,v_def_espera,v_config_espera,
      v_criterio_espera,v_protocolo_espera,'duracao',
      jsonb_build_object('segundos',v_espera[v_indice]),
      'Boa resposta ao temporizador visual.'
    );
    insert into public.integridade_procedimental (
      sessao_id,registro_medicao_id,protocolo_intervencao_id,itens,itens_previstos,itens_realizados
    ) values (
      v_sessao,v_registro,v_protocolo_espera,
      '{"hierarquia_ajuda":true,"reforcamento":true,"correcao_erro":true}'::jsonb,3,3
    );
  end loop;

  insert into public.registros_validade_social (
    paciente_id,alvo_id,profissional_id,respondente_tipo,objetivo_relevante,
    aceitabilidade,viabilidade,beneficio_percebido,assentimento_observado,
    relato,adaptacoes_necessarias,registrado_em
  ) values (
    v_paciente,v_alvo_comunicacao,v_usuario,'responsavel',true,5,4,5,'aceite',
    'A família percebeu aumento de pedidos adequados durante a rotina.',
    'Manter cartões disponíveis em mais de um ambiente.',current_date-2
  );

  raise notice 'Usuário demo criado: % | senha: % | id: %','demo@registrosaba.local','Demo@2026!',v_usuario;
end
$$;

commit;

select
  'demo@registrosaba.local' as email,
  'Demo@2026!' as senha_temporaria,
  (select count(*) from public.pacientes where criado_por=(select id from public.profiles where lower(email)='demo@registrosaba.local' limit 1)) as pacientes_demo,
  (select count(*) from public.sessoes_clinicas s join public.profiles p on p.id=s.profissional_id where p.email='demo@registrosaba.local') as sessoes_demo;
