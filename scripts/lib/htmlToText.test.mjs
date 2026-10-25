import { describe, expect, it } from 'vitest'
import { htmlToText } from './htmlToText.mjs'

describe('htmlToText', () => {
  it('turns paragraphs, line breaks and list items into lines', () => {
    expect(htmlToText('<p>One</p><p>Two<br/>Three</p><ul><li>a</li><li>b</li></ul>')).toBe(
      'One\nTwo\nThree\n- a\n- b',
    )
  })

  it('strips inline tags', () => {
    expect(htmlToText('<p><strong>Record:</strong> <a href="x">29-3</a></p>')).toBe('Record: 29-3')
  })

  it('decodes named, decimal and hex entities', () => {
    expect(htmlToText('Tom &amp;&nbsp;Jerry &#39;s &#x2019;')).toBe("Tom & Jerry 's ’")
  })

  it('decodes Windows-1252 numeric entities', () => {
    expect(htmlToText('a&#133;b')).toBe('a…b')
    expect(htmlToText('&#146;&#147;&#148;&#150;&#151;')).toBe('’“”–—')
    expect(htmlToText('&#x85;')).toBe('…')
  })
})
