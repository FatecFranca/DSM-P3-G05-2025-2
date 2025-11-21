/**
 * initPage - Inicializa a página lendo parâmetros da URL
 */
function initPage() {
  // Captura a query string da URL atual (ex: "?name=pizzaria&tag=lenha")
  const urlParams = window.location.search;

  // Remove o "?" inicial se existir, mantendo apenas os parâmetros
  const queryString = urlParams.startsWith('?') ? urlParams.substring(1) : urlParams;

  // Dispara o controlador (string vazia significa "buscar todos")
  searchController(queryString);
}

/**
 * fetchSearchResults - Comunica com a API para buscar estabelecimentos
 * @param {string} queryParams - Query string (ex: "name=pizzaria&tag=lenha") ou vazio
 * @returns {Promise<Array|null>} Array de estabelecimentos ou null em caso de erro
 */
async function fetchSearchResults(queryParams) {
  // Determina o endpoint baseado nos parâmetros
  let apiUrl;
  
  if (!queryParams || queryParams.trim() === '') {
    // Cenário A: Listagem geral (todos os estabelecimentos)
    apiUrl = 'http://localhost:3000/estabelecimentos';
  } else {
    // Cenário B: Busca específica
    apiUrl = `http://localhost:3000/estabelecimentos/search?${queryParams}`;
  }

  try {
    // Executa requisição GET
    const response = await fetch(apiUrl);

    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      console.error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      return null;
    }

    // Parse do JSON e retorno dos dados
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar estabelecimentos:', error);
    return null;
  }
}

/**
 * searchController - Orquestra a busca e renderização
 * @param {string} queryString - Query string (ex: "name=pizzaria&tag=lenha") ou vazio
 */
async function searchController(queryString) {
  try {
    // Exibe estado de carregamento (opcional)
    showLoading();

    // Busca os dados na API
    const data = await fetchSearchResults(queryString);

    // Renderiza os resultados
    if (data) {
      renderResults(data);
    } else {
      renderError();
    }
  } catch (error) {
    console.error('Erro no controlador de busca:', error);
    renderError();
  }
}

/**
 * renderResults - Renderiza os cards de estabelecimentos na tela
 * @param {Array} data - Array de objetos JSON de estabelecimentos
 */
function renderResults(data) {
  const container = document.getElementById('establishments-list');
  if (!container) return;

  // Limpa o container anterior
  container.innerHTML = '';

  // Tratamento de array vazio ou nulo
  if (!data || data.length === 0) {
    container.innerHTML = '<p class="no-results">Nenhum estabelecimento encontrado com os critérios de busca.</p>';
    return;
  }

  // Loop para criar cada card
  data.forEach(establishment => {
    // Cria o card principal com ID único
    const card = document.createElement('div');
    card.className = 'card';
    card.id = `card-${establishment.id}`;
    card.style.cursor = 'pointer';

    // Adiciona evento de clique para navegação
    card.addEventListener('click', () => {
      window.location.href = `perfil-estabelecimento.html?id=${establishment.id}`;
    });

    // Imagem de fallback
    const imageUrl = (establishment.images && establishment.images.length > 0) 
      ? establishment.images[0] 
      : 'https://placehold.co/600x400/9775da/white?text=Sem+Imagem';

    // Estrutura do card (Novo Design)
    card.innerHTML = `
      <div class="card-image-container">
        <img src="${imageUrl}" alt="${establishment.place_name}" class="card-image">
        <div class="card-rating-badge">
           <svg class="star-icon-sm" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
           ${establishment.rating || '0.0'}
        </div>
      </div>
      <div class="card-content">
        <div class="card-header">
          <div class="card-category">${establishment.category?.title || 'Geral'}</div>
          <h3 class="card-title">${establishment.place_name || 'Nome não disponível'}</h3>
        </div>
        
        <div class="card-info">
          <div class="info-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="info-icon"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${establishment.street || ''}, ${establishment.street_number || ''}</span>
          </div>
          <div class="info-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="info-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${establishment.opening_hours || '--:--'} - ${establishment.closing_hours || '--:--'}</span>
          </div>
        </div>

        <div class="card-tags">
          ${renderTags(establishment.tags)}
        </div>

        <button class="card-action">Ver Detalhes</button>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * renderTags - Cria HTML para as tags
 * @param {Array} tags - Array de tags
 * @returns {string} HTML das tags
 */
function renderTags(tags) {
  if (!tags || tags.length === 0) {
    return '';
  }
  // Limita a 3 tags para não quebrar o layout do card
  const displayTags = tags.slice(0, 3);
  return displayTags.map(tag => `<span class="tag-pill-sm">${tag}</span>`).join('');
}

/**
 * showLoading - Exibe estado de carregamento
 */
function showLoading() {
  const container = document.getElementById('establishments-list');
  if (container) {
    container.innerHTML = '<p class="loading-message">Carregando estabelecimentos...</p>';
  }
}

/**
 * renderError - Exibe mensagem de erro
 */
function renderError() {
  const container = document.getElementById('establishments-list');
  if (container) {
    container.innerHTML = '<p class="error-message">Erro ao carregar estabelecimentos. Tente novamente.</p>';
  }
}

/**
 * showLoading - Exibe estado de carregamento
 */
function showLoading() {
  const container = document.getElementById('establishments-list');
  if (container) {
    container.innerHTML = '<p class="loading-message">Carregando estabelecimentos...</p>';
  }
}

/**
 * renderError - Exibe mensagem de erro
 */
function renderError() {
  const container = document.getElementById('establishments-list');
  if (container) {
    container.innerHTML = '<p class="error-message">Erro ao carregar estabelecimentos. Tente novamente.</p>';
  }
}

// --- Inicialização Específica da Página ---
document.addEventListener('DOMContentLoaded', () => {
  // Roda a lógica de inicialização da página de estabelecimentos
  initPage();
});
