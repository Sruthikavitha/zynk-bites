import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSkipDecision } from "@/services/api";

interface SkipDecisionResponse {
  action: "skip" | "suggest_light_meal" | "reschedule";
  message: string;
  riskScore: number;
  lightMealSuggestions?: Array<{
    name: string;
    calories: number;
    description: string;
  }>;
  healthTips?: string[];
}

export const MealSkipDecisionWidget: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState("breakfast");
  const [skipCount, setSkipCount] = useState(0);
  const [healthGoal, setHealthGoal] = useState("balanced");
  const [subscriptionStatus, setSubscriptionStatus] = useState("active");
  const [consecutiveSkips, setConsecutiveSkips] = useState(0);
  const [decision, setDecision] = useState<SkipDecisionResponse | null>(null);

  const handleGetDecision = () => {
    if (loading) return;

    setLoading(true);
    try {
      // Use client-side implementation (no API call needed)
      const response = getSkipDecision({
        mealType: mealType as "breakfast" | "lunch" | "dinner",
        skipCount: parseInt(skipCount.toString()) || 0,
        healthGoal: healthGoal as any,
        subscriptionStatus: subscriptionStatus as "active" | "paused" | "cancelled",
        consecutiveSkips: parseInt(consecutiveSkips.toString()) || 0,
        lastMealTime: new Date().toISOString(),
      });
      setDecision(response);
      toast({
        title: "Decision Generated",
        description: "Your meal skip assessment is ready",
      });
    } catch (error) {
      console.error("Error getting skip decision:", error);
      toast({
        title: "Error",
        description: "Failed to get meal skip decision. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number): string => {
    if (score < 4) return "bg-green-100 text-green-800";
    if (score < 7) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getActionIcon = (action: string) => {
    if (action === "skip") return <CheckCircle className="w-5 h-5" />;
    if (action === "suggest_light_meal") return <AlertTriangle className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  const getActionDescription = (action: string): string => {
    switch (action) {
      case "skip":
        return "Safe to Skip";
      case "suggest_light_meal":
        return "Try a Light Meal Instead";
      case "reschedule":
        return "Please Reschedule";
      default:
        return "Assessment Needed";
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meal Skip Decision Assistant</CardTitle>
          <CardDescription>
            Get personalized guidance on whether to skip a meal based on your health profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meal Type */}
            <div className="space-y-2">
              <Label htmlFor="meal-type">Meal Type</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger id="meal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Skip Count This Week */}
            <div className="space-y-2">
              <Label htmlFor="skip-count">Skips This Week</Label>
              <Input
                id="skip-count"
                type="number"
                min="0"
                max="21"
                value={skipCount}
                onChange={(e) => setSkipCount(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            {/* Health Goal */}
            <div className="space-y-2">
              <Label htmlFor="health-goal">Health Goal</Label>
              <Select value={healthGoal} onValueChange={setHealthGoal}>
                <SelectTrigger id="health-goal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight-loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                  <SelectItem value="balanced">Balanced Diet</SelectItem>
                  <SelectItem value="improved-digestion">Improved Digestion</SelectItem>
                  <SelectItem value="energy-boost">Energy Boost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subscription Status */}
            <div className="space-y-2">
              <Label htmlFor="subscription-status">Subscription Status</Label>
              <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                <SelectTrigger id="subscription-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Consecutive Skips */}
            <div className="space-y-2">
              <Label htmlFor="consecutive-skips">Consecutive Skips</Label>
              <Input
                id="consecutive-skips"
                type="number"
                min="0"
                value={consecutiveSkips}
                onChange={(e) => setConsecutiveSkips(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Get Decision Button */}
          <Button
            onClick={handleGetDecision}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Get Skip Decision"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Decision Result */}
      {decision && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getActionIcon(decision.action)}
                {getActionDescription(decision.action)}
              </CardTitle>
              <Badge className={getRiskColor(decision.riskScore)}>
                Risk Score: {decision.riskScore}/10
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Decision Message */}
            <Alert>
              <AlertDescription className="text-base">{decision.message}</AlertDescription>
            </Alert>

            {/* Light Meal Suggestions */}
            {decision.lightMealSuggestions && decision.lightMealSuggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Light Meal Suggestions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {decision.lightMealSuggestions.map((meal, idx) => (
                    <Card key={idx} className="bg-slate-50 border-slate-200">
                      <CardContent className="pt-4">
                        <div className="space-y-1">
                          <p className="font-medium">{meal.name}</p>
                          <p className="text-sm text-gray-600">{meal.description}</p>
                          <Badge variant="outline" className="mt-2">
                            {meal.calories} cal
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Health Tips */}
            {decision.healthTips && decision.healthTips.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Health Tips</h3>
                <ul className="space-y-2">
                  {decision.healthTips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="flex gap-2 text-sm text-gray-700"
                    >
                      <span className="text-blue-500 font-bold">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
