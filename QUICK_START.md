# 📋 QUICK START GUIDE

## Sua Aplicação Android Está Pronta! ✅

### ⚡ PRÓXIMAS 3 ETAPAS (20 MINUTOS TOTAL)

---

## 1️⃣ INSTALAR FERRAMENTAS (15 MIN)

### Opção A: Windows (Recomendado)

**a) Instalar Java 11:**

- Acesse: https://www.oracle.com/java/technologies/downloads/
- Download: JDK 11 LTS
- Instale com as configurações padrão
- Verifique: Abra PowerShell e digite `java -version`

**b) Instalar Android Studio:**

- Acesse: https://developer.android.com/studio
- Download e instale
- Abre e deixa instalar SDK (automático)
- Fecha quando terminar

**c) Configurar no PowerShell (como Admin):**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_SDK_ROOT = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
```

### Opção B: Linux/Mac

```bash
# Ubuntu/Debian
sudo apt-get install openjdk-11-jdk

# Baixe Android Studio:
# https://developer.android.com/studio
```

---

## 2️⃣ COMPILAR APK (5 MIN)

**Automático (Windows - Recomendado):**

```powershell
cd "e:\HD Externo\app meu cronograma\painel-de-controle"
powershell -ExecutionPolicy Bypass -File build-apk.ps1
```

**Manual:**

```powershell
cd "e:\HD Externo\app meu cronograma\painel-de-controle\android"
./gradlew.bat assembleDebug
```

**Espere 3-5 minutos...**

✅ Sucesso quando ver:

```
BUILD SUCCESSFUL
APK compilado com sucesso!
📦 Arquivo: android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 3️⃣ INSTALAR NO CELULAR (2 MIN)

### Opção A: Via USB

1. Conecte celular com USB
2. Ative "Modo desenvolvedor" (toque 7x em "Versão do Android")
3. Ative "Depuração USB"
4. PowerShell:

```powershell
adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"
```

### Opção B: Manual

1. Copie `app-debug.apk` para seu celular
2. Abra em gerenciador de arquivos
3. Toque para instalar
4. Confirme em "Instalação de aplicativos desconhecidos"

---

## 📱 APÓS INSTALAR

1. Abra o aplicativo "Painel de Controle"
2. Comece a usar:
   - 📅 Calendário e tarefas
   - 💰 Gastos e receitas
   - ⏱️ Timer Pomodoro

---

## 🆘 SE DER ERRO

| Erro                         | Solução                         |
| ---------------------------- | ------------------------------- |
| "Java não encontrado"        | Instale JDK novamente           |
| "Android SDK não encontrado" | Instale Android Studio          |
| "Compilação falha"           | `./gradlew clean assembleDebug` |
| "APK não instala"            | Ative "Fontes desconhecidas"    |

---

## 📂 ONDE ESTÁ TUDO

- **Código:** `e:\HD Externo\app meu cronograma\painel-de-controle\src\`
- **APK:** `e:\HD Externo\app meu cronograma\painel-de-controle\android\app\build\outputs\apk\debug\app-debug.apk`
- **Dados:** Salvos no celular (localStorage)

---

## ✨ DIVIRTA-SE!

Sua aplicação tem tudo:

- ✅ Calendário inteligente
- ✅ Rastreamento de tarefas
- ✅ Gestão de gastos
- ✅ Timer Pomodoro
- ✅ Funciona offline
- ✅ 100% privado

**Bom uso!** 🚀
