import { CHART_WIDTH } from './constants'
import { Outlet } from 'react-router'

export default function Root() {
  return (
    <main
      className="mx-auto flex min-h-screen w-full flex-col gap-4 px-4 py-8"
      style={{ maxWidth: CHART_WIDTH + 32 }}
    >
      <Outlet />
    </main>
  )
}
