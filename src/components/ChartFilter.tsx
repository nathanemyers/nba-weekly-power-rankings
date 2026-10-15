import {
  westernConferenceTeams,
  easternConferenceTeams,
  southwestDivisionTeams,
  pacificDivisionTeams,
  northwestDivisionTeams,
  southeastDivisionTeams,
  centralDivisionTeams,
  atlanticDivisionTeams,
} from 'types'

import { Button } from '@/components/ui/button'
import { setPinnedTeams } from 'store/slices/chart'
import { useAppDispatch } from '@/store/hooks'

export default function ChartFilter() {
  const dispatch = useAppDispatch()
  return (
    <div className="flex flex-col gap-4">
      <Button onClick={() => dispatch(setPinnedTeams(westernConferenceTeams))}>
        Western Conference
      </Button>
      <Button onClick={() => dispatch(setPinnedTeams(easternConferenceTeams))}>
        Eastern Conference
      </Button>

      <Button onClick={() => dispatch(setPinnedTeams(southwestDivisionTeams))}>
        Southwest Division
      </Button>
      <Button onClick={() => dispatch(setPinnedTeams(pacificDivisionTeams))}>
        Pacific Division
      </Button>
      <Button onClick={() => dispatch(setPinnedTeams(northwestDivisionTeams))}>
        Northwest Division
      </Button>

      <Button onClick={() => dispatch(setPinnedTeams(southeastDivisionTeams))}>
        Southeast Division
      </Button>
      <Button onClick={() => dispatch(setPinnedTeams(centralDivisionTeams))}>
        Central Division
      </Button>
      <Button onClick={() => dispatch(setPinnedTeams(atlanticDivisionTeams))}>
        Atlantic Division
      </Button>
    </div>
  )
}
