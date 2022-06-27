import adapter from '@sveltejs/adapter-auto'
import preprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess({
    defaults: {
      script: 'typescript',
      style: 'scss',
    },
    scss: {
      prependData: `
				@import './src/style/helpers.scss';
			`,
    },
  }),

  kit: {
    adapter: adapter(),
  },
}

export default config
