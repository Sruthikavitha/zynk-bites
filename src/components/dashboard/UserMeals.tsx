import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const weeklyMeals = [
  {
    date: '2026-02-10',
    day: 'Tue',
    mealType: 'Lunch',
    dish: 'Chicken Biryani',
    image: 'https://foodish-api.herokuapp.com/api/images/biryani'
  },
  {
    date: '2026-02-10',
    day: 'Tue',
    mealType: 'Dinner',
    dish: 'Butter Chicken with Naan',
    image: 'https://foodish-api.herokuapp.com/api/images/butter%20chicken'
  },
  {
    date: '2026-02-11',
    day: 'Wed',
    mealType: 'Lunch',
    dish: 'Thai Green Curry',
    image: 'https://foodish-api.herokuapp.com/api/images/curry'
  },
  {
    date: '2026-02-11',
    day: 'Wed',
    mealType: 'Dinner',
    dish: 'Grilled Chicken',
    image: 'https://foodish-api.herokuapp.com/api/images/grilled%20chicken'
  },
  {
    date: '2026-02-12',
    day: 'Thu',
    mealType: 'Lunch',
    dish: 'Veg Biryani',
    image: 'https://foodish-api.herokuapp.com/api/images/biryani'
  },
  {
    date: '2026-02-12',
    day: 'Thu',
    mealType: 'Dinner',
    dish: 'Paneer Butter Masala',
    image: 'https://foodish-api.herokuapp.com/api/images/paneer'
  }
];

export const UserMeals = () => {
  const [selectedDay, setSelectedDay] = useState('Tue');

  const mealsForDay = weeklyMeals.filter((meal) => meal.day === selectedDay);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-display">Weekly Meal Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Day Selection Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
          {['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
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
            mealsForDay.map((meal, index) => (
              <div
                key={index}
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                  background: '#fff'
                }}
              >
                <img
                  src={meal.image}
                  alt={meal.dish}
                  style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/placeholder.svg';
                  }}
                />
                <div style={{ padding: '12px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{meal.dish}</h3>
                  <p style={{ margin: '4px 0', color: '#555', fontSize: '14px' }}>{meal.mealType}</p>
                  <span style={{ fontSize: '12px', color: '#888' }}>{meal.date}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>No meals scheduled for this day</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserMeals;
