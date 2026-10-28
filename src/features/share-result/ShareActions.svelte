<script lang="ts">
  import Button from '$shared/ui/Button.svelte';
  import { copyText } from './clipboard';
  import { saveCardImage } from './save-image';

  interface Props {
    card: HTMLElement | undefined;
    filename: string;
    onretry: () => void;
    onreplay?: () => void;
  }
  let { card, filename, onretry, onreplay }: Props = $props();

  let toast = $state('');
  let saving = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  function say(msg: string) {
    toast = msg;
    clearTimeout(timer);
    timer = setTimeout(() => (toast = ''), 2400);
  }

  async function copyLink() {
    say((await copyText(location.href)) ? '링크를 복사했습니다' : '복사하지 못했습니다. 주소창의 링크를 직접 복사해 주세요');
  }

  async function save() {
    if (!card || saving) return;
    saving = true;
    try {
      const how = await saveCardImage(card, filename);
      if (how === 'downloaded') say('이미지를 저장했습니다');
    } catch {
      say('이미지를 만들지 못했습니다. 화면을 캡처해 주세요');
    } finally {
      saving = false;
    }
  }
</script>

<div class="actions">
  <div class="row">
    <Button variant="ghost" onclick={copyLink}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5l3-3M7 4.5l1.2-1.2a2.8 2.8 0 014 4L11 8.5M9 11.5l-1.2 1.2a2.8 2.8 0 01-4-4L5 7.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
      링크 복사
    </Button>
    <Button variant="ghost" onclick={save} disabled={saving || !card}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      {saving ? '만드는 중…' : '이미지 저장'}
    </Button>
  </div>
  <Button variant="primary" block onclick={onretry}>다시 측정</Button>
  {#if onreplay}
    <Button variant="quiet" size="sm" onclick={onreplay}>연출 다시 보기</Button>
  {/if}
  <div class="toast" class:show={!!toast} role="status" aria-live="polite">{toast}</div>
</div>

<style lang="scss">
  .actions {
    display: grid;
    gap: 10px;
    justify-items: center;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;

    :global(.btn) {
      width: 100%;
    }
    :global(.btn.quiet) {
      width: auto;
    }
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
  }

  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(24px + env(safe-area-inset-bottom));
    z-index: 50;
    max-width: calc(100% - 32px);
    padding: 10px 18px;
    border-radius: 999px;
    background: rgba(240, 248, 250, 0.95);
    color: #0b1c2c;
    font-size: 13.5px;
    font-weight: 500;
    transform: translate(-50%, 20px);
    opacity: 0;
    pointer-events: none;
    transition:
      opacity 0.25s,
      transform 0.35s var(--ease-out);

    &.show {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
</style>
