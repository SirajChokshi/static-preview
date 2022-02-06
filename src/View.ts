import {
  DEFAULT_URL,
  URL_INPUT_ID,
  URL_SUBMIT_ID,
  PREVIEW_ID,
} from './constants'
import { QueryParams } from './helpers'

const $urlInput = document.querySelector<HTMLInputElement>(URL_INPUT_ID)!
const $urlSubmit = document.querySelector<HTMLButtonElement>(URL_SUBMIT_ID)!
const $preview = document.querySelector<HTMLDivElement>(PREVIEW_ID)!

export default function view(params: Record<string, string>) {
  // init url
  let url = DEFAULT_URL

  // add listeners
  $urlInput.addEventListener('input', (e) => {
    url = (<HTMLInputElement>e.target)!.value
  })

  $urlSubmit.addEventListener('click', () => updatePreviewURL(url))

  // process received (or default) url
  updatePreviewURL(params.url ?? url)

  function updatePreviewURL(newURL: string) {
    QueryParams.set({ url: newURL })
    url = newURL

    if (!newURL) {
      $preview.innerHTML = '<b>try a repo</b>'
      return
    }

    $preview.innerHTML = `
      <button id="close-button"">&larr; Back</button>
      <iframe src="${url}">
    `

    document.getElementById('close-button')!.onclick = () =>
      updatePreviewURL('')
  }
}
