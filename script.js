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

  // --- AudioManager (WebAudio + prewarm for iOS) ---
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  let masterGain = null;
  let audioPrewarmed = false;

  function safeRandom() {
    try {
      var arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return arr[0] / 4294967296;
    } catch (_) { return Math.random(); }
  }

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    if (AudioCtxClass && !audioCtx) {
      audioCtx = new AudioCtxClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function prewarmAudio() {
    if (!audioEnabled || !audioCtx || !masterGain || audioPrewarmed) return;
    audioPrewarmed = true;
    try {
      var now = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      gain.gain.setValueAtTime(0.0001, now);
      osc.frequency.setValueAtTime(440, now);
      osc.start(now);
      osc.stop(now + 0.01);
    } catch (_) { audioPrewarmed = false; }
  }

  document.addEventListener('pointerdown', function () { unlockAudio(); prewarmAudio(); }, { once: true, capture: true });
  document.addEventListener('touchstart', function () { unlockAudio(); prewarmAudio(); }, { once: true, capture: true });
  document.addEventListener('keydown', unlockAudio, { once: true, capture: true });

  function playNoSfx() {
    if (!audioEnabled) return;
    unlockAudio();
    if (!audioCtx || !masterGain) return;
    try {
      var now = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (_) {}
  }

  function playSfx(name) {
    if (name === 'no') playNoSfx();
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

  // --- "Nie" escape logic (iOS: many positions, anti-repeat, score) ---
  let noButtonLayoutPos = null;
  var lastNoPositions = [];
  var ANTI_REPEAT_DIST = 120;
  var JITTER = 10;
  var NUM_CANDIDATES = 35;

  function getRects() {
    var cardR = card.getBoundingClientRect();
    var yesR = btnYes.getBoundingClientRect();
    var noR = btnNo.getBoundingClientRect();
    if (!noButtonLayoutPos) noButtonLayoutPos = { left: noR.left, top: noR.top };
    return { cardR, yesR, noR };
  }

  function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function rectsOverlap(a, b, pad) {
    var p = pad || 8;
    return !(a.right + p < b.left - p || a.left - p > b.right + p ||
             a.bottom + p < b.top - p || a.top - p > b.bottom + p);
  }

  function findBestEscapePosition(pointerX, pointerY, retry) {
    if (retry === undefined) retry = false;
    var r = getRects();
    var cardR = r.cardR, yesR = r.yesR, noR = r.noR;
    var noW = noR.width, noH = noR.height;
    var pad = 20;
    var minL = cardR.left + pad;
    var maxL = cardR.right - noW - pad;
    var minT = cardR.top + pad;
    var maxT = cardR.bottom - noH - pad;
    var centerX = (cardR.left + cardR.right) / 2;
    var centerY = (cardR.top + cardR.bottom) / 2;
    var yesCx = (yesR.left + yesR.right) / 2;
    var yesCy = (yesR.top + yesR.bottom) / 2;
    var candidates = [];
    for (var i = 0; i < NUM_CANDIDATES; i++) {
      var l = minL + safeRandom() * (maxL - minL);
      var t = minT + safeRandom() * (maxT - minT);
      var jitterX = (safeRandom() * 2 - 1) * JITTER;
      var jitterY = (safeRandom() * 2 - 1) * JITTER;
      l = Math.max(minL, Math.min(maxL, l + jitterX));
      t = Math.max(minT, Math.min(maxT, t + jitterY));
      var rect = { left: l, top: t, right: l + noW, bottom: t + noH };
      if (rectsOverlap(rect, yesR, 28)) continue;
      var cx = l + noW / 2, cy = t + noH / 2;
      var distPtr = dist(pointerX, pointerY, cx, cy);
      var distYes = dist(cx, cy, yesCx, yesCy);
      var distCenter = dist(cx, cy, centerX, centerY);
      var tooClose = false;
      for (var j = 0; j < lastNoPositions.length; j++) {
        if (dist(cx, cy, lastNoPositions[j].x, lastNoPositions[j].y) < ANTI_REPEAT_DIST) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      var score = distPtr * 2 + distYes * 1 + distCenter * 0.2;
      candidates.push({ left: l, top: t, score: score, cx: cx, cy: cy });
    }
    if (candidates.length === 0) {
      if (!retry) {
        lastNoPositions = [];
        return findBestEscapePosition(pointerX, pointerY, true);
      }
      return { left: noR.left, top: noR.top };
    }
    candidates.sort(function (a, b) { return b.score - a.score; });
    var best = candidates[0];
    lastNoPositions.push({ x: best.cx, y: best.cy });
    if (lastNoPositions.length > 4) lastNoPositions.shift();
    return { left: best.left, top: best.top };
  }

  function moveNoButton(x, y) {
    if (yesClicked) return;
    var pos = findBestEscapePosition(x, y);
    var relX = pos.left - noButtonLayoutPos.left;
    var relY = pos.top - noButtonLayoutPos.top;

    if (prefersReducedMotion) {
      btnNo.style.transform = 'translate(' + relX + 'px,' + relY + 'px)';
      return;
    }
    btnNo.classList.add('shake');
    var targetTransform = 'translate(' + relX + 'px,' + relY + 'px)';
    setTimeout(function () {
      btnNo.classList.remove('shake');
      btnNo.style.transition = 'none';
      btnNo.style.transform = targetTransform;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          btnNo.style.transition = 'transform 0.12s ease';
        });
      });
    }, 80);
  }

  var lastNoSoundTime = 0;
  var NO_SFX_THROTTLE_MS = 180;
  var lastNoHandleTime = 0;
  var NO_HANDLE_DEBOUNCE_MS = 50;

  function handleNoHover(e) {
    if (yesClicked) return;
    var now = Date.now();
    if (audioEnabled && now - lastNoSoundTime >= NO_SFX_THROTTLE_MS) {
      lastNoSoundTime = now;
      playNoSfx();
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
  btnNo.addEventListener('pointerenter', handleNoHover);
  function handleNoInteraction(e) {
    var t = Date.now();
    if (t - lastNoHandleTime < NO_HANDLE_DEBOUNCE_MS) return;
    lastNoHandleTime = t;
    handleNoHover(e);
  }
  btnNo.addEventListener('touchstart', function (e) {
    e.preventDefault();
    if (e.touches.length) handleNoInteraction(e);
  }, { passive: false });
  btnNo.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') handleNoInteraction(e);
  });
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

    try {
      bgMusic = new Audio('./audio/background.mp3');
      bgMusic.loop = true;
      bgMusic.volume = 0.5;

      bgMusic.play().then(function () {
        audioUnlocked = true;
      }).catch(function (err) {
        console.warn("Audio blocked:", err);
      });
    } catch (e) {
      console.error(e);
    }
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
