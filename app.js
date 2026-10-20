(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const config = window.RDA_CONFIG;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let effects = !reduced.matches, sound = false, elapsed = 0;
  let lastTick = performance.now(), storyElapsed = 0, noticeTimer, glitchTimer, intrusionTimer;
  let severity = 0, nextPulse = 0, hijacked = false;
  const takeover = $('#takeover');
  const footage = $('#footage-dialog');
  const radio = window.RDARadio;
  const video = $('#archive-video');
  video.src = config.video013; video.muted = false; video.volume = .85;
  let videoEngaged = false, soundWanted = true, soundRequest = 0;
  $('#event-place').textContent = config.evento.lugar;
  $('#event-date').textContent = config.evento.fecha;
  $('#event-message').textContent = config.evento.mensaje;
  let audioStopTimer, idleTimer, watcherTimer, opened = {}, previousTitle = document.title;
  let visits = 1;
  try { visits = Math.min(999, Number(sessionStorage.getItem('rda-visits') || 0) + 1); sessionStorage.setItem('rda-visits', String(visits)); } catch {}
  if (visits > 1) { $('#return-message').textContent = 'VOLVISTE.'; $('.intro').textContent = 'Esta vez no abras la puerta.'; $('#session-id').textContent = 'RECONEXIÓN #' + String(visits).padStart(6, '0'); }
  function activity() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!effects || hijacked || document.hidden || dialog.open || footage.open) return;
      $('#watcher').hidden = false; radio.knock();
      $('#wire-message').textContent = '¿sigues ahí?';
      watcherTimer = setTimeout(() => { $('#watcher').hidden = true; }, 2800);
    }, 8500);
  }
  ['pointerdown', 'keydown', 'scroll'].forEach(name => document.addEventListener(name, activity, { passive: true }));
  const fired = new Set();
  const records = Object.fromEntries(config.expedientes.map(record => [record.id, record]));
  $('#year').textContent = config.anio;
  function paintPhoto(element, photo) {
    element.style.backgroundImage = 'url(' + JSON.stringify(photo.src) + ')';
    element.style.backgroundPosition = photo.posicion;
    element.style.backgroundSize = photo.tamano;
    element.style.setProperty('--photo-ratio', photo.ratio);
  }
  for (const record of config.expedientes) {
    const card = document.createElement('button'); card.className = 'case-card photo-only';
    card.dataset.case = record.id; card.setAttribute('aria-label', 'Abrir expediente ' + record.id);
    const photo = document.createElement('div'); photo.className = 'evidence-photo';
    photo.setAttribute('role', 'img'); photo.setAttribute('aria-label', 'Periódico del expediente ' + record.id);
    paintPhoto(photo, record); card.append(photo); $('.case-grid').append(card);
  }
  paintPhoto($('.watcher-photo'), config.expedientes[3]);

  function toast(message) {
    clearTimeout(noticeTimer);
    $('#notice').textContent = message;
    $('#notice').hidden = false;
    noticeTimer = setTimeout(() => { $('#notice').hidden = true; }, 5500);
  }
  function tone() { radio.crackle(.65); }
  function glitch() {
    if (!effects || document.hidden) return;
    clearTimeout(glitchTimer);
    document.body.classList.remove('glitching');
    void document.body.offsetWidth;
    document.body.classList.add('glitching');
    tone(53, .4); radio.crackle(.7);
    glitchTimer = setTimeout(() => document.body.classList.remove('glitching'), 1200);
  }
  function refreshEffects() {
    document.body.classList.toggle('quiet', !effects);
    document.body.dataset.damage = effects ? String(severity) : '0';
    $('#effects').textContent = `EFECTOS: ${effects ? 'ON' : 'OFF'}`;
    $('#effects').setAttribute('aria-pressed', String(effects));
    if (!effects && !hijacked) {
      document.body.classList.remove('glitching', 'corrupted'); $('#watcher').hidden = true;
      $('#intrusion').hidden = true;
      clearTimeout(glitchTimer); clearTimeout(intrusionTimer);
      if (takeover.open) takeover.close();
      document.body.classList.remove('hijacked');
      hijacked = false;
    }
  }
  $('#effects').addEventListener('click', () => { if (hijacked) return; effects = !effects; refreshEffects(); });
  reduced.addEventListener('change', event => { if (event.matches) { effects = false; refreshEffects(); } });
  refreshEffects();
  async function syncSound() {
    const request = ++soundRequest;
    try {
      await radio.setEnabled(soundWanted && !hijacked);
      if (request !== soundRequest) return;
      sound = soundWanted && !hijacked;
      $('#sound').textContent = 'SONIDO: ' + (sound ? 'ON' : 'OFF');
      $('#sound').setAttribute('aria-pressed', String(sound));
    } catch { if (request === soundRequest) { sound = false; $('#sound').textContent = soundWanted ? 'SONIDO: AUTO' : 'SONIDO: OFF'; } }
  }
  $('#sound').addEventListener('click', () => {
    if (hijacked) return;
    soundWanted = !soundWanted; syncSound();
  });
  function unlockSound(event) {
    if (!hijacked && soundWanted && !sound && !event.target.closest('#sound')) syncSound();
  }
  document.addEventListener('pointerdown', unlockSound);
  document.addEventListener('keydown', unlockSound);
  syncSound();
  $('#volume').addEventListener('input', event => radio.volume(Number(event.target.value) / 100));

  const dialog = $('#case-dialog');
  function openFile(id) {
    if (hijacked) return;
    const record = records[id];
    if (!record) return;
    if (record.soloPeriodico) {
      $('#dialog-code').textContent = 'RDA / PERIÓDICO ' + id;
      $('#dialog-body').innerHTML = '<div class="evidence-photo dossier-photo" role="img" aria-label="Periódico completo"></div>';
      paintPhoto($('.dossier-photo'), record);
      if (!dialog.open) dialog.showModal();
      return;
    }
    $('#dialog-code').textContent = `RDA / EXPEDIENTE ${id} / COPIA RECUPERADA`;
    $('#dialog-body').innerHTML = `<div class="dossier"><div class="evidence-photo dossier-photo" role="img" aria-label="Periódico del expediente ${id}"></div><div><span class="tiny red">ÚLTIMO REGISTRO / ${record.date}</span><h2>EXPEDIENTE ${id}</h2><dl><dt>ÚLTIMA UBICACIÓN</dt><dd id="last-location">${fired.has('ubicacion') ? 'AQUÍ.' : record.place}</dd><dt>VESTIMENTA VISIBLE</dt><dd>${record.clothes}</dd><dt>DETALLES DEL REGISTRO</dt><dd>${record.details}</dd></dl></div></div><blockquote class="testimony">${record.quote}</blockquote><div class="dossier-actions"><button class="outline" id="report">LO VI</button></div>`;
    paintPhoto($('.dossier-photo'), record);
    $('#report').addEventListener('click', event => {
      event.currentTarget.textContent = 'AVISTAMIENTO REGISTRADO';
      event.currentTarget.disabled = true;
      const response = document.createElement('p');
      response.className = 'testimony'; response.setAttribute('role', 'status');
      response.textContent = 'YA LO REPORTASTE. 03:13.';
      event.currentTarget.closest('.dossier-actions').after(response); glitch();
    });
    opened[id] = (opened[id] || 0) + 1;
    if (opened[id] > 1 && effects) { $('.testimony').textContent = '“No decía esto la última vez.”'; radio.knock(); }
    if (!dialog.open) dialog.showModal();
  }
  document.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => openFile(button.dataset.case)));
  $('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  function openRecording() {
    if (hijacked) return;
    if (dialog.open) dialog.close();
    if (!footage.open) footage.showModal();
    playRecording(); glitch();
  }
  document.querySelectorAll('[data-secret]').forEach(button => button.addEventListener('click', openRecording));
  $('#close-footage').addEventListener('click', () => footage.close());
  function setVideoEngaged(value) {
    videoEngaged = value; lastTick = performance.now(); radio.duck(value);
    $('#video-status').textContent = value ? 'REPRODUCIENDO / SESIÓN EN PAUSA' : video.ended ? 'FIN DE LA GRABACIÓN / SESIÓN REANUDADA' : 'SEÑAL PAUSADA / SESIÓN REANUDADA';
  }
  function playRecording() {
    if (hijacked || !footage.open) return;
    if (video.ended) video.currentTime = 0;
    $('#video-start').hidden = true;
    video.play().catch(error => {
      if (error.name === 'AbortError') return;
      setVideoEngaged(false); $('#video-start').hidden = false;
      $('#video-status').textContent = 'PULSA REPRODUCIR PARA ABRIR EL CANAL';
    });
  }
  video.addEventListener('play', () => setVideoEngaged(true));
  video.addEventListener('pause', () => setVideoEngaged(false));
  video.addEventListener('ended', () => setVideoEngaged(false));
  video.addEventListener('error', () => { setVideoEngaged(false); $('#video-status').textContent = 'NO SE PUDO ABRIR LA GRABACIÓN'; });
  $('#video-start').addEventListener('click', playRecording);
  footage.addEventListener('close', () => { video.pause(); setVideoEngaged(false); });
  // Seis periódicos completos alternados entre las 36 fotografías del final.
  const faces = config.expedientes;
  const faceFragment = document.createDocumentFragment();
  for (let index = 0; index < 36; index++) {
    const photo = faces[index % faces.length], face = document.createElement('div');
    face.className = 'swarm-face';
    face.style.backgroundImage = 'url(' + JSON.stringify(photo.src) + ')';
    face.style.backgroundPosition = photo.posicion || 'center';
    face.style.backgroundSize = photo.tamano || 'cover';
    face.style.setProperty('--photo-ratio', photo.ratio);
    const values = {
      '--x': ((index % 6) * 19 - 6 + (index % 3) * 2) + '%',
      '--y': (Math.floor(index / 6) * 21 - 12) + '%',
      '--dx': ((index % 2 ? 1 : -1) * (16 + index % 5 * 5)) + 'vw',
      '--dy': ((index % 3 ? -1 : 1) * (15 + index % 4 * 6)) + 'vh',
      '--rotation': ((index * 17 % 35) - 17) + 'deg',
      '--duration': (8 + index % 9) + 's',
      '--delay': (-index * 1.7) + 's',
      '--face-opacity': String(.3 + index % 4 * .12),
      '--face-scale': String(.7 + index % 5 * .18)
    };
    for (const [key, value] of Object.entries(values)) face.style.setProperty(key, value);
    faceFragment.append(face);
  }
  $('#hack-faces').append(faceFragment);
  function damage(level) {
    severity = level; document.body.dataset.damage = String(level); radio.damage(level); glitch();
  }
  // Final de la experiencia. Recargar o cerrar la pestaña sigue funcionando normalmente.
  takeover.addEventListener('cancel', event => event.preventDefault());
  function invade() {
    if (hijacked) return;
    if (footage.open) footage.close();
    if (dialog.open) dialog.close();
    $('#intrusion').hidden = true; $('#notice').hidden = true;
    clearTimeout(intrusionTimer); clearTimeout(noticeTimer);
    hijacked = true; damage(6); document.body.classList.add('hijacked');
    document.querySelectorAll('.shell, .systembar, .skip').forEach(element => { element.inert = true; });
    clearTimeout(idleTimer); clearTimeout(watcherTimer); $('#watcher').hidden = true;
    radio.damage(6);
    audioStopTimer = setTimeout(() => {
      $('#event-reveal').hidden = false; takeover.classList.add('revealed');
      soundWanted = false; ++soundRequest; sound = false; radio.setEnabled(false).catch(() => {});
    }, 8000);
    $('#signal').textContent = '0%';
    if (!takeover.open) takeover.showModal();
  }
  const actions = {
    primeraFalla() { damage(1); $('#warning-text').textContent = 'ARCHIVO ALTERADO.'; document.body.classList.add('corrupted'); $('#signal').textContent = '71%'; $('#wire-message').textContent = 'respuesta recibida: no deberías tener esta copia.'; },
    segundoVisitante() { damage(2); $('#visitors').textContent = '2 visitantes conectados'; toast('NO ESTÁS SOLO.'); tone(80, .6); $('#signal').textContent = '53%'; $('#wire-message').textContent = 'alguien está leyendo contigo.'; radio.knock(); },
    ubicacion() { damage(3); if ($('#last-location')) $('#last-location').textContent = 'AQUÍ.'; $('#warning-text').textContent = 'TE ENCONTRÓ.'; $('#signal').textContent = '31%'; $('#wire-message').textContent = 'registro 007: reservado.'; $('.case-grid').classList.add('reserved'); },
    interferencia() { damage(4); $('#intrusion').hidden = false; tone(45, 1); intrusionTimer = setTimeout(() => { $('#intrusion').hidden = true; }, 3600); $('#signal').textContent = '13%'; },
    archivo013() { damage(4); $('#secret-status').textContent = 'TE ESTÁ ESPERANDO'; toast('013 ESTÁ ABIERTO.'); $('#warning-text').textContent = 'ADMINISTRADOR DESCONECTADO.'; },
    colapso() { damage(5); $('#warning-text').textContent = 'SAL. AHORA.'; $('#signal').textContent = '1%'; toast('NO QUEDA TIEMPO.'); },
    hackeo: invade
  };
  setInterval(() => {
    const now = performance.now(), delta = (now - lastTick) / 1000; lastTick = now;
    if (document.hidden || videoEngaged) return;
    elapsed += Math.min(delta, 2);
    const seconds = Math.floor(elapsed);
    $('#elapsed').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    if (!effects) return;
    storyElapsed += Math.min(delta, 2);
    if (severity > 0 && storyElapsed >= nextPulse) { glitch(); nextPulse = storyElapsed + Math.max(2.5, 12 - severity * 2); }
    if (severity === 6 && !hijacked) invade();
    for (const [name, threshold] of Object.entries(config.tiempos)) {
      if (storyElapsed >= threshold && !fired.has(name)) { fired.add(name); actions[name](); }
    }
  }, 250);
  document.addEventListener('visibilitychange', () => {
    lastTick = performance.now();
    if (document.hidden) { video.pause(); document.title = 'NO TE FUISTE SOLO.'; $('#intrusion').hidden = true; $('#watcher').hidden = true; }
    else { document.title = previousTitle; if (effects && !hijacked) { $('#wire-message').textContent = 'la puerta se abrió mientras no estabas.'; radio.knock(); activity(); } }
  });
  $('#restart').addEventListener('click', () => {
    if (hijacked) return;
    if (footage.open) footage.close();
    $('#event-reveal').hidden = true; takeover.classList.remove('revealed');
    clearTimeout(audioStopTimer); clearTimeout(idleTimer); clearTimeout(watcherTimer); $('#watcher').hidden = true; $('.case-grid').classList.remove('reserved'); opened = {}; $('#wire-message').textContent = 'esperando respuesta del otro lado_'; radio.damage(0); activity();
    elapsed = 0; storyElapsed = 0; severity = 0; nextPulse = 0; hijacked = false; lastTick = performance.now(); fired.clear();
    document.body.dataset.damage = '0'; document.body.classList.remove('hijacked');
    if (takeover.open) takeover.close();
    clearTimeout(glitchTimer); clearTimeout(intrusionTimer); clearTimeout(noticeTimer);
    $('#visitors').textContent = '1 visitante conectado'; $('#elapsed').textContent = '00:00'; $('#signal').textContent = '86%';
    $('#warning-text').textContent = 'ALGUIEN MODIFICÓ EL ARCHIVO.';
    $('#secret-status').textContent = 'NO LO ABRAS';
    $('#intrusion').hidden = true; $('#notice').hidden = true;
    document.body.classList.remove('glitching', 'corrupted');
    if (dialog.open) dialog.close();
    toast('Sesión restaurada. El archivo vuelve a observar.');
  });

  activity();
  document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => {
    document.querySelectorAll('nav a').forEach(item => item.classList.remove('active'));link.classList.add('active');
  }));
  const deepLink = location.hash.match(/^#exp-(00[1-6])$/);
  if (deepLink) openFile(deepLink[1]);
  if (location.hash === '#exp-013') openRecording();
})();

