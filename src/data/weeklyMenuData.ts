export const foodImageMap: Record<string, string> = {
    "Chicken Biryani": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Biryani_of_Lahore.jpg/1280px-Biryani_of_Lahore.jpg",
    "Veg Biryani": "/foods/veg-biryani.jpg",
    "Tomato Rice": "/foods/tomato-rice.jpg",
    "Curd Rice": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Curd_Rice_01.jpg/640px-Curd_Rice_01.jpg",
    "Fried Rice": "/foods/fried-rice.jpg",
    "Meals": "/foods/meals.jpg",
    "Chapati": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Chapati.jpg/640px-Chapati.jpg",
    "Naan": "/foods/naan.jpg",
    "Butter Chicken": "/foods/butter-chicken.jpg",
    "Paneer Butter Masala": "/foods/paneer-butter-masala.jpg",
    "Dosa": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Dosa_Classic.jpg/640px-Dosa_Classic.jpg",
    "Idli": "/foods/idli.jpg",
    "Poori": "/foods/poori.jpg",
    "Butter Chicken with Naan": "/foods/butter-chicken.jpg",
    "Thai Green Curry": "/foods/curry.jpg",
    "Grilled Chicken": "/foods/grilled-chicken.jpg"
};

export const getFoodImage = (dish: string) =>
    foodImageMap[dish] || "https://via.placeholder.com/400x300?text=Food";

export const weeklyMenu = [
    {
        date: "2026-02-09",
        lunch: "Chicken Biryani",
        dinner: "Chapati"
    },
    {
        date: "2026-02-10",
        lunch: "Tomato Rice",
        dinner: "Butter Chicken"
    },
    {
        date: "2026-02-11",
        lunch: "Veg Biryani",
        dinner: "Paneer Butter Masala"
    },
    {
        date: "2026-02-12",
        lunch: "Fried Rice",
        dinner: "Naan"
    },
    {
        date: "2026-02-13",
        lunch: "Meals",
        dinner: "Curd Rice"
    },
    {
        date: "2026-02-14",
        lunch: "Dosa",
        dinner: "Poori"
    },
    {
        date: "2026-02-15",
        lunch: "Idli",
        dinner: "Chapati"
    }
];
