import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import type { Tarefa } from './types';

export class WidgetSync {
  private static instance: WidgetSync;
  private isAndroid = false;

  private constructor() {
    this.checkPlatform();
  }

  static getInstance(): WidgetSync {
    if (!WidgetSync.instance) {
      WidgetSync.instance = new WidgetSync();
    }
    return WidgetSync.instance;
  }

  private async checkPlatform() {
    const info = await Device.getInfo();
    this.isAndroid = info.platform === 'android';
  }

  async updateWidget(dados: Tarefa[]): Promise<void> {
    if (!this.isAndroid) {
      return; // Widget só funciona no Android
    }

    try {
      // Salvar dados no localStorage (que será sincronizado com SharedPreferences)
      localStorage.setItem('painel_controle_dados', JSON.stringify(dados));
      
      // Enviar broadcast para atualizar o widget
      if (window.AndroidBridge) {
        window.AndroidBridge.updateWidget();
      }
      
      console.log('[WidgetSync] Widget atualizado com sucesso');
    } catch (error) {
      console.error('[WidgetSync] Erro ao atualizar widget:', error);
    }
  }

  async syncData(): Promise<void> {
    if (!this.isAndroid) {
      return;
    }

    try {
      const dados = localStorage.getItem('painel_controle_dados');
      if (dados) {
        await this.updateWidget(JSON.parse(dados));
      }
    } catch (error) {
      console.error('[WidgetSync] Erro ao sincronizar dados:', error);
    }
  }
}

// Declaração global para o bridge Android
declare global {
  interface Window {
    AndroidBridge?: {
      updateWidget: () => void;
    };
  }
}

export default WidgetSync; 