# Guia para Compilar APK Android

## Status Atual ✅

- ✅ Código-fonte corrigido (sem erros TypeScript)
- ✅ Build Next.js completo gerado em `/out`
- ✅ Assets web sincronizados com Capacitor em `android/app/src/main/assets/public/`
- ✅ Configuração Capacitor definida

## Requisitos Faltantes

Para compilar o APK, você precisa instalar:

### 1. Java Development Kit (JDK)

- **Versão mínima:** Java 11
- **Download:** https://www.oracle.com/java/technologies/downloads/#java11
- **Após instalação:**
  ```powershell
  java -version  # Verificar instalação
  ```

### 2. Android SDK

- **Opção A (Recomendado):** Android Studio
  - Download: https://developer.android.com/studio
  - Instalação automática de SDK, emulator, e ferramentas
- **Opção B:** Android SDK Command-line Tools
  - Download: https://developer.android.com/tools/releases/cmdline-tools
  - Manual setup (mais complexo)

### 3. Configurar Variáveis de Ambiente

Após instalar Java e Android SDK, configure as variáveis:

**Windows (PowerShell - executar como Admin):**

```powershell
# Se usou Android Studio (caminho padrão):
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"

# Adicionar PATH:
$env:Path += ";$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools"

# Verificar:
java -version
adb version
```

## Passos para Compilar APK

### Após instalar Java e Android SDK:

```powershell
cd "e:\HD Externo\app meu cronograma\painel-de-controle"

# 1. Sincronizar com Capacitor (se falhar na primeira vez, tente novamente)
bun x @capacitor/cli sync android

# 2. Compilar APK Debug (para testes)
cd android
./gradlew.bat assembleDebug

# 3. O APK estará em:
# android\app\build\outputs\apk\debug\app-debug.apk

# Para APK Release (distribuição):
# ./gradlew.bat assembleRelease
# (requer configuração de assinatura)
```

## Estrutura da Aplicação

A aplicação contém:

- **Painel de Controle TDAH:** Calendário, tarefas com subcategorias
- **Gestão Financeira:** Gastos, receitas, categorias personalizáveis
- **Timer Pomodoro:** Técnica de produtividade
- **Armazenamento Local:** localStorage (sincronizado no dispositivo)

## Dados Persistem

Todos os dados são salvos localmente no dispositivo em `painelControleTDAHDados_v7`

## Troubleshooting

### Erro: "java: command not found"

- Java não está instalado ou PATH não configurado
- Solução: Instale JDK e configure JAVA_HOME

### Erro: "Android SDK not found"

- SDK não instalado ou ANDROID_HOME não configurado
- Solução: Instale Android Studio ou SDK Tools e configure ANDROID_SDK_ROOT

### Erro: "gradle build failed"

- Tente: `./gradlew.bat clean assembleDebug`
- Verifique compatibilidade de versões em `android/local.properties`

### APK não instala no celular

- Ative "Fontes desconhecidas" em Configurações > Segurança
- Use: `adb install android\app\build\outputs\apk\debug\app-debug.apk`

## Próximas Etapas

1. Instale Java e Android SDK
2. Configure variáveis de ambiente
3. Execute os comandos acima
4. O APK estará pronto para instalar no seu dispositivo Android

## Suporte

Se tiver dúvidas durante a compilação, verifique:

- https://capacitorjs.com/docs/android
- https://developer.android.com/build
