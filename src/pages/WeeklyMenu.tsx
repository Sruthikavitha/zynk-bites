import { weeklyMenu, getFoodImage } from "@/data/weeklyMenuData";
import { Card, CardContent } from "@/components/ui/card";
import { NavLink } from "@/components/NavLink";
import { format, parseISO } from "date-fns";

const WeeklyMenu = () => {
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
                            <h2 className="text-3xl font-bold mb-2">Weekly Menu</h2>
                            <p className="text-muted-foreground">Delicious meals planned for your week</p>
                        </div>

                        {weeklyMenu.map((day) => (
                            <div key={day.date} className="space-y-4">
                                <h3 className="text-xl font-semibold border-b pb-2">
                                    {format(parseISO(day.date), "EEEE, MMMM do")}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Lunch */}
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-none shadow-md bg-white/80 backdrop-blur-sm">
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={getFoodImage(day.lunch)}
                                                alt={day.lunch}
                                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
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
                                                src={getFoodImage(day.dinner)}
                                                alt={day.dinner}
                                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
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
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyMenu;
