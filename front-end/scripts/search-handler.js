/**
 * search-handler.js
 * Funções compartilhadas de busca para todas as páginas
 */

/**
 * handleSearch - Captura, valida e processa o input de busca
 * @param {Event} event - Evento do formulário
 */
function handleSearch(event) {
  if (event) {
    event.preventDefault();
  }

  // Captura o input identificado por data-js="search"
  const input = document.querySelector('[data-js="search"]');
  if (!input) return;

  const rawSearch = input.value.trim();

  // Input vazio é permitido
  if (!rawSearch) {
    routerSearch('');
    return;
  }

  // Parsing: extração de tag:, categoria: e texto livre (name)
  let remaining = rawSearch;
  let tag = '';
  let category = '';

  // Função auxiliar para extrair valores após uma chave específica
  const extractValue = (source, key) => {
    const regex = new RegExp(`\\b${key}:\\s*([^\\s]+(?:\\s+(?!tag:|categoria:)[^\\s]+)*)`, 'i');
    const match = source.match(regex);
    
    if (!match) return { value: '', rest: source };
    
    const captured = match[1].trim();
    if (!captured) {
      throw new Error(`Chave "${key}:" sem valor associado`);
    }
    
    const rest = source.replace(match[0], ' ').trim();
    return { value: captured, rest };
  };

  try {
    // Extrai tag:
    const tagResult = extractValue(remaining, 'tag');
    tag = tagResult.value;
    remaining = tagResult.rest;

    // Extrai categoria:
    const categoryResult = extractValue(remaining, 'categoria');
    category = categoryResult.value;
    remaining = categoryResult.rest;
  } catch (err) {
    alert('Pesquisa inválida, siga o formato corretamente');
    console.error(err);
    return;
  }

  // O texto restante é o name
  const name = remaining.trim();

  // Formatação: capitaliza a primeira letra de category
  if (category) {
    category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }

  // Construção da query string
  const params = [];
  if (name) params.push(`name=${encodeURIComponent(name)}`);
  if (tag) params.push(`tag=${encodeURIComponent(tag)}`);
  if (category) params.push(`category=${encodeURIComponent(category)}`);

  const queryString = params.join('&');

  // Delega navegação para routerSearch
  routerSearch(queryString);
}

/**
 * routerSearch - Gerencia navegação baseada na pesquisa
 * @param {string} queryString - Query string (ex: "name=pizzaria&tag=lenha")
 */
function routerSearch(queryString) {
  const onEstablishmentsPage = window.location.pathname.endsWith('/estabelecimentos.html');

  if (onEstablishmentsPage) {
    // Cenário A: Já está na página de resultados
    // Atualiza a URL visual sem recarregar a página
    const newUrl = queryString 
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.pushState({}, '', newUrl);

    // Executa a busca imediatamente SE a função existir
    if (typeof searchController === 'function') {
      searchController(queryString);
    }
  } else {
    // Cenário B: Está em outra página - redireciona
    const redirectUrl = queryString
      ? `estabelecimentos.html?${queryString}`
      : 'estabelecimentos.html';
    window.location.href = redirectUrl;
  }
}

/**
 * setupSearchListeners - Configura eventos de busca
 */
function setupSearchListeners() {
  // Tenta buscar o elemento
  const form = document.querySelector('[data-js="search-form"]');

  // Verificação de Segurança
  // Só adiciona o evento SE o formulário existir nesta página
  if (form) {
    form.addEventListener('submit', handleSearch);
  }
}

// Inicializa listeners em todas as páginas
document.addEventListener('DOMContentLoaded', setupSearchListeners);
