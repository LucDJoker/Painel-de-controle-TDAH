# OrganizaMente — versão melhorada

Alterações aplicadas neste pacote:

- Renomeado o app de Focus ERP/Painel de Controle para **OrganizaMente**.
- Atualizados título, descrição, manifest PWA, nome Android e textos principais.
- Criados novos ícones 192x192 e 512x512 para web/PWA.
- Atualizados ícones Android em `mipmap-*`.
- Ativado PWA por padrão para Vercel/web. Para build Android sem service worker, use `DISABLE_PWA=true`.
- Removido o script que desregistrava service worker e apagava cache no carregamento.
- Ajustado AndroidManifest com permissões para notificações no Android moderno.
- Desativado backup automático Android (`allowBackup=false`) para reduzir exposição de dados locais.
- Impedido tráfego HTTP claro (`usesCleartextTraffic=false`).
- Corrigido comportamento perigoso que limpava todo o `localStorage` quando a versão do app mudava.

## Como testar na Vercel

Suba este projeto no mesmo repositório ou faça novo deploy. O app usará:

- Nome: OrganizaMente
- Descrição: Organize sua rotina, tarefas, finanças e foco diário.
- PWA ativo por padrão

## Como preparar Android

No computador, rode:

```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

O APK de teste ficará em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Observação importante

O pacote ainda usa armazenamento local do navegador/app para login e dados. Para versão de produção/publicação, o ideal é migrar para banco real local (SQLite) ou nuvem (Supabase/Firebase) e autenticação mais forte.
