import {
  buildImageFallbackTargets,
  decodePreviewUrlFromReferer,
  sanitizeRelativePath,
} from '../src/utils/image-fallback'

describe('[Image fallback route]', () => {
  it('extracts preview URL from encoded referer path', () => {
    const referer =
      'http://localhost:5173/https%3A%2F%2Fgithub.com%2FOpenEmu%2Fopenemu.github.io'

    expect(decodePreviewUrlFromReferer(referer)).toBe(
      'https://github.com/OpenEmu/openemu.github.io',
    )
  })

  it('builds deduplicated raw targets for github repositories', () => {
    const targets = buildImageFallbackTargets(
      'https://github.com/OpenEmu/openemu.github.io',
      'logo.png',
    )

    expect(targets).toEqual(
      expect.arrayContaining([
        'https://raw.githubusercontent.com/OpenEmu/openemu.github.io/master/img/logo.png',
        'https://raw.githubusercontent.com/OpenEmu/openemu.github.io/main/img/logo.png',
      ]),
    )
  })

  it('sanitizes image fallback paths', () => {
    expect(sanitizeRelativePath('logo.png')).toBe('logo.png')
    expect(sanitizeRelativePath('nested/path/logo.png')).toBe(
      'nested/path/logo.png',
    )
    expect(sanitizeRelativePath('../logo.png')).toBeUndefined()
    expect(sanitizeRelativePath('./logo.png')).toBeUndefined()
  })

  it('resolves first candidate before fallback branch candidate', () => {
    const targets = buildImageFallbackTargets(
      'https://github.com/OpenEmu/openemu.github.io',
      'logo.png',
    )

    expect(targets[0]).toBe(
      'https://raw.githubusercontent.com/OpenEmu/openemu.github.io/master/img/logo.png',
    )
  })
})
