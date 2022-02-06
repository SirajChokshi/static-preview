import './style.css'
import { renderPage } from './preview'

const $app = document.querySelector<HTMLDivElement>('#app')!

$app.innerHTML = `
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`

renderPage("https://github.com/daviskeene/Portfolio")