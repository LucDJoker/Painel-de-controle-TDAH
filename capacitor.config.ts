import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.painelcontrole.app',
  appName: 'Painel de Controle',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    hostname: '10.0.0.104'
  }
};

export default config;
