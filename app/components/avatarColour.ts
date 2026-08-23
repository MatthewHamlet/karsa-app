/** A stable colour per person, derived from their id.
 *
 *  The mock rows carried a hand-picked `color`; real ones cannot, because a
 *  colour is not a fact about a person and nobody is going to choose one when
 *  adding their mother. Hashing the id instead means the same person is the
 *  same colour on every device, in every list, and after every reload — which
 *  is the only property that makes a colour useful for recognising somebody.
 *
 *  Not random and not stored: a stored colour is a column to migrate and a
 *  random one changes on refresh, which is worse than no colour at all. */
const AVATAR_COLOURS = ["#56785d", "#8a76bd", "#c08b5e", "#4f8a8b", "#a4676b", "#6f7f9e"];

export function colourFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
}
