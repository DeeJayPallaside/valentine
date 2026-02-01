(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- DOM refs ---
  const card = document.querySelector('.card');
  const headline = document.getElementById('headline');
  const btnYes = document.getElementById('btnYes');
  const btnNo = document.getElementById('btnNo');
  const btnAgain = document.getElementById('btnAgain');
  const successArea = document.getElementById('successArea');
  const successMessage = document.getElementById('successMessage');
  const successGif = document.getElementById('successGif');
  const gifFallback = document.getElementById('gifFallback');
  const confettiContainer = document.getElementById('confettiContainer');
  const easterTooltip = document.getElementById('easterTooltip');
  const particleLayer = document.querySelector('.particle-layer');
  const wizardSvg = document.querySelector('.wizard-svg');
  const soundToggle = document.querySelector('.sound-toggle');
  const buttonsRow = document.querySelector('.buttons-row');

  // --- State ---
  let yesClicked = false;
  let noHoverCount = 0;
  let audioEnabled = true;
  let audioUnlocked = false;
  let wandSparkleInterval = null;
  let bgMusic = null;

  // --- Sound (WebAudio, no assets) ---
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    if (AudioCtxClass && !audioCtx) audioCtx = new AudioCtxClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playMagicSound() {
    if (!audioEnabled || !audioUnlocked || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);

      const noise = audioCtx.createBufferSource();
      const buf = audioCtx.createBuffer(1, 4410, 44100);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.03;
      noise.buffer = buf;
      const nGain = audioCtx.createGain();
      noise.connect(nGain);
      nGain.connect(audioCtx.destination);
      nGain.gain.setValueAtTime(0.04, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      noise.start(now);
      noise.stop(now + 0.08);
    } catch (_) {}
  }

  function playSuccessSound() {
    if (!audioEnabled || !audioUnlocked || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.3);
      });
      const heartNoise = audioCtx.createOscillator();
      const hGain = audioCtx.createGain();
      heartNoise.connect(hGain);
      hGain.connect(audioCtx.destination);
      heartNoise.frequency.setValueAtTime(200, now);
      heartNoise.type = 'sine';
      hGain.gain.setValueAtTime(0.03, now);
      hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      heartNoise.start(now);
      heartNoise.stop(now + 0.6);
    } catch (_) {}
  }

  btnYes.addEventListener('click', unlockAudio);
  btnNo.addEventListener('mouseenter', unlockAudio);
  card.addEventListener('click', unlockAudio);

  // --- Wand sparkle particles (magic dust) ---
  function spawnWandParticle() {
    const tip = wizardSvg.querySelector('.wand-tip');
    if (!tip) return;
    const svgRect = wizardSvg.getBoundingClientRect();
    const layerRect = particleLayer.getBoundingClientRect();
    const tipX = svgRect.left + (115 / 120) * svgRect.width - layerRect.left;
    const tipY = svgRect.top + (45 / 180) * svgRect.height - layerRect.top;

    const p = document.createElement('span');
    p.className = 'sparkle';
    p.style.cssText = `
      position: absolute; left: ${tipX}px; top: ${tipY}px;
      width: 6px; height: 6px; border-radius: 50%;
      background: radial-gradient(circle, #FDE68A 0%, #F59E0B 50%, transparent 70%);
      pointer-events: none; animation: sparkleFly 1.2s ease-out forwards;
    `;
    const angle = Math.random() * 0.8 - 0.4;
    const dist = 30 + Math.random() * 40;
    const dx = Math.sin(angle) * dist;
    const dy = -Math.cos(angle) * dist - 20;
    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--dy', dy + 'px');

    particleLayer.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes sparkleFly {
      0% { opacity: 1; transform: translate(0,0) scale(1); }
      100% { opacity: 0; transform: translate(var(--dx,0), var(--dy,0)) scale(0.3); }
    }
    @media (prefers-reduced-motion: reduce) { .sparkle { animation: none; opacity: 0; } }
  `;
  document.head.appendChild(style);

  function startWandSparkles() {
    if (wandSparkleInterval || prefersReducedMotion) return;
    wandSparkleInterval = setInterval(() => {
      spawnWandParticle();
      if (audioEnabled && audioUnlocked && Math.random() < 0.25) playMagicSound();
    }, 800);
  }
  function stopWandSparkles() {
    if (wandSparkleInterval) {
      clearInterval(wandSparkleInterval);
      wandSparkleInterval = null;
    }
  }

  setTimeout(startWandSparkles, 500);

  // --- "Nie" escape logic ---
  let noButtonLayoutPos = null;

  function getRects() {
    const cardR = card.getBoundingClientRect();
    const yesR = btnYes.getBoundingClientRect();
    const noR = btnNo.getBoundingClientRect();
    const rowR = buttonsRow.getBoundingClientRect();
    if (!noButtonLayoutPos) noButtonLayoutPos = { left: noR.left, top: noR.top };
    return { cardR, yesR, noR, rowR };
  }

  function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function rectsOverlap(a, b, pad) {
    const p = pad || 8;
    return !(a.right + p < b.left - p || a.left - p > b.right + p ||
             a.bottom + p < b.top - p || a.top - p > b.bottom + p);
  }

  function findBestEscapePosition(cursorX, cursorY) {
    const { cardR, yesR, noR } = getRects();
    const noW = noR.width;
    const noH = noR.height;
    const pad = 16;
    const candidates = [];
    const stepX = (cardR.width - noW - pad * 2) / 6;
    const stepY = (cardR.height - noH - pad * 2) / 4;
    for (let i = 0; i <= 6; i++) {
      for (let j = 0; j <= 4; j++) {
        const l = cardR.left + pad + i * stepX;
        const t = cardR.top + pad + j * stepY;
        if (l + noW > cardR.right - pad || t + noH > cardR.bottom - pad) continue;
        const noRect = { left: l, top: t, right: l + noW, bottom: t + noH };
        if (rectsOverlap(noRect, yesR, 24)) continue;
        const dist = distance(cursorX, cursorY, l + noW / 2, t + noH / 2);
        candidates.push({ left: l, top: t, dist });
      }
    }
    candidates.sort((a, b) => b.dist - a.dist);
    return candidates[0] || { left: noR.left, top: noR.top };
  }

  function moveNoButton(x, y) {
    if (yesClicked) return;
    getRects();
    const pos = findBestEscapePosition(x, y);
    const relX = pos.left - noButtonLayoutPos.left;
    const relY = pos.top - noButtonLayoutPos.top;

    if (prefersReducedMotion) {
      btnNo.style.transform = `translate(${relX}px, ${relY}px)`;
      return;
    }
    btnNo.classList.add('shake');
    setTimeout(() => {
      btnNo.classList.remove('shake');
      btnNo.style.transform = `translate(${relX}px, ${relY}px)`;
    }, 80);
  }

  let lastNoSoundTime = 0;
  function handleNoHover(e) {
    if (yesClicked) return;
    unlockAudio();
    const now = Date.now();
    if (audioEnabled && audioUnlocked && now - lastNoSoundTime > 350) {
      lastNoSoundTime = now;
      playMagicSound();
    }
    noHoverCount++;
    if (noHoverCount >= 5 && !easterTooltip.classList.contains('visible')) {
      easterTooltip.hidden = false;
      easterTooltip.classList.add('visible');
      setTimeout(() => {
        easterTooltip.classList.remove('visible');
        setTimeout(() => {
          easterTooltip.style.fontSize = '0.75rem';
          easterTooltip.style.padding = '0.25rem 0.5rem';
          easterTooltip.classList.add('visible');
        }, 200);
      }, 2500);
    }
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    moveNoButton(x, y);
  }

  function isCursorNearNo(x, y) {
    const r = btnNo.getBoundingClientRect();
    const pad = 60;
    return x >= r.left - pad && x <= r.right + pad &&
           y >= r.top - pad && y <= r.bottom + pad;
  }

  let lastMoveTime = 0;
  card.addEventListener('mousemove', function (e) {
    if (yesClicked) return;
    const now = Date.now();
    if (now - lastMoveTime < 80) return;
    if (isCursorNearNo(e.clientX, e.clientY)) {
      lastMoveTime = now;
      handleNoHover(e);
    }
  });

  btnNo.addEventListener('mouseenter', handleNoHover);
  btnNo.addEventListener('touchstart', function (e) {
    e.preventDefault();
    if (e.touches.length) handleNoHover(e);
  }, { passive: false });
  document.addEventListener('touchmove', function (e) {
    if (yesClicked) return;
    const touch = Array.from(e.touches).find(t => {
      const r = btnNo.getBoundingClientRect();
      return t.clientX >= r.left - 30 && t.clientX <= r.right + 30 &&
             t.clientY >= r.top - 30 && t.clientY <= r.bottom + 30;
    });
    if (touch) handleNoHover({ clientX: touch.clientX, clientY: touch.clientY });
  }, { passive: true });

  // --- Confetti / hearts ---
  function runConfetti() {
    if (prefersReducedMotion) return;
    const symbols = ['♥', '♦', '💖', '✨', '❀'];
    const colors = ['#EC4899', '#F472B6', '#8B5CF6', '#C4B5FD', '#FDE68A'];
    for (let i = 0; i < 50; i++) {
      const el = document.createElement('span');
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      el.style.cssText = `
        position: fixed; left: ${Math.random() * 100}vw; bottom: -20px;
        font-size: ${14 + Math.random() * 16}px; color: ${colors[Math.floor(Math.random() * colors.length)]};
        pointer-events: none; z-index: 100;
        animation: confettiUp ${2 + Math.random() * 2}s ease-out forwards;
        animation-delay: ${Math.random() * 0.5}s;
      `;
      el.style.setProperty('--twist', (Math.random() * 360 - 180) + 'deg');
      confettiContainer.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }
  }

  const confStyle = document.createElement('style');
  confStyle.textContent = `
    @keyframes confettiUp {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(-100vh) rotate(var(--twist, 0deg)); opacity: 0; }
    }
  `;
  document.head.appendChild(confStyle);

  // --- GIF fallback ---
  successGif.addEventListener('error', function () {
    successGif.style.display = 'none';
    gifFallback.hidden = false;
  });

  function playBackgroundMusic() {
    if (!audioEnabled) return;
    unlockAudio();
    try {
      var src = './audio/background.mp3';
      bgMusic = new Audio(src);
      bgMusic.loop = true;
      bgMusic.volume = 0.5;
      bgMusic.addEventListener('canplaythrough', function () { bgMusic.play().catch(function () {}); }, { once: true });
      bgMusic.play().catch(function () {});
    } catch (_) {}
  }

  function stopBackgroundMusic() {
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
      bgMusic = null;
    }
  }

  soundToggle.addEventListener('click', function () {
    audioEnabled = !audioEnabled;
    soundToggle.textContent = audioEnabled ? '🔊' : '🔇';
    soundToggle.setAttribute('aria-label', audioEnabled ? 'Wyłącz dźwięk' : 'Włącz dźwięk');
    if (!audioEnabled) stopBackgroundMusic();
    else if (yesClicked && bgMusic) bgMusic.play().catch(function () {});
  });

  // --- "Tak" click ---
  btnYes.addEventListener('click', function () {
    unlockAudio();
    if (yesClicked) {
      stopBackgroundMusic();
      document.location.reload();
      return;
    }
    yesClicked = true;
    stopWandSparkles();
    easterTooltip.classList.remove('visible');
    easterTooltip.hidden = true;
    if (audioEnabled) {
      playMagicSound();
      playSuccessSound();
      playBackgroundMusic();
    }

    headline.innerHTML = 'Yaaay, Bejbi! 💖 Wiedziałem!';
    card.classList.add('success');
    successArea.hidden = false;
    btnNo.classList.add('hidden');
    btnYes.textContent = 'Jeszcze raz!';
    btnYes.setAttribute('aria-label', 'Odtwórz od nowa');

    runConfetti();
  });

  btnAgain.addEventListener('click', function () {
    stopBackgroundMusic();
    document.location.reload();
  });
})();
