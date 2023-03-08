<script lang="ts">
  type ButtonType = 'primary' | 'glass'
  type ButtonSize = 'sm' | 'md' | 'lg'

  export let size: ButtonSize = 'lg'
  export let variant: ButtonType = 'primary'
  export let disabled = false
  export let rounded = false
</script>

<button
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  {disabled}
  class={[variant, size].join(' ')}
  class:rounded
>
  <slot />
</button>

<style lang="scss">
  button {
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    padding: spacing(1.25, 2);
    border-radius: spacing(0.925);
    box-sizing: border-box;
    font-size: 1rem;
    color: var(--light);
    font-family: var(--fonts);
    font-weight: 400;

    border: 1px solid var(--blue-2);
    background-color: var(--blue);

    transition: all 0.075s ease-in-out;

    &.glass {
      background: var(--blue-transparent);
      border-color: var(--blue-transparent);
      color: var(--blue);
    }

    &.rounded {
      border-radius: 9999px !important;
    }

    &.sm {
      padding: spacing(0.5, 1);
      font-size: 0.75rem;
      border-radius: spacing(0.5);

      &:focus-visible {
        outline-offset: -1px;
        outline: 1px solid;
      }
    }

    &.md {
      padding: spacing(0.75, 1.5);
      font-size: 0.875rem;
      border-radius: spacing(0.75);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &:active {
      transform: scale(0.97);
    }

    &:focus-visible {
      outline: 2px solid;
      outline-offset: -2;
      outline-color: var(--blue);
    }
  }
</style>
