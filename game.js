(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const overlay = document.getElementById("overlay");
  const overlayEmoji = document.getElementById("overlayEmoji");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const startBtn = document.getElementById("startBtn");
  const jumpBtn = document.getElementById("jumpBtn");
  const jumpLabel = document.getElementById("jumpLabel");
  const chargeFill = document.getElementById("chargeFill");

  const W = 800, H = 600, groundY = 445;
  let running = false, gameOver = false, charging = false;
  let charge = 0, score = 0, lastTime = 0, cameraX = 0, lastLandedPlatformX = 0;
  let player, platforms, nextPlatformX, particles = [];
  let best = 0;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    draw();
  }
  function resetGame() {
    score = 0; cameraX = 0; charge = 0; charging = false; gameOver = false; lastLandedPlatformX = 0;
    platforms = [{ x: 0, w: 330 }, { x: 445, w: 175 }];
    nextPlatformX = 720;
    player = { x: 115, y: groundY - 42, w: 34, h: 42, vx: 0, vy: 0, onGround: true, targetPlatform: -1 };
    particles = [];
    scoreEl.textContent = "0";
    chargeFill.style.width = "0%";
    jumpBtn.disabled = false;
    jumpLabel.textContent = "ЗАЖМИ ДЛЯ ПРЫЖКА";
    overlay.classList.add("hidden");
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
  function endGame() {
    if (gameOver) return;
    gameOver = true; running = false; charging = false;
    best = Math.max(best, score);
    jumpBtn.disabled = true;
    chargeFill.style.width = "0%";
    overlayEmoji.textContent = "💫";
    overlayTitle.textContent = "Прыжок не удался!";
    overlayText.textContent = `Ты преодолел пропастей: ${score}. Лучший результат за эту сессию: ${best}. Попробуем ещё раз?`;
    startBtn.textContent = "Играть снова";
    overlay.classList.remove("hidden");
    draw();
  }
  function ensurePlatforms() {
    while (nextPlatformX < cameraX + W + 600) {
      const gap = 95 + Math.random() * 90;
      const width = 135 + Math.random() * 105;
      const last = platforms[platforms.length - 1];
      nextPlatformX = last.x + last.w + gap;
      platforms.push({ x: nextPlatformX, w: width });
    }
    platforms = platforms.filter(p => p.x + p.w > cameraX - 200);
  }
  function startCharge() {
    if (!running || !player.onGround || charging) return;
    charging = true; charge = 0;
    jumpLabel.textContent = "ЗАРЯДКА…";
  }
  function releaseCharge() {
    if (!charging || !running) return;
    charging = false;
    const power = Math.max(0.18, charge);
    player.onGround = false;
    player.vx = 250 + power * 360;
    player.vy = -(410 + power * 130);
    player.targetPlatform = -1;
    jumpLabel.textContent = "В ПОЛЁТЕ!";
  }
  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, 0.032);
    lastTime = now;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }
  function update(dt) {
    if (charging) {
      charge = Math.min(1, charge + dt * 0.62);
      chargeFill.style.width = `${Math.round(charge * 100)}%`;
    }
    if (!player.onGround) {
      const oldBottom = player.y + player.h;
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.vy += 980 * dt;
      const newBottom = player.y + player.h;
      if (player.vy > 0) {
        for (let i = 0; i < platforms.length; i++) {
          const p = platforms[i];
          if (player.x + player.w > p.x && player.x < p.x + p.w &&
              oldBottom <= groundY && newBottom >= groundY) {
            player.y = groundY - player.h;
            player.vy = 0; player.vx = 0; player.onGround = true;
            // Award one point only when reaching a new platform.
            if (p.x > lastLandedPlatformX) {
              score++;
              lastLandedPlatformX = p.x;
              scoreEl.textContent = String(score);
            }
            charge = 0; chargeFill.style.width = "0%";
            jumpLabel.textContent = "ЗАЖМИ ДЛЯ ПРЫЖКА";
            break;
          }
        }
      }
      if (player.y > H + 80 || player.x < cameraX - 50) endGame();
    }
    // Camera follows the character after the initial platform.
    cameraX = Math.max(0, player.x - 190);
    ensurePlatforms();
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    // If the player has passed the end of a platform and is falling, the fall is handled above.
    if (player.onGround && player.x + player.w > platforms[platforms.length - 1].x + 100) endGame();
  }
  function roundedRect(x, y, w, h, r, fill) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#7bd7ff"); sky.addColorStop(1, "#d7f5ff");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // Decorative clouds
    ctx.fillStyle = "#ffffffa8";
    for (let i = 0; i < 5; i++) {
      const x = ((i * 205 - cameraX * 0.18) % (W + 180) + W + 180) % (W + 180) - 60;
      ctx.beginPath(); ctx.ellipse(x, 105 + (i % 3) * 45, 48, 17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 25, 98 + (i % 3) * 45, 28, 22, 0, 0, Math.PI * 2); ctx.fill();
    }
    // distant hills
    ctx.fillStyle = "#75cbb5";
    ctx.beginPath(); ctx.moveTo(0, groundY);
    for (let x = 0; x <= W + 40; x += 40) ctx.lineTo(x, 340 + Math.sin((x + cameraX * .22) * .012) * 28);
    ctx.lineTo(W, groundY); ctx.closePath(); ctx.fill();
    // platforms
    for (const p of (platforms || [])) {
      const x = p.x - cameraX;
      if (x > W || x + p.w < 0) continue;
      ctx.fillStyle = "#805c45"; ctx.fillRect(x, groundY, p.w, H - groundY);
      ctx.fillStyle = "#55b95b"; ctx.fillRect(x, groundY, p.w, 13);
      ctx.fillStyle = "#8ae27b"; ctx.fillRect(x, groundY, p.w, 4);
      for (let gx = x + 12; gx < x + p.w - 8; gx += 34) {
        ctx.fillStyle = "#6c4b38"; ctx.fillRect(gx, groundY + 28, 13, 5);
      }
    }
    if (player) {
      const x = player.x - cameraX, y = player.y;
      // simple friendly character
      roundedRect(x + 2, y + 10, player.w - 4, player.h - 10, 9, "#273d80");
      roundedRect(x + 1, y + 1, player.w - 2, 24, 9, "#ffd0a0");
      ctx.fillStyle = "#24314f"; ctx.fillRect(x + 2, y + 1, player.w - 4, 8);
      ctx.fillStyle = "#182338"; ctx.fillRect(x + 10, y + 12, 4, 5); ctx.fillRect(x + 23, y + 12, 4, 5);
      ctx.fillStyle = "#f6fbff"; ctx.fillRect(x + 9, y + 27, 7, 7); ctx.fillRect(x + 19, y + 27, 7, 7);
      if (charging && player.onGround) {
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.beginPath();
        ctx.arc(x + player.w / 2, y + 20, 28 + charge * 13, -Math.PI * .8, -Math.PI * .8 + Math.PI * 1.6 * charge); ctx.stroke();
      }
    }
    // foreground label
    ctx.fillStyle = "#15354d99"; ctx.font = "bold 15px system-ui"; ctx.fillText("ПРЫГАЙ ДАЛЬШЕ!", 22, 34);
  }

  startBtn.addEventListener("click", resetGame);
  jumpBtn.addEventListener("pointerdown", e => { e.preventDefault(); startCharge(); });
  jumpBtn.addEventListener("pointerup", e => { e.preventDefault(); releaseCharge(); });
  jumpBtn.addEventListener("pointercancel", releaseCharge);
  jumpBtn.addEventListener("pointerleave", e => { if (charging && e.buttons === 0) releaseCharge(); });
  window.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); startCharge(); }
  });
  window.addEventListener("keyup", e => {
    if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); releaseCharge(); }
  });
  window.addEventListener("resize", resizeCanvas);
  // Telegram's viewport sizing helper, if opened inside Telegram.
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
  }
  resizeCanvas();
})();
