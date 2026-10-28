<!-- 잔잔한 수면: 3겹 파도선이 서로 다른 속도로 흐른다 -->
<script lang="ts">
  interface Props {
    calm?: boolean;
  }
  let { calm = false }: Props = $props();

  // 한 주기 = 200 단위. 두 주기를 이어 붙여 translateX(-50%) 무한 루프
  const wave = (amp: number, y: number) => {
    let d = `M0 ${y}`;
    for (let i = 0; i < 4; i++) {
      const x = i * 100;
      d += ` Q${x + 25} ${y - amp} ${x + 50} ${y} T${x + 100} ${y}`;
    }
    return d + ' V40 H0 Z';
  };
</script>

<div class="surface" class:calm aria-hidden="true">
  <svg class="w w3" viewBox="0 0 400 40" preserveAspectRatio="none"><path d={wave(3, 14)} /></svg>
  <svg class="w w2" viewBox="0 0 400 40" preserveAspectRatio="none"><path d={wave(4, 18)} /></svg>
  <svg class="w w1" viewBox="0 0 400 40" preserveAspectRatio="none"><path d={wave(5, 22)} /></svg>
  <div class="glint"></div>
</div>

<style lang="scss">
  .surface {
    position: relative;
    height: 40px;
    overflow: hidden;
  }

  .w {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 200%;
    height: 100%;
    animation: drift linear infinite;
  }

  .w3 {
    fill: rgba(150, 226, 232, 0.55);
    animation-duration: 14s;
    animation-direction: reverse;
  }
  .w2 {
    fill: rgba(92, 208, 218, 0.75);
    animation-duration: 10s;
  }
  .w1 {
    fill: var(--sea-surface);
    animation-duration: 7s;
  }

  .calm .w {
    animation-duration: 22s;
  }

  .glint {
    position: absolute;
    inset: auto 0 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7) 30%, transparent 55%, rgba(255, 255, 255, 0.5) 80%, transparent);
    background-size: 200% 100%;
    animation: glint 6s linear infinite;
    opacity: 0.5;
  }

  @keyframes drift {
    to {
      transform: translateX(-50%);
    }
  }
  @keyframes glint {
    to {
      background-position: -200% 0;
    }
  }
</style>
