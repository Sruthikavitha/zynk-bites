import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { NavLink } from "@/components/NavLink";

const MealRecommendations = () => {
    const [diet, setDiet] = useState("");
    const [goal, setGoal] = useState("");
    const [allergies, setAllergies] = useState("");
    const [dislikes, setDislikes] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const getRecommendations = async () => {
        if (!diet || !goal) {
            toast({
                title: "Missing Information",
                description: "Please enter your diet preference and health goal.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setResult("");

        const prompt = `
Generate personalized lunch and dinner meal recommendations.

Diet Preference: ${diet}
Health Goal: ${goal}
Allergies: ${allergies || "None"}
Foods Disliked: ${dislikes || "None"}

Give:
1. Lunch meal
2. Dinner meal
3. Short health benefit
    `;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: prompt }],
                            },
                        ],
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch recommendations");
            }

            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (generatedText) {
                setResult(generatedText);
            } else {
                throw new Error("No recommendations generated");
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to get meal recommendations. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

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

                    <div className="max-w-2xl mx-auto">
                        <Card className="bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-0">
                            <CardHeader>
                                <CardTitle className="text-3xl text-center">Meal Recommendations</CardTitle>
                                <CardDescription className="text-center">
                                    Get personalized meal plans powered by AI based on your preferences and goals.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="diet">Diet Preference (e.g., Vegan, Keto)</Label>
                                    <Input
                                        id="diet"
                                        placeholder="Enter diet preference..."
                                        value={diet}
                                        onChange={(e) => setDiet(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="goal">Health Goal (e.g., Muscle Gain, Weight Loss)</Label>
                                    <Input
                                        id="goal"
                                        placeholder="Enter health goal..."
                                        value={goal}
                                        onChange={(e) => setGoal(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="allergies">Allergies (Optional)</Label>
                                    <Input
                                        id="allergies"
                                        placeholder="Peanuts, Gluten, etc..."
                                        value={allergies}
                                        onChange={(e) => setAllergies(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dislikes">Foods Disliked (Optional)</Label>
                                    <Input
                                        id="dislikes"
                                        placeholder="Mushrooms, Cilantro, etc..."
                                        value={dislikes}
                                        onChange={(e) => setDislikes(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={getRecommendations}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating Recommendations...
                                        </>
                                    ) : (
                                        "Get My Recommendations"
                                    )}
                                </Button>

                                {result && (
                                    <div className="mt-6 p-6 bg-secondary/20 rounded-lg border border-border w-full">
                                        <h3 className="text-lg font-semibold mb-3">Your Personalized Plan:</h3>
                                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                                            {result}
                                        </div>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MealRecommendations;
