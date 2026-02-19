// calculator.js — funções de cálculo

function calcValorHora(salario, horas) {
  if (!horas || horas <= 0) return 0;
  return salario / horas;
}

function calcHorasGastas(preco, valorHora) {
  if (!valorHora || valorHora <= 0) return 0;
  return preco / valorHora;
}

function calcInvestimento(preco, anos, taxa) {
  const years = anos !== undefined ? anos : 10;
  const rate = taxa !== undefined ? taxa : 0.10;
  return preco * Math.pow(1 + rate, years);
}

function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatHoras(horas) {
  if (horas < 1) {
    const minutos = Math.round(horas * 60);
    return minutos + 'min';
  }
  const h = Math.floor(horas);
  const m = Math.floor((horas - h) * 60);
  const segundos = Math.round(((horas - h) * 60 - m) * 60);
  if (m === 0 && segundos === 0) return h + 'h';
  if (segundos === 0) return h + 'h ' + m + 'm';
  return h + 'h ' + m + 'm ' + segundos + 's';
}
