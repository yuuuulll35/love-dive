<script lang="ts">
  import Button from '$shared/ui/Button.svelte';
  import { copyText } from './clipboard';
  import { shareUrl } from './share-url';
  import { saveCardImage } from './save-image';

  interface Props {
    card: HTMLElement | undefined;
    filename: string;
    onretry: () => void;
    onreplay?: () => void;
    /** 이 결과에 페어 이미지가 붙어 있는지 (링크에는 담기지 않는다) */
    hasImage?: boolean;
    /** 링크 미리보기 페이지 이름 (share-key.ts) */
    shareKey: string;
  }
  let { card, filename, onretry, onreplay, hasImage = false, shareKey }: Props = $props();

  let toast = $state('');
  let toastSub = $state('');
  let saving = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  // 결과 화면(.result)은 backdrop-filter 때문에 fixed 기준이 되어, 스크롤하면 토스트가 화면 밖으로 밀린다 → body 로 옮긴다
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return { destroy: () => node.remove() };
  }

  function say(msg: string, sub = '') {
    toast = msg;
    toastSub = sub;
    clearTimeout(timer);
    timer = setTimeout(() => (toast = ''), sub ? 3600 : 2400);
  }

  // 결과 링크: 코드와 페어 이름이 주소에 담겨 있어서, 받은 사람도 같은 결과를 보게 된다 (이미지는 제외).
  // 공개 사이트에서는 결과 종류별 미리보기 페이지(s/<key>/)를 거쳐 메신저에 칭호·구간이 담긴 카드가 뜬다
  async function copyLink() {
    const ok = await copyText(shareUrl(shareKey));
    if (!ok) return say('복사하지 못했어요. 주소창의 링크를 직접 복사해 주세요');
    // 다른 페이지 안에 끼워진 미리보기라면 이 주소는 바깥에서 열리지 않을 수 있다
    const sub = hasImage ? '페어 이미지는 링크로 공유되지 않아요. 이미지 저장을 이용해 주세요' : '';
    say(window.top !== window.self ? '복사했어요. 미리보기에서는 공유 메뉴의 링크를 써 주세요' : '결과 링크를 복사했어요', sub);
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
      결과 링크 복사
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
  <div class="toast" class:show={!!toast} role="status" aria-live="polite" use:portal>
    {toast}
    {#if toastSub}<small>{toastSub}</small>{/if}
  </div>
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
    display: grid;
    gap: 2px;
    width: max-content;
    padding: 10px 18px;
    border-radius: 18px;
    text-align: center;
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
    small {
      font-size: 12px;
      font-weight: 400;
      color: rgba(11, 28, 44, 0.65);
      text-wrap: balance;
    }
  }
</style>
