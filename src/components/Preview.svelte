<script lang="ts">
  import { Preview } from '../utils/preview'
  import Button from './Button.svelte'
  import Fullscreen from 'svelte-bootstrap-icons/lib/Fullscreen.svelte'
  import FullscreenExit from 'svelte-bootstrap-icons/lib/FullscreenExit.svelte'

  import { goto } from '$app/navigation'
  import Spinner from './icons/Spinner.svelte'

  export let url: string | undefined

  let loading = true
  let preview: Preview | undefined = undefined

  $: {
    if (url) {
      const decodedUrl = decodeURIComponent(url)

      if (typeof window !== 'undefined') {
        if (!preview) {
          preview = new Preview('#site-frame')
        }

        preview.render(decodedUrl).then(() => {
          loading = false
        })
      }
    }
  }
</script>

<header>
  <Button
    on:click={() => {
      goto('/')
    }}>Leave Preview</Button
  >
</header>

<iframe title="Site Preview" id="site-frame" />

{#if loading}
  <div class="splash">
    <Spinner />
  </div>
{/if}

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
    left: 0;
    top: 0;
    width: 100%;
    height: calc(100% - 3.5rem);
    transform: translateY(3.5rem);

    // reset to default page background
    background: white;
  }

  .splash {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2.25rem;
    font-weight: bold;
    color: var(--dark-2);
    backdrop-filter: blur(5px);
    z-index: 1;

    :global(svg) {
      animation: spin 2s cubic-bezier(0.075, 0.82, 0.165, 1) infinite;

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    }
  }

  header {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    padding: 1rem;
    height: 3.5rem;
    box-sizing: border-box;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    z-index: 2;

    padding: spacing(0.5);
    background: white;

    border-bottom: 1px solid var(--light-2);

    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.1);
  }
</style>
