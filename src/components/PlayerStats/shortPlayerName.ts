export function shortPlayerName(name: string): string {
  const space = name.indexOf(' ')
  if (space === -1) return name
  return `${name[0]}. ${name.slice(space + 1)}`
}
