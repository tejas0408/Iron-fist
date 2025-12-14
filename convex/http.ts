import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { WebhookEvent } from "@clerk/nextjs/server";
import { httpAction } from "./_generated/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const http = httpRouter();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable ");
        }
        const svix_id = request.headers.get("svix-id");
        const svix_signature = request.headers.get("svix-signature");
        const svix_timestamp = request.headers.get("svix-timestamp");

        if (!svix_id || !svix_signature || !svix_timestamp) {
            return new Response("No svix headers found", {
                status: 400,
            });
        }
        const payload = await request.json();
        const body = JSON.stringify(payload);

        const wh = new Webhook(webhookSecret);
        let evt: WebhookEvent;

        try {
            evt = wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }) as WebhookEvent;
        } catch (err) {
            console.error("Error verifying webhook:", err);
            return new Response("Error occured", { status: 400 });
        }

        const eventType = evt.type;

        if (eventType === "user.created") {
            const { id, first_name, last_name, image_url, email_addresses } = evt.data;

            const email = email_addresses[0].email_address;

            const name = `${first_name || ""} ${last_name || ""}`.trim();

            try {
                await ctx.runMutation(api.users.syncUser, {
                    email,
                    name,
                    image: image_url,
                    clerkId: id
                })
            } catch (error) {
                console.log("Error creating user:", error);
                return new Response("error creating user", { status: 500 });
            }
        }

        return new Response("Webhooks processed successfully", { status: 200 });
    })
});

http.route({
    path: "/vapi/generate-program",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const payload = await request.json();
            const { user_id,
                age,
                height,
                weight,
                injuries,
                fitness_goal,
                fitness_level,
                workout_days,
                dietetary_restrictions

            } = payload;

            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp",
                generationConfig: {
                    temperature: 0.4,
                    topP: 0.9,
                    responseMimeType: "application/json",

                }
            });

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

        } catch (error) {
            console.log("Error generating program:", error);
            return new Response("Error generating program", { status: 500 });
        }
    })
})


export default http;
