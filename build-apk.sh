#!/bin/bash
# Script de Compilação de APK para Painel de Controle TDAH
# Use este script após instalar Java e Android SDK

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="$(pwd)"
ANDROID_DIR="$PROJECT_DIR/android"

echo -e "${YELLOW}=== Compilador APK - Painel de Controle TDAH ===${NC}"
echo ""

# Verificar se está no diretório correto
if [ ! -d "android" ]; then
    echo -e "${RED}❌ Erro: Execute este script a partir da raiz do projeto${NC}"
    exit 1
fi

# Verificar Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java não encontrado. Instale JDK primeiro!${NC}"
    echo "   Download: https://www.oracle.com/java/technologies/downloads/#java11"
    exit 1
fi

echo -e "${GREEN}✅ Java encontrado: $(java -version 2>&1 | head -n 1)${NC}"
echo ""

# Verificar Android SDK
if [ -z "$ANDROID_SDK_ROOT" ] && [ -z "$ANDROID_HOME" ]; then
    echo -e "${RED}❌ Android SDK não configurado${NC}"
    echo "   Configure ANDROID_SDK_ROOT ou ANDROID_HOME"
    exit 1
fi

ANDROID_SDK="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
echo -e "${GREEN}✅ Android SDK encontrado: $ANDROID_SDK${NC}"
echo ""

# Sincronizar com Capacitor
echo -e "${YELLOW}🏗️  Gerando build do Next.js e Sincronizando...${NC}"

# Garante que o build web existe antes de sincronizar
bun run build

bun x @capacitor/cli sync android

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro: Falha na sincronização (Sync).${NC}"
    echo -e "${RED}O APK ficaria com tela branca. Abortando.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔨 Compilando APK Debug...${NC}"

cd "$ANDROID_DIR"

# Build debug APK
# Limpar build anterior para evitar cache corrompido
./gradlew clean

./gradlew assembleDebug

if [ $? -eq 0 ]; then
    APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
    
    if [ -f "$APK_PATH" ]; then
        SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo ""
        echo -e "${GREEN}✅ APK compilado com sucesso!${NC}"
        echo -e "${GREEN}📦 Arquivo: $APK_PATH${NC}"
        echo -e "${GREEN}📊 Tamanho: $SIZE${NC}"
        echo ""
        echo -e "${YELLOW}Para instalar no dispositivo:${NC}"
        echo "   adb install -r \"$APK_PATH\""
        echo ""
    else
        echo -e "${RED}❌ APK não foi criado${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Compilação falhou${NC}"
    exit 1
fi
