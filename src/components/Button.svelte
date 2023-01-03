<script lang="ts">
  type ButtonType = 'primary' | 'secondary'

  export let type: ButtonType = 'primary'
  export let disabled = false
</script>

<button
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  {disabled}
  class={type}
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
    border-radius: spacing(1);
    box-sizing: border-box;
    font-size: 1rem;
    color: var(--light);
    font-family: var(--fonts);
    font-weight: 400;

    border: 1px solid var(--blue-2);
    background-color: var(--blue);

    &.secondary {
      background: transparent;
      border-color: var(--blue);
      color: var(--blue);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &:focus {
      outline: 2px solid;
      outline-offset: -2;
      outline-color: var(--blue);
    }
  }
</style>
