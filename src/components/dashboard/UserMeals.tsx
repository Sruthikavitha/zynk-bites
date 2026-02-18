import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import type { DailyMeal, Meal, Dish } from '@/types';

interface UserMealsProps {
  dailyMeals: DailyMeal[];
  allMeals: Meal[];
  allDishes: Dish[];
}

export const UserMeals = ({ dailyMeals, allMeals, allDishes }: UserMealsProps) => {
  const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), 'EEE'));

  const getMealDetails = (id: string) => {
    const dish = allDishes.find((d) => d.id === id);
    if (dish) return { name: dish.name, image: dish.imageUrl || '/placeholder.svg' };
    const meal = allMeals.find((m) => m.id === id);
    if (meal) return { name: meal.name, image: meal.imageUrl || '/placeholder.svg' };
    return { name: 'Unknown Meal', image: '/placeholder.svg' };
  };

  // Filter meals for the selected day
  // Assuming dailyMeals has 'date' in YYYY-MM-DD
  const mealsForDay = dailyMeals
    .filter((dm) => {
      try {
        return format(parseISO(dm.date), 'EEE') === selectedDay;
      } catch { return false; }
    })
    .map((dm) => {
      const details = getMealDetails(dm.currentMealId);
      return {
        ...dm,
        dishName: details.name,
        image: details.image,
        displayDate: dm.date
      };
    });

  // Unique days available in dailyMeals to show tabs
  const availableDays = Array.from(new Set(dailyMeals.map(dm => {
    try {
      return format(parseISO(dm.date), 'EEE');
    } catch { return ''; }
  }))).filter(Boolean);

  // If no meals, show standard week days as fallback or just available
  const daysToShow = availableDays.length > 0 ? availableDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-display">Your Meal Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Day Selection Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
          {daysToShow.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: 'none',
                background: selectedDay === day ? '#22c55e' : '#e5e7eb',
                color: selectedDay === day ? '#fff' : '#000',
                cursor: 'pointer',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Meals Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {mealsForDay.length > 0 ? (
            mealsForDay.map((meal) => (
              <div
                key={meal.id}
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                  background: '#fff'
                }}
              >
                <img
                  src={meal.image}
                  alt={meal.dishName}
                  style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/placeholder.svg';
                  }}
                />
                <div style={{ padding: '12px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{meal.dishName}</h3>
                  <p style={{ margin: '4px 0', color: '#555', fontSize: '14px', textTransform: 'capitalize' }}>{meal.mealTime}</p>
                  <span style={{ fontSize: '12px', color: '#888' }}>{meal.displayDate} • {meal.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#888' }}>
              <p>No meals scheduled for {selectedDay}.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserMeals;
