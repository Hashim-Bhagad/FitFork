import { motion } from "framer-motion";
import { Clock, Star, Utensils } from "lucide-react";

const CUISINE_EMOJIS = {
  Italian:"🍝", Indian:"🍛", Mexican:"🌮", Chinese:"🥢", Japanese:"🍣",
  Thai:"🫙", Mediterranean:"🫒", American:"🍔", French:"🥐",
  "Middle Eastern":"🧆", Korean:"🥘", Greek:"🫑", default:"🍽️",
};

export default function RecipeCard({ recipe, index = 0 }) {
  const emoji = CUISINE_EMOJIS[recipe.cuisine] || CUISINE_EMOJIS.default;
  const score = recipe.score != null ? Math.round(recipe.score * 100) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5, boxShadow: "var(--shadow-glow)" }}
      className="recipe-card glass"
    >
      <div className="rc-thumb">
        {emoji}
        {score !== null && <span className="rc-score">{score}% match</span>}
      </div>
      <div className="rc-body">
        <div className="rc-title">{recipe.title}</div>
        <div className="rc-meta">
          {recipe.cuisine && <span className="tag tag-brand">{recipe.cuisine}</span>}
          {recipe.time_minutes > 0 && <span className="tag flex items-center gap-1"><Clock size={10} /> {recipe.time_minutes}m</span>}
          {recipe.dietary_tags?.slice(0, 2).map(d => (
            <span key={d} className="tag tag-mint">{d}</span>
          ))}
        </div>
        {recipe.description && (
          <p className="rc-desc">{recipe.description}</p>
        )}
        {recipe.ingredients?.length > 0 && (
          <p style={{ fontSize:"0.72rem", color:"var(--muted)", marginBottom:8 }}>
            {recipe.ingredients.slice(0,4).join(" · ")}
            {recipe.ingredients.length > 4 && ` +${recipe.ingredients.length - 4} more`}
          </p>
        )}
        <div className="rc-nutrition">
          {[
            { val: recipe.calories  ? Math.round(recipe.calories)  : "—", lbl: "kcal" },
            { val: recipe.protein_g ? `${recipe.protein_g}g`       : "—", lbl: "protein" },
            { val: recipe.carbs_g   ? `${recipe.carbs_g}g`         : "—", lbl: "carbs" },
            { val: recipe.fat_g     ? `${recipe.fat_g}g`           : "—", lbl: "fat" },
          ].map(n => (
            <div key={n.lbl} className="rn">
              <div className="rn-val">{n.val}</div>
              <div className="rn-lbl">{n.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
