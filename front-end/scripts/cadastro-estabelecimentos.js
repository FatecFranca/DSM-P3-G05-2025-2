function openTab(tabId, event) {
  const tabContents = document.querySelectorAll('.tab-content');
  const tabButtons = document.querySelectorAll('.tab-button');

  // Oculta todas as tabs e remove classe "active" dos botões
  tabContents.forEach(tab => tab.classList.remove('active'));
  tabButtons.forEach(btn => btn.classList.remove('active'));

  // Mostra a tab clicada e marca o botão correspondente como ativo
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');

  // Ajusta o tamanho do container conforme a aba selecionada
  const menu = document.getElementById('menu');
  if (menu) {
    if (tabId === 'tab3') {
      menu.classList.add('compact');
    } else {
      menu.classList.remove('compact');
    }
  }

  // Reseta todos os formulários ao trocar de aba
  const forms = document.querySelectorAll('#menu form');
  forms.forEach(form => form.reset());
}

// ===== Cadastro de estabelecimento (POST /estabelecimentos) =====
async function registerEstabelecimento() {
  const q = (sel) => document.querySelector(sel);
  const getVal = (id) => (q(`#tab1 #${id}`)?.value || '').trim();

  // Converte "tag1, tag2, tag3" -> ["tag1","tag2","tag3"]
  const tagsStr = getVal('input-tags');
  const tags = tagsStr
    ? tagsStr.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const payload = {
    place_name: getVal('input-nome-fantasia'),
    opening_hours: getVal('input-openning-hour'),
    closing_hours: getVal('input-closing-hour'),
    tags,
    street: getVal('input-street'),
    street_number: getVal('input-street-number'),
    phone_number: getVal('input-phone-number'),
    category_title: getVal('input-categoria'),
    razao_social: getVal('input-razao-social'),
    cnpj: getVal('input-cnpj'),
    owner_cpf: getVal('input-owner-cpf').replaceAll(/\D/g, '')
  };

  try {
    const res = await fetch('http://localhost:3000/estabelecimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    console.log('API response:', res.status, data);
    alert(`API: ${res.status} ${res.statusText}\n${JSON.stringify(data, null, 2)}`);
    return data;
  } catch (err) {
    console.error('Erro ao cadastrar estabelecimento:', err);
    alert(`Erro ao cadastrar: ${err?.message || err}`);
    throw err;
  }
}

// ===== Busca e preenchimento para edição (GET /estabelecimentos/:id) =====
async function fetchAndFillEstabelecimento(id) {
  console.log('fetchAndFillEstabelecimento chamada com ID:', id);
  
  if (!id) {
    alert('Por favor, insira um ID para buscar.');
    return;
  }

  try {
    console.log('Fazendo fetch para:', `http://localhost:3000/estabelecimentos/${id}`);
    const res = await fetch(`http://localhost:3000/estabelecimentos/${id}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Erro ${res.status}`);
    }

    console.log('API response (GET):', data);

    // Mapeamento direto de ID do input para campo da API
    const fieldMap = {
      'edit-nome-fantasia': data.place_name,
      'edit-categoria': data.category?.title || data.category_title,
      'edit-openning-hour': data.opening_hours,
      'edit-closing-hour': data.closing_hours,
      'edit-tags': Array.isArray(data.tags) ? data.tags.join(', ') : data.tags,
      'edit-street': data.street,
      'edit-street-number': data.street_number,
      'edit-phone-number': data.phone_number,
      'edit-razao-social': data.infoPrivPlace?.razao_social || data.razao_social,
      'edit-cnpj': data.infoPrivPlace?.cnpj || data.cnpj
    };

    // Preenche os campos
    console.log('Iniciando preenchimento dos campos...');
    let preenchidos = 0;
    for (const [inputId, value] of Object.entries(fieldMap)) {
      const input = document.getElementById(inputId);
      console.log(`Campo ${inputId}:`, { encontrado: !!input, valor: value });
      if (input && value !== undefined && value !== null) {
        const strVal = String(value);
        input.value = strVal;
        input.placeholder = strVal;
        preenchidos++;
        // Re-aplica máscaras
        input.dispatchEvent(new Event('input'));
        input.dispatchEvent(new Event('blur'));
      }
    }
    console.log(`${preenchidos} campos preenchidos com sucesso!`);
    alert(`Estabelecimento carregado! ${preenchidos} campos preenchidos.`);

  } catch (err) {
    console.error('Erro ao buscar estabelecimento:', err);
    alert(`Erro ao buscar: ${err.message || err}`);
  }
}

// ===== Atualização de estabelecimento (PUT /estabelecimentos/:id) =====
async function updateEstabelecimento() {
  const idInput = document.getElementById('input-id-update');
  const id = idInput ? idInput.value.trim() : '';
  if (!id) {
    alert('Informe o ID do estabelecimento antes de editar.');
    return;
  }

  const inputs = document.querySelectorAll('#tab2 .update');
  const keyMap = {
    'nome-fantasia': 'place_name',
    'categoria': 'category_title',
    'openning-hour': 'opening_hours',
    'closing-hour': 'closing_hours',
    'tags': 'tags',
    'street': 'street',
    'street-number': 'street_number',
    'phone-number': 'phone_number',
    'razao-social': 'razao_social',
    'cnpj': 'cnpj'
  };

  const payload = {};
  for (const input of inputs) {
    const inputId = input.id || '';
    const rawKey = inputId.replace(/^edit-/, '');
    if (!rawKey) continue;
    const apiKey = keyMap[rawKey] || rawKey.replace(/-/g, '_');
    const value = input.value.trim();
    if (!value) continue;

    if (apiKey === 'tags') {
      const tags = value
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
      if (tags.length) {
        payload.tags = tags;
      }
      continue;
    }

    payload[apiKey] = value;
  }

  if (Object.keys(payload).length === 0) {
    alert('Preencha ao menos um campo para atualizar.');
    return;
  }

  try {
    const url = `http://localhost:3000/estabelecimentos/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || `Erro ${res.status}`);
    }

    alert('Estabelecimento atualizado com sucesso!');
    console.log('Atualização realizada:', data);
  } catch (err) {
    console.error('Erro ao atualizar estabelecimento:', err);
    alert(`Erro ao atualizar: ${err?.message || err}`);
  }
}

// ===== Exclusão de estabelecimento (DELETE /estabelecimentos/:id) =====
async function deleteEstabelecimento() {
  const idInput = document.getElementById('delete-id');
  const id = idInput ? idInput.value.trim() : '';

  if (!id) {
    alert('Por favor, informe o ID do estabelecimento para excluir.');
    return;
  }

  try {
    const url = `http://localhost:3000/estabelecimentos/${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: 'DELETE' });
    let data = null;
    try { data = await res.json(); } catch (e) { /* resposta sem corpo */ }

    if (res.ok) {
      alert('Estabelecimento excluído com sucesso.');
    } else {
      const detail = data ? `\n${JSON.stringify(data, null, 2)}` : '';
      alert(`Falha ao excluir (${res.status} ${res.statusText}).${detail}`);
    }
  } catch (err) {
    alert(`Erro de rede ao excluir: ${err?.message || err}`);
    console.error('Erro ao excluir estabelecimento:', err);
  }
}

// Garante o estado correto na carga inicial da página
document.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('menu');
  const activeTab = document.querySelector('.tab-content.active');
  if (menu && activeTab) {
    if (activeTab.id === 'tab3') {
      menu.classList.add('compact');
    } else {
      menu.classList.remove('compact');
    }
  }

  // ====== Máscaras de inputs ======
  const on = (el, evts, fn) => {
    if (!el) return;
    for (const evt of evts.split(' ')) {
      el.addEventListener(evt, fn);
    }
  };

  // Helpers de formatação
  const onlyDigits = str => (str || '').replaceAll(/\D/g, '');

  // Hora (HH:MM) com validação básica
  const formatTimeTyping = val => {
    const v = onlyDigits(val).slice(0, 4);
    let h = v.slice(0, 2);
    let m = v.slice(2, 4);
    if (h.length === 2) {
  const hi = Number.parseInt(h, 10);
  if (!Number.isNaN(hi) && hi > 23) h = '23';
    }
    if (m.length === 2) {
  const mi = Number.parseInt(m, 10);
  if (!Number.isNaN(mi) && mi > 59) m = '59';
    }
    return m.length ? `${h}:${m}` : h;
  };

  const formatTimeBlur = val => {
    const v = onlyDigits(val);
    if (!v) return '';
    let h = v.slice(0, 2);
    let m = v.slice(2, 4).padEnd(2, '0');
    h = h.padEnd(2, '0');
  let hi = Number.parseInt(h, 10);
  let mi = Number.parseInt(m, 10);
  if (Number.isNaN(hi)) { hi = 0; }
  if (Number.isNaN(mi)) { mi = 0; }
  if (hi > 23) { hi = 23; }
  if (mi > 59) { mi = 59; }
    return `${String(hi).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
  };

  // Telefone BR: (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX
  const formatPhone = val => {
    const v = onlyDigits(val).slice(0, 11);
    const ddd = v.slice(0, 2);
    const isMobile = v.length > 10; // 11 dígitos
    if (v.length <= 2) return ddd ? `(${ddd}` : '';
    if (isMobile) {
      const p1 = v.slice(2, 7);
      const p2 = v.slice(7, 11);
      if (p2) return `(${ddd}) ${p1}-${p2}`;
      if (p1) return `(${ddd}) ${p1}`;
      return `(${ddd}`;
    }
    const p1 = v.slice(2, 6);
    const p2 = v.slice(6, 10);
    if (p2) return `(${ddd}) ${p1}-${p2}`;
    if (p1) return `(${ddd}) ${p1}`;
    return `(${ddd}`;
  };

  // CPF: 000.000.000-00
  const formatCPF = val => {
    const v = onlyDigits(val).slice(0, 11);
    const p1 = v.slice(0, 3);
    const p2 = v.slice(3, 6);
    const p3 = v.slice(6, 9);
    const p4 = v.slice(9, 11);
    let out = '';
    if (p1) out = p1;
    if (p2) out += `.${p2}`; else return out;
    if (p3) out += `.${p3}`; else return out;
    if (p4) out += `-${p4}`;
    return out;
  };

  // CNPJ: 00.000.000/0000-00
  const formatCNPJ = val => {
    const v = onlyDigits(val).slice(0, 14);
    const p1 = v.slice(0, 2);
    const p2 = v.slice(2, 5);
    const p3 = v.slice(5, 8);
    const p4 = v.slice(8, 12);
    const p5 = v.slice(12, 14);
    let out = '';
    if (p1) out = p1;
    if (p2) out += `.${p2}`; else return out;
    if (p3) out += `.${p3}`; else return out;
    if (p4) out += `/${p4}`; else return out;
    if (p5) out += `-${p5}`;
    return out;
  };

  // Numérico simples
  const numericOnly = val => onlyDigits(val);

  // Liga máscaras para TODOS os campos com mesmo id nas abas (Cadastrar e Editar)
  // Observação: apesar de ids duplicados não serem ideais em HTML, aqui usamos seletor por atributo para
  // encontrar todos (tab1 e tab2).

  // Horários (abertura/fechamento)
  const elsOpen = document.querySelectorAll('#input-openning-hour, #edit-openning-hour');
  for (const el of elsOpen) {
    on(el, 'input', e => { e.target.value = formatTimeTyping(e.target.value); });
    on(el, 'blur', e => { e.target.value = formatTimeBlur(e.target.value); });
    el.setAttribute('maxlength', '5');
    if (el.value) { el.value = formatTimeBlur(el.value); }
  }

  const elsClose = document.querySelectorAll('#input-closing-hour, #edit-closing-hour');
  for (const el of elsClose) {
    on(el, 'input', e => { e.target.value = formatTimeTyping(e.target.value); });
    on(el, 'blur', e => { e.target.value = formatTimeBlur(e.target.value); });
    el.setAttribute('maxlength', '5');
    if (el.value) { el.value = formatTimeBlur(el.value); }
  }

  // Telefone
  const elsPhone = document.querySelectorAll('#input-phone-number, #edit-phone-number');
  for (const el of elsPhone) {
    on(el, 'input', e => { e.target.value = formatPhone(e.target.value); });
    el.setAttribute('maxlength', '16'); // (99) 99999-9999
    if (el.value) { el.value = formatPhone(el.value); }
  }

  // CPF
  const elsCPF = document.querySelectorAll('#input-owner-cpf');
  for (const el of elsCPF) {
    on(el, 'input', e => { e.target.value = formatCPF(e.target.value); });
    el.setAttribute('maxlength', '14'); // 000.000.000-00
    if (el.value) { el.value = formatCPF(el.value); }
  }

  // CNPJ
  const elsCNPJ = document.querySelectorAll('#input-cnpj, #edit-cnpj');
  for (const el of elsCNPJ) {
    on(el, 'input', e => { e.target.value = formatCNPJ(e.target.value); });
    el.setAttribute('maxlength', '18'); // 00.000.000/0000-00
    if (el.value) { el.value = formatCNPJ(el.value); }
  }

  // Número da rua (apenas dígitos)
  const elsStreetNum = document.querySelectorAll('#input-street-number, #edit-street-number');
  for (const el of elsStreetNum) {
    on(el, 'input', e => { e.target.value = numericOnly(e.target.value); });
    el.setAttribute('maxlength', '6');
    if (el.value) { el.value = numericOnly(el.value); }
  }

  // Listener do botão "Cadastrar" (aba 1)
  const btnCreate = document.querySelector('#tab1 #create-button');
  if (btnCreate) {
    btnCreate.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btnCreate.disabled = true;
      try {
        await registerEstabelecimento();
      } finally {
        btnCreate.disabled = false;
      }
    });
  }

  // Listener do botão "buscar" (aba 2)
  const btnSearch = document.getElementById('edit-id-button');
  console.log('Botão buscar encontrado?', btnSearch);
  if (btnSearch) {
    btnSearch.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const idInput = document.getElementById('input-id-update');
      const id = idInput ? idInput.value.trim() : null;
      
      if (!id) {
        alert('Por favor, digite um ID no campo antes de buscar.');
        return;
      }
      
      const originalText = btnSearch.innerText;
      btnSearch.disabled = true;
      btnSearch.innerText = 'Buscando...';
      
      try {
        await fetchAndFillEstabelecimento(id);
      } catch (err) {
        console.error(err);
        alert('Erro ao buscar: ' + (err.message || err));
      } finally {
        btnSearch.disabled = false;
        btnSearch.innerText = originalText;
      }
    });
  } else {
    console.error('Botão edit-id-button não foi encontrado no DOM!');
  }

  // Listener do botão "Editar" (aba 2)
  const btnUpdate = document.getElementById('update-button');
  if (btnUpdate) {
    btnUpdate.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btnUpdate.disabled = true;
      try {
        await updateEstabelecimento();
      } finally {
        btnUpdate.disabled = false;
      }
    });
  }

  // Listener do botão "Excluir" (aba 3)
  const btnDelete = document.getElementById('exclude-button');
  if (btnDelete) {
    btnDelete.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btnDelete.disabled = true;
      try {
        await deleteEstabelecimento();
      } finally {
        btnDelete.disabled = false;
      }
    });
  }
});
