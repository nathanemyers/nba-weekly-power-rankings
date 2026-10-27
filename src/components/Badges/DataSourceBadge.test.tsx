import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import DataSourceBadge from './DataSourceBadge'
import { DataSource } from 'types'

describe('DataSourceBadge', () => {
  it("links NBA.com seasons to NBA.com's Power Rankings", () => {
    render(<DataSourceBadge source={DataSource.NBA} season="2024-25" />)
    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('Source: NBA.com')
    expect(link).toHaveAttribute('href', 'https://www.nba.com/news/category/power-rankings')
    expect(link).toHaveAttribute('title', expect.stringContaining('John Schuhmann'))
  })

  it("links ESPN seasons to that season's ESPN archive page", () => {
    render(<DataSourceBadge source={DataSource.ESPN} season="2007-08" />)
    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('Source: ESPN')
    expect(link).toHaveAttribute('href', 'https://www.espn.com/nba/powerrankings/_/year/2008')
    expect(link).toHaveAttribute('title', expect.stringContaining('Marc Stein'))
    expect(link).toHaveAttribute('target', '_blank')
  })
})
