<script lang="ts">
  export let size: 'small' | 'large' = 'large'
</script>

<img src="/logo.png" class={size} alt="Static Preview Logo" />

<style lang="scss">
  img {
    width: 7rem;

    &.small {
      width: 3.5rem;
    }

    filter: drop-shadow(0 4px 0.375rem var(--light-3));
  }
</style>
