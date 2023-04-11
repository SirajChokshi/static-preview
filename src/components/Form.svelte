<script lang="ts">
  import { goto } from '$app/navigation'

  import { RESOURCES } from '../constants/resources'
  import { isValidURL, getResourceType } from '../utils/url'

  import Button from './Button.svelte'

  let url = ''
  let isError = false

  function handleSubmit() {
    isError = false
    if (isValidURL(url)) {
      goto(`/${encodeURIComponent(url)}`, { replaceState: false })
    } else {
      isError = true
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  $: url, (isError = false)
  $: urlResource = getResourceType(url)
</script>

<div>
  <section role="form" on:keydown={handleKeyDown}>
    <div class="input-wrapper">
      <div class="icon-wrapper">
        <svelte:component this={RESOURCES[urlResource].icon} />
      </div>
      <input bind:value={url} placeholder="e.g. https://example.com" />
    </div>
    <Button on:click={handleSubmit} disabled={!url}>Preview</Button>
  </section>

  <p class:error={isError}>
    Link to a repository/folder with an index.html file on Github or Gitlab or a
    directly to any HTML file.
  </p>
</div>

<style lang="scss">
  section {
    display: flex;

    .input-wrapper {
      display: flex;
      flex: 1;
      justify-content: center;
      align-items: stretch;
      border-radius: spacing(0.925);
      background: white;
      border: 1px solid var(--light-3);
      overflow: hidden;

      margin-right: 0.5rem;

      &:focus-within {
        outline: 2px solid;
        outline-offset: -2;
        outline-color: var(--blue);
      }
    }

    .icon-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;

      width: 2rem;

      border-right: none;

      color: var(--dark-2);

      :global(svg) {
        width: 24px;
        height: 24px;
      }
    }

    input {
      flex: 1;
      width: 100%;
      font-family: var(--fonts);
      font-size: 1rem;
      font-weight: 500;
      border: none;
      color: var(--dark);

      &:focus {
        outline: none;
      }
    }
  }

  p {
    color: var(--dark-2);
    font-size: 0.875rem;
    line-height: 1.75;
    max-width: 80%;
    margin: 1.5rem auto;

    &.error {
      color: var(--red);
      animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes shake {
    10%,
    90% {
      transform: translate3d(-1px, 0, 0);
    }

    20%,
    80% {
      transform: translate3d(2px, 0, 0);
    }

    30%,
    50%,
    70% {
      transform: translate3d(-4px, 0, 0);
    }

    40%,
    60% {
      transform: translate3d(4px, 0, 0);
    }
  }
</style>
