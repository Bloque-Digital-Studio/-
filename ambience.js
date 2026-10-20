// Radio local sintetizada. No descarga audio ni usa el micrófono.
window.RDARadio = (() => {
  let context, master, analyser, noise, hiss, drone, pulse, timer, meterTimer;
  let active = false, level = .28, intensity = 0, ducked = false, enableRequest = 0;
  function setup() {
    context = new (window.AudioContext || window.webkitAudioContext)();
    master = context.createGain(); master.gain.value = 0;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18; compressor.ratio.value = 8;
    analyser = context.createAnalyser(); analyser.fftSize = 256;
    master.connect(compressor); compressor.connect(analyser); analyser.connect(context.destination);
    const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true;
    const band = context.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 1450; band.Q.value = .6;
    hiss = context.createGain(); hiss.gain.value = .48;
    noise.connect(band); band.connect(hiss); hiss.connect(master); noise.start();
    drone = context.createOscillator(); drone.type = 'triangle'; drone.frequency.value = 86;
    const hum = context.createGain(); hum.gain.value = .14;
    drone.connect(hum); hum.connect(master); drone.start();
    pulse = context.createOscillator(); pulse.frequency.value = .17;
    const modulation = context.createGain(); modulation.gain.value = .12;
    pulse.connect(modulation); modulation.connect(hiss.gain); pulse.start();
    const values = new Uint8Array(analyser.fftSize);
    meterTimer = setInterval(() => {
      analyser.getByteTimeDomainData(values);
      const rms = Math.sqrt(values.reduce((sum, x) => sum + ((x - 128) / 128) ** 2, 0) / values.length);
      document.querySelector('#audio-level').value = active && !document.hidden ? Math.min(1, rms * 15) : 0;
    }, 120);
  }
  function crackle(strength = 1) {
    if (!active || context.state !== 'running' || document.hidden) return;
    const source = context.createBufferSource(); source.buffer = noise.buffer;
    const filter = context.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 450;
    const gain = context.createGain(), t = context.currentTime;
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.5 * strength, t + .035);
    gain.gain.exponentialRampToValueAtTime(.001, t + .65);
    source.connect(filter); filter.connect(gain); gain.connect(master);
    source.start(t, Math.random()); source.stop(t + .7);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  function knock() {
    if (!active || document.hidden) return;
    const t = context.currentTime;
    for (let i = 0; i < 3; i++) {
      const oscillator = context.createOscillator(), envelope = context.createGain(), pan = context.createStereoPanner();
      oscillator.type = 'sine'; oscillator.frequency.value = 170 - i * 22; pan.pan.value = i % 2 ? .7 : -.7;
      envelope.gain.setValueAtTime(0, t + i * .43);
      envelope.gain.linearRampToValueAtTime(.42, t + i * .43 + .006);
      envelope.gain.exponentialRampToValueAtTime(.001, t + i * .43 + .18);
      oscillator.connect(envelope); envelope.connect(pan); pan.connect(master);
      oscillator.start(t + i * .43); oscillator.stop(t + i * .43 + .2);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); pan.disconnect(); };
    }
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => { crackle(.7 + intensity * .1); if (Math.random() > .6) knock(); schedule(); }, 3200 + Math.random() * 4000);
  }
  async function setEnabled(value) {
    const request = ++enableRequest;
    if (value) {
      if (!context) setup();
      await context.resume();
      if (request !== enableRequest) return;
      active = true;
      master.gain.cancelScheduledValues(context.currentTime); master.gain.setTargetAtTime(level * (ducked ? .08 : 1), context.currentTime, .12);
      crackle(); schedule();
    } else {
      active = false; clearTimeout(timer);
      if (context) { master.gain.cancelScheduledValues(context.currentTime); master.gain.value = 0; await context.suspend(); }
      document.querySelector('#audio-level').value = 0;
    }
  }
  function volume(value) { level = value; if (active) master.gain.setTargetAtTime(level * (ducked ? .08 : 1), context.currentTime, .1); }
  function duck(value) { ducked = value; volume(level); }
  function damage(value) { intensity = value; if (hiss) hiss.gain.setTargetAtTime(.48 + value * .035, context.currentTime, .5); crackle(); }
  document.addEventListener('visibilitychange', () => {
    if (!context || !active) return;
    if (document.hidden) context.suspend(); else context.resume().catch(() => {});
  });
  return { setEnabled, volume, damage, crackle, knock, duck };
})();
