## 📋 Descrição das Alterações

<!-- Descreva de forma concisa e técnica as modificações implementadas neste Pull Request. -->

---

## 🎯 Tipo de Mudança
- [ ] 🐛 Correção de bug / hotfix (não quebra compatibilidade)
- [ ] ✨ Nova funcionalidade / melhoria técnica
- [ ] 🔒 Remediação de segurança ou privacidade (LGPD / RLS)
- [ ] ⚡ Otimização de desempenho ou escalabilidade
- [ ] 📝 Atualização de documentação ou governança

---

## 🧪 Checklist de Verificação Local (Obrigatório antes do Merge)

### Banco de Dados e Migrações (PostgreSQL / Supabase CLI)
- [ ] `supabase db reset` executado sem erros
- [ ] Migrações aplicadas de forma idempotente em transação única
- [ ] Suíte pgTAP aprovada (`supabase test db`) com validação de RLS e `security_invoker = true`

### Backend Worker Python (`worker/`)
- [ ] `python3 -m unittest discover -s worker/tests -v` aprovado (19/19 testes)
- [ ] `ruff check worker/pumip_worker worker/tests` com 0 apontamentos
- [ ] `mypy --strict worker/pumip_worker` com 0 erros de tipo
- [ ] Ausência de chamadas não-autorizadas e zero dados sintéticos/inventados

### Frontend Next.js (`web/`)
- [ ] `npm run lint` aprovado (0 erros e 0 avisos)
- [ ] `npm run test:unit` aprovado (26/26 testes)
- [ ] `npm run test:benchmarks` aprovado (3/3 benchmarks < 50ms)
- [ ] `npm run build` concluído com sucesso (17/17 rotas)
- [ ] Ausência de nomes pessoais reais de servidores nos códigos de exemplo

---

## 👥 Revisão por Pares (Peer Review)
- **Revisor Designado:** @desenvolvedor-revisor
- **Status da Revisão:** [ ] Aprovado / [ ] Alterações Solicitadas
