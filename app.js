(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const config = window.RDA_CONFIG;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let effects = !reduced.matches, sound = false, elapsed = 0;
  let lastTick = performance.now(), storyElapsed = 0, noticeTimer, glitchTimer, intrusionTimer;
  let playing = false, frame = 0, clipStart = 0;
  let severity = 0, nextPulse = 0, hijacked = false;
  const takeover = $('#takeover');
  const footage = $('#footage-dialog'), realVideo = $('#real-video');
  const hasRealVideo = Boolean(config.video013);
  let clipPulse = -1;
  if (hasRealVideo) { realVideo.src = config.video013; realVideo.hidden = false; $('#camera').hidden = true; $('#demo-label').textContent = 'ARCHIVO ORIGINAL'; }
  const radio = window.RDARadio;
  let revealTimer, idleTimer, watcherTimer, opened = {}, previousTitle = document.title;
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
  const records = {
    '001': { name: 'Lucía Mendoza', image: 0, age: 21, date: '28 de octubre de 1998 / 18:42', place: 'Edificio B, segundo piso', object: 'Una libreta con trece páginas en blanco.', quote: 'Sus pasos subían y bajaban al mismo tiempo.', note: 'Se encontró su mochila dentro de un salón que llevaba nueve años cerrado.' },
    '002': { name: 'Diego Salas', image: 1, age: 22, date: '29 de octubre de 1998 / 19:13', place: 'Pasillo B, cámara 04', object: 'Una cámara sin batería. Seguía encendida.', quote: 'No mires detrás de la cámara.', note: 'El fragmento 002-B se recuperó de una cinta completamente vacía.' },
    '003': { name: 'Inés Vidal', image: 2, age: 20, date: '30 de octubre de 1998 / 03:13', place: 'Acceso al sótano', object: 'Una credencial. La fotografía cambia en cada copia.', quote: 'Su silla estaba vacía. Alguien contestó.', note: 'Su nombre fue borrado del registro. A la mañana siguiente estaba escrito trece veces.' }
  };
  $('#event-date').textContent = config.evento.fecha;
  $('#event-place').textContent = config.evento.lugar;
  $('#event-entry').textContent = config.evento.acceso;
  $('#year').textContent = config.evento.anio;

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
  $('#sound').addEventListener('click', async () => {
    if (hijacked) return;
    const button = $('#sound'); button.disabled = true;
    try {
      await radio.setEnabled(!sound); sound = !sound;
      button.textContent = 'SONIDO: ' + (sound ? 'ON' : 'OFF');
      button.setAttribute('aria-pressed', String(sound));
      realVideo.muted = !sound;
    } catch { sound = false; toast('No se pudo abrir el canal de audio.'); }
    finally { button.disabled = false; }
  });
  $('#volume').addEventListener('input', event => radio.volume(Number(event.target.value) / 100));

  const dialog = $('#case-dialog');
  function openFile(id) {
    if (hijacked) return;
    const record = records[id];
    if (!record) return;
    $('#dialog-code').textContent = `RDA / EXPEDIENTE ${id} / COPIA RECUPERADA`;
    $('#dialog-body').innerHTML = `<div class="dossier"><div class="portrait portrait-${record.image}" role="img" aria-label="Retrato de ${record.name}"></div><div><span class="tiny red">AUSENTE / ${record.date}</span><h2>${record.name.toUpperCase()}</h2><dl><dt>ÚLTIMA UBICACIÓN</dt><dd id="last-location">${fired.has('ubicacion') ? 'AQUÍ.' : record.place}</dd><dt>EVIDENCIA</dt><dd>${record.object}</dd></dl></div></div><blockquote class="testimony">“${record.quote}”</blockquote><div class="dossier-actions"><button class="outline" id="report">LO VI</button></div><p class="tiny muted" style="margin:20px 0 0">COPIA RECUPERADA / INTEGRIDAD NO VERIFICADA</p>`;
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
    stopClip(); startClip(); glitch();
  }
  document.querySelectorAll('[data-secret]').forEach(button => button.addEventListener('click', openRecording));
  $('#close-footage').addEventListener('click', () => footage.close());
  footage.addEventListener('close', () => stopClip());
  // Las caras comparten el sprite de prueba; config.js admite fotos individuales.
  const faces = config.caras;
  const faceFragment = document.createDocumentFragment();
  for (let index = 0; index < 36; index++) {
    const photo = faces[index % faces.length], face = document.createElement('div');
    face.className = 'swarm-face';
    face.style.backgroundImage = 'url(' + JSON.stringify(photo.src) + ')';
    face.style.backgroundPosition = photo.posicion || 'center';
    face.style.backgroundSize = photo.tamano || 'cover';
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
    stopClip(); $('#intrusion').hidden = true; $('#notice').hidden = true;
    clearTimeout(intrusionTimer); clearTimeout(noticeTimer);
    hijacked = true; damage(6); document.body.classList.add('hijacked');
    document.querySelectorAll('.shell, .systembar, .skip').forEach(element => { element.inert = true; });
    clearTimeout(idleTimer); clearTimeout(watcherTimer); $('#watcher').hidden = true;
    radio.damage(6);
    revealTimer = setTimeout(() => {
      $('#event-reveal').hidden = false; takeover.classList.add('revealed');
      sound = false; radio.setEnabled(false).catch(() => {});
    }, 8000);
    $('#signal').textContent = '0%';
    if (!takeover.open) takeover.showModal();
  }
  const actions = {
    primeraFalla() { damage(1); $('#warning-text').textContent = 'ARCHIVO ALTERADO.'; document.body.classList.add('corrupted'); $('#signal').textContent = '71%'; $('#wire-message').textContent = 'respuesta recibida: no deberías tener esta copia.'; },
    segundoVisitante() { damage(2); $('#visitors').textContent = '2 visitantes conectados'; toast('NO ESTÁS SOLO.'); tone(80, .6); $('#signal').textContent = '53%'; $('#wire-message').textContent = 'alguien está leyendo contigo.'; radio.knock(); },
    ubicacion() { damage(3); if ($('#last-location')) $('#last-location').textContent = 'AQUÍ.'; $('#warning-text').textContent = 'TE ENCONTRÓ.'; $('#signal').textContent = '31%'; $('#wire-message').textContent = 'registro 004: reservado.'; $('.case-grid').classList.add('reserved'); },
    interferencia() { damage(4); $('#intrusion').hidden = false; tone(45, 1); intrusionTimer = setTimeout(() => { $('#intrusion').hidden = true; }, 3600); $('#signal').textContent = '13%'; },
    archivo013() { damage(4); $('#secret-status').textContent = 'TE ESTÁ ESPERANDO'; toast('013 ESTÁ ABIERTO.'); $('#warning-text').textContent = 'ADMINISTRADOR DESCONECTADO.'; },
    colapso() { damage(5); $('#warning-text').textContent = 'SAL. AHORA.'; $('#signal').textContent = '1%'; toast('NO QUEDA TIEMPO.'); },
    hackeo: invade
  };
  setInterval(() => {
    const now = performance.now(), delta = (now - lastTick) / 1000; lastTick = now;
    if (document.hidden) return;
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
    if (document.hidden) { document.title = 'NO TE FUISTE SOLO.'; $('#intrusion').hidden = true; $('#watcher').hidden = true; if (playing) stopClip(); }
    else { document.title = previousTitle; if (effects && !hijacked) { $('#wire-message').textContent = 'la puerta se abrió mientras no estabas.'; radio.knock(); activity(); } }
  });
  $('#restart').addEventListener('click', () => {
    if (hijacked) return;
    if (footage.open) footage.close();
    clearTimeout(revealTimer); clearTimeout(idleTimer); clearTimeout(watcherTimer); $('#watcher').hidden = true; $('#event-reveal').hidden = true; takeover.classList.remove('revealed'); $('.case-grid').classList.remove('reserved'); opened = {}; $('#wire-message').textContent = 'esperando respuesta del otro lado_'; radio.damage(0); activity();
    elapsed = 0; storyElapsed = 0; severity = 0; nextPulse = 0; hijacked = false; lastTick = performance.now(); fired.clear();
    document.body.dataset.damage = '0'; document.body.classList.remove('hijacked');
    if (takeover.open) takeover.close();
    clearTimeout(glitchTimer); clearTimeout(intrusionTimer); clearTimeout(noticeTimer);
    $('#visitors').textContent = '1 visitante conectado'; $('#elapsed').textContent = '00:00'; $('#signal').textContent = '86%';
    $('#warning-text').textContent = 'ALGUIEN MODIFICÓ EL ARCHIVO.';
    $('#secret-status').textContent = 'NO LO ABRAS';
    $('#intrusion').hidden = true; $('#notice').hidden = true;
    document.body.classList.remove('glitching', 'corrupted');
    if (dialog.open) dialog.close(); stopClip();
    toast('Sesión restaurada. El archivo vuelve a observar.');
  });

  // Reconstrucción de vigilancia dibujada localmente; no accede a la cámara.
  const canvas = $('#camera'), ctx = canvas.getContext('2d');
  function polygon(points, fill) {
    ctx.fillStyle = fill; ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
  }
  function drawCamera(time = 0) {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#161a16'; ctx.fillRect(0, 0, w, h);
    polygon([[0,0],[w,0],[520,165],[320,165]], '#282e23');
    polygon([[0,0],[320,165],[320,335],[0,h]], '#343b2c');
    polygon([[w,0],[520,165],[520,335],[w,h]], '#252c22');
    polygon([[0,h],[320,335],[520,335],[w,h]], '#30372a');
    ctx.fillStyle = '#1b231b'; ctx.fillRect(320,165,200,170);
    ctx.fillStyle = '#070b09'; ctx.fillRect(380,203,79,132);
    ctx.fillStyle = '#4e5940'; ctx.fillRect(376,198,87,5);
    ctx.strokeStyle = '#727b4a'; ctx.lineWidth = 2;
    for(let i=0;i<4;i++) {
      const x=25+i*76, y=38+i*34;
      polygon([[x,y+30],[x+49,y+54],[x+49,369-i*13],[x,402-i*16]], '#111a14');
      ctx.beginPath(); ctx.moveTo(x,y+30); ctx.lineTo(x+49,y+54); ctx.lineTo(x+49,369-i*13); ctx.stroke();
      const xr=815-i*76;
      polygon([[xr,y+30],[xr-49,y+54],[xr-49,369-i*13],[xr,402-i*16]], '#141c15');
    }
    ctx.strokeStyle='#70765544'; ctx.lineWidth=1;
    for(let i=0;i<6;i++) {const y=335+Math.pow(i/5,2)*145; ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    for(let x=-400;x<1400;x+=160){ctx.beginPath();ctx.moveTo(420,300);ctx.lineTo(x,480);ctx.stroke();}
    for(let i=0;i<3;i++){const y=40+i*47; const wid=105-i*29;ctx.fillStyle='#b5bd8a';ctx.fillRect(420-wid/2,y,wid,6-i);}
    if(time>5.5) {
      const scale=time>9 ? 1.7 : 1, cx=time>9 ? 446 : 420, cy=284;
      ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);
      ctx.fillStyle='#060a07';ctx.beginPath();ctx.ellipse(0,-34,9,12,0,0,Math.PI*2);ctx.fill();
      polygon([[-12,-23],[12,-23],[18,31],[-18,31]],'#070b08');ctx.fillRect(-10,25,7,24);ctx.fillRect(4,25,7,24);ctx.restore();
    }
    const vignette=ctx.createRadialGradient(420,240,50,420,240,480);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#000d');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#bfc9a006'; for(let y=0;y<h;y+=4) ctx.fillRect(0,y,w,1);
    if (effects && playing) {
      ctx.fillStyle='#e2e7b60a';for(let i=0;i<350;i++)ctx.fillRect(Math.random()*w,Math.random()*h,Math.random()*5+1,1);
      if(time>8 && time<8.3){ctx.fillStyle='#87916b44';ctx.fillRect(0,180,w,25);}
    }
  }
  function stopClip(completed = false) {
    playing = false; cancelAnimationFrame(frame); realVideo.pause();
    if (!completed && hasRealVideo) realVideo.currentTime = 0;
    footage.classList.remove('tape-glitch');
    $('#play').textContent = completed ? '↻ VOLVER A REPRODUCIR' : '▶ REPRODUCIR FRAGMENTO';
    $('#cam-status').textContent = completed ? '● FIN DE LA SEÑAL' : '● SEÑAL PAUSADA';
    $('#cam-message').hidden = completed;
    if (!completed) { drawCamera(0); $('#cam-time').textContent = '31/10/1998 — 03:13:00'; $('#tape-caption').textContent = 'Mira la puerta.'; }
  }
  function animate(now) {
    if (!playing) return;
    const time = hasRealVideo ? realVideo.currentTime : (now - clipStart) / 1000;
    if (!hasRealVideo) drawCamera(time);
    const fragment = Math.floor(time);
    if (effects && fragment > 0 && fragment % 3 === 0 && fragment !== clipPulse) {
      clipPulse = fragment; footage.classList.add('tape-glitch'); tone(47, .25);
    } else if (time - fragment > .65) footage.classList.remove('tape-glitch');
    const tapeSeconds = 13 * 60 + Math.floor(time);
    $('#cam-time').textContent = `31/10/1998 — 03:${String(Math.floor(tapeSeconds / 60)).padStart(2,'0')}:${String(tapeSeconds % 60).padStart(2,'0')}`;
    if(time>6)$('#tape-caption').textContent='AHÍ.';
    if(!hasRealVideo && time>=12){stopClip(true);$('#tape-caption').textContent='AHORA ESTÁ MÁS CERCA.';tone(55,.6);return;}
    frame=requestAnimationFrame(animate);
  }
  function startClip() {
    if (hijacked) return;
    if (playing) { stopClip(); return; }
    playing=true;clipPulse=-1;clipStart=performance.now();$('#cam-message').hidden=true;
    if (hasRealVideo) { realVideo.currentTime = 0; realVideo.muted = !sound; realVideo.play().catch(() => { stopClip(); $('#tape-caption').textContent = 'Pulsa reproducir para abrir el video.'; }); }
    $('#play').textContent='■ DETENER FRAGMENTO';$('#cam-status').textContent='● REPRODUCIENDO';
    $('#tape-caption').textContent='Mira la puerta.';tone(100,.2);frame=requestAnimationFrame(animate);
  }
  realVideo.addEventListener('ended', () => { stopClip(true); $('#tape-caption').textContent = 'FIN DEL ARCHIVO.'; });
  realVideo.addEventListener('error', () => { stopClip(); $('#tape-caption').textContent = 'No se pudo abrir el video. Revisa video013 en config.js.'; });
  $('#play').addEventListener('click', startClip);
  drawCamera(); activity();
  document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => {
    document.querySelectorAll('nav a').forEach(item => item.classList.remove('active'));link.classList.add('active');
  }));
  const deepLink = location.hash.match(/^#exp-(001|002|003)$/);
  if (deepLink) openFile(deepLink[1]);
  if (location.hash === '#exp-013') openRecording();
})();

