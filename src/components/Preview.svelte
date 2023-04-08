<script lang="ts">
  import { Preview } from '../utils/preview'
  import Button from './Button.svelte'

  import { goto } from '$app/navigation'
  import Spinner from './icons/Spinner.svelte'

  export let url: string | undefined

  let loading = true
  let preview: Preview | undefined = undefined

  let title = ''

  $: {
    if (url) {
      const decodedUrl = decodeURIComponent(url)

      if (typeof window !== 'undefined') {
        if (!preview) {
          preview = new Preview('#site-frame')
        }

        preview.render(decodedUrl).then(() => {
          loading = false

          if (preview?.pageData.title) {
            // update with page title or URL
            title = preview.pageData.title
          }
        })
      }
    }
  }
</script>

<header>
  <Button
    variant="glass"
    rounded
    size="md"
    on:click={() => {
      goto('/')
    }}>&larr; Back</Button
  >
  <h1>{title}</h1>
  <Button
    disabled
    size="md"
    on:click={() => {
      goto('/')
    }}>&larr; Back</Button
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
    padding-top: 3.5rem;
    position: fixed;
    border: none;
    left: 0;
    top: 0;
    width: 100%;
    height: calc(100% - 3.5rem);

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
    top: 1rem;
    left: 1rem;
    display: flex;
    border-radius: 9999px;
    box-sizing: border-box;
    width: calc(100% - 2rem);
    justify-content: space-between;
    align-items: center;
    z-index: 2;

    padding: spacing(0.75);
    background: var(--light);
    border: 1px solid var(--light-2);

    box-shadow: 0 4px 7.6px rgba(0, 0, 0, 0.025);

    h1 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--dark-2);

      max-width: 500px;
      flex: 1;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    > :global(button:last-child) {
      visibility: hidden;
    }
  }
</style>
