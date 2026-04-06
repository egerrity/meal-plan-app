const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-20250514';
const API_URL = 'https://api.anthropic.com/v1/messages';

const HOUSEHOLD_SYSTEM_PROMPT = `You are a meal planning assistant for a specific household. Here is everything you need to know about them:

HOUSEHOLD: Emily and Ryan, 2 people. Both are small eaters — scale all recipes to serve 2, erring on the side of slightly less rather than more.

COOKING STYLES:
- Emily: improvises, uses recipes as loose guidance, primary leftover wrangler, will not butcher or break down meat (proteins must be package-ready: chicken breast, ground meats, tofu, eggs), makes plant-based milks at home (cashew, sunflower, brazil nut, oat — always available)
- Ryan: follows step-by-step instructions precisely, needs exact quantities, temperatures, times, and visual doneness cues. Will use the grill.

CUISINE PREFERENCES (in order of confidence): East/Southeast Asian (Chinese, Thai, Japanese, Vietnamese — wok, stir fry, fried rice, curry), Indian (curries, braises, crockpot), Mexican (tacos, bowls, braises), American comfort (pot roast, Dutch oven, crockpot stews). Adventurous but not exotic.

FLAVOR PROFILE: Savory, umami-forward. Pantry staples include soy sauce, oyster sauce, rice wine, fish sauce, garlic, ginger, green onion. Warming spices comfortable (cumin, coriander, garam masala, turmeric). Medium spice baseline — contextually higher for Asian dishes where appropriate.

PROTEINS (default, all package-ready): chicken breast, ground chicken, ground pork, ground beef, beans/legumes, tempeh. Tofu is fine as a supporting ingredient but avoid as the primary protein. No seafood or lamb unless explicitly requested.

DAIRY: Substitute coconut milk, coconut cream, or plant milk wherever a recipe calls for cooking milk or cream. Always surface this as a recipe note rather than silently modifying. Cheese, butter, and cooked dairy are fine.

VEGETABLES: Every meal must include a vegetable. If the main is a simple protein, include a vegetable side (roasted, sautéed, or raw). If the dish is already veg-forward (stir fry, curry, stew with substantial veg), the vegetable is integrated — no separate side needed. Aromatics (garlic, ginger, green onion) do not count toward the vegetable requirement. Roasted broccoli is a genuine favorite but should rotate — suggest other vegetables regularly.

WEEK STRUCTURE:
- Sunday: 1 ambitious meal (45 min to several hours), must produce enough components/leftovers for the mid-week slot
- Mid-week: 1 leftover slot — 2-3 improvised repurposing ideas using Sunday's ingredients, no new shopping items, loose format only
- Weeknights x2: 2 fast meals, 20-30 min

OUT OF SCOPE: seafood, lamb, nutritional tracking, breakfast/lunch planning.

Always respond with valid JSON only. No markdown, no explanation outside the JSON structure.`;

async function callClaude(userPrompt) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: HOUSEHOLD_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: '{' },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content[0].text;

  // Prepend the prefill character we sent, then strip any markdown fences as a fallback
  let text = '{' + raw;
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Claude returned invalid JSON: ' + text.slice(0, 200));
  }
}

// Call 1: Generate the weekly meal plan (4 slots)
export async function generateMealPlan() {
  const prompt = `Generate a weekly meal plan for this household. Return exactly 4 meal slots.

Return this exact JSON structure:
{
  "meals": [
    {
      "slot": "ambitious",
      "name": "string — dish name",
      "effortTier": "ambitious",
      "cookTime": "string — e.g. '2–3 hours'",
      "protein": "string — primary protein",
      "vegetableComponent": "string — vegetable(s) in or alongside dish",
      "notes": "string or null — any relevant notes (e.g. dairy substitution)",
      "produceLeftovers": "string — brief description of what components/leftovers Sunday produces for mid-week"
    },
    {
      "slot": "leftover",
      "name": "string — e.g. 'Leftover ideas from [Sunday dish name]'",
      "effortTier": "leftover",
      "cookTime": "10–20 min",
      "protein": "string — inherited from Sunday",
      "vegetableComponent": "string — inherited from Sunday",
      "notes": "string or null",
      "leftoverIdeas": [
        {
          "title": "string — idea name, e.g. 'Turn it into tacos'",
          "description": "string — loose method notes, 2-4 sentences, Emily-compatible improvisational style"
        }
      ]
    },
    {
      "slot": "fast",
      "name": "string — dish name",
      "effortTier": "fast",
      "cookTime": "string — e.g. '25 min'",
      "protein": "string",
      "vegetableComponent": "string",
      "notes": "string or null"
    },
    {
      "slot": "fast",
      "name": "string — dish name",
      "effortTier": "fast",
      "cookTime": "string — e.g. '20 min'",
      "protein": "string",
      "vegetableComponent": "string",
      "notes": "string or null"
    }
  ]
}

Rules:
- Vary cuisines across the week — don't repeat the same cuisine twice
- Sunday's ambitious meal must produce enough for at least one mid-week repurposed meal
- Leftover ideas must use only Sunday's already-purchased ingredients — no new shopping items
- All meals scaled to serve 2
- Include a vegetable in every meal slot
- Leftover slot must include exactly 2-3 leftover ideas`;

  return callClaude(prompt);
}

// Call 1b: Regenerate a single meal slot (swap)
export async function swapMeal(slot, currentMeals) {
  const currentNames = currentMeals.map((m) => m.name).join(', ');

  const slotDescriptions = {
    ambitious: 'an ambitious Sunday meal (45 min to several hours, must produce leftovers/components for mid-week)',
    fast: 'a fast weeknight meal (20-30 min)',
  };

  const prompt = `Generate a single replacement meal for the "${slot}" slot.
Current meals to avoid repeating: ${currentNames}

${slot === 'ambitious' ? 'Also regenerate leftover ideas based on the new Sunday meal.' : ''}

Return this exact JSON structure:
${slot === 'ambitious' ? `{
  "meal": {
    "slot": "ambitious",
    "name": "string",
    "effortTier": "ambitious",
    "cookTime": "string",
    "protein": "string",
    "vegetableComponent": "string",
    "notes": "string or null",
    "produceLeftovers": "string"
  },
  "leftoverMeal": {
    "slot": "leftover",
    "name": "string",
    "effortTier": "leftover",
    "cookTime": "10–20 min",
    "protein": "string",
    "vegetableComponent": "string",
    "notes": "string or null",
    "leftoverIdeas": [
      { "title": "string", "description": "string" }
    ]
  }
}` : `{
  "meal": {
    "slot": "${slot}",
    "name": "string",
    "effortTier": "${slot}",
    "cookTime": "string",
    "protein": "string",
    "vegetableComponent": "string",
    "notes": "string or null"
  }
}`}

This is ${slotDescriptions[slot] || 'a meal slot'}.
Pick a different cuisine than the meals already in the plan. Include a vegetable. Scale to serve 2.`;

  return callClaude(prompt);
}

// Call 2: Generate recipe for a single meal (lazy — called on demand)
export async function generateRecipe(meal) {
  const prompt = `Generate a full recipe for: "${meal.name}"
Slot: ${meal.slot} (${meal.effortTier})
Primary protein: ${meal.protein}
Vegetable component: ${meal.vegetableComponent}
${meal.notes ? `Notes from meal plan: ${meal.notes}` : ''}

Return this exact JSON structure:
{
  "mealName": "string",
  "stepByStep": {
    "ingredients": [
      { "item": "string", "quantity": "string" }
    ],
    "steps": [
      {
        "number": 1,
        "instruction": "string — full step with exact temps, times, and visual doneness cues"
      }
    ],
    "vegetableSide": "string or null — if a separate vegetable side is needed, describe it briefly"
  },
  "looseFormat": {
    "ingredients": [
      { "item": "string", "quantity": "string — approximate, e.g. 'a few tablespoons'" }
    ],
    "methodOverview": "string — 3-6 sentences, technique notes over rigid steps, Emily-compatible"
  },
  "shoppingIngredients": {
    "definitelyNeed": ["string — fresh produce, proteins, fresh herbs"],
    "mightNeed": ["string — pantry items, canned goods, grains, oils, condiments, spices, dairy staples, nuts"]
  },
  "dairySubNote": "string or null — if coconut milk/plant milk substituted for cooking cream/milk, explain here"
}

Rules:
- Step-by-step format: exact quantities, numbered steps, temperatures in °F, times, visual cues (e.g. 'until golden brown', 'internal temp 165°F')
- Loose format: approx quantities, method overview, improvisational tone
- definitelyNeed: fresh items unlikely to already be in the house (produce, proteins, fresh herbs)
- mightNeed: anything with a long shelf life (oils, sauces, canned goods, grains, spices, pantry items)
- Grains and carbs (rice, noodles, pasta) go in mightNeed even if required
- Scale to serve 2, erring slightly small for Emily's portions
- Substitute coconut milk/cream or plant milk for any cooking milk or cream`;

  return callClaude(prompt);
}

// Call 3: Ingredient reuse suggestions (called after all recipes loaded)
export async function generateReuseSuggestions(meals, recipes) {
  const recipeData = meals
    .filter((m) => m.slot !== 'leftover' && recipes[m.name])
    .map((m) => ({
      mealName: m.name,
      slot: m.slot,
      definitelyNeed: recipes[m.name].shoppingIngredients.definitelyNeed,
      mightNeed: recipes[m.name].shoppingIngredients.mightNeed,
    }));

  const prompt = `Here are the ingredient lists for this week's meals:
${JSON.stringify(recipeData, null, 2)}

Identify optional ingredient reuse opportunities. Look for perishable ingredients (fresh produce, fresh herbs, proteins) that appear in one meal but could also enhance another.

Return this exact JSON structure:
{
  "suggestions": [
    {
      "ingredient": "string — the ingredient name",
      "currentlyUsedIn": "string — meal name where it's already required",
      "couldAlsoWorkIn": "string — meal name where it could optionally be used",
      "suggestionText": "string — natural language suggestion shown to Emily, e.g. 'You're already buying cilantro for the tacos — it also works great on the stir fry, want to add it?'"
    }
  ]
}

Rules:
- Only suggest perishables (fresh produce, fresh herbs) — not pantry staples
- Only suggest if it genuinely improves the other dish, not just because it's available
- 2-5 suggestions maximum
- Tone: practical and helpful, not pushy
- If no good suggestions exist, return an empty suggestions array`;

  return callClaude(prompt);
}
