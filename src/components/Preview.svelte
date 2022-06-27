<script lang="ts">
  import renderPage from '../utils/preview'
  import Button from './Button.svelte'
  import Fullscreen from 'svelte-bootstrap-icons/lib/Fullscreen.svelte'
  import FullscreenExit from 'svelte-bootstrap-icons/lib/FullscreenExit.svelte'

  import { goto } from '$app/navigation'

  export let url: string | undefined

  let minimized = true

  $: {
    if (url) {
      renderPage(url)
    }
  }
</script>

{#if !minimized}
  <Button on:click={() => (minimized = true)}><FullscreenExit /></Button>
{/if}
<header class:max={!minimized}>
  <Button
    on:click={() => {
      goto('/')
    }}>Back</Button
  >
  <Button on:click={() => (minimized = false)}><Fullscreen /></Button>
</header>
<iframe class:max={!minimized} title="Site Preview" id="site-frame" />

<style lang="scss">
  :global(main > button) {
    position: absolute;
    z-index: 999;
    right: 4rem;
    top: 1rem;
  }

  iframe {
    position: fixed;
    border: none;
    left: 50%;
    top: 50%;
    width: calc(100% - 8rem);
    height: calc(100% - 7rem);
    transform: translate(-50%, calc(-50% + 1.5rem));
    border-radius: spacing(0.5);

    transition: all 0.15s cubic-bezier(0.785, 0.135, 0.15, 0.86);

    &.max {
      border-radius: 0;
      width: 100%;
      height: 100%;
      transform: translate(-50%, -50%);
    }
  }

  header {
    position: fixed;
    top: 1rem;
    left: 4rem;
    display: flex;
    padding: 1rem;
    box-sizing: border-box;
    width: calc(100% - 8rem);
    justify-content: space-between;
    align-items: center;

    padding: spacing(0.5);
    background: white;
    border-radius: spacing(0.5);

    transform: translateY(0);
    transition: transform 0.15s cubic-bezier(0.785, 0.135, 0.15, 0.86);

    &.max {
      transform: translateY(-8rem);
    }
  }
</style>
