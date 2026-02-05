# Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ZYNK PLATFORM                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────── FRONTEND (React) ─────────────────────┐
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Customer Dashboard                          │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  MealRecommendationWidget                      │ │   │
│  │  │  ┌──────────────────────────────────────────┐ │ │   │
│  │  │  │ Preference Form                          │ │ │   │
│  │  │  │ - Diet Type Selector                     │ │ │   │
│  │  │  │ - Health Goal Selector                   │ │ │   │
│  │  │  │ - Allergy Tag Input                      │ │ │   │
│  │  │  │ - Dislike Tag Input                      │ │ │   │
│  │  │  │ - Get Recommendations Button             │ │ │   │
│  │  │  └──────────────────────────────────────────┘ │ │   │
│  │  │  ┌──────────────────────────────────────────┐ │ │   │
│  │  │  │ Results Display                          │ │ │   │
│  │  │  │ - Breakfast Card (with reason)           │ │ │   │
│  │  │  │ - Lunch Card (with reason)               │ │ │   │
│  │  │  │ - Dinner Card (with reason)              │ │ │   │
│  │  │  │ - Summary Reason                         │ │ │   │
│  │  │  └──────────────────────────────────────────┘ │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          │ POST /api/recommendations         │
│                          │ (axios/fetch)                     │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API Service (api.ts)                               │   │
│  │  - getMealRecommendations()                         │   │
│  │  - Type validation                                  │   │
│  │  - Error handling                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP Request
                          │ JSON Payload
                          ▼
┌──────────────────── BACKEND (Express) ────────────────────┐
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  API Endpoint: POST /api/recommendations          │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │  Middleware Chain                           │ │   │
│  │  │  1. authenticate (JWT verification)         │ │   │
│  │  │  2. validateRequest (Zod schema)            │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                   ▼                                │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │  recommendationController.ts                │ │   │
│  │  │  - Extract user preferences                 │ │   │
│  │  │  - Get available meals                      │ │   │
│  │  │  - Call recommendation service              │ │   │
│  │  │  - Format response                          │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                   ▼                                │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │  mealRecommendationService.ts               │ │   │
│  │  │                                              │ │   │
│  │  │  ┌──────────────────────────────────────┐  │ │   │
│  │  │  │ 1. Filter by preferences             │  │ │   │
│  │  │  │    - Diet type matching              │  │ │   │
│  │  │  │    - Allergen filtering              │  │ │   │
│  │  │  │    - Dislike exclusion               │  │ │   │
│  │  │  └──────────────────────────────────────┘  │ │   │
│  │  │                                              │ │   │
│  │  │  ┌──────────────────────────────────────┐  │ │   │
│  │  │  │ 2. Score meals per meal time         │  │ │   │
│  │  │  │    - Health goal alignment           │  │ │   │
│  │  │  │    - Meal time optimization          │  │ │   │
│  │  │  │    - Diversity bonus                 │  │ │   │
│  │  │  │    - Sort by score                   │  │ │   │
│  │  │  └──────────────────────────────────────┘  │ │   │
│  │  │                                              │ │   │
│  │  │  ┌──────────────────────────────────────┐  │ │   │
│  │  │  │ 3. Generate reasons                 │  │ │   │
│  │  │  │    - Per meal reason                │  │ │   │
│  │  │  │    - Overall summary                │  │ │   │
│  │  │  └──────────────────────────────────────┘  │ │   │
│  │  │                                              │ │   │
│  │  │  ┌──────────────────────────────────────┐  │ │   │
│  │  │  │ 4. Return MealRecommendation        │  │ │   │
│  │  │  │    - breakfast object               │  │ │   │
│  │  │  │    - lunch object                   │  │ │   │
│  │  │  │    - dinner object                  │  │ │   │
│  │  │  │    - shortReason string             │  │ │   │
│  │  │  └──────────────────────────────────────┘  │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                   ▼                                │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │  dishModel.ts                               │ │   │
│  │  │  - getAllDishes()                           │ │   │
│  │  │  - Returns 10 sample dishes with:           │ │   │
│  │  │    • Nutritional info (cal, protein, etc)  │ │   │
│  │  │    • Category (veg/non-veg)                │ │   │
│  │  │    • Customization options                 │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP Response
                          │ JSON with recommendations
                          ▼
┌──────────────────── FRONTEND (React) ─────────────────────┐
│                                                              │
│  Display Results:                                           │
│  • Breakfast recommendation card                           │
│  • Lunch recommendation card                               │
│  • Dinner recommendation card                              │
│  • Summary reason                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Input (Form)
    ↓
{
  dietType: string,
  healthGoal: string,
  allergies: string[],
  dislikedFoods: string[],
  mealHistory: string[]
}
    ↓
API Call (POST /api/recommendations)
    ↓
Backend Processing:
  1. Validate input (Zod schema)
  2. Fetch available meals
  3. Filter by preferences
  4. Score each meal
  5. Select top meals per category
  6. Generate reasons
    ↓
Response JSON
    ↓
{
  breakfast: {
    mealId: string,
    mealName: string,
    reason: string
  },
  lunch: {
    mealId: string,
    mealName: string,
    reason: string
  },
  dinner: {
    mealId: string,
    mealName: string,
    reason: string
  },
  shortReason: string
}
    ↓
UI Render (Results Display)
    ↓
Show recommendations to user
```

## Scoring Algorithm Flow

```
Available Meals (filtered by preferences)
    ↓
For BREAKFAST:
  Score = 0
  + Health goal points (0-5)
  + Breakfast optimization (0-2)
  + Diversity bonus (0-2)
  = Final Score
    ↓
For LUNCH:
  Score = 0
  + Health goal points (0-5)
  + Lunch optimization (0-2)
  + Diversity bonus (0-2)
    (exclude breakfast selection)
  = Final Score
    ↓
For DINNER:
  Score = 0
  + Health goal points (0-5)
  + Dinner optimization (0-2)
  + Diversity bonus (0-2)
    (exclude breakfast & lunch selections)
  = Final Score
    ↓
Select meals with highest scores
    ↓
Generate personalized reasons
    ↓
Return MealRecommendation object
```

## Component Hierarchy

```
CustomerDashboard
  ├── CutoffBanner
  ├── ReviewPrompt
  ├── OrderTracker
  ├── MealRecommendationWidget
  │   ├── PreferenceForm (form state)
  │   │   ├── DietTypeSelect
  │   │   ├── HealthGoalSelect
  │   │   ├── AllergyTagInput
  │   │   ├── DislikeTagInput
  │   │   └── GetRecommendationsButton
  │   └── ResultsDisplay (results state)
  │       ├── BreakfastCard
  │       ├── LunchCard
  │       ├── DinnerCard
  │       └── SummaryReason
  ├── AddressToggle
  ├── TomorrowsMeal
  └── UpcomingMeals
```

## Type System Flow

```
UserPreferences
  ├── dietType: DietType
  │   └── 'vegetarian' | 'non-vegetarian' | 'vegan' | 'keto' | 'gluten-free'
  ├── healthGoal: HealthGoal
  │   └── 'weight-loss' | 'muscle-gain' | 'maintenance' | 'energy' | 'balanced'
  ├── allergies: string[]
  ├── dislikedFoods: string[]
  └── mealHistory: string[]
       ↓
MealRecommendation
  ├── breakfast: RecommendedMeal
  │   ├── mealId: string
  │   ├── mealName: string
  │   └── reason: string
  ├── lunch: RecommendedMeal
  ├── dinner: RecommendedMeal
  └── shortReason: string
```

## Error Handling Flow

```
User submits preferences
    ↓
Frontend validation
    ├─ Valid? → Continue
    └─ Invalid? → Show error toast, stay on form
    ↓
Backend receives request
    ├─ Authenticate? 
    │  ├─ No? → 401 Unauthorized
    │  └─ Yes? → Continue
    │
    ├─ Validate input?
    │  ├─ Invalid? → 400 Bad Request + errors
    │  └─ Valid? → Continue
    │
    ├─ Have meals?
    │  ├─ No? → 404 No meals available
    │  └─ Yes? → Continue
    │
    └─ Generate recommendations?
       ├─ Success? → 200 + data
       └─ Error? → 500 + error message
    ↓
Frontend handles response
    ├─ Success? → Display results
    └─ Error? → Show error toast
```

## State Management Flow

```
MealRecommendationWidget State:

loading: boolean
  └─ true during API call
  └─ false when complete

recommendations: MealRecommendation | null
  └─ null initially
  └─ populated after successful API call

showForm: boolean
  └─ true to show preference form
  └─ false to show results

preferences: UserPreferences
  └─ dietType (selected)
  └─ healthGoal (selected)
  └─ allergies[] (dynamic array)
  └─ dislikedFoods[] (dynamic array)
  └─ mealHistory[] (preset)

allergyInput: string
  └─ temporary text for allergy input

dislikeInput: string
  └─ temporary text for dislike input
```

---

## Integration Points

```
Customer Dashboard
    ↓
    ├─ Imports MealRecommendationWidget
    └─ Renders widget in Card component
        ↓
MealRecommendationWidget
    ↓
    ├─ Imports api.getMealRecommendations
    └─ Imports useToast hook
        ↓
API Service (api.ts)
    ↓
    ├─ Imports recommendation functions
    ├─ Imports types from types/index.ts
    └─ Implements filtering and scoring
        ↓
Backend API
    ↓
    ├─ POST /api/recommendations
    ├─ Middleware: authenticate, validate
    ├─ Controller: handles request
    ├─ Service: generates recommendations
    └─ Model: returns available meals
```

---

## Performance Characteristics

```
Time Complexity:
  - Filtering: O(n) where n = meals
  - Scoring: O(n) where n = meals
  - Sorting: O(n log n) where n = meals
  - Total: O(n log n)

Space Complexity:
  - Filtered array: O(n)
  - Scored array: O(n)
  - Total: O(n)

For 100 meals: ~1-5ms
For 1000 meals: ~10-50ms
For 10000 meals: ~100-500ms

Memory efficient - no persistent storage required
```

---

*Diagrams created with ASCII art for universal compatibility*
