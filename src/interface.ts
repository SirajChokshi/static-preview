import {
  DEFAULT_URL,
  URL_INPUT_ID,
  URL_SUBMIT_ID,
  PREVIEW_ID,
  IFRAME_ID,
} from './constants'
import { isValidURL, QueryParams } from './helpers'

import renderPage from './preview'

const $urlInput = document.querySelector<HTMLInputElement>(URL_INPUT_ID)!
const $urlSubmit = document.querySelector<HTMLButtonElement>(URL_SUBMIT_ID)!
const $preview = document.querySelector<HTMLDivElement>(PREVIEW_ID)!
const $help = document.querySelector<HTMLDivElement>('#help')!

export default function view(params: Record<string, string>) {
  // init url
  let url = DEFAULT_URL

  // add listeners
  $urlInput.addEventListener('input', (e) => {
    const { value } = (<HTMLInputElement>e.target)!

    if (!value) {
      $urlSubmit.disabled = true
    } else {
      $urlSubmit.disabled = false
    }

    url = value
  })

  $urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      updatePreviewURL(url)
    }
  })

  $urlSubmit.addEventListener('click', () => updatePreviewURL(url))

  // process received (or default) url
  updatePreviewURL(params.url ?? url)

  function updatePreviewURL(newURL: string) {
    if (newURL.length < 3 || !isValidURL(newURL)) {
      $preview.innerHTML = ''

      if (newURL.length < 1) {
        return
      }

      $help.classList.remove('error')
      // eslint-disable-next-line no-unused-expressions
      $help.offsetWidth
      $help.classList.add('error')

      return
    }

    QueryParams.set({ url: newURL })
    url = newURL
    $urlInput.value = newURL

    if (!newURL) {
      $preview.innerHTML = ''
      return
    }

    $preview.innerHTML = `
      <button id="min-button" class="square"><i class="gg-menu-grid-r"></i></button> 
      <div id="toolbar">
        <button id="close-button"><i class="gg-arrow-left"></i> Back</button>
        <div class="toolbar__right">
          <button id="max-button" class="square"><i class="gg-maximize-alt"></i></button>
        </div>
      </div>
      <iframe id="${IFRAME_ID.substring(1)}"></iframe>
    `

    renderPage(url)

    document.getElementById('close-button')!.onclick = () => {
      updatePreviewURL('')
      QueryParams.set({ url: '' })
      $urlInput.value = ''
    }

    const $minButton = document.querySelector<HTMLDivElement>('#min-button')!
    const $maxButton = document.querySelector<HTMLDivElement>('#max-button')!

    $maxButton.addEventListener('click', () => {
      $preview.classList.remove('is-minimized')
    })

    $minButton.addEventListener('click', () => {
      $preview.classList.add('is-minimized')
    })
  }
}
