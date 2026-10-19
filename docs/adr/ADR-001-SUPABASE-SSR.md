# ADR 001: Migração para @supabase/ssr e Proteção de Rotas Server-Side

**Status:** Aprovado e Implementado  
**Data:** 19/10/2026  
**Decisores:** Arquiteto de Software, Especialista em Segurança (@Cpacesso), Equipe Técnica SEDUC/STI  

---

## 1. Contexto e Problema
A versão anterior do PUMIP utilizava o pacote depreciado `@supabase/auth-helpers-nextjs`, em conjunto com validações de perfil no frontend e dependência de `localStorage` do navegador para controle de sessão.
Na auditoria técnica de 19/10/2026, foi identificado que a manipulação direta do `localStorage` no console do navegador (`localStorage.setItem('pumip_auth_user', ...)`) permitia a um usuário comum visualizar rotas protegidas como `/admin/integracoes`, configurando vulnerabilidade de *Broken Access Control* (OWASP Top 10 A01).

## 2. Decisão Arquitetural
1. **Descontinuação e Remoção:** Remover completamente `@supabase/auth-helpers-nextjs` do `web/package.json`.
2. **Adoção do `@supabase/ssr`:** Instalar e padronizar clientes Supabase oficiais em:
   - [`web/src/lib/supabase/client.ts`](file:///Users/servulojunior/.gemini/antigravity/scratch/pumip-seduc/web/src/lib/supabase/client.ts): cliente de navegação usando `createBrowserClient`.
   - [`web/src/lib/supabase/server.ts`](file:///Users/servulojunior/.gemini/antigravity/scratch/pumip-seduc/web/src/lib/supabase/server.ts): cliente server-side usando `createServerClient` e `cookies()` do `next/headers`.
3. **Resolução de Papel no Servidor:** Módulo [`web/src/lib/auth/perfil.ts`](file:///Users/servulojunior/.gemini/antigravity/scratch/pumip-seduc/web/src/lib/auth/perfil.ts) (`obterPerfil()`) buscando os metadados diretamente das tabelas `perfis_usuarios` e `unidades_organizacionais` através de chamada autenticada.
4. **Proteção em Server Component:** Implementação de layout server-side em [`web/src/app/admin/layout.tsx`](file:///Users/servulojunior/.gemini/antigravity/scratch/pumip-seduc/web/src/app/admin/layout.tsx) que redireciona imediatamente para `/` caso `perfil.role !== 'ADMIN'`, antes de qualquer renderização de componentes de tela.

## 3. Consequências e Benefícios
- **Segurança Robusta:** Impossibilidade absoluta de invasão ou elevação de privilégios via devtools ou `localStorage`.
- **Conformidade de Cookies:** Cookies HTTP-Only geridos com rotação e refresh transparentes pelo middleware do Next.js.
- **Isolamento de Credenciais:** As chaves de serviço (`SUPABASE_SERVICE_ROLE_KEY`) nunca são expostas ao browser do cliente.
