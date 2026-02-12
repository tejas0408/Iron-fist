import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function validateWorkoutPlan(plan: any) {
    return {
        schedule: plan.schedule,
        exercises: plan.exercises.map((exercise: any) => ({
            day: exercise.day,
            routines: exercise.routines.map((routine: any) => ({
                name: routine.name,
                sets:
                    typeof routine.sets === "number"
                        ? routine.sets
                        : parseInt(routine.sets) || 1,
                reps:
                    typeof routine.reps === "number"
                        ? routine.reps
                        : parseInt(routine.reps) || 10,
            })),
        })),
    };
}

function validateDietPlan(plan: any) {
    return {
        dailyCalories:
            typeof plan.dailyCalories === "number"
                ? plan.dailyCalories
                : parseInt(plan.dailyCalories) || 2000,
        meals: plan.meals.map((meal: any) => ({
            name: meal.name,
            foods: meal.foods,
        })),
    };
}

export async function POST(request: NextRequest) {
    try {
        const {
            userId,
            age,
            height,
            weight,
            injuries,
            fitness_goal,
            fitness_level,
            workout_days,
            dietary_restrictions,
        } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        // Generate workout plan
        const workoutPrompt = `You are an experienced fitness coach creating a personalized workout plan based on:
    Age: ${age}
    Height: ${height}
    Weight: ${weight}
    Injuries or limitations: ${injuries}
    Available days for workout: ${workout_days}
    Fitness goal: ${fitness_goal}
    Fitness level: ${fitness_level}
    
    As a professional coach:
    - Consider muscle group splits to avoid overtraining the same muscles on consecutive days
    - Design exercises that match the fitness level and account for any injuries
    - Structure the workouts to specifically target the user's fitness goal
    
    CRITICAL SCHEMA INSTRUCTIONS:
    - Your output MUST contain ONLY the fields specified below, NO ADDITIONAL FIELDS
    - "sets" and "reps" MUST ALWAYS be NUMBERS, never strings
    - For example: "sets": 3, "reps": 10
    - Do NOT use text like "reps": "As many as possible" or "reps": "To failure"
    - Instead use specific numbers like "reps": 12 or "reps": 15
    - For cardio, use "sets": 1, "reps": 1 or another appropriate number
    - NEVER include strings for numerical fields
    - NEVER add extra fields not shown in the example below
    
    Return a JSON object with this EXACT structure:
    {
      "schedule": ["Monday", "Wednesday", "Friday"],
      "exercises": [
        {
          "day": "Monday",
          "routines": [
            {
              "name": "Exercise Name",
              "sets": 3,
              "reps": 10
            }
          ]
        }
      ]
    }
    
    DO NOT add any fields that are not in this example. Your response must be a valid JSON object with no additional text.`;

        const workoutCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: workoutPrompt }],
            temperature: 0.4,
            response_format: { type: "json_object" },
        });

        const workoutPlanText = workoutCompletion.choices[0]?.message?.content || "{}";
        let workoutPlan = JSON.parse(workoutPlanText);
        workoutPlan = validateWorkoutPlan(workoutPlan);

        // Generate diet plan
        const dietPrompt = `You are an experienced nutrition coach creating a personalized diet plan based on:
    Age: ${age}
    Height: ${height}
    Weight: ${weight}
    Fitness goal: ${fitness_goal}
    Dietary restrictions: ${dietary_restrictions}
    
    As a professional nutrition coach:
    - Calculate appropriate daily calorie intake based on the person's stats and goals
    - Create a balanced meal plan with proper macronutrient distribution
    - Include a variety of nutrient-dense foods while respecting dietary restrictions
    - Consider meal timing around workouts for optimal performance and recovery
    
    CRITICAL SCHEMA INSTRUCTIONS:
    - Your output MUST contain ONLY the fields specified below, NO ADDITIONAL FIELDS
    - "dailyCalories" MUST be a NUMBER, not a string
    - DO NOT add fields like "supplements", "macros", "notes", or ANYTHING else
    - ONLY include the EXACT fields shown in the example below
    - Each meal should include ONLY a "name" and "foods" array

    Return a JSON object with this EXACT structure and no other fields:
    {
      "dailyCalories": 2000,
      "meals": [
        {
          "name": "Breakfast",
          "foods": ["Oatmeal with berries", "Greek yogurt", "Black coffee"]
        },
        {
          "name": "Lunch",
          "foods": ["Grilled chicken salad", "Whole grain bread", "Water"]
        }
      ]
    }
    
    DO NOT add any fields that are not in this example. Your response must be a valid JSON object with no additional text.`;

        const dietCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: dietPrompt }],
            temperature: 0.4,
            response_format: { type: "json_object" },
        });

        const dietPlanText = dietCompletion.choices[0]?.message?.content || "{}";
        let dietPlan = JSON.parse(dietPlanText);
        dietPlan = validateDietPlan(dietPlan);

        // Save to Convex
        const planId = await convex.mutation(api.plans.createPlan, {
            userId,
            dietPlan,
            name: `${fitness_goal} Plan - ${new Date().toLocaleDateString()}`,
            workoutPlan,
            isActive: true,
        });

        return NextResponse.json({
            success: true,
            data: {
                planId,
                workoutPlan,
                dietPlan,
            },
        });
    } catch (error: any) {
        console.error("Error generating fitness program:", error);
        return NextResponse.json(
            { error: "Failed to generate program", details: error?.message || String(error) },
            { status: 500 }
        );
    }
}
