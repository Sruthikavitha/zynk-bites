import { useState, useEffect } from "react";
import { backendApi } from "@/services/backendApi";
import { Card, CardContent } from "@/components/ui/card";
import { NavLink } from "@/components/NavLink";
import { format, parseISO } from "date-fns";
import type { Chef } from "@/types";

const WeeklyMenu = () => {
    const [weeklyMenu, setWeeklyMenu] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                // Fetch chefs for a default/popular pincode to show *some* menu
                const chefs = await backendApi.getAvailableChefs('560001'); // Bangalore generic/central
                if (chefs.length > 0) {
                    const featuredChef = chefs[0];
                    const weekStart = new Date().toISOString().split('T')[0];
                    const menuData = await backendApi.getChefMenu(featuredChef.id, weekStart);

                    if (menuData && menuData.days) {
                        const daysArray = Object.entries(menuData.days).map(([dayIndex, meals]: [string, any]) => {
                            // Map numeric day index to a date for this week
                            const date = new Date(weekStart);
                            date.setDate(date.getDate() + parseInt(dayIndex));

                            const lunch = meals.find((m: any) => m.mealTime === 'lunch' || true); // Fallback to any meal
                            const dinner = meals.find((m: any) => m.mealTime === 'dinner') || meals[1] || lunch;

                            return {
                                date: date.toISOString().split('T')[0],
                                lunch: lunch?.name || 'Chef Special',
                                dinner: dinner?.name || 'Chef Special',
                                lunchImg: lunch?.image || '/placeholder.svg',
                                dinnerImg: dinner?.image || '/placeholder.svg'
                            };
                        }).sort((a, b) => a.date.localeCompare(b.date));
                        setWeeklyMenu(daysArray);
                    }
                }
            } catch (error) {
                console.error("Failed to load featured menu", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading menu...</div>;
    }

    return (
        <div className="weekly-bg-wrapper">
            <div className="food-animated-bg"></div>

            <div className="weekly-content min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <header className="mb-8 flex items-center justify-between">
                        <NavLink to="/">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Zynk Bites
                            </h1>
                        </NavLink>
                    </header>

                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold mb-2">Weekly Menu Preview</h2>
                            <p className="text-muted-foreground">Delicious meals planned for the week</p>
                        </div>

                        {weeklyMenu.length === 0 ? (
                            <p className="text-center text-muted-foreground">No menus available right now. Check back later!</p>
                        ) : (
                            weeklyMenu.map((day) => (
                                <div key={day.date} className="space-y-4">
                                    <h3 className="text-xl font-semibold border-b pb-2">
                                        {format(parseISO(day.date), "EEEE, MMMM do")}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Lunch */}
                                        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-none shadow-md bg-white/80 backdrop-blur-sm">
                                            <div className="h-48 overflow-hidden">
                                                <img
                                                    src={day.lunchImg}
                                                    alt={day.lunch}
                                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                                />
                                            </div>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-medium text-primary mb-1">Lunch</p>
                                                        <h4 className="text-lg font-bold">{day.lunch}</h4>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Dinner */}
                                        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-none shadow-md bg-white/80 backdrop-blur-sm">
                                            <div className="h-48 overflow-hidden">
                                                <img
                                                    src={day.dinnerImg}
                                                    alt={day.dinner}
                                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                                />
                                            </div>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-medium text-purple-600 mb-1">Dinner</p>
                                                        <h4 className="text-lg font-bold">{day.dinner}</h4>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyMenu;
