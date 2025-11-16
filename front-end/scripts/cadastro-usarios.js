function openTab(tabId, event) {
  const tabContents = document.querySelectorAll('.tab-content');
  const tabButtons = document.querySelectorAll('.tab-button');

  // Oculta todas as tabs e remove classe "active" dos botões
  tabContents.forEach(tab => tab.classList.remove('active'));
  tabButtons.forEach(btn => btn.classList.remove('active'));

  // Mostra a tab clicada e marca o botão correspondente como ativo
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');

  // Remove classe expanded ao trocar de aba (reseta tamanho)
  const menu = document.getElementById('menu');
  if (menu) {
    menu.classList.remove('expanded');
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
