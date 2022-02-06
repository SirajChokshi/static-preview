import {
  DEFAULT_URL,
  URL_INPUT_ID,
  URL_SUBMIT_ID,
  PREVIEW_ID,
} from './constants'
import { QueryParams } from './helpers'

export default class View {
  $urlInput
  $urlSubmit
  $preview

  url: string = DEFAULT_URL

  constructor(params: Record<string, string>) {
    this.$urlInput = document.querySelector<HTMLInputElement>(URL_INPUT_ID)!
    this.$urlSubmit = document.querySelector<HTMLButtonElement>(URL_SUBMIT_ID)!
    this.$preview = document.querySelector<HTMLDivElement>(PREVIEW_ID)!

    this.$urlInput.addEventListener(
      'input',
      (e) => (this.url = (<HTMLInputElement>e.target)!.value),
    )

    this.$urlSubmit.addEventListener('click', () =>
      this.updatePreviewURL(this.url),
    )

    this.updatePreviewURL(params.url ?? this.url)
  }

  private updatePreviewURL(url: string) {
    QueryParams.set({ url })
    this.url = url

    if (!url) {
      this.$preview.innerHTML = '<b>try a repo</b>'
      return
    }

    this.$preview.innerHTML = `
      <button id="close-button"">&larr; Back</button>
      <iframe src="${url}">
    `

    document.getElementById('close-button')!.onclick = () =>
      this.updatePreviewURL('')
  }
}
