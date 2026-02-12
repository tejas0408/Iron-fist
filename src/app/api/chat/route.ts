import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

const SYSTEM_PROMPT = `You are "Fit Voice AI", a friendly and professional fitness coach having a voice conversation to collect information for creating a personalized fitness program.

Your job is to collect ALL of the following information from the user, one question at a time:
1. Age
2. Height (in any format they prefer)
3. Weight (in any format they prefer)
4. Any injuries or physical limitations
5. Fitness goal (e.g., weight loss, muscle gain, general fitness, endurance)
6. Current fitness level (beginner, intermediate, advanced)
7. How many days per week they can work out
8. Any dietary restrictions or preferences

RULES:
- Ask ONE question at a time. Be conversational and encouraging.
- If the user gives multiple pieces of info at once, acknowledge all of them and move to the next missing item.
- Keep your responses SHORT (1-3 sentences max) since they will be spoken aloud.
- Be warm, motivating, and professional.
- Do NOT generate a workout or diet plan yourself. Just collect the data.
- Start by greeting the user by name and asking their first question.

When you have collected ALL 8 pieces of information, respond with your final confirmation message AND include a special JSON block at the very end of your message in this exact format:

|||COMPLETE|||
{"age":"<age>","height":"<height>","weight":"<weight>","injuries":"<injuries>","fitness_goal":"<goal>","fitness_level":"<level>","workout_days":"<days>","dietary_restrictions":"<restrictions>"}
|||END|||

The JSON values should be the exact information the user provided. Only include this block when ALL data has been collected.`;

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        const { messages, userName } = (await request.json()) as {
            messages: ChatMessage[];
            userName: string;
        };

        // If no user messages yet, return the greeting
        if (messages.length === 0) {
            return NextResponse.json({
                response: `Hey ${userName}! Great to have you here! I'm excited to help you create a personalized fitness program. Let's start with the basics — how old are you?`,
                isComplete: false,
                userData: null,
            });
        }

        // Build the messages array for OpenAI
        const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `${SYSTEM_PROMPT}\n\nThe user's name is: ${userName}.`,
            },
            {
                role: "assistant",
                content: `Hey ${userName}! Great to have you here! I'm excited to help you create a personalized fitness program. Let's start with the basics — how old are you?`,
            },
            ...messages.map((msg) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            })),
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: openaiMessages,
            temperature: 0.7,
            max_tokens: 300,
        });

        const responseText = completion.choices[0]?.message?.content || "";

        // Check if the AI has collected all data
        let isComplete = false;
        let userData = null;
        let cleanResponse = responseText;

        if (responseText.includes("|||COMPLETE|||")) {
            isComplete = true;
            const jsonMatch = responseText.match(
                /\|\|\|COMPLETE\|\|\|\s*(\{[\s\S]*?\})\s*\|\|\|END\|\|\|/
            );
            if (jsonMatch) {
                try {
                    userData = JSON.parse(jsonMatch[1]);
                } catch (e) {
                    console.error("Failed to parse user data JSON:", e);
                }
            }
            // Remove the JSON block from the spoken response
            cleanResponse = responseText
                .replace(/\|\|\|COMPLETE\|\|\|[\s\S]*?\|\|\|END\|\|\|/, "")
                .trim();
        }

        return NextResponse.json({
            response: cleanResponse,
            isComplete,
            userData,
        });
    } catch (error: any) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: "Failed to process chat message", details: error?.message || String(error) },
            { status: 500 }
        );
    }
}
