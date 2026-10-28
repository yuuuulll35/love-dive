<script lang="ts">
  import InputPage from '$pages/input/InputPage.svelte';
  import DivePage from '$pages/dive/DivePage.svelte';
  import { router } from './router.svelte';
</script>

{#if router.route.name === 'dive'}
  {#key router.route.token}
    <DivePage token={router.route.token} />
  {/key}
{:else}
  <InputPage />
{/if}
