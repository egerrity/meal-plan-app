import { useState } from 'react';
import PlanView from './components/PlanView';
import GroceryView from './components/GroceryView';
import ShareView from './components/ShareView';
import './App.css';

// Views: 'plan' | 'grocery' | 'share'
export default function App() {
  const [view, setView] = useState('plan');
  const [meals, setMeals] = useState(null);
  const [recipes, setRecipes] = useState({});
  const [reuseSuggestions, setReuseSuggestions] = useState(null);
  const [finalList, setFinalList] = useState(null);

  function handlePlanGenerated(newMeals) {
    setMeals(newMeals);
    setRecipes({});
    setReuseSuggestions(null);
    setFinalList(null);
  }

  function handleMealSwapped(updatedMeals) {
    setMeals(updatedMeals);
    setRecipes({});
    setReuseSuggestions(null);
    setFinalList(null);
  }

  function handleRecipeLoaded(mealName, recipe) {
    setRecipes((prev) => ({ ...prev, [mealName]: recipe }));
  }

  function handleReuseSuggestionsLoaded(suggestions) {
    setReuseSuggestions(suggestions);
  }

  function handleGoToGrocery() {
    setView('grocery');
  }

  function handleConfirmList(list) {
    setFinalList(list);
    setView('share');
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Weekly Meal Plan</h1>
        {view !== 'plan' && (
          <nav className="app-nav">
            <button
              className={`app-nav__btn ${view === 'grocery' ? 'app-nav__btn--active' : ''}`}
              onClick={() => setView('grocery')}
            >
              Grocery list
            </button>
            <button
              className={`app-nav__btn ${view === 'share' ? 'app-nav__btn--active' : ''}`}
              onClick={() => finalList && setView('share')}
              disabled={!finalList}
            >
              Share
            </button>
          </nav>
        )}
      </header>
      <main>
        {view === 'plan' && (
          <PlanView
            meals={meals}
            recipes={recipes}
            reuseSuggestions={reuseSuggestions}
            onPlanGenerated={handlePlanGenerated}
            onMealSwapped={handleMealSwapped}
            onRecipeLoaded={handleRecipeLoaded}
            onReuseSuggestionsLoaded={handleReuseSuggestionsLoaded}
            onGoToGrocery={handleGoToGrocery}
          />
        )}
        {view === 'grocery' && (
          <GroceryView
            meals={meals}
            recipes={recipes}
            reuseSuggestions={reuseSuggestions}
            onConfirm={handleConfirmList}
            onBack={() => setView('plan')}
          />
        )}
        {view === 'share' && (
          <ShareView
            meals={meals}
            recipes={recipes}
            reuseSuggestions={reuseSuggestions}
            finalList={finalList}
            onBack={() => setView('grocery')}
          />
        )}
      </main>
    </div>
  );
}
