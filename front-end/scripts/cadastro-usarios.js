function openTab(tabId, event) {
  const tabContents = document.querySelectorAll('.tab-content');
  const tabButtons = document.querySelectorAll('.tab-button');

  for (const tab of tabContents) {
    tab.classList.remove('active');
  }
  for (const btn of tabButtons) {
    btn.classList.remove('active');
  }

  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  const clickedButton = event?.currentTarget instanceof HTMLElement
    ? event.currentTarget
    : event?.target instanceof HTMLElement
      ? event.target.closest('.tab-button')
      : null;
  if (clickedButton) {
    clickedButton.classList.add('active');
  }

  const menu = document.getElementById('menu');
  if (menu) {
    menu.classList.remove('expanded', 'compact');
    if (tabId === 'tab3') {
      menu.classList.add('compact');
    }
  }

  // Reseta todos os formulários da página
  const forms = document.querySelectorAll('#menu form');
  for (const form of forms) {
    form.reset();
  }

  // Limpa campos extras dinâmicos (telefone/CPF) e reseta para tipo C
  const extraContainer = document.getElementById('extra-user-fields');
  if (extraContainer) {
    extraContainer.innerHTML = '';
  }
  const editExtraContainer = document.getElementById('edit-extra-user-fields');
  if (editExtraContainer) {
    editExtraContainer.innerHTML = '';
  }
  const editTypeField = document.getElementById('edit-type-field');
  if (editTypeField) {
    editTypeField.innerHTML = '';
  }
  const radioCDefault = document.querySelector('input[name="user-type"][value="C"]');
  if (radioCDefault) {
    radioCDefault.checked = true;
  }
}

// ===== Campos dinâmicos para criação de usuário =====
document.addEventListener('DOMContentLoaded', () => {
  const typeRadios = document.querySelectorAll('input[name="user-type"]');
  const extraContainer = document.getElementById('extra-user-fields');
  const menu = document.getElementById('menu');

  const renderExtraFields = (type) => {
    extraContainer.innerHTML = '';
    if (type === 'O') {
      const phoneField = document.createElement('div');
      phoneField.className = 'form-field';
      phoneField.innerHTML = `\n        <label for="user-phone">Número de telefone</label>\n        <input type="text" id="user-phone" placeholder="(11) 91234-5678">\n      `;
      const cpfField = document.createElement('div');
      cpfField.className = 'form-field';
      cpfField.innerHTML = `\n        <label for="user-cpf">CPF</label>\n        <input type="text" id="user-cpf" placeholder="123.456.789-10">\n      `;
      extraContainer.appendChild(phoneField);
      extraContainer.appendChild(cpfField);
      if (menu) menu.classList.add('expanded');
    } else if (menu) {
      menu.classList.remove('expanded');
    }
  };

  const initial = document.querySelector('input[name="user-type"]:checked');
  renderExtraFields(initial ? initial.value : 'C');

  for (const r of typeRadios) {
    r.addEventListener('change', (e) => {
      renderExtraFields(e.target.value);
    });
  }

  // ===== Registrar usuário =====
  const registerButton = document.querySelector('button[name="button-register"]');
  if (registerButton) {
    registerButton.addEventListener('click', (e) => {
      e.preventDefault();
      registerUser();
    });
  }

  const searchButton = document.querySelector('#id-search-field .search-button');
  if (searchButton) {
    searchButton.addEventListener('click', async (e) => {
      e.preventDefault();
      searchButton.disabled = true;
      try {
        await fetchAndPopulateUser();
      } finally {
        searchButton.disabled = false;
      }
    });
  }

  const sendUpdateButton = document.getElementById('send-update-button');
  if (sendUpdateButton) {
    sendUpdateButton.addEventListener('click', async (e) => {
      e.preventDefault();
      sendUpdateButton.disabled = true;
      try {
        await updateUser();
      } finally {
        sendUpdateButton.disabled = false;
      }
    });
  }

  const deleteButton = document.getElementById('exclude-button');
  if (deleteButton) {
    deleteButton.addEventListener('click', async (e) => {
      e.preventDefault();
      deleteButton.disabled = true;
      try {
        await deleteUser();
      } finally {
        deleteButton.disabled = false;
      }
    });
  }
});

async function registerUser() {
  const name = document.getElementById('user-name').value;
  const email = document.getElementById('user-email').value;
  const typeUser = document.querySelector('input[name="user-type"]:checked').value;

  let payload = {
    name: name,
    user_email: email,
    phone_number: null,
    type_user: typeUser,
    cpf: null,
    cnpj_owner: []
  };

  if (typeUser === 'O') {
    const phone = document.getElementById('user-phone')?.value || null;
    const cpf = document.getElementById('user-cpf')?.value || null;
    payload.phone_number = phone;
    payload.cpf = cpf;
  }

  try {
    const response = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    alert('Usuário registrado com sucesso!');
    console.log(result);
  } catch (error) {
    alert('Erro ao registrar usuário: ' + error.message);
    console.error(error);
  }
}

async function fetchAndPopulateUser() {
  const idInput = document.querySelector('#id-search-field input[data-update="id"]');
  const id = idInput ? idInput.value.trim() : '';

  if (!id) {
    alert('Informe um ID para buscar.');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/users/${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    const nameInput = document.querySelector('#tab2 input[data-update="name"]');
    if (nameInput) {
      nameInput.value = data?.name ?? '';
    }

    const emailInput = document.querySelector('#tab2 input[data-update="email"]');
    if (emailInput) {
      emailInput.value = data?.user_email ?? data?.email ?? '';
    }

    renderEditTypeFields(data?.type_user, data);
  } catch (error) {
    alert('Erro ao buscar usuário: ' + error.message);
    console.error(error);
  }
}

function renderEditTypeFields(typeUser, data) {
  const normalizedType = (typeUser || 'C').toString().toUpperCase() === 'O' ? 'O' : 'C';
  const typeField = document.getElementById('edit-type-field');
  const extraContainer = document.getElementById('edit-extra-user-fields');
  const menu = document.getElementById('menu');

  if (!typeField || !extraContainer) {
    return;
  }

  typeField.innerHTML = '';
  extraContainer.innerHTML = '';

  const label = document.createElement('label');
  label.textContent = 'Tipo';
  typeField.appendChild(label);

  const typeGroup = document.createElement('div');
  typeGroup.className = 'user-type-group';

  const optionLabel = document.createElement('label');
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'edit-user-type';
  radio.value = normalizedType;
  radio.checked = true;
  radio.disabled = true;
  optionLabel.appendChild(radio);
  optionLabel.appendChild(document.createTextNode(` ${normalizedType}`));
  typeGroup.appendChild(optionLabel);
  typeField.appendChild(typeGroup);

  if (normalizedType === 'O') {
    if (menu) {
      menu.classList.remove('compact');
      menu.classList.add('expanded');
    }

    const phoneField = document.createElement('div');
    phoneField.className = 'form-field';
    const phoneLabel = document.createElement('label');
    phoneLabel.setAttribute('for', 'edit-user-phone');
    phoneLabel.textContent = 'Número de telefone';
    const phoneInput = document.createElement('input');
    phoneInput.type = 'text';
    phoneInput.id = 'edit-user-phone';
    phoneInput.dataset.update = 'phone_number';
    phoneInput.placeholder = '(11) 91234-5678';
    phoneInput.value = data?.phone_number ?? '';
    phoneField.appendChild(phoneLabel);
    phoneField.appendChild(phoneInput);

    const cpfField = document.createElement('div');
    cpfField.className = 'form-field';
    const cpfLabel = document.createElement('label');
    cpfLabel.setAttribute('for', 'edit-user-cpf');
    cpfLabel.textContent = 'CPF';
    const cpfInput = document.createElement('input');
    cpfInput.type = 'text';
    cpfInput.id = 'edit-user-cpf';
    cpfInput.dataset.update = 'cpf';
    cpfInput.placeholder = '123.456.789-10';
    cpfInput.value = data?.cpf ?? '';
    cpfField.appendChild(cpfLabel);
    cpfField.appendChild(cpfInput);

    extraContainer.appendChild(phoneField);
    extraContainer.appendChild(cpfField);
  } else {
    if (menu) {
      menu.classList.remove('expanded');
      menu.classList.remove('compact');
    }
  }
}

async function updateUser() {
  const idInput = document.querySelector('#id-search-field input[data-update="id"]');
  const id = idInput ? idInput.value.trim() : '';

  if (!id) {
    alert('Informe o ID do usuário antes de enviar a atualização.');
    return;
  }

  const payload = {};

  const nameInput = document.querySelector('#tab2 input[data-update="name"]');
  if (nameInput && nameInput.value.trim()) {
    payload.name = nameInput.value.trim();
  }

  const emailInput = document.querySelector('#tab2 input[data-update="email"]');
  if (emailInput && emailInput.value.trim()) {
    payload.user_email = emailInput.value.trim();
  }

  const phoneInput = document.querySelector('#edit-extra-user-fields input[data-update="phone_number"]');
  if (phoneInput && phoneInput.value.trim()) {
    payload.phone_number = phoneInput.value.trim();
  }

  const cpfInput = document.querySelector('#edit-extra-user-fields input[data-update="cpf"]');
  if (cpfInput && cpfInput.value.trim()) {
    payload.cpf = cpfInput.value.trim();
  }

  if (Object.keys(payload).length === 0) {
    alert('Preencha ao menos um campo antes de enviar a atualização.');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json().catch(() => ({}));
    alert('Usuário atualizado com sucesso!');
    console.log('Usuário atualizado:', data);
  } catch (error) {
    alert('Erro ao atualizar usuário: ' + error.message);
    console.error(error);
  }
}

async function deleteUser() {
  const idInput = document.querySelector('#delete-field input[data-delete="id"]');
  const id = idInput ? idInput.value.trim() : '';

  if (!id) {
    alert('Informe o ID do usuário que deseja excluir.');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/users/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      let detail = '';
      try {
        const data = await response.json();
        detail = data?.message ? `\n${data.message}` : '';
      } catch (err) {
        // corpo vazio ou inválido
      }
      throw new Error(`Erro HTTP: ${response.status}${detail}`);
    }

    alert('Usuário excluído com sucesso!');
    const deleteForm = document.getElementById('delete-user-form');
    if (deleteForm) {
      deleteForm.reset();
    }
  } catch (error) {
    alert('Erro ao excluir usuário: ' + error.message);
    console.error(error);
  }
}
