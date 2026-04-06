<script>
  import Form from '../components/Form.svelte'
  import Logo from '../components/Logo.svelte'
</script>

<main>
  <nav>
    <Logo />
    <h1>Static Preview</h1>
    <h2>Git Repos as Static Sites</h2>
  </nav>
  <Form />
  <footer>
    Copyright &copy; 2022 &middot; Source on
    <a target="_blank" href="https://github.com/SirajChokshi/static-preview"
      >Github</a
    >
  </footer>
</main>

<style lang="scss">
  nav {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: spacing(0, 0, 5, 0);
  }

  h1,
  h2 {
    font-size: 1.375rem;
    font-weight: 600;
    margin: 0.5rem 0;
  }

  h1 {
    margin-top: 1.5rem;
  }

  h2 {
    font-size: 1.125rem;
    font-weight: 400;
    color: var(--dark-2);
  }

  main {
    width: 95%;
    margin: 0 auto;
    max-width: 47.5ch;
    text-align: center;
    margin-top: 20vh;
    box-sizing: border-box;
    border-radius: spacing(2);
  }

  footer {
    margin-top: 5vh;
  }
</style>
