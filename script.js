const socket = io();
const detencionForm = document.getElementById('detencion-form');
const siipolForm = document.getElementById('siipol-form');
const accidenteForm = document.getElementById('accidente-form');
const involucradoForm = document.getElementById('involucrado-form');
const showDetenciones = document.getElementById('show-detenciones');
const showSiipol = document.getElementById('show-siipol');
const showAccidentes = document.getElementById('show-accidentes');
const detencionesSection = document.getElementById('detenciones');
const siipolSection = document.getElementById('siipol');
const accidentesSection = document.getElementById('accidentes');
const ctxSiipol = document.getElementById('grafico-siipol').getContext('2d');
const ctxAccidentes = document.getElementById('grafico-accidentes').getContext('2d');

const chartSiipol = new Chart(ctxSiipol, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{ label: 'Verificaciones SIIPOL', data: [] }]
    }
});

const chartAccidentes = new Chart(ctxAccidentes, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{ label: 'Accidentes por Tipo', data: [] }]
    }
});

// Alternar secciones
showDetenciones.addEventListener('click', () => {
    detencionesSection.classList.add('active');
    siipolSection.classList.remove('active');
    accidentesSection.classList.remove('active');
});
showSiipol.addEventListener('click', () => {
    siipolSection.classList.add('active');
    detencionesSection.classList.remove('active');
    accidentesSection.classList.remove('active');
});
showAccidentes.addEventListener('click', () => {
    accidentesSection.classList.add('active');
    detencionesSection.classList.remove('active');
    siipolSection.classList.remove('active');
});

// Actualizar resúmenes
socket.on('actualizar', (data) => {
    document.querySelector('#detenciones-hoy span').textContent = data.detenciones;
    document.querySelector('#siipol-hoy span').textContent = data.siipol;
    document.querySelector('#accidentes-hoy span').textContent = data.accidentes;
    document.querySelector('#heridos-hoy span').textContent = data.heridos;
    document.querySelector('#fallecidos-hoy span').textContent = data.fallecidos;
});

// Guardar detención
detencionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(detencionForm);
    const data = Object.fromEntries(formData);
    socket.emit('nueva_detencion', data);
    detencionForm.reset();
});

// Guardar verificación SIIPOL
siipolForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(siipolForm);
    const data = Object.fromEntries(formData);
    socket.emit('nueva_verificacion', data);
    siipolForm.reset();
});

// Guardar accidente
accidenteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(accidenteForm);
    const data = Object.fromEntries(formData);
    socket.emit('nuevo_accidente', data);
    accidenteForm.reset();
});

// Guardar involucrado
involucradoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(involucradoForm);
    const data = Object.fromEntries(formData);
    socket.emit('nuevo_involucrado', data);
    involucradoForm.reset();
});

// Mostrar ID del accidente guardado
socket.on('accidente_guardado', (data) => {
    alert(`Accidente guardado con ID: ${data.id}. Usa este ID para agregar involucrados.`);
});

// Reporte semanal SIIPOL
document.getElementById('reporte-semanal').addEventListener('click', () => {
    socket.emit('reporte_semanal');
});

socket.on('reporte_semanal', (data) => {
    chartSiipol.data.labels = data.map(d => d.nombre);
    chartSiipol.data.datasets[0].data = data.map(d => d.total);
    chartSiipol.update();
});

// Reporte semanal Accidentes
document.getElementById('reporte-accidentes-semanal').addEventListener('click', () => {
    socket.emit('reporte_accidentes_semanal');
});

socket.on('reporte_accidentes_semanal', (data) => {
    chartAccidentes.data.labels = data.map(d => d.tipo_transporte);
    chartAccidentes.data.datasets[0].data = data.map(d => d.total);
    chartAccidentes.update();
});
