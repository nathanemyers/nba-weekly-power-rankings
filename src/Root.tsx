import type { ReactNode } from 'react'
import { CHART_WIDTH } from './constants'
import { Outlet } from 'react-router'

function Shell(props: { children: ReactNode }) {
  return (
    <main
      className="mx-auto flex min-h-screen w-full flex-col gap-4 px-4 py-8"
      style={{ maxWidth: CHART_WIDTH + 32 }}
    >
      {props.children}
    </main>
  )
}

export function RootFallback() {
  return (
    <Shell>
      <p className="pt-[30vh] text-6xl text-center text-muted-foreground">
        Loading…
      </p>
    </Shell>
  )
}

export default function Root() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}
