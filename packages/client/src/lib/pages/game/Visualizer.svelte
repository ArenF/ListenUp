<script lang="ts">
  interface Props {
    /** 비주얼라이저 동작 여부 (게임 진행 중일 때 true) */
    playing?: boolean;
    /** 바 강도 (0~1) — 기본 1 */
    intensity?: number;
  }
  let { playing = true, intensity = 1 }: Props = $props();

  // 원형 비주얼라이저 파라미터 (목업과 동일)
  const CX = 200;
  const CY = 200;
  const BARS = 96;
  const MAX = 200;
  // 메인 그라디언트 3색: 시안 → 블루바이올렛 → 핑크
  const C1: [number, number, number] = [34, 211, 238];
  const C2: [number, number, number] = [124, 156, 255];
  const C3: [number, number, number] = [244, 114, 182];

  function lerp3(
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    t: number
  ): [number, number, number] {
    // 0~0.5: C1→C2, 0.5~1: C2→C3
    if (t < 0.5) {
      const k = t / 0.5;
      return [
        C1[0] + (C2[0] - C1[0]) * k,
        C1[1] + (C2[1] - C1[1]) * k,
        C1[2] + (C2[2] - C1[2]) * k,
      ];
    }
    const k = (t - 0.5) / 0.5;
    return [
      C2[0] + (C3[0] - C2[0]) * k,
      C2[1] + (C2[1] - C2[1]) * k,
      C2[2] + (C3[2] - C2[2]) * k,
    ];
  }

  let svg: SVGSVGElement | undefined = $state();
  let rafId = 0;
  let startTime = 0;

  $effect(() => {
    if (!svg) return;

    // 96개 바 생성 (한 번만)
    const rects: SVGRectElement[] = [];
    for (let i = 0; i < BARS; i++) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const [r, g, b] = lerp3(C1, C2, C3, i / BARS);
      rect.setAttribute('fill', `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},.88)`);
      svg.appendChild(rect);
      rects.push(rect);
    }

    startTime = performance.now();

    const loop = (now: number) => {
      if (playing) {
        const t = (now - startTime) / 1000;
        rects.forEach((rect, i) => {
          const angle = (i / BARS) * Math.PI * 2 - Math.PI / 2;
          // 합성 스펙트럼 — 여러 사인파 합성으로 BPM 느낌 (Web Audio 교체 전)
          const energy =
            Math.abs(Math.sin(t * 1.7 + i * 0.55)) * 0.55 +
            Math.abs(Math.sin(t * 0.9 + i * 0.21)) * 0.3 +
            Math.abs(Math.sin(t * 3.3 + i * 0.13)) * 0.25;
          const len = 30 + energy * intensity * (MAX - 30) * 0.92;
          rect.setAttribute('transform', `rotate(${(angle * 180) / Math.PI + 90} ${CX} ${CY})`);
          rect.setAttribute('x', String(CX - 1.3));
          rect.setAttribute('y', String(CY - 104 - len));
          rect.setAttribute('width', '2.6');
          rect.setAttribute('height', String(len));
        });
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  });
</script>

<div class="viz-core">
  <svg bind:this={svg} viewBox="0 0 400 400" aria-hidden="true"></svg>
  <!-- 중앙 글로우 (호흡) -->
  <div class="glow"></div>
  <!-- 액센트 링 -->
  <div class="ring"></div>
  <div class="ring ring-dashed"></div>
</div>

<style>
  .viz-core {
    position: relative;
    width: 600px;
    height: 600px;
  }
  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .glow {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 300px;
    height: 300px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124, 156, 255, 0.22), transparent 70%);
    filter: blur(6px);
    animation: viz-pulse 2.4s ease-in-out infinite;
  }
  .ring {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid rgba(124, 156, 255, 0.28);
    width: 420px;
    height: 420px;
  }
  .ring-dashed {
    border: 1px dashed rgba(244, 114, 182, 0.2);
    width: 470px;
    height: 470px;
    animation: viz-spin 22s linear infinite;
  }
  @keyframes viz-pulse {
    0%,
    100% {
      transform: translate(-50%, -50%) scale(0.94);
      opacity: 0.75;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.06);
      opacity: 1;
    }
  }
  @keyframes viz-spin {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
</style>