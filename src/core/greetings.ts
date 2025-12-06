export const nightGreetings = [
  'Hello {name}',
  'Welcome back, {name}',
  'Hey there, {name}',
  'Howdy, {name}',
  '{name}, you’re back!',
  'Hi {name}',
];

export const morningGreetings = [
  'Good morning, {name}',
  'Morning, {name}',
  'Hey {name}, ready to start?',
  'Rise and shine, {name}',
  'Hello {name}',
  '{name}, good to see you',
];

export const afternoonGreetings = [
  'Good afternoon, {name}',
  'Hey {name}, welcome back',
  'Hello {name}',
  '{name}, you’re back!',
  'Hi {name}',
  'Afternoon, {name}',
];

export const eveningGreetings = [
  'Good evening, {name}',
  'Evening, {name}',
  'Welcome back, {name}',
  'Hello {name}',
  'Hey there, {name}',
  '{name}, glad you’re here',
];

export const lateEveningGreetings = [
  'Hey {name}',
  'Hello {name}',
  'You’re back, {name}',
  'Welcome back, {name}',
  'Hi {name}',
  'Howdy, {name}',
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
