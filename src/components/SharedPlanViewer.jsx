import { useState } from 'react';
import './SharedPlanViewer.css';

const SLOT_LABELS = {
  ambitious: 'Sunday',
  leftover: 'Mid-week',
  fast: 'Weeknight',
};

export default function SharedPlanViewer({ plan }) {
  const { meals, recipes, finalList } = plan;
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [recipeFormat, setRecipeFormat] = useState('stepByStep');

  const cookableMeals = meals?.filter((m) => m.slot !== 'leftover') ?? [];
  const leftoverMeal = meals?.find((m) => m.slot === 'leftover');

  return (
    <div className="shared-viewer">
      <header className="shared-viewer__header">
        <h1>This week's meals</h1>
      </header>

      {/* Grocery list — compact, for shopping */}
      {finalList && (
        <section className="shared-viewer__section">
          <h2 className="shared-viewer__section-title">Grocery list</h2>
          <div className="shared-grocery">
            <div className="shared-grocery__group">
              <p className="shared-grocery__label">Always buying</p>
              <ul>
                {finalList.alwaysBuying.map((item) => (
                  <li key={item.name}>{item.name}{item.detail ? ` — ${item.detail}` : ''}</li>
                ))}
              </ul>
            </div>
            <div className="shared-grocery__group">
              <p className="shared-grocery__label">You need this</p>
              <ul>
                {finalList.needThis.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            {(finalList.mightNeedConfirmed?.length > 0 || finalList.snackReminder) && (
              <div className="shared-grocery__group">
                <p className="shared-grocery__label">Also buying</p>
                <ul>
                  {finalList.snackReminder && (
                    <li>{finalList.snackReminder.name} — {finalList.snackReminder.detail}</li>
                  )}
                  {finalList.mightNeedConfirmed?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recipes */}
      <section className="shared-viewer__section">
        <h2 className="shared-viewer__section-title">Recipes</h2>

        <div className="shared-recipes">
          {cookableMeals.map((meal) => {
            const recipe = recipes?.[meal.name];
            const isOpen = expandedMeal === meal.name;

            return (
              <div key={meal.name} className="shared-recipe-card">
                <button
                  className="shared-recipe-card__toggle"
                  onClick={() => setExpandedMeal(isOpen ? null : meal.name)}
                >
                  <div className="shared-recipe-card__meta">
                    <span className="shared-recipe-card__slot">{SLOT_LABELS[meal.slot]}</span>
                    <span className="shared-recipe-card__name">{meal.name}</span>
                    <span className="shared-recipe-card__time">{meal.cookTime}</span>
                  </div>
                  <span className="shared-recipe-card__chevron">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && recipe && (
                  <div className="shared-recipe-card__body">
                    <div className="shared-format-toggle">
                      <button
                        className={recipeFormat === 'stepByStep' ? 'active' : ''}
                        onClick={() => setRecipeFormat('stepByStep')}
                      >
                        Step-by-step
                      </button>
                      <button
                        className={recipeFormat === 'loose' ? 'active' : ''}
                        onClick={() => setRecipeFormat('loose')}
                      >
                        Loose
                      </button>
                    </div>

                    {recipe.dairySubNote && (
                      <p className="shared-dairy-note">🥥 {recipe.dairySubNote}</p>
                    )}

                    {recipeFormat === 'stepByStep' && recipe.stepByStep && (
                      <>
                        <h4 className="shared-recipe__subheading">Ingredients</h4>
                        <ul className="shared-recipe__ingredients">
                          {recipe.stepByStep.ingredients.map((ing, i) => (
                            <li key={i}>
                              <span className="ing-qty">{ing.quantity}</span> {ing.item}
                            </li>
                          ))}
                        </ul>
                        {recipe.stepByStep.vegetableSide && (
                          <p className="shared-recipe__veg-side">
                            <strong>Veg side:</strong> {recipe.stepByStep.vegetableSide}
                          </p>
                        )}
                        <h4 className="shared-recipe__subheading">Steps</h4>
                        <ol className="shared-recipe__steps">
                          {recipe.stepByStep.steps.map((step) => (
                            <li key={step.number}>{step.instruction}</li>
                          ))}
                        </ol>
                      </>
                    )}

                    {recipeFormat === 'loose' && recipe.looseFormat && (
                      <>
                        <h4 className="shared-recipe__subheading">Ingredients</h4>
                        <ul className="shared-recipe__ingredients">
                          {recipe.looseFormat.ingredients.map((ing, i) => (
                            <li key={i}>
                              <span className="ing-qty">{ing.quantity}</span> {ing.item}
                            </li>
                          ))}
                        </ul>
                        <h4 className="shared-recipe__subheading">Method</h4>
                        <p className="shared-recipe__method">{recipe.looseFormat.methodOverview}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {leftoverMeal && (
            <div className="shared-recipe-card">
              <button
                className="shared-recipe-card__toggle"
                onClick={() =>
                  setExpandedMeal(expandedMeal === 'leftover' ? null : 'leftover')
                }
              >
                <div className="shared-recipe-card__meta">
                  <span className="shared-recipe-card__slot">Mid-week</span>
                  <span className="shared-recipe-card__name">{leftoverMeal.name}</span>
                  <span className="shared-recipe-card__time">{leftoverMeal.cookTime}</span>
                </div>
                <span className="shared-recipe-card__chevron">
                  {expandedMeal === 'leftover' ? '▲' : '▼'}
                </span>
              </button>
              {expandedMeal === 'leftover' && leftoverMeal.leftoverIdeas && (
                <div className="shared-recipe-card__body">
                  <ul className="shared-leftover-ideas">
                    {leftoverMeal.leftoverIdeas.map((idea, i) => (
                      <li key={i}>
                        <strong>{idea.title}</strong>
                        <p>{idea.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
