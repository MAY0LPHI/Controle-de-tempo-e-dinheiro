// storage.js — funções de leitura/escrita no LocalStorage

const KEYS = {
  PERFIL: 'quantocusta_perfil',
  ECONOMIAS: 'quantocusta_economias',
  QUARENTENA: 'quantocusta_quarentena',
  ENVELOPES: 'quantocusta_envelopes',
};

function storageGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore storage errors
  }
}

// Perfil
function getPerfil() {
  return storageGet(KEYS.PERFIL);
}

function savePerfil(salario, horas) {
  const valorHora = salario / horas;
  const perfil = { salario, horas, valorHora };
  storageSet(KEYS.PERFIL, perfil);
  return perfil;
}

// Economias
function getEconomias() {
  return storageGet(KEYS.ECONOMIAS) || { total: 0, historico: [] };
}

function addEconomia(valor) {
  const economias = getEconomias();
  economias.total += valor;
  economias.historico.push({ valor, data: new Date().toISOString() });
  storageSet(KEYS.ECONOMIAS, economias);
  return economias;
}

function addGasto(valor) {
  // registra gasto sem somar às economias
  return { valor, data: new Date().toISOString() };
}

// Quarentena
function getQuarentena() {
  return storageGet(KEYS.QUARENTENA) || [];
}

function addQuarentena(item) {
  const lista = getQuarentena();
  const novo = {
    id: Date.now().toString(),
    nome: item.nome,
    categoria: item.categoria,
    valor: item.valor,
    lembrete_timestamp: item.lembrete_timestamp,
  };
  lista.push(novo);
  storageSet(KEYS.QUARENTENA, lista);
  return novo;
}

function removeQuarentena(id) {
  const lista = getQuarentena().filter((i) => i.id !== id);
  storageSet(KEYS.QUARENTENA, lista);
  return lista;
}

function getLembretesVencidos() {
  const agora = Date.now();
  return getQuarentena().filter((i) => i.lembrete_timestamp <= agora);
}

// Envelopes
function getEnvelopes() {
  return storageGet(KEYS.ENVELOPES) || [];
}

function saveEnvelopes(marcados) {
  storageSet(KEYS.ENVELOPES, marcados);
}
