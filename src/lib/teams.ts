export interface TeamMeta {
  abbr: string;      // ESPN abbreviation, used for logo URL
  name: string;      // display name
  city: string;
  primary: string;   // hex accent color, optional use
}

export const TEAMS: Record<string, TeamMeta> = {
  ARI: { abbr: 'ari', name: 'Cardinals',   city: 'Arizona',       primary: '#97233F' },
  ATL: { abbr: 'atl', name: 'Falcons',     city: 'Atlanta',       primary: '#A71930' },
  BAL: { abbr: 'bal', name: 'Ravens',      city: 'Baltimore',     primary: '#241773' },
  BUF: { abbr: 'buf', name: 'Bills',       city: 'Buffalo',       primary: '#00338D' },
  CAR: { abbr: 'car', name: 'Panthers',    city: 'Carolina',      primary: '#0085CA' },
  CHI: { abbr: 'chi', name: 'Bears',       city: 'Chicago',       primary: '#0B162A' },
  CIN: { abbr: 'cin', name: 'Bengals',     city: 'Cincinnati',    primary: '#FB4F14' },
  CLE: { abbr: 'cle', name: 'Browns',      city: 'Cleveland',     primary: '#311D00' },
  DAL: { abbr: 'dal', name: 'Cowboys',     city: 'Dallas',        primary: '#003594' },
  DEN: { abbr: 'den', name: 'Broncos',     city: 'Denver',        primary: '#FB4F14' },
  DET: { abbr: 'det', name: 'Lions',       city: 'Detroit',       primary: '#0076B6' },
  GB:  { abbr: 'gb',  name: 'Packers',     city: 'Green Bay',     primary: '#203731' },
  HOU: { abbr: 'hou', name: 'Texans',      city: 'Houston',       primary: '#03202F' },
  IND: { abbr: 'ind', name: 'Colts',       city: 'Indianapolis',  primary: '#002C5F' },
  JAX: { abbr: 'jax', name: 'Jaguars',     city: 'Jacksonville',  primary: '#101820' },
  KC:  { abbr: 'kc',  name: 'Chiefs',      city: 'Kansas City',   primary: '#E31837' },
  LAC: { abbr: 'lac', name: 'Chargers',    city: 'Los Angeles',   primary: '#0080C6' },
  LAR: { abbr: 'lar', name: 'Rams',        city: 'Los Angeles',   primary: '#003594' },
  LV:  { abbr: 'lv',  name: 'Raiders',     city: 'Las Vegas',     primary: '#A5ACAF' },
  MIA: { abbr: 'mia', name: 'Dolphins',    city: 'Miami',         primary: '#008E97' },
  MIN: { abbr: 'min', name: 'Vikings',     city: 'Minnesota',     primary: '#4F2683' },
  NE:  { abbr: 'ne',  name: 'Patriots',    city: 'New England',   primary: '#002244' },
  NO:  { abbr: 'no',  name: 'Saints',      city: 'New Orleans',   primary: '#D3BC8D' },
  NYG: { abbr: 'nyg', name: 'Giants',      city: 'New York',      primary: '#0B2265' },
  NYJ: { abbr: 'nyj', name: 'Jets',        city: 'New York',      primary: '#125740' },
  PHI: { abbr: 'phi', name: 'Eagles',      city: 'Philadelphia',  primary: '#004C54' },
  PIT: { abbr: 'pit', name: 'Steelers',    city: 'Pittsburgh',    primary: '#FFB612' },
  SEA: { abbr: 'sea', name: 'Seahawks',    city: 'Seattle',       primary: '#002244' },
  SF:  { abbr: 'sf',  name: '49ers',       city: 'San Francisco', primary: '#AA0000' },
  TB:  { abbr: 'tb',  name: 'Buccaneers',  city: 'Tampa Bay',     primary: '#D50A0A' },
  TEN: { abbr: 'ten', name: 'Titans',      city: 'Tennessee',     primary: '#0C2340' },
  WSH: { abbr: 'wsh', name: 'Commanders',  city: 'Washington',    primary: '#5A1414' },
};

export function logoUrl(teamKey: string, size: 500 | 200 | 100 = 500): string {
  const meta = TEAMS[teamKey];
  const abbr = meta?.abbr ?? teamKey.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nfl/${size}/${abbr}.png`;
}

export function teamDisplay(teamKey: string): string {
  const meta = TEAMS[teamKey];
  return meta ? meta.name : teamKey;
}
