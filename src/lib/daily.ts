/**
 * The daily setup. One a day, the same for everyone, so the site has a reason
 * to be opened every morning and a board worth checking at night. Written for
 * Sam: a junior, new to the city, in the dorms, out exploring on weekends.
 */
export const SETUPS = [
  "The 1 train at 2am",
  "Ferris on a Sunday morning",
  "Butler at 4am during finals",
  "Your first bodega chopped cheese",
  "Telling your parents back home what a 'studio' costs",
  "The swim test",
  "A Sidechat post that gets 400 upvotes",
  "Trying to find Pupin from the Mudd side",
  "The Hamilton deli line at 12:10pm",
  "Your roommate's air fryer",
  "Lit Hum discussion when nobody did the reading",
  "Walking across the Brooklyn Bridge in the wrong shoes",
  "The Low steps the first warm day of spring",
  "Koronet pizza after midnight",
  "A Barnard student explaining the gates",
  "Getting on an express train by accident",
  "Columbia Housing lottery night",
  "The Morningside Park stairs",
  "Office hours with a line out the door",
  "Dining hall sushi",
  "A weekend 'exploring' that was three coffee shops",
  "Your CULPA review of the professor you still have",
  "The Hudson Yards vessel you can't go up",
  "Email signature with four club titles",
  "Explaining the Core to someone from a state school",
  "Being asked for directions by an actual New Yorker",
  "The dorm elevator that stops at every floor",
  "A $19 salad",
  "Meeting someone from your hometown at Tom's",
  "The last shuttle to Manhattanville",
];

/** New York's date, so the setup flips at midnight in Morningside Heights, not UTC. */
export function todayNY(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function setupFor(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const n = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return SETUPS[((n % SETUPS.length) + SETUPS.length) % SETUPS.length];
}
