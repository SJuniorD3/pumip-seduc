# Guia de Contribuição e Governança Técnica (CONTRIBUTING.md)
## PUMIP-SEDUC: Plataforma Unificada de Monitoramento e Inteligência Processual

Agradecemos o interesse em contribuir com a evolução do PUMIP da Secretaria de Estado da Educação do Maranhão (SEDUC-MA).
Para manter os mais elevados padrões de segurança, acessibilidade e integridade de dados exigidos pela auditoria técnica (`@Cpacesso`), todas as contribuições devem observar as diretrizes abaixo.

---

## 1. Padrões de Commit e Versionamento

Utilizamos o padrão **Conventional Commits**:
- `feat(web): ...` para novas funcionalidades de frontend.
- `feat(worker): ...` para novas capacidades do motor de coleta Python.
- `fix(security): ...` para correções de segurança ou vulnerabilidades.
- `fix(a11y): ...` para conformidade de acessibilidade e-MAG / WCAG.
- `test(...): ...` para inclusão ou refatoração de testes.
- `docs(...): ...` para alterações de documentação ou runbooks.

---

## 2. Checklist Obrigatório Antes de Abrir Pull Request

Antes de submeter qualquer contribuição, o desenvolvedor deve garantir que os seguintes comandos executem localmente com 100% de sucesso e zero erros:

```bash
# 1. Frontend: Lint sem erros nem avisos
cd web && npm run lint

# 2. Frontend: Validação estrita de tipos TypeScript
npx tsc --noEmit

# 3. Frontend: Suíte de testes unitários (RLS, Prazos, e-MAG)
npm run test:unit

# 4. Frontend: Benchmarks de desempenho (< 50ms)
npm run test:benchmarks

# 5. Frontend: Compilação de produção Next.js (17/17 rotas)
npm run build

# 6. Worker: Testes unitários e de contrato Python
cd .. && PYTHONPATH=worker python3 -m unittest discover -s worker/tests
```

---

## 3. Diretrizes de Segurança Inegociáveis

1. **Zero Mocks em Produção:** Jamais introduza dados simulados ou fallbacks em caminhos de execução de produção.
2. **Zero Segredos no Repositório:** Credenciais, certificados e chaves mTLS devem ser injetados exclusivamente via variáveis de ambiente.
3. **Conformidade com a LGPD:** Nomes de servidores ou e-mails em fixtures de teste devem ser fictícios ("Servidor Exemplo 01").
4. **Legibilidade e-MAG:** É terminantemente proibido utilizar fontes menores que 12px (`text-[10px]`, `text-[11px]`). Use `text-xs` (12px) como tamanho mínimo.

---

## 4. Fluxo de Trabalho (Branching)

- Toda modificação deve partir da branch `main`.
- Branches de funcionalidade devem seguir a nomenclatura: `feature/<nome-curto>` ou `fix/<nome-curto>`.
- O merge na branch `main` exige aprovação obrigatória do proprietário técnico definido no `.github/CODEOWNERS` e aprovação dos 4 jobs da esteira de CI.
