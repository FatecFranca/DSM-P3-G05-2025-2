function openTab(tabId, event) {
  const tabContents = document.querySelectorAll('.tab-content');
  const tabButtons = document.querySelectorAll('.tab-button');

  // Oculta todas as tabs e remove classe "active" dos botões
  tabContents.forEach(tab => tab.classList.remove('active'));
  tabButtons.forEach(btn => btn.classList.remove('active'));

  // Mostra a tab clicada e marca o botão correspondente como ativo
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');
}
