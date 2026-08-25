const AVATAR_COLOURS = ["#56785d", "#8a76bd", "#c08b5e", "#4f8a8b", "#a4676b", "#6f7f9e"];

export function colourFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
}
