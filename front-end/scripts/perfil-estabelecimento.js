/**
 * perfil-estabelecimento.js
 * Script responsável pela lógica da página de perfil do estabelecimento.
 * Segue o padrão de separação de responsabilidades: Entrada -> Serviço -> Visualização.
 */

// 1. Objetivo Principal e Acionamento 🎯
document.addEventListener('DOMContentLoaded', initProfilePage);

/**
 * initProfilePage - Maestro da página de perfil
 * Responsável por orquestrar o carregamento e exibição dos dados.
 */
async function initProfilePage() {
  // 2. Camada de Entrada e Dados (Aquisição) 📥
  const establishmentId = getEstablishmentId();

  // Decisão de Fluxo: Se não houver ID, redireciona
  if (!establishmentId) {
    console.warn('ID do estabelecimento não encontrado na URL. Redirecionando para a busca...');
    window.location.href = 'estabelecimentos.html';
    return;
  }

  try {
    // 3. Camada de Serviço (Comunicação com API) 📡
    const establishmentData = await fetchEstablishmentData(establishmentId);

    if (!establishmentData) {
      throw new Error('Dados do estabelecimento não retornados pela API.');
    }

    // 4. Camada de Visualização (Preenchimento da View) 🖼️
    renderProfile(establishmentData);

    // Carrega os comentários do estabelecimento
    loadComments(establishmentId);

    // Inicializa componentes interativos que não dependem diretamente do fetch inicial (ou usam estado local)
    initCommentForm();

  } catch (error) {
    console.error('Erro crítico ao carregar perfil:', error);
    alert('Não foi possível carregar as informações do estabelecimento.');
    // Opcional: window.location.href = 'estabelecimentos.html';
  }
}

/**
 * Extrai o ID do estabelecimento dos parâmetros da URL.
 * @returns {string|null} O ID do estabelecimento ou null se não encontrado.
 */
function getEstablishmentId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

/**
 * Realiza a requisição à API para obter os dados do estabelecimento.
 * @param {string} id - O ID do estabelecimento.
 * @returns {Promise<Object>} O objeto JSON com os dados do estabelecimento.
 */
async function fetchEstablishmentData(id) {
  const endpoint = `http://localhost:3000/estabelecimentos/${id}/public`;
  
  const response = await fetch(endpoint);
  
  if (!response.ok) {
    throw new Error(`Falha na requisição: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Preenche a interface com os dados recebidos.
 * @param {Object} data - Objeto contendo os dados do estabelecimento.
 */
function renderProfile(data) {
  // Mapeamento de campos simples
  setTextContent('estab-name', data.place_name || 'Nome Indisponível');
  setTextContent('hours-open', data.opening_hours || '--:--');
  setTextContent('hours-close', data.closing_hours || '--:--');
  setTextContent('estab-phone', data.phone_number || 'Não informado');

  // Tratamento de Dados Complexos: Categoria
  const categoryTitle = data.category && data.category.title ? data.category.title : 'Sem Categoria';
  setTextContent('estab-category', categoryTitle);

  // Tratamento de Dados Complexos: Endereço (Concatenação)
  const address = `${data.street || ''}, ${data.street_number || ''}`;
  setTextContent('estab-address', address);

  // Configuração do botão de ligar
  if (data.phone_number) {
    const cleanPhone = data.phone_number.replace(/\D/g, '');
    const callBtn = document.getElementById('call-btn');
    if (callBtn) callBtn.href = `tel:${cleanPhone}`;
  }

  // Tratamento de Dados Complexos: Tags (Array)
  renderTags(data.tags);

  // Renderização de Imagens (Galeria)
  // Se a API não retornar imagens, usamos placeholders para manter o layout
  const images = data.images && data.images.length > 0 ? data.images : getDefaultImages();
  initGallery(images);

  // Renderização de Avaliação (Campos opcionais na API, usamos defaults)
  const rating = data.rating || 0;
  const reviews = data.reviews || 0;
  setTextContent('estab-rating', rating);
  setTextContent('estab-reviews', reviews);
  renderStars(rating);
}

/**
 * Helper para definir texto de um elemento com segurança.
 */
function setTextContent(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

/**
 * Renderiza a lista de tags.
 * @param {Array} tags - Lista de tags.
 */
function renderTags(tags) {
  const tagsList = document.getElementById('tags-list');
  if (!tagsList) return;

  tagsList.innerHTML = ''; // Limpa tags anteriores

  if (!tags || tags.length === 0) {
    return;
  }

  tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'tag-pill';
    // Ícone SVG inline para a tag
    span.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tag-icon"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l5 5a2 2 0 0 0 2.828 0l7-7a2 2 0 0 0 0-2.828l-5-5z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
      ${tag}
    `;
    tagsList.appendChild(span);
  });
}

/**
 * Renderiza as estrelas de avaliação.
 * @param {number} rating - Nota de 0 a 5.
 */
function renderStars(rating) {
  const starsContainer = document.getElementById('stars-container');
  if (!starsContainer) return;

  starsContainer.innerHTML = '';

  for (let i = 0; i < 5; i++) {
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("fill", "none");
    star.setAttribute("stroke", "currentColor");
    star.setAttribute("stroke-width", "2");
    star.setAttribute("stroke-linecap", "round");
    star.setAttribute("stroke-linejoin", "round");
    star.classList.add("star-icon");
    
    if (i < Math.floor(rating)) {
      star.classList.add("filled");
      star.innerHTML = '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>';
    } else {
      star.innerHTML = '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>';
    }
    starsContainer.appendChild(star);
  }
}

/**
 * Retorna imagens padrão caso a API não forneça.
 */
function getDefaultImages() {
  return [
    '/images/caf--moderno-minimalista-interior.jpg',
    '/images/caf--minimalista-x-cara-caf-.jpg',
    '/images/caf--minimalista-planta-decora--o.jpg',
    '/images/caf--aconchegante-luz-natural.jpg',
  ];
}

/**
 * Inicializa a galeria de imagens.
 * @param {Array} images - Array de URLs das imagens.
 */
function initGallery(images) {
  let currentIndex = 0;
  const mainImage = document.getElementById('main-image');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const thumbnailsContainer = document.getElementById('thumbnails-container');
  const counter = document.getElementById('image-counter');

  if (!mainImage || !thumbnailsContainer) return;

  // Limpa thumbnails antigos
  thumbnailsContainer.innerHTML = '';

  function updateGallery() {
    // Fallback se a imagem não carregar
    mainImage.onerror = function() {
        this.src = 'https://placehold.co/800x500/9775da/white?text=Imagem+Indisponivel';
    };
    mainImage.src = images[currentIndex];
    
    if (counter) {
        counter.textContent = `${currentIndex + 1} / ${images.length}`;
    }
    
    const thumbs = thumbnailsContainer.querySelectorAll('.thumbnail-btn');
    thumbs.forEach((thumb, index) => {
      if (index === currentIndex) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  // Cria thumbnails
  images.forEach((imgSrc, index) => {
    const btn = document.createElement('button');
    btn.className = 'thumbnail-btn';
    btn.innerHTML = `<img src="${imgSrc}" class="thumbnail-img" alt="Thumbnail ${index + 1}">`;
    btn.addEventListener('click', () => {
      currentIndex = index;
      updateGallery();
    });
    thumbnailsContainer.appendChild(btn);
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex === 0) ? images.length - 1 : currentIndex - 1;
        updateGallery();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex === images.length - 1) ? 0 : currentIndex + 1;
        updateGallery();
    });
  }

  updateGallery();
}

/**
 * Carrega e renderiza os comentários do estabelecimento.
 * @param {string} establishmentId - ID do estabelecimento.
 */
async function loadComments(establishmentId) {
  try {
    const comments = await fetchComments(establishmentId);
    renderCommentsList(comments);
  } catch (error) {
    console.error("Erro ao carregar comentários:", error);
    renderCommentsList([]);
  }
}

/**
 * Busca os comentários na API.
 * @param {string} id - ID do estabelecimento.
 * @returns {Promise<Array>} Lista de comentários.
 */
async function fetchComments(id) {
  const response = await fetch(`http://localhost:3000/estabelecimentos/${id}/comments`);
  if (!response.ok) {
    // Se for 404, pode significar que não tem comentários ou endpoint não existe.
    // Assumimos lista vazia se falhar, mas logamos o erro.
    if (response.status === 404) return [];
    throw new Error('Falha ao buscar comentários');
  }
  return await response.json();
}

/**
 * Renderiza a lista de comentários no DOM.
 * @param {Array} comments - Lista de objetos de comentário.
 */
function renderCommentsList(comments) {
  const container = document.getElementById('comments-list');
  if (!container) return;

  container.innerHTML = ''; // Limpa conteúdo anterior (incluindo estático)

  if (!comments || comments.length === 0) {
    container.innerHTML = '<div class="empty-state">Não há comentários ainda. Seja o primeiro a comentar!</div>';
    return;
  }

  comments.forEach(comment => {
    const card = document.createElement('div');
    card.className = 'review-card';
    
    // Mapeamento seguro dos dados
    const userName = comment.user && comment.user.name ? comment.user.name : 'Usuário Anônimo';
    const content = comment.content || '';

    card.innerHTML = `
      <div class="review-header">
        <h3 class="review-author">${escapeHtml(userName)}</h3>
      </div>
      <p class="review-text">
        ${escapeHtml(content)}
      </p>
    `;
    container.appendChild(card);
  });
}

/**
 * Inicializa o formulário de comentários.
 */
function initCommentForm() {
  const form = document.getElementById('comment-form');
  const submitBtn = document.getElementById('submit-comment-btn');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const userIdInput = document.getElementById('userId');
      const commentInput = document.getElementById('comment');
      
      const userEmail = userIdInput.value.trim();
      const content = commentInput.value.trim();
      const placeId = getEstablishmentId();

      if (!userEmail || !content || !placeId) return;

      // Loading state
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Enviando...</span>';

      try {
        const response = await fetch('http://localhost:3000/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: content,
            user_email: userEmail,
            place_id: placeId
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar comentário');
        }

        // Recarrega a lista de comentários para mostrar o novo
        await loadComments(placeId);

        // Reset form
        userIdInput.value = '';
        commentInput.value = '';
        alert('Comentário enviado com sucesso!');

      } catch (error) {
        console.error('Erro:', error);
        alert('Ocorreu um erro ao enviar seu comentário. Tente novamente.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
