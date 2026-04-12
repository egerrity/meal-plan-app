import { useState, useEffect } from 'react';
import LZString from 'lz-string';
import './ShareView.css';

// Encode the full plan into the URL hash (compressed)
function encodePlan(payload) {
  const json = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(json);
}

// Decode plan from URL hash — supports both compressed (new) and uncompressed (old) links
export function decodePlan(hash) {
  // Try compressed format first
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (json) return JSON.parse(json);
  } catch {
    // fall through
  }
  // Fallback: old uncompressed format
  try {
    const json = decodeURIComponent(atob(hash));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const SLOT_LABELS = {
  ambitious: 'Sunday',
  leftover: 'Mid-week',
  fast: 'Weeknight',
};

export default function ShareView({ meals, recipes, reuseSuggestions, finalList, onBack }) {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [recipeFormat, setRecipeFormat] = useState('stepByStep'); // 'stepByStep' | 'loose'

  useEffect(() => {
    const payload = { meals, recipes, reuseSuggestions, finalList };
    const hash = encodePlan(payload);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    setShareUrl(url);
    window.location.hash = hash;
  }, [meals, recipes, reuseSuggestions, finalList]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select the input
      document.getElementById('share-url-input')?.select();
    }
  }

  const cookableMeals = meals?.filter((m) => m.slot !== 'leftover') ?? [];
  const leftoverMeal = meals?.find((m) => m.slot === 'leftover');

  return (
    <div className="share-view">
      <div className="share-view__header">
        <button className="share-view__back-btn" onClick={onBack}>
          ← Back to grocery list
        </button>
        <h2>Share this week's plan</h2>
      </div>

      {/* Shareable link */}
      <section className="share-link-section">
        <p className="share-link-section__desc">
          Send this link to Ryan — no login required. Opens on mobile with all recipes.
        </p>
        <div className="share-link-section__row">
          <input
            id="share-url-input"
            className="share-link-section__input"
            type="text"
            value={shareUrl}
            readOnly
            onFocus={(e) => e.target.select()}
          />
          <button className="share-link-section__copy-btn" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </section>

      {/* Finalized grocery list */}
      {finalList && (
        <section className="share-grocery-section">
          <h3 className="share-section-title">Grocery list</h3>
          <div className="share-grocery-columns">
            <div>
              <p className="share-grocery-label">Always buying</p>
              <ul className="share-grocery-list">
                {finalList.alwaysBuying.map((item) => (
                  <li key={item.name}>
                    {item.name}{item.detail ? ` — ${item.detail}` : ''}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="share-grocery-label">You need this</p>
              <ul className="share-grocery-list">
                {finalList.needThis.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            {finalList.mightNeedConfirmed?.length > 0 && (
              <div>
                <p className="share-grocery-label">Also buying</p>
                <ul className="share-grocery-list">
                  {finalList.snackReminder && (
                    <li>{finalList.snackReminder.name} — {finalList.snackReminder.detail}</li>
                  )}
                  {finalList.mightNeedConfirmed.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recipe viewer */}
      <section className="share-recipes-section">
        <h3 className="share-section-title">This week's recipes</h3>

        <div className="share-recipes-list">
          {cookableMeals.map((meal) => {
            const recipe = recipes[meal.name];
            const isOpen = expandedMeal === meal.name;

            return (
              <div key={meal.name} className="share-recipe-card">
                <button
                  className="share-recipe-card__toggle"
                  onClick={() => setExpandedMeal(isOpen ? null : meal.name)}
                >
                  <div className="share-recipe-card__meta">
                    <span className="share-recipe-card__slot">{SLOT_LABELS[meal.slot]}</span>
                    <span className="share-recipe-card__name">{meal.name}</span>
                  </div>
                  <span className="share-recipe-card__chevron">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && recipe && (
                  <div className="share-recipe-card__body">
                    <div className="share-recipe-card__format-toggle">
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
                      <p className="share-recipe-card__dairy-note">
                        🥥 {recipe.dairySubNote}
                      </p>
                    )}

                    {recipeFormat === 'stepByStep' && recipe.stepByStep && (
                      <div className="share-recipe-card__steps">
                        <h4>Ingredients</h4>
                        <ul className="share-recipe__ingredients">
                          {recipe.stepByStep.ingredients.map((ing, i) => (
                            <li key={i}>
                              <span className="ing-qty">{ing.quantity}</span> {ing.item}
                            </li>
                          ))}
                        </ul>
                        {recipe.stepByStep.vegetableSide && (
                          <p className="share-recipe__veg-side">
                            <strong>Vegetable side:</strong> {recipe.stepByStep.vegetableSide}
                          </p>
                        )}
                        <h4>Steps</h4>
                        <ol className="share-recipe__step-list">
                          {recipe.stepByStep.steps.map((step) => (
                            <li key={step.number}>{step.instruction}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {recipeFormat === 'loose' && recipe.looseFormat && (
                      <div className="share-recipe-card__loose">
                        <h4>Ingredients</h4>
                        <ul className="share-recipe__ingredients">
                          {recipe.looseFormat.ingredients.map((ing, i) => (
                            <li key={i}>
                              <span className="ing-qty">{ing.quantity}</span> {ing.item}
                            </li>
                          ))}
                        </ul>
                        <h4>Method</h4>
                        <p className="share-recipe__method">{recipe.looseFormat.methodOverview}</p>
                      </div>
                    )}

                    {!recipe && (
                      <p className="share-recipe-card__no-recipe">Recipe not loaded.</p>
                    )}
                  </div>
                )}

                {isOpen && !recipe && (
                  <div className="share-recipe-card__body">
                    <p className="share-recipe-card__no-recipe">
                      Recipe wasn't loaded — go back to the plan and open this recipe first.
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Leftover ideas */}
          {leftoverMeal && (
            <div className="share-recipe-card">
              <button
                className="share-recipe-card__toggle"
                onClick={() =>
                  setExpandedMeal(expandedMeal === 'leftover' ? null : 'leftover')
                }
              >
                <div className="share-recipe-card__meta">
                  <span className="share-recipe-card__slot">Mid-week</span>
                  <span className="share-recipe-card__name">{leftoverMeal.name}</span>
                </div>
                <span className="share-recipe-card__chevron">
                  {expandedMeal === 'leftover' ? '▲' : '▼'}
                </span>
              </button>
              {expandedMeal === 'leftover' && leftoverMeal.leftoverIdeas && (
                <div className="share-recipe-card__body">
                  <ul className="share-leftover-ideas">
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
