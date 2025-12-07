export const nightGreetings = [
  'Night owl, {name}',
  'Still awake, {name}?',
  'Midnight grind, {name}',
  'Late hustle, {name}',
  'Burning oil, {name}',
  "Can't sleep, {name}?",
  '3 AM energy, {name}',
  'Still at it, {name}?',
  'Nocturnal vibes, {name}',
  'Hello {name}',
  'Hola {name}',
  '{name}, good to see you',
];

export const morningGreetings = [
  'Morning, {name}',
  'Rise & shine, {name}',
  'Top of morning, {name}',
  'Fresh start, {name}',
  'Bright & early, {name}',
  "Let's conquer, {name}",
  'Ready to win, {name}?',
  'New day energy, {name}',
  'Seize the day, {name}',
  'Hello {name}',
  'Heya {name}',
  '{name}, good to see you',
];

export const afternoonGreetings = [
  'Afternoon, {name}',
  'Midday warrior, {name}',
  'Afternoon grind, {name}',
  'Post-lunch mode, {name}',
  'Keeping at it, {name}?',
  'Halfway strong, {name}',
  'Midday focus, {name}',
  'PM productivity, {name}',
  'Hi {name}',
  'Hola {name}',
  "G'day, {name}",
  '{name}, good to see you',
];

export const eveningGreetings = [
  'Evening, {name}',
  'Winding down, {name}?',
  'Almost done, {name}?',
  'Evening session, {name}',
  'Final stretch, {name}',
  'Golden hour, {name}',
  'Sunset grind, {name}',
  'End of day, {name}',
  'Hello {name}',
  'Heya {name}',
  'Dusk vibes, {name}',
  '{name}, good to see you',
];

export const lateEveningGreetings = [
  'Late night, {name}',
  'Almost midnight, {name}',
  'Final push, {name}?',
  'Wrapping up, {name}?',
  'One more thing, {name}?',
  'Late session, {name}',
  'Night cap time, {name}',
  'Pre-midnight, {name}',
  'Hi {name}',
  'Hola {name}',
  'Heya {name}',
  '{name}, good to see you',
];

type GreetingBucket = {
  startHour: number;
  endHour: number;
  messages: string[];
};

const greetingBuckets: GreetingBucket[] = [
  { startHour: 0, endHour: 4, messages: nightGreetings },
  { startHour: 5, endHour: 11, messages: morningGreetings },
  { startHour: 12, endHour: 16, messages: afternoonGreetings },
  { startHour: 17, endHour: 20, messages: eveningGreetings },
  { startHour: 21, endHour: 23, messages: lateEveningGreetings },
];

const buildStableIndex = (seed: string, modulo: number): number => {
  if (modulo <= 0) return 0;
  let acc = 0;
  for (let i = 0; i < seed.length; i += 1) {
    acc = (acc + seed.charCodeAt(i) * (i + 1)) % modulo;
  }
  return acc % modulo;
};

export function getGreeting(name: string, now: Date = new Date()): string {
  const safeName = name.trim() || 'friend';
  const hour = now.getHours();
  const bucket =
    greetingBuckets.find((slot) => hour >= slot.startHour && hour <= slot.endHour) ??
    greetingBuckets[0];
  const seed = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${hour}`;
  const index = buildStableIndex(seed, bucket.messages.length);
  const template = bucket.messages[index] ?? 'Hello Night Owl';
  return template.replace('{name}', safeName);
}
