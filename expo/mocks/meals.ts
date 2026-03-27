import { MealPlan } from '@/types';

export const eveningShiftMeals: MealPlan[] = [
  {
    id: '1',
    label: 'Pre-Shift Meal',
    time: '5:00 PM',
    description: 'Grilled chicken with quinoa, roasted sweet potatoes, and steamed broccoli. High protein to fuel your shift.',
    icon: 'Utensils',
    calories: 650,
  },
  {
    id: '2',
    label: 'Mid-Shift Snack',
    time: '10:00 PM',
    description: 'Greek yogurt with mixed nuts and dark berries. Sustained energy without the crash.',
    icon: 'Apple',
    calories: 280,
  },
  {
    id: '3',
    label: 'Post-Shift Light Meal',
    time: '2:00 AM',
    description: 'Turkey and avocado wrap with leafy greens. Easy to digest before sleep.',
    icon: 'Sandwich',
    calories: 420,
  },
  {
    id: '4',
    label: 'Wake-Up Smoothie',
    time: '12:00 PM',
    description: 'Banana, spinach, protein powder, almond butter, and oat milk. Gentle wake-up nutrition.',
    icon: 'Coffee',
    calories: 350,
  },
];

export const nightShiftMeals: MealPlan[] = [
  {
    id: '1',
    label: 'Pre-Shift Dinner',
    time: '9:00 PM',
    description: 'Salmon with brown rice and mixed vegetables. Omega-3s support brain function during long nights.',
    icon: 'Utensils',
    calories: 700,
  },
  {
    id: '2',
    label: 'Midnight Fuel',
    time: '1:00 AM',
    description: 'Whole grain toast with almond butter and banana slices. Quick energy boost.',
    icon: 'Apple',
    calories: 320,
  },
  {
    id: '3',
    label: 'Early Morning Snack',
    time: '4:00 AM',
    description: 'Trail mix with dark chocolate, dried cranberries, and almonds. Fights the 4AM slump.',
    icon: 'Sandwich',
    calories: 250,
  },
  {
    id: '4',
    label: 'Post-Shift Wind Down',
    time: '7:30 AM',
    description: 'Chamomile tea with oatmeal and honey. Promotes melatonin production for daytime sleep.',
    icon: 'Coffee',
    calories: 280,
  },
];

export const nutritionTips = [
  'Eat your largest meal before your shift starts, not during',
  'Avoid heavy meals within 2 hours of your sleep window',
  'Caffeine has a 6-hour half-life — set a cutoff time',
  'Hydrate consistently — dehydration mimics fatigue',
  'Meal prep on days off to avoid fast food during shifts',
  'Vitamin D supplements can help compensate for less sunlight',
];
