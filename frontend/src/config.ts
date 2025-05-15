/**
 * Configurações da aplicação BCB (Big Chat Brasil)
 * 
 * Este arquivo obtém as configurações do backend em tempo de execução
 * para garantir que o frontend e o backend estejam sempre sincronizados.
 */

// URL base da API - Valor padrão que será usado até que as configurações sejam carregadas do backend
export let API_URL = 'http://localhost:3000/api';

// Preços das mensagens - Valores padrão que serão atualizados com os valores do backend
export let MESSAGE_PRICES = {
  normal: 0.25, // Valor padrão para mensagens normais
  urgent: 0.50  // Valor padrão para mensagens urgentes
};

// Indica se as configurações já foram carregadas do backend
let configLoaded = false;

/**
 * Função para obter a URL da API em tempo de execução
 * Isso é útil para ambientes onde a URL pode mudar dinamicamente
 */
export const getApiUrl = () => {
  return API_URL;
};

/**
 * Função para carregar as configurações do backend
 * Esta função é chamada automaticamente quando o arquivo é importado
 */
export const loadConfig = async () => {
  if (configLoaded) return;
  
  try {
    // Tentar obter as configurações do backend
    const response = await fetch(`${API_URL}/config`);
    
    if (response.ok) {
      const config = await response.json();
      
      // Atualizar as configurações com os valores do backend
      if (config.apiUrl) API_URL = config.apiUrl;
      if (config.messagePrices) MESSAGE_PRICES = config.messagePrices;
      
      configLoaded = true;
      console.log('Configurações carregadas do backend:', config);
    }
  } catch (error) {
    console.warn('Não foi possível carregar as configurações do backend:', error);
  }
};

// Tentar carregar as configurações do backend quando o arquivo é importado
loadConfig();
