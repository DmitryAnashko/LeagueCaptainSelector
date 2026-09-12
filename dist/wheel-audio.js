// Small, locally synthesized sound palette. No external audio downloads.
(() => {
  const STORAGE_KEY = 'captains-rift.sound-muted.v1';
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const curve = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;

  // Invert the wheel's cubic-bezier(.16,.68,.15,1) to find the precise
  // moment each slice boundary passes the pointer during deceleration.
  function timeAtProgress(progress) {
    let low = 0, high = 1;
    for (let i = 0; i < 24; i++) {
      const t = (low + high) / 2;
      if (curve(t, .68, 1) < progress) low = t;
      else high = t;
    }
    return curve((low + high) / 2, .16, .15);
  }

  window.createWheelAudio = () => {
    let context, master, reverb, noise;
    let muted = false;
    let generation = 0;
    const sources = new Set();
    try { muted = localStorage.getItem(STORAGE_KEY) === 'true'; } catch {}

    function track(source, nodes) {
      sources.add(source);
      source.onended = () => {
        sources.delete(source);
        source.disconnect();
        nodes.forEach(node => node.disconnect());
      };
    }

    function stopSources() {
      sources.forEach(source => { try { source.stop(); } catch {} });
      sources.clear();
    }

    async function unlock() {
      if (!AudioContextClass || muted) return false;
      try {
        if (!context || context.state === 'closed') {
          context = new AudioContextClass();
          master = context.createGain();
          master.gain.value = .65;
          master.connect(context.destination);
          reverb = context.createConvolver();
          const wet = context.createGain();
          wet.gain.value = .12;
          reverb.connect(wet).connect(master);
          const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * .75), context.sampleRate);
          let seed = 731;
          const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
          for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            let smooth = 0;
            for (let i = 0; i < data.length; i++) {
              smooth = smooth * .65 + random() * .35;
              data[i] = smooth * (1 - i / data.length) ** 3;
            }
          }
          reverb.buffer = impulse;
          noise = context.createBuffer(1, Math.ceil(context.sampleRate * .3), context.sampleRate);
          const data = noise.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = random();
        }
        if (context.state !== 'running') await context.resume();
        return context.state === 'running' && !muted;
      } catch { return false; }
    }

    function tone(frequency, at, duration, volume, airy = true) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, at);
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(volume, at + .008);
      envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
      oscillator.connect(envelope).connect(master);
      if (airy) envelope.connect(reverb);
      track(oscillator, [envelope]);
      oscillator.start(at);
      oscillator.stop(at + duration + .02);
    }

    function breath(at, duration, volume, frequency) {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const envelope = context.createGain();
      source.buffer = noise;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(frequency, at);
      filter.Q.value = .7;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(volume, at + Math.min(.025, duration / 4));
      envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
      source.connect(filter).connect(envelope).connect(master);
      track(source, [filter, envelope]);
      source.start(at);
      source.stop(at + duration + .005);
    }

    async function start({ from, to, sliceCount, duration, reducedMotion }) {
      const ticket = ++generation;
      const began = performance.now();
      stopSources();
      if (!(await unlock()) || ticket !== generation) return;
      const now = context.currentTime;
      if (reducedMotion) return;
      tone(293.665, now, .65, .075);
      tone(440, now + .08, .65, .035);
      tone(587.33, now + .16, .7, .025);
      breath(now, .25, .035, 1100);
      const origin = now - (performance.now() - began) / 1000;
      const step = 360 / sliceCount;
      let previousTick = -Infinity;
      for (let boundary = (Math.floor(from / step) + 1) * step; boundary < to; boundary += step) {
        const progress = (boundary - from) / (to - from);
        const at = origin + timeAtProgress(progress) * duration / 1000;
        // Avoid piled-up clicks when starting late or spinning at maximum speed.
        if (at < now + .01 || at - previousTick < .04) continue;
        previousTick = at;
        breath(at, .018, .095, 2100);
        tone(920, at, .035, .035, false);
      }
    }

    function finish() {
      ++generation;
      stopSources();
      if (muted || !context || context.state !== 'running' || document.hidden) return;
      const now = context.currentTime + .01;
      // A short D-major resolution with a quiet upper harmonic and soft room tail.
      [587.33, 739.99, 880].forEach((frequency, i) => {
        tone(frequency, now + i * .085, 1.15, .085 - i * .014);
        tone(frequency * 2, now + i * .085, .75, .012);
      });
      tone(293.665, now, .8, .045);
    }

    function toggle() {
      muted = !muted;
      try { localStorage.setItem(STORAGE_KEY, String(muted)); } catch {}
      if (context) {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(muted ? 0 : .65, context.currentTime, .015);
      }
      if (!muted) void unlock();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { ++generation; stopSources(); }
    });
    window.addEventListener('pagehide', () => {
      ++generation;
      stopSources();
      if (context) void context.close();
    });
    return { start, finish, toggle, get muted() { return muted; }, available: Boolean(AudioContextClass) };
  };
})();
