// AI Service - uses Gemini API for test case generation, code review, and smart hints.
// Set GEMINI_API_KEY in your .env.local to enable AI features.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "AI features are disabled. Set GEMINI_API_KEY in .env.local to enable.";
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "AI service temporarily unavailable.";
  }
}

// ─── Test Case Generation ──────────────────────────────────
export async function generateTestCases(
  problemDescription: string,
  existingTestCases: { input: string; expected_output: string }[]
): Promise<{ input: string; expected_output: string; description: string }[]> {
  const prompt = `You are an expert competitive programming problem setter. Given a programming problem description and existing test cases, generate 5 additional edge-case test cases that would catch common bugs.

PROBLEM DESCRIPTION:
${problemDescription}

EXISTING TEST CASES:
${existingTestCases.map((tc, i) => `Case ${i + 1}: Input: ${tc.input} | Output: ${tc.expected_output}`).join("\n")}

Generate 5 new test cases. For each test case, provide:
1. A brief description of what edge case it tests
2. The input
3. The expected output

Format your response as a JSON array with objects having fields: "description", "input", "expected_output"
Only output the JSON array, nothing else.`;

  const response = await callGemini(prompt);
  try {
    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    console.error("Failed to parse AI test cases:", response);
    return [];
  }
}

// ─── Code Review ───────────────────────────────────────────
export async function reviewCode(
  code: string,
  language: string,
  problemDescription: string
): Promise<{
  timeComplexity: string;
  spaceComplexity: string;
  suggestions: string[];
  codeQuality: string;
  potentialBugs: string[];
}> {
  const prompt = `You are an expert code reviewer for competitive programming. Analyze the following ${language} code submitted for a programming problem.

PROBLEM:
${problemDescription}

CODE:
\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive code review. Respond with a JSON object containing:
- "timeComplexity": Big-O time complexity (e.g., "O(n log n)")
- "spaceComplexity": Big-O space complexity (e.g., "O(n)")
- "suggestions": Array of improvement suggestions (max 5)
- "codeQuality": One of "excellent", "good", "fair", "poor" with brief explanation
- "potentialBugs": Array of potential bugs or pitfalls (max 3)

Only output the JSON object, nothing else.`;

  const response = await callGemini(prompt);
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {
      timeComplexity: "Unable to analyze",
      spaceComplexity: "Unable to analyze",
      suggestions: [],
      codeQuality: "Unable to analyze",
      potentialBugs: [],
    };
  } catch {
    return {
      timeComplexity: "Unable to analyze",
      spaceComplexity: "Unable to analyze",
      suggestions: ["AI analysis temporarily unavailable"],
      codeQuality: "Unable to analyze",
      potentialBugs: [],
    };
  }
}

// ─── Smart Hints ───────────────────────────────────────────
export async function getSmartHint(
  code: string,
  language: string,
  problemDescription: string,
  verdict: string,
  errorMessage?: string,
  hintLevel: number = 1
): Promise<{ hint: string; level: number }> {
  const levelDescriptions: Record<number, string> = {
    1: "Give a very subtle hint about the general approach without revealing the solution. Just nudge them in the right direction.",
    2: "Give a more specific hint about what technique or data structure to use, but don't reveal the exact implementation.",
    3: "Give a detailed hint that explains the approach step by step, but still don't write the code for them.",
  };

  const prompt = `You are a helpful programming tutor. A student is working on a competitive programming problem and needs help. Their code got the verdict "${verdict}".

PROBLEM:
${problemDescription}

STUDENT'S CODE:
\`\`\`${language}
${code}
\`\`\`

${errorMessage ? `ERROR MESSAGE: ${errorMessage}` : ""}

HINT LEVEL: ${hintLevel}/3
${levelDescriptions[hintLevel] || levelDescriptions[1]}

Provide a helpful hint. Be encouraging and educational. Do NOT give them the complete solution code.
Format your response as a JSON object with field "hint" containing your hint text (use markdown formatting).`;

  const response = await callGemini(prompt);
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { hint: parsed.hint, level: hintLevel };
    }
    return { hint: response, level: hintLevel };
  } catch {
    return { hint: response, level: hintLevel };
  }
}
