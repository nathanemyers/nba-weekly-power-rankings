import { Team, Teams } from 'types'
import atl from 'staticAssets/logos/atl.png'
import bos from 'staticAssets/logos/bos.gif'
import bkn from 'staticAssets/logos/byn.png'
import cha from 'staticAssets/logos/cha.png'
import chi from 'staticAssets/logos/chi.png'
import cle from 'staticAssets/logos/cle.png'
import dal from 'staticAssets/logos/dal.png'
import den from 'staticAssets/logos/den.png'
import det from 'staticAssets/logos/det.png'
import gsw from 'staticAssets/logos/gsw.png'
import hou from 'staticAssets/logos/hou.png'
import ind from 'staticAssets/logos/ind.png'
import lac from 'staticAssets/logos/lac.png'
import lal from 'staticAssets/logos/lal.png'
import mem from 'staticAssets/logos/mem.png'
import mia from 'staticAssets/logos/mia.png'
import mil from 'staticAssets/logos/mil.png'
import min from 'staticAssets/logos/min.png'
import nop from 'staticAssets/logos/nop.png'
import nyk from 'staticAssets/logos/nyk.png'
import okc from 'staticAssets/logos/okc.png'
import orl from 'staticAssets/logos/orl.png'
import phi from 'staticAssets/logos/phi.png'
import phx from 'staticAssets/logos/pho.png'
import por from 'staticAssets/logos/por.png'
import sac from 'staticAssets/logos/sac.png'
import sas from 'staticAssets/logos/sas.png'
import tor from 'staticAssets/logos/tor.png'
import uta from 'staticAssets/logos/uta.png'
import was from 'staticAssets/logos/was.webp'

const LOGOS: Record<Team, string> = {
  [Team.Atlanta]: atl,
  [Team.Boston]: bos,
  [Team.Brooklyn]: bkn,
  [Team.Charlotte]: cha,
  [Team.Chicago]: chi,
  [Team.Cleveland]: cle,
  [Team.Dallas]: dal,
  [Team.Denver]: den,
  [Team.Detroit]: det,
  [Team.GoldenState]: gsw,
  [Team.Houston]: hou,
  [Team.Indiana]: ind,
  [Team.LAClippers]: lac,
  [Team.LALakers]: lal,
  [Team.Memphis]: mem,
  [Team.Miami]: mia,
  [Team.Milwaukee]: mil,
  [Team.Minnesota]: min,
  [Team.NewOrleans]: nop,
  [Team.NewYork]: nyk,
  [Team.OklahomaCity]: okc,
  [Team.Orlando]: orl,
  [Team.Philadelphia]: phi,
  [Team.Phoenix]: phx,
  [Team.Portland]: por,
  [Team.Sacramento]: sac,
  [Team.SanAntonio]: sas,
  [Team.Toronto]: tor,
  [Team.Utah]: uta,
  [Team.Washington]: was,
}

interface TeamLogoProps {
  team: Team
  className?: string
}

export default function TeamLogo({ team, className }: TeamLogoProps) {
  const name = Teams.find((t) => t.teamId === team)?.name
  return <img src={LOGOS[team]} alt={`${name} logo`} className={className} />
}
