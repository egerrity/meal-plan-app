import { useState } from 'react';
import MealCard from './MealCard';
import ReuseSuggestions from './ReuseSuggestions';
import { generateMealPlan, swapMeal, generateRecipe, generateReuseSuggestions } from '../services/claude';
import './PlanView.css';

export default function PlanView({
  meals,
  recipes,
  reuseSuggestions,
  onPlanGenerated,
  onMealSwapped,
  onRecipeLoaded,
  onReuseSuggestionsLoaded,
  onGoToGrocery,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [swappingSlot, setSwappingSlot] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(null); // meal name being loaded
  const [isLoadingReuse, setIsLoadingReuse] = useState(false);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateMealPlan();
      onPlanGenerated(result.meals);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSwap(meal) {
    const swapKey = meal.slot === 'ambitious' ? 'ambitious' : meal.name;
    setSwappingSlot(swapKey);
    setError(null);
    try {
      const result = await swapMeal(meal.slot, meals);
      let updatedMeals = [...meals];

      if (meal.slot === 'ambitious') {
        updatedMeals = updatedMeals.map((m) => {
          if (m.slot === 'ambitious') return result.meal;
          if (m.slot === 'leftover') return result.leftoverMeal;
          return m;
        });
      } else {
        updatedMeals = updatedMeals.map((m) =>
          m.name === meal.name && m.slot === meal.slot ? result.meal : m
        );
      }

      onMealSwapped(updatedMeals);
    } catch (err) {
      setError(err.message);
    } finally {
      setSwappingSlot(null);
    }
  }

  // Lazy recipe load: called when Emily expands a recipe on a MealCard
  async function handleLoadRecipe(meal) {
    if (recipes[meal.name]) return; // already loaded
    setLoadingRecipe(meal.name);
    setError(null);
    try {
      const recipe = await generateRecipe(meal);
      onRecipeLoaded(meal.name, recipe);
    } catch (err) {
      setError(`Failed to load recipe for ${meal.name}: ${err.message}`);
    } finally {
      setLoadingRecipe(null);
    }
  }

  // Load all remaining recipes then fire reuse suggestions
  async function handleGoToGrocery() {
    const cookableMeals = meals.filter((m) => m.slot !== 'leftover');
    const unloaded = cookableMeals.filter((m) => !recipes[m.name]);

    setError(null);

    // Load any missing recipes in parallel
    if (unloaded.length > 0) {
      setLoadingRecipe('__all__');
      try {
        const results = await Promise.all(unloaded.map((m) => generateRecipe(m)));
        results.forEach((recipe, i) => {
          onRecipeLoaded(unloaded[i].name, recipe);
        });
      } catch (err) {
        setError(`Failed to load recipes: ${err.message}`);
        setLoadingRecipe(null);
        return;
      }
      setLoadingRecipe(null);
    }

    // Fire reuse suggestions if not already loaded
    if (!reuseSuggestions) {
      setIsLoadingReuse(true);
      try {
        // Build full recipes map including freshly loaded ones
        const allRecipes = { ...recipes };
        const unloadedResults = await Promise.all(
          unloaded.map((m) => allRecipes[m.name] ? Promise.resolve(allRecipes[m.name]) : generateRecipe(m))
        );
        unloaded.forEach((m, i) => { allRecipes[m.name] = unloadedResults[i]; });

        const result = await generateReuseSuggestions(meals, allRecipes);
        onReuseSuggestionsLoaded(result.suggestions);
      } catch (err) {
        // Reuse suggestions are non-critical — fail silently
        onReuseSuggestionsLoaded([]);
      } finally {
        setIsLoadingReuse(false);
      }
    }

    onGoToGrocery();
  }

  if (!meals) {
    return (
      <div className="plan-view plan-view--empty">
        <p className="plan-view__intro">
          Generate this week's meal plan. You'll get one ambitious Sunday cook,
          leftover ideas for mid-week, and two fast weeknight meals.
        </p>
        <button
          className="plan-view__generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating plan...' : "Generate this week's plan"}
        </button>
        {error && <p className="plan-view__error">{error}</p>}
      </div>
    );
  }

  const orderedMeals = [
    ...meals.filter((m) => m.slot === 'ambitious'),
    ...meals.filter((m) => m.slot === 'leftover'),
    ...meals.filter((m) => m.slot === 'fast'),
  ];

  const isBusy = isGenerating || swappingSlot !== null || loadingRecipe !== null || isLoadingReuse;

  return (
    <div className="plan-view">
      <div className="plan-view__top-actions">
        <button
          className="plan-view__regenerate-btn"
          onClick={handleGenerate}
          disabled={isBusy}
        >
          {isGenerating ? 'Regenerating...' : 'Regenerate whole plan'}
        </button>
      </div>

      {error && <p className="plan-view__error">{error}</p>}

      <div className="plan-view__grid">
        {orderedMeals.map((meal) => {
          const swapKey = meal.slot === 'ambitious' ? 'ambitious' : meal.name;
          return (
            <MealCard
              key={`${meal.slot}-${meal.name}`}
              meal={meal}
              recipe={recipes[meal.name] || null}
              isSwapping={swappingSlot === swapKey}
              isLoadingRecipe={loadingRecipe === meal.name || loadingRecipe === '__all__'}
              onSwap={() => handleSwap(meal)}
              onLoadRecipe={() => handleLoadRecipe(meal)}
            />
          );
        })}
      </div>

      {reuseSuggestions && reuseSuggestions.length > 0 && (
        <ReuseSuggestions suggestions={reuseSuggestions} />
      )}

      <div className="plan-view__bottom-actions">
        <button
          className="plan-view__grocery-btn"
          onClick={handleGoToGrocery}
          disabled={isBusy}
        >
          {loadingRecipe === '__all__' || isLoadingReuse
            ? 'Loading ingredients...'
            : 'Review grocery list →'}
        </button>
      </div>
    </div>
  );
}
