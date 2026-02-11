import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

const PROMPT_LINE_1 = "임상엽님과 함께";
const PROMPT_LINE_2 = "발렌타인을 보내시겠습니까?";
const SUCCESS_TEXT_YES = "그럼 기다리고 있겠습니다\n재밌게 만나요";
const SUCCESS_TEXT_NO = "그냥 동의하면 얼마나 좋아요.\n어차피 만나러 갈 거니까 그렇게 알아요";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function App() {
  const cardRef = useRef(null);
  const arenaRef = useRef(null);
  const noButtonRef = useRef(null);
  const yesButtonRef = useRef(null);
  const successRef = useRef(null);
  const burstRef = useRef(null);
  const fireworkCanvasRef = useRef(null);
  const rageFireCanvasRef = useRef(null);
  const flashRef = useRef(null);
  const darkStageRef = useRef(null);
  const lastEvadeAtRef = useRef(0);
  const noButtonPosRef = useRef({ x: 0, y: 0 });
  const noButtonVelocityRef = useRef({ vx: 0, vy: 0 });
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const noButtonXToRef = useRef(null);
  const noButtonYToRef = useRef(null);
  const dodgeCountRef = useRef(0);
  const rageIntensityRef = useRef({ value: 0 });
  const rageGrowthRef = useRef({ value: 0 });
  const layoutRef = useRef({
    arenaLeft: 0,
    arenaTop: 0,
    arenaWidth: 0,
    arenaHeight: 0,
    noWidth: 0,
    noHeight: 0,
    yesWidth: 0,
    yesCenter: null,
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    safeRadius: 118
  });

  const [accepted, setAccepted] = useState(false);
  const [acceptMode, setAcceptMode] = useState("yes");
  const [ready, setReady] = useState(false);
  const [dodgeCount, setDodgeCount] = useState(0);
  const isFurious = dodgeCount > 50;
  const isNoButtonUnlocked = dodgeCount >= 100;
  const rageGrowthProgress = clamp((dodgeCount - 50) / 50, 0, 1);

  const floatingItems = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        symbol: index % 3 === 0 ? "✦" : "❤",
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 7}s`,
        duration: `${7 + Math.random() * 8}s`,
        size: `${14 + Math.random() * 18}px`,
        drift: `${-40 + Math.random() * 80}px`,
        opacity: 0.12 + Math.random() * 0.35
      })),
    []
  );

  const burst = useCallback((originX, originY, count = 56) => {
    const container = burstRef.current;
    if (!container) return;

    for (let index = 0; index < count; index += 1) {
      const piece = document.createElement("span");
      const isHeart = Math.random() > 0.35;
      piece.className = isHeart ? "burst-piece burst-heart" : "burst-piece burst-spark";
      piece.textContent = isHeart ? "❤" : "✦";
      container.appendChild(piece);

      const angle = gsap.utils.random(0, 360);
      const distance = gsap.utils.random(90, 360);
      const endX = originX + Math.cos((angle * Math.PI) / 180) * distance;
      const endY = originY + Math.sin((angle * Math.PI) / 180) * distance;

      gsap.fromTo(
        piece,
        {
          x: originX,
          y: originY,
          scale: 0,
          opacity: 0,
          rotation: 0
        },
        {
          x: endX,
          y: endY - 40,
          scale: gsap.utils.random(0.8, 1.7),
          opacity: 0,
          rotation: gsap.utils.random(-220, 220),
          duration: gsap.utils.random(1.05, 1.9),
          ease: "power3.out",
          onStart: () => gsap.set(piece, { opacity: 1 }),
          onComplete: () => piece.remove()
        }
      );
    }
  }, []);

  const confetti = useCallback((count = 90) => {
    const container = burstRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const palette = ["#ff477e", "#ff8a5b", "#ffd166", "#9bf6ff", "#f4a9ff", "#ffffff"];

    for (let index = 0; index < count; index += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.backgroundColor = palette[index % palette.length];
      container.appendChild(piece);

      const startX = gsap.utils.random(-40, width + 40);
      const driftX = gsap.utils.random(-220, 220);
      const duration = gsap.utils.random(2.2, 3.9);

      gsap.set(piece, {
        x: startX,
        y: gsap.utils.random(-120, -20),
        rotation: gsap.utils.random(-180, 180),
        scale: gsap.utils.random(0.7, 1.4)
      });

      gsap.to(piece, {
        x: startX + driftX,
        y: height + 80,
        rotation: gsap.utils.random(240, 760),
        duration,
        ease: "power2.in",
        onComplete: () => piece.remove()
      });

      gsap.to(piece, {
        opacity: 0,
        duration: 0.65,
        delay: duration - 0.65,
        ease: "power1.in"
      });
    }
  }, []);

  const laserFanSweep = useCallback((count = 10) => {
    const container = burstRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const originX = width / 2;
    const originY = height + 24;

    for (let index = 0; index < count; index += 1) {
      const beam = document.createElement("span");
      beam.className = "laser-fan-beam";
      container.appendChild(beam);

      const rotation = -90 + gsap.utils.random(-58, 58);
      const length = gsap.utils.random(height * 0.5, height * 0.95);
      const colorA = `hsla(${gsap.utils.random(315, 350)}, 100%, 72%, 0.9)`;
      const colorB = `hsla(${gsap.utils.random(180, 228)}, 100%, 74%, 0.92)`;
      beam.style.background = `linear-gradient(180deg, ${colorA} 0%, ${colorB} 60%, transparent 100%)`;

      gsap.set(beam, {
        x: originX,
        y: originY,
        rotation,
        height: length,
        opacity: 0,
        scaleY: 0,
        transformOrigin: "50% 100%"
      });

      gsap.to(beam, {
        scaleY: 1,
        opacity: 0.96,
        duration: gsap.utils.random(0.18, 0.28),
        ease: "power3.out"
      });

      gsap.to(beam, {
        opacity: 0,
        duration: gsap.utils.random(0.45, 0.72),
        delay: 0.18,
        ease: "power2.in",
        onComplete: () => beam.remove()
      });
    }
  }, []);

  const lightPulse = useCallback((x, y, intensity = 1) => {
    const container = burstRef.current;
    if (!container) return;

    const pulse = document.createElement("span");
    pulse.className = "light-pulse";
    container.appendChild(pulse);

    const size = gsap.utils.random(220, 420) * intensity;
    gsap.set(pulse, {
      x: x - size / 2,
      y: y - size / 2,
      width: size,
      height: size,
      scale: 0.65,
      opacity: 0
    });

    gsap.to(pulse, {
      opacity: gsap.utils.random(0.4, 0.72) * intensity,
      scale: 1.16,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: "power1.out"
    });

    gsap.to(pulse, {
      opacity: 0,
      duration: 0.8,
      delay: 0.2,
      ease: "power2.out",
      onComplete: () => pulse.remove()
    });
  }, []);

  const flash = useCallback((maxOpacity = 0.4) => {
    const flashLayer = flashRef.current;
    if (!flashLayer) return;

    gsap.fromTo(
      flashLayer,
      { opacity: 0 },
      {
        opacity: gsap.utils.random(maxOpacity * 0.62, maxOpacity),
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "power1.out"
      }
    );
  }, []);

  const registerDodge = useCallback(() => {
    const now = performance.now();
    if (now - lastEvadeAtRef.current < 110) return;
    lastEvadeAtRef.current = now;
    dodgeCountRef.current += 1;
    setDodgeCount(dodgeCountRef.current);
  }, []);

  const kickAwayFromPointer = useCallback((pointerX, pointerY, power = 10) => {
    let { x, y } = noButtonPosRef.current;
    let { vx, vy } = noButtonVelocityRef.current;
    let dx = x - pointerX;
    let dy = y - pointerY;
    let dist = Math.hypot(dx, dy);

    if (dist < 0.001) {
      const angle = Math.random() * Math.PI * 2;
      dx = Math.cos(angle);
      dy = Math.sin(angle);
      dist = 1;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    vx += nx * power;
    vy += ny * power;

    noButtonVelocityRef.current = { vx, vy };
    registerDodge();
  }, [registerDodge]);

  const stepNoButtonPhysics = useCallback(() => {
    if (accepted || !ready || isNoButtonUnlocked) return;
    if (!noButtonXToRef.current || !noButtonYToRef.current) return;

    const {
      minX,
      maxX,
      minY,
      maxY,
      noWidth,
      safeRadius
    } = layoutRef.current;
    if (!noWidth || maxX <= minX || maxY <= minY) return;

    let { x, y } = noButtonPosRef.current;
    let { vx, vy } = noButtonVelocityRef.current;
    const pointer = pointerRef.current;

    if (!x && !y) {
      x = (minX + maxX) / 2;
      y = (minY + maxY) / 2;
    }

    if (pointer.active) {
      let dx = x - pointer.x;
      let dy = y - pointer.y;
      let dist = Math.hypot(dx, dy);

      if (dist < 0.0001) {
        const angle = Math.random() * Math.PI * 2;
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        dist = 1;
      }

      const nx = dx / dist;
      const ny = dy / dist;
      const edgeDist = Math.min(x - minX, maxX - x, y - minY, maxY - y);
      const edgeBoost = clamp((34 - edgeDist) / 34, 0, 1);
      const dynamicSafeRadius = safeRadius + edgeBoost * 34;
      const pressure = clamp((dynamicSafeRadius - dist) / dynamicSafeRadius, 0, 1);

      if (pressure > 0) {
        registerDodge();
        const repelForce = 0.8 + pressure * 4.6;
        vx += nx * repelForce;
        vy += ny * repelForce;

        const tangentSign = Math.sin((x + y + performance.now() * 0.12) * 0.01) > 0 ? 1 : -1;
        vx += -ny * 0.48 * pressure * tangentSign;
        vy += nx * 0.48 * pressure * tangentSign;

        if (dist < dynamicSafeRadius) {
          x = pointer.x + nx * dynamicSafeRadius;
          y = pointer.y + ny * dynamicSafeRadius;
        }

        if (dist < noWidth * 0.44) {
          vx += nx * 2.4;
          vy += ny * 2.4;
        }
      }
    }

    const cushion = 20;
    if (x < minX + cushion) vx += (minX + cushion - x) * 0.09;
    if (x > maxX - cushion) vx -= (x - (maxX - cushion)) * 0.09;
    if (y < minY + cushion) vy += (minY + cushion - y) * 0.09;
    if (y > maxY - cushion) vy -= (y - (maxY - cushion)) * 0.09;

    const t = performance.now() * 0.001;
    vx += Math.sin(t * 1.35 + y * 0.021) * 0.02;
    vy += Math.cos(t * 1.22 + x * 0.018) * 0.018;

    vx *= 0.9;
    vy *= 0.9;
    x += vx;
    y += vy;

    if (pointer.active) {
      const cornerPad = 28;
      const nearLeft = x <= minX + cornerPad;
      const nearRight = x >= maxX - cornerPad;
      const nearTop = y <= minY + cornerPad;
      const nearBottom = y >= maxY - cornerPad;
      const inCorner = (nearLeft || nearRight) && (nearTop || nearBottom);

      if (inCorner) {
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const ex = centerX - x;
        const ey = centerY - y;
        const eLen = Math.hypot(ex, ey) || 1;
        const enx = ex / eLen;
        const eny = ey / eLen;

        x += enx * 2.1;
        y += eny * 2.1;
        vx += enx * 2.9;
        vy += eny * 2.9;
      }
    }

    if (x < minX) {
      x = minX;
      vx = Math.abs(vx) * 0.32;
    } else if (x > maxX) {
      x = maxX;
      vx = -Math.abs(vx) * 0.32;
    }

    if (y < minY) {
      y = minY;
      vy = Math.abs(vy) * 0.32;
    } else if (y > maxY) {
      y = maxY;
      vy = -Math.abs(vy) * 0.32;
    }

    if (pointer.active) {
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      let escapeDx = centerX - pointer.x;
      let escapeDy = centerY - pointer.y;
      let escapeLen = Math.hypot(escapeDx, escapeDy);
      if (escapeLen < 0.001) {
        escapeDx = centerX - x;
        escapeDy = centerY - y;
        escapeLen = Math.hypot(escapeDx, escapeDy) || 1;
      }

      const escapeNx = escapeDx / escapeLen;
      const escapeNy = escapeDy / escapeLen;
      const postDist = Math.hypot(x - pointer.x, y - pointer.y);
      if (postDist < safeRadius * 0.92) {
        x = clamp(pointer.x + escapeNx * (safeRadius + 14), minX, maxX);
        y = clamp(pointer.y + escapeNy * (safeRadius + 14), minY, maxY);
        vx += escapeNx * 2.4;
        vy += escapeNy * 2.4;
      }
    }

    noButtonPosRef.current = { x, y };
    noButtonVelocityRef.current = { vx, vy };
    noButtonXToRef.current(x);
    noButtonYToRef.current(y);
  }, [accepted, ready, registerDodge, isNoButtonUnlocked]);

  useEffect(() => {
    const arena = arenaRef.current;
    const noButton = noButtonRef.current;
    const yesButton = yesButtonRef.current;
    if (!arena || !noButton) return;

    gsap.set(noButton, {
      xPercent: -50,
      yPercent: -50,
      force3D: true
    });

    noButtonXToRef.current = gsap.quickTo(noButton, "x", {
      duration: 0.18,
      ease: "power3.out",
      overwrite: "auto"
    });
    noButtonYToRef.current = gsap.quickTo(noButton, "y", {
      duration: 0.18,
      ease: "power3.out",
      overwrite: "auto"
    });

    const initializePosition = () => {
      const arenaRect = arena.getBoundingClientRect();
      const noRect = noButton.getBoundingClientRect();
      const yesRect = yesButton?.getBoundingClientRect();

      layoutRef.current = {
        arenaLeft: arenaRect.left,
        arenaTop: arenaRect.top,
        arenaWidth: arenaRect.width,
        arenaHeight: arenaRect.height,
        noWidth: noRect.width,
        noHeight: noRect.height,
        yesWidth: yesRect?.width ?? 0,
        yesCenter: yesRect
          ? {
              x: yesRect.left - arenaRect.left + yesRect.width / 2,
              y: yesRect.top - arenaRect.top + yesRect.height / 2
            }
          : null,
        minX: noRect.width / 2 + 14,
        maxX: arenaRect.width - noRect.width / 2 - 14,
        minY: noRect.height / 2 + 14,
        maxY: arenaRect.height - noRect.height / 2 - 14,
        safeRadius: Math.max(114, noRect.width * 0.7 + 38)
      };

      const initialX = clamp(arenaRect.width * 0.73, noRect.width / 2 + 12, arenaRect.width - noRect.width / 2 - 12);
      const initialY = clamp(arenaRect.height * 0.55, noRect.height / 2 + 12, arenaRect.height - noRect.height / 2 - 12);
      noButtonPosRef.current = { x: initialX, y: initialY };
      noButtonVelocityRef.current = { vx: 0, vy: 0 };
      pointerRef.current = { x: -9999, y: -9999, active: false };
      gsap.set(noButton, { x: initialX, y: initialY });
      setReady(true);
    };

    initializePosition();
    window.addEventListener("resize", initializePosition);
    window.addEventListener("scroll", initializePosition, { passive: true });

    return () => {
      window.removeEventListener("resize", initializePosition);
      window.removeEventListener("scroll", initializePosition);
      noButtonXToRef.current = null;
      noButtonYToRef.current = null;
    };
  }, []);

  useEffect(() => {
    const tick = () => stepNoButtonPhysics();
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [stepNoButtonPhysics]);

  useEffect(() => {
    gsap.killTweensOf(rageIntensityRef.current);
    if (isFurious && !isNoButtonUnlocked) {
      rageIntensityRef.current.value = 0;
      gsap.to(rageIntensityRef.current, {
        value: 1,
        duration: 0.82,
        ease: "power2.out"
      });
    } else {
      rageIntensityRef.current.value = 0;
    }
  }, [isFurious, isNoButtonUnlocked]);

  useEffect(() => {
    gsap.killTweensOf(rageGrowthRef.current);
    if (!isFurious) {
      rageGrowthRef.current.value = 0;
      return;
    }
    gsap.to(rageGrowthRef.current, {
      value: rageGrowthProgress,
      duration: 0.24,
      ease: "power2.out"
    });
  }, [isFurious, rageGrowthProgress]);

  useEffect(() => {
    if (!isNoButtonUnlocked) return;
    pointerRef.current.active = false;
    noButtonVelocityRef.current = { vx: 0, vy: 0 };
  }, [isNoButtonUnlocked]);

  useEffect(() => {
    if (!isFurious || accepted || isNoButtonUnlocked) return;

    const canvas = rageFireCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = [];
    const sparks = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let emitSpan = 0;
    let width = 0;
    let height = 0;
    let fireCenterX = 0;
    let baseY = 0;
    let topPadding = 0;
    let bottomPadding = 0;
    let emitBudget = 0;
    let rafId = null;
    let lastTs = performance.now();
    let active = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      emitSpan = Math.max(1, yesButtonRef.current?.offsetWidth ?? width * 0.32);
      fireCenterX = width * 0.46;
      topPadding = Math.max(64, height * 0.35);
      bottomPadding = Math.max(34, height * 0.12);
      baseY = height - bottomPadding;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnFlame = () => {
      const intensity = rageIntensityRef.current.value;
      const growth = rageGrowthRef.current.value;
      const spawnSpread = Math.min(width * 0.42, emitSpan * (0.42 + growth * 0.32));
      particles.push({
        x: fireCenterX + gsap.utils.random(-spawnSpread, spawnSpread),
        y: baseY + gsap.utils.random(-6, 4),
        vx: gsap.utils.random(-0.6, 0.6),
        vy: gsap.utils.random(-3.85, -2.4),
        life: gsap.utils.random(0.56, 1.02),
        age: 0,
        size: gsap.utils.random(11, 21) * (0.68 + intensity * 0.3) * (0.92 + growth * 0.54),
        stretch: gsap.utils.random(0.2, 0.65),
        seed: Math.random() * Math.PI * 2
      });
    };

    const spawnSpark = () => {
      const intensity = rageIntensityRef.current.value;
      const growth = rageGrowthRef.current.value;
      const sparkSpread = Math.min(width * 0.3, emitSpan * (0.3 + growth * 0.26));
      sparks.push({
        x: fireCenterX + gsap.utils.random(-sparkSpread, sparkSpread),
        y: baseY + gsap.utils.random(-5, 2),
        vx: gsap.utils.random(-1.2, 1.2),
        vy: gsap.utils.random(-2.8, -1.6),
        age: 0,
        life: gsap.utils.random(0.36, 0.62),
        radius: gsap.utils.random(0.8, 1.5) * (0.6 + intensity * 0.4) * (0.9 + growth * 0.36)
      });
    };

    const render = (ts) => {
      if (!active) return;

      const dt = Math.min(0.032, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;
      const intensity = rageIntensityRef.current.value;
      const growth = rageGrowthRef.current.value;

      if (intensity < 0.01) {
        ctx.clearRect(0, 0, width, height);
        rafId = window.requestAnimationFrame(render);
        return;
      }

      emitBudget += dt * (26 + intensity * 88 + growth * 56);
      while (emitBudget >= 1) {
        emitBudget -= 1;
        spawnFlame();
      }

      if (Math.random() > 0.76 - intensity * 0.2 - growth * 0.2) {
        spawnSpark();
      }

      ctx.clearRect(0, 0, width, height);

      ctx.globalCompositeOperation = "source-over";
      const bedGlow = ctx.createRadialGradient(
        fireCenterX,
        baseY,
        10,
        fireCenterX,
        baseY - 6,
        width * (0.3 + growth * 0.2)
      );
      bedGlow.addColorStop(0, `rgba(255, 214, 132, ${0.38 + intensity * 0.34})`);
      bedGlow.addColorStop(0.42, `rgba(255, 139, 56, ${0.24 + intensity * 0.2})`);
      bedGlow.addColorStop(1, "rgba(255, 72, 20, 0)");
      ctx.fillStyle = bedGlow;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const flame = particles[index];
        flame.age += dt;

        const lifeProgress = flame.age / flame.life;
        if (lifeProgress >= 1 || flame.y < -topPadding * 1.6) {
          particles.splice(index, 1);
          continue;
        }

        flame.vx += Math.sin(flame.seed + flame.age * 12) * 0.015;
        flame.vx += (fireCenterX - flame.x) * 0.0016;
        flame.vy -= 0.032;
        flame.x += flame.vx * (dt * 60);
        flame.y += flame.vy * (dt * 60);

        const flameLimit = Math.min(width * 0.45, emitSpan * (0.66 + growth * 0.4));
        flame.x = clamp(flame.x, fireCenterX - flameLimit, fireCenterX + flameLimit);

        const alpha = Math.pow(1 - lifeProgress, 1.2) * (0.45 + intensity * 0.55) * (0.84 + growth * 0.34);
        const radius = flame.size * (1 - lifeProgress * 0.68);
        const stretch = 1.2 + lifeProgress * 2.1 + flame.stretch;

        ctx.save();
        ctx.translate(flame.x, flame.y);
        ctx.rotate(flame.vx * 0.08);
        ctx.scale(1, stretch);

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        grad.addColorStop(0, `rgba(255, 250, 218, ${0.95 * alpha})`);
        grad.addColorStop(0.28, `rgba(255, 225, 143, ${0.86 * alpha})`);
        grad.addColorStop(0.6, `rgba(255, 153, 57, ${0.58 * alpha})`);
        grad.addColorStop(1, `rgba(255, 66, 16, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.58, radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        spark.age += dt;

        const lifeProgress = spark.age / spark.life;
        if (lifeProgress >= 1 || spark.y < -topPadding) {
          sparks.splice(index, 1);
          continue;
        }

        spark.vx *= 0.98;
        spark.vx += (fireCenterX - spark.x) * 0.0012;
        spark.vy -= 0.014;
        spark.x += spark.vx * (dt * 60);
        spark.y += spark.vy * (dt * 60);
        const alpha = (1 - lifeProgress) * (0.32 + intensity * 0.52);

        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 246, 201, ${alpha})`;
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    rafId = window.requestAnimationFrame(render);

    return () => {
      active = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, width, height);
    };
  }, [isFurious, accepted, isNoButtonUnlocked]);

  useEffect(() => {
    if (!accepted) return;

    const card = cardRef.current;
    const success = successRef.current;
    const celebrationLayer = burstRef.current;
    const darkStage = darkStageRef.current;
    if (!card || !success || !celebrationLayer || !darkStage) return;

    const intervalIds = [];
    const timeoutIds = [];

    const tl = gsap.timeline();
    tl.to(card, {
      autoAlpha: 0,
      y: -24,
      scale: 0.92,
      duration: 0.42,
      ease: "power2.inOut"
    })
      .set(card, { display: "none" })
      .set(success, { display: "block" })
      .set(darkStage, { display: "block" })
      .fromTo(
        success,
        { autoAlpha: 0, y: 36, scale: 0.76 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: "elastic.out(1, 0.58)" }
      )
      .fromTo(
        darkStage,
        { autoAlpha: 0 },
        { autoAlpha: 0.9, duration: 0.32, ease: "power2.out" },
        "<0.04"
      )
      .fromTo(
        ".success-glow",
        { opacity: 0 },
        { opacity: 0.3, duration: 0.7 },
        "<"
      );

    const stageRect = celebrationLayer.getBoundingClientRect();
    let stageWidth = stageRect.width;
    let stageHeight = stageRect.height;
    const canvas = fireworkCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    let rafId = null;
    let fireworksEnabled = true;
    let launchFirework = null;
    let resizeCanvas = null;

    if (canvas && ctx) {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rockets = [];
      const particles = [];

      const createRocket = (targetX, targetY, intensity = 1) => {
        const startX = stageWidth * 0.5 + gsap.utils.random(-stageWidth * 0.28, stageWidth * 0.28);
        const startY = stageHeight + 24;
        const hue = gsap.utils.random(0, 360);
        return {
          x: startX,
          y: startY,
          vx: (targetX - startX) * 0.02,
          vy: gsap.utils.random(-11.8, -9.2),
          tx: targetX,
          ty: targetY,
          hue,
          intensity,
          trail: Array.from({ length: 8 }, () => ({ x: startX, y: startY })),
          exploded: false
        };
      };

      const createParticle = (x, y, hue, speedFactor = 1) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = gsap.utils.random(1.6, 7.2) * speedFactor;
        return {
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: gsap.utils.random(0.055, 0.085),
          friction: gsap.utils.random(0.955, 0.982),
          alpha: 1,
          decay: gsap.utils.random(0.012, 0.019),
          brightness: gsap.utils.random(52, 72),
          trail: Array.from({ length: 6 }, () => ({ x, y }))
        };
      };

      const explode = (x, y, hue, intensity = 1) => {
        const count = Math.floor(gsap.utils.random(62, 104) * intensity);
        for (let index = 0; index < count; index += 1) {
          particles.push(createParticle(x, y, hue + gsap.utils.random(-24, 24), intensity));
        }
        lightPulse(x, y, 1.15 * intensity);
        flash(Math.min(0.7, 0.33 + intensity * 0.22));
      };

      resizeCanvas = () => {
        const rect = celebrationLayer.getBoundingClientRect();
        stageWidth = rect.width;
        stageHeight = rect.height;
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(0, 0, stageWidth, stageHeight);
      };

      launchFirework = (targetX, targetY, intensity = 1) => {
        rockets.push(createRocket(targetX, targetY, intensity));
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      let lastTs = performance.now();
      let autoLaunchBudget = 0;

      const drawRocket = (rocket) => {
        ctx.beginPath();
        ctx.moveTo(rocket.trail[rocket.trail.length - 1].x, rocket.trail[rocket.trail.length - 1].y);
        for (let index = rocket.trail.length - 2; index >= 0; index -= 1) {
          ctx.lineTo(rocket.trail[index].x, rocket.trail[index].y);
        }
        ctx.strokeStyle = `hsla(${rocket.hue}, 100%, 72%, 0.85)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rocket.x, rocket.y, 2.1, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${rocket.hue}, 100%, 82%, 0.95)`;
        ctx.fill();
      };

      const drawParticle = (particle) => {
        const tail = particle.trail;
        ctx.beginPath();
        ctx.moveTo(tail[tail.length - 1].x, tail[tail.length - 1].y);
        for (let index = tail.length - 2; index >= 0; index -= 1) {
          ctx.lineTo(tail[index].x, tail[index].y);
        }
        ctx.strokeStyle = `hsla(${particle.hue}, 100%, ${particle.brightness}%, ${particle.alpha * 0.72})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 1.45, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 84%, ${particle.alpha})`;
        ctx.fill();
      };

      const animateFireworks = (ts) => {
        if (!fireworksEnabled) return;
        const dt = Math.min(34, ts - lastTs);
        lastTs = ts;

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(8, 10, 18, 0.23)";
        ctx.fillRect(0, 0, stageWidth, stageHeight);
        ctx.globalCompositeOperation = "lighter";

        autoLaunchBudget += dt;
        if (autoLaunchBudget > 380) {
          autoLaunchBudget = 0;
          const targetX = gsap.utils.random(80, stageWidth - 80);
          const targetY = gsap.utils.random(60, stageHeight * 0.52);
          launchFirework(targetX, targetY, gsap.utils.random(0.86, 1.08));
        }

        for (let index = rockets.length - 1; index >= 0; index -= 1) {
          const rocket = rockets[index];
          rocket.trail.pop();
          rocket.trail.unshift({ x: rocket.x, y: rocket.y });

          rocket.vx *= 0.992;
          rocket.vy += 0.024;
          rocket.vx += (rocket.tx - rocket.x) * 0.00065;
          rocket.vy += (rocket.ty - rocket.y) * 0.0016;
          rocket.x += rocket.vx;
          rocket.y += rocket.vy;

          drawRocket(rocket);

          const reached = rocket.y <= rocket.ty || Math.hypot(rocket.x - rocket.tx, rocket.y - rocket.ty) < 28;
          if (reached && !rocket.exploded) {
            rocket.exploded = true;
            explode(rocket.x, rocket.y, rocket.hue, rocket.intensity);
            rockets.splice(index, 1);
          }
        }

        for (let index = particles.length - 1; index >= 0; index -= 1) {
          const particle = particles[index];
          particle.trail.pop();
          particle.trail.unshift({ x: particle.x, y: particle.y });

          particle.vx *= particle.friction;
          particle.vy *= particle.friction;
          particle.vy += particle.gravity;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.alpha -= particle.decay;
          drawParticle(particle);

          if (particle.alpha <= 0 || particle.y > stageHeight + 30) {
            particles.splice(index, 1);
          }
        }

        rafId = window.requestAnimationFrame(animateFireworks);
      };

      rafId = window.requestAnimationFrame(animateFireworks);
    }

    const fireworkShot = (intensity = 1) => {
      const x = gsap.utils.random(70, stageWidth - 70);
      const y = gsap.utils.random(60, stageHeight * 0.54);
      if (launchFirework) {
        launchFirework(x, y, intensity);
      } else {
        burst(x, y, gsap.utils.random(54, 96));
        lightPulse(x, y, intensity);
        flash(Math.min(0.6, 0.28 + intensity * 0.2));
      }
    };

    for (let index = 0; index < 7; index += 1) {
      const timerId = window.setTimeout(() => fireworkShot(1.12), index * 220);
      timeoutIds.push(timerId);
    }

    const fireworkTimer = window.setInterval(() => fireworkShot(0.9), 320);
    intervalIds.push(fireworkTimer);

    const stage2Timer = window.setTimeout(() => {
      gsap.to(darkStage, {
        autoAlpha: 0.16,
        duration: 1.1,
        ease: "power2.out"
      });

      confetti(170);
      laserFanSweep(16);

      const laserTimer = window.setInterval(() => laserFanSweep(gsap.utils.random(9, 14)), 340);
      const confettiTimer = window.setInterval(() => confetti(56), 740);
      intervalIds.push(laserTimer, confettiTimer);
    }, 1850);
    timeoutIds.push(stage2Timer);

    const finaleTimer = window.setTimeout(() => {
      confetti(240);
      for (let index = 0; index < 12; index += 1) {
        const timerId = window.setTimeout(() => {
          fireworkShot(1.08);
          laserFanSweep(14);
        }, index * 135);
        timeoutIds.push(timerId);
      }
    }, 4300);
    timeoutIds.push(finaleTimer);

    const stopTimer = window.setTimeout(() => {
      intervalIds.forEach((id) => window.clearInterval(id));
      gsap.to(darkStage, {
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => gsap.set(darkStage, { display: "none" })
      });
    }, 7700);
    timeoutIds.push(stopTimer);

    return () => {
      tl.kill();
      fireworksEnabled = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      if (resizeCanvas) {
        window.removeEventListener("resize", resizeCanvas);
      }
      intervalIds.forEach((id) => window.clearInterval(id));
      timeoutIds.forEach((id) => window.clearTimeout(id));
      gsap.killTweensOf(flashRef.current);
      gsap.killTweensOf(darkStage);
      celebrationLayer.innerHTML = "";
      if (ctx) {
        ctx.clearRect(0, 0, stageWidth, stageHeight);
      }
      gsap.set(flashRef.current, { opacity: 0 });
      gsap.set(darkStage, { opacity: 0, display: "none" });
    };
  }, [accepted, burst, confetti, flash, laserFanSweep, lightPulse]);

  const handleArenaPointerMove = (event) => {
    if (!ready || accepted || isNoButtonUnlocked) return;

    const { arenaLeft, arenaTop } = layoutRef.current;
    const pointerX = event.clientX - arenaLeft;
    const pointerY = event.clientY - arenaTop;
    pointerRef.current = { x: pointerX, y: pointerY, active: true };
  };

  const handleArenaPointerLeave = () => {
    pointerRef.current.active = false;
  };

  const handleNoButtonPress = (event) => {
    if (isNoButtonUnlocked) return;
    event.preventDefault();
    event.stopPropagation();

    const { arenaLeft, arenaTop } = layoutRef.current;
    const pointerX = event.clientX - arenaLeft;
    const pointerY = event.clientY - arenaTop;
    pointerRef.current = { x: pointerX, y: pointerY, active: true };
    kickAwayFromPointer(pointerX, pointerY, 15);
  };

  const handleNoButtonHover = (event) => {
    if (isNoButtonUnlocked) return;
    const { arenaLeft, arenaTop } = layoutRef.current;
    const pointerX = event.clientX - arenaLeft;
    const pointerY = event.clientY - arenaTop;
    pointerRef.current = { x: pointerX, y: pointerY, active: true };
    kickAwayFromPointer(pointerX, pointerY, 11);
  };

  const handleNoButtonClick = () => {
    if (!isNoButtonUnlocked) return;
    setAcceptMode("no");
    setAccepted(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        {floatingItems.map((item) => (
          <span
            key={item.id}
            className="ambient-item"
            style={{
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
              fontSize: item.size,
              opacity: item.opacity,
              "--drift": item.drift
            }}
          >
            {item.symbol}
          </span>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.62),transparent_46%),radial-gradient(circle_at_20%_15%,rgba(255,160,203,0.32),transparent_38%),radial-gradient(circle_at_85%_12%,rgba(255,224,147,0.32),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(255,164,136,0.28),transparent_35%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center">
        <section className="w-full max-w-3xl">
          <article
            ref={cardRef}
            className="invite-card rounded-[2rem] p-6 sm:p-10"
          >
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.28em] text-rose-500/80">
              Valentine Invitation
            </p>
            <h1 className="title-iseoyun text-center text-3xl leading-tight text-rose-950 sm:text-5xl">
              {PROMPT_LINE_1}
              <br />
              {PROMPT_LINE_2}
            </h1>

            <div
              ref={arenaRef}
              onPointerEnter={handleArenaPointerMove}
              onPointerMove={handleArenaPointerMove}
              onPointerLeave={handleArenaPointerLeave}
              className="arena-surface relative mt-9 h-44 rounded-3xl border border-white/60 bg-white/70 px-3 pb-12 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:h-40"
            >
              {!isNoButtonUnlocked && (
                <button
                  ref={yesButtonRef}
                  onClick={() => {
                    setAcceptMode("yes");
                    setAccepted(true);
                  }}
                  className={`yes-button absolute left-1/2 top-1/2 -translate-x-[112%] -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 px-6 py-3 text-base font-bold text-white shadow-glam transition-all duration-200 hover:scale-105 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 ${
                    isFurious ? "yes-button-fire" : ""
                  }`}
                  type="button"
                >
                  {isFurious && (
                    <span
                      className="rage-flames"
                      aria-hidden="true"
                    >
                      <canvas
                        ref={rageFireCanvasRef}
                        className="rage-fire-canvas"
                      />
                    </span>
                  )}
                  <span className="yes-label">동의함</span>
                </button>
              )}

              <button
                ref={noButtonRef}
                onClick={handleNoButtonClick}
                onPointerEnter={isNoButtonUnlocked ? undefined : handleNoButtonHover}
                onPointerDown={isNoButtonUnlocked ? undefined : handleNoButtonPress}
                onFocus={
                  isNoButtonUnlocked
                    ? undefined
                    : () => kickAwayFromPointer(noButtonPosRef.current.x, noButtonPosRef.current.y, 9)
                }
                className={`no-button rounded-full bg-white px-6 py-3 text-base font-semibold text-rose-700 shadow-[0_10px_30px_rgba(255,97,164,0.2)] ring-1 ring-rose-100 ${
                  isNoButtonUnlocked ? "no-button-final" : ""
                }`}
                style={{ visibility: isNoButtonUnlocked || ready ? "visible" : "hidden" }}
                tabIndex={isNoButtonUnlocked ? 0 : -1}
                type="button"
              >
                동의 안함
              </button>

              <p className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-center text-xs font-medium text-rose-800/70">
                {isNoButtonUnlocked
                  ? "그렇게 원하시면 동의하지 마세요"
                  : dodgeCount > 50
                  ? `동의안함 버튼이 ${dodgeCount}번 도망갔어요 · 이제 동의함을 눌러주세요`
                  : dodgeCount > 0
                  ? `동의안함 버튼이 ${dodgeCount}번 도망갔어요`
                  : "동의 하실 거죠"}
              </p>
            </div>
          </article>

          <article
            ref={successRef}
            className="success-card relative hidden overflow-hidden rounded-[2rem] p-8 text-center sm:p-12"
          >
            <div className="success-glow pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.7),transparent_45%),radial-gradient(circle_at_80%_65%,rgba(255,140,179,0.45),transparent_42%),radial-gradient(circle_at_50%_95%,rgba(255,204,140,0.38),transparent_40%)]" />
            <p className="relative mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-rose-500/80">
              Reservation Complete
            </p>
            <h2 className="title-iseoyun relative text-4xl text-rose-900 sm:text-5xl">
              약속 성사
            </h2>
            <p className="relative mt-5 whitespace-pre-line text-lg font-semibold text-rose-800 sm:text-2xl">
              {acceptMode === "no" ? SUCCESS_TEXT_NO : SUCCESS_TEXT_YES}
            </p>
          </article>
        </section>
      </main>

      <div
        ref={darkStageRef}
        className="stage-dark pointer-events-none absolute inset-0 z-[18] hidden"
      />

      <canvas
        ref={fireworkCanvasRef}
        className="fireworks-canvas pointer-events-none absolute inset-0 z-[19]"
      />

      <div
        ref={burstRef}
        className="pointer-events-none absolute inset-0 z-20"
      />
      <div
        ref={flashRef}
        className="screen-flash pointer-events-none absolute inset-0 z-30"
      />
    </div>
  );
}

export default App;
