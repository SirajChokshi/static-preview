<script lang="ts">
  import Preview from '../components/Preview.svelte'
  import { page } from '$app/stores'
</script>

<Preview url={$page.params.slug} />
