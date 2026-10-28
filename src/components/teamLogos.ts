import { Team } from 'types'
import atl from 'staticAssets/logos/icon/atl.png'
import bos from 'staticAssets/logos/icon/bos.gif'
import bkn from 'staticAssets/logos/icon/bkn.png'
import cha from 'staticAssets/logos/icon/cha.png'
import chi from 'staticAssets/logos/icon/chi2.png'
import cle from 'staticAssets/logos/icon/cle.png'
import dal from 'staticAssets/logos/icon/dal.png'
import den from 'staticAssets/logos/icon/den.png'
import det from 'staticAssets/logos/icon/det.png'
import gsw from 'staticAssets/logos/icon/gsw.png'
import hou from 'staticAssets/logos/icon/hou.png'
import ind from 'staticAssets/logos/icon/ind.png'
import lac from 'staticAssets/logos/icon/lac.png'
import lal from 'staticAssets/logos/icon/lal.png'
import mem from 'staticAssets/logos/icon/mem.png'
import mia from 'staticAssets/logos/icon/mia2.png'
import mil from 'staticAssets/logos/icon/mil.png'
import min from 'staticAssets/logos/icon/min.png'
import nop from 'staticAssets/logos/icon/nop2.png'
import nyk from 'staticAssets/logos/icon/nyk.png'
import okc from 'staticAssets/logos/icon/okc.png'
import orl from 'staticAssets/logos/icon/orl.png'
import phi from 'staticAssets/logos/icon/phi.png'
import phx from 'staticAssets/logos/icon/phx.png'
import por from 'staticAssets/logos/icon/por.png'
import sac from 'staticAssets/logos/icon/sac.png'
import sas from 'staticAssets/logos/icon/sas.png'
import tor from 'staticAssets/logos/icon/tor.png'
import uta from 'staticAssets/logos/icon/uta2.png'
import was from 'staticAssets/logos/icon/was.png'

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

export function getTeamLogoUrl(team: Team) {
  return LOGOS[team]
}
