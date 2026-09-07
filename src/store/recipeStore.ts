import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey, isOwnerAccount } from '../lib/workspace'

// ── Types ────────────────────────────────────────────────────────
// Gestructureerd model: elk ingredient en elke stap is een eigen record,
// zodat schalen, voedingswaarden en (later) boodschappenlijsten mogelijk blijven.

export const RECIPE_CATEGORIES = [
  'Ontbijt', 'Lunch', 'Diner', 'Snack', 'Dessert', 'Drinks', 'Meal Prep', 'Anders',
] as const

export const RECIPE_TAGS = [
  'High Protein', 'Low Calorie', 'Quick', 'Meal Prep', 'Vegetarisch', 'Vegan', 'Glutenvrij', 'Zoet', 'Hartig',
] as const

export const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'stuk', 'handvol', 'snuf', 'naar smaak'] as const
// eenheden die niet meeschalen als getal (geen hoeveelheid)
export const UNSCALED_UNITS = new Set(['naar smaak'])

export const HACK_CATEGORIES = [
  'Time Saver', 'High Protein', 'Lower Calorie', 'Meal Prep', 'Techniek', 'Ingredient Swap', 'Smaak', 'Bewaren', 'Kitchen Hack',
] as const

export const SOURCE_PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Website', 'Boek', 'Vriend(in)', 'Eigen recept', 'Anders'] as const

export interface Ingredient {
  id: string
  name: string
  quantity?: number      // origineel aantal; UI schaalt, database blijft onaangeroerd
  unit: string
  preparation?: string   // bv. "geraspt"
  notes?: string
  optional?: boolean
  groupId?: string
}

export interface IngredientGroup {
  id: string
  name: string
}

export interface RecipeStep {
  id: string
  text: string
}

export interface Nutrition {
  calories?: number      // per originele portie
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
}

export interface RecipeSource {
  platform?: string
  url?: string
  creator?: string
}

export type RecipeStatus = 'draft' | 'published'
export type Difficulty = 'makkelijk' | 'gemiddeld' | 'uitdagend'

export interface Recipe {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  prepTime?: number      // minuten
  cookTime?: number
  servings: number       // originele porties
  difficulty?: Difficulty
  groups: IngredientGroup[]
  ingredients: Ingredient[]
  steps: RecipeStep[]
  nutrition: Nutrition   // per originele portie
  source: RecipeSource
  status: RecipeStatus
  favorite: boolean
  hasImage?: boolean     // afbeelding staat in IndexedDB onder key `recipe-${id}`
  createdAt: string
  updatedAt: string
}

export interface LUHack {
  id: string
  title: string
  content: string
  category: string
  recipeId?: string
  createdAt: string
}

// ── Helpers ──────────────────────────────────────────────────────
export function emptyRecipe(): Recipe {
  return {
    id: crypto.randomUUID(),
    title: '', description: '', category: 'Diner', tags: [],
    servings: 2, groups: [], ingredients: [], steps: [],
    nutrition: {}, source: {},
    status: 'draft', favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Nette weergave van geschaalde hoeveelheden: 0.6666667 -> 0.67, 1.50 -> 1.5, 3.0 -> 3
export function formatQty(q: number): string {
  if (!isFinite(q)) return ''
  const rounded = q >= 100 ? Math.round(q) : Math.round(q * 100) / 100
  if (Number.isInteger(rounded)) return String(rounded)
  return String(parseFloat(rounded.toFixed(2)))
}

export function scaleQty(quantity: number, originalServings: number, selectedServings: number): number {
  return quantity * (selectedServings / Math.max(1, originalServings))
}

// ── Seed-recepten (Kookboek Healthy & Jummy) ─────────────────────
// Vaste id's zodat de migratie ze nooit dubbel toevoegt.
const T = '2026-08-24T10:00:00.000Z'
const ing = (id: string, name: string, quantity: number | undefined, unit: string, extra: Partial<Ingredient> = {}): Ingredient =>
  ({ id, name, quantity, unit, ...extra })

export const SEED_RECIPES: Recipe[] = [
  {
    id: 'seed-chicken-meatballs',
    title: 'Chicken Meatballs in Tomato Sauce',
    description: 'Malse kipballetjes uit de airfryer in een diepe tomatensaus. Serveer met bruine rijst of geroosterde zuurdesem en rucola.',
    category: 'Diner', tags: ['High Protein'],
    prepTime: 15, cookTime: 30, servings: 4, difficulty: 'gemiddeld',
    groups: [
      { id: 'g-mb', name: 'Meatballs' },
      { id: 'g-saus', name: 'Saus' },
    ],
    ingredients: [
      ing('mb1', 'mager kippengehakt (± 5% vet)', 500, 'g', { groupId: 'g-mb' }),
      ing('mb2', 'citroenzeste', 0.5, 'stuk', { groupId: 'g-mb', preparation: 'van een halve citroen' }),
      ing('mb3', 'ei', 1, 'stuk', { groupId: 'g-mb' }),
      ing('mb4', 'paneermeel', 60, 'g', { groupId: 'g-mb' }),
      ing('mb5', 'gedroogde oregano', 1, 'tsp', { groupId: 'g-mb' }),
      ing('mb6', 'look', 2, 'stuk', { groupId: 'g-mb', preparation: 'fijngehakt' }),
      ing('mb7', 'cottage cheese', 1, 'tbsp', { groupId: 'g-mb', preparation: 'grote eetlepel' }),
      ing('s1', 'bruine ui', 1, 'stuk', { groupId: 'g-saus', preparation: 'fijngesneden' }),
      ing('s2', 'look', 2, 'stuk', { groupId: 'g-saus', preparation: 'fijngehakt' }),
      ing('s3', 'rode chili', 1, 'stuk', { groupId: 'g-saus', preparation: 'fijngehakt' }),
      ing('s4', 'tomatenpuree', 1, 'tbsp', { groupId: 'g-saus', preparation: 'volle eetlepel' }),
      ing('s5', 'gehakte tomaten (blik)', 400, 'g', { groupId: 'g-saus' }),
      ing('s6', 'passata', 400, 'g', { groupId: 'g-saus' }),
      ing('s7', 'verse basilicum', 1, 'handvol', { groupId: 'g-saus', preparation: 'grote handvol' }),
    ],
    steps: [
      { id: 'st1', text: 'Meng kippengehakt, citroenzeste, ei, paneermeel, oregano, look en cottage cheese in een grote kom. Kruid royaal met peper en zout, meng tot net gecombineerd.' },
      { id: 'st2', text: 'Rol 12 balletjes (met natte handen gaat dit makkelijker). Airfryer op 210°C, 10 tot 12 minuten, halverwege draaien. Of onder een hete grill tot mooi gebruind. Ze hoeven nog niet gaar te zijn, ze garen verder in de saus.' },
      { id: 'st3', text: 'Verhit intussen 1 el olijfolie in een grote pan op middelhoog vuur. Fruit de ui met een snuf zout 5 minuten. Voeg look en chili toe, 1 minuut. Roer de tomatenpuree erdoor en bak 1 tot 2 minuten tot dieprood.' },
      { id: 'st4', text: 'Giet de gehakte tomaten en passata erbij, kruid goed en laat ± 10 minuten sudderen tot licht ingekookt.' },
      { id: 'st5', text: 'Leg de balletjes in de saus en laat nog 5 minuten sudderen tot ze gaar zijn. Werk af met verse basilicum en geraspte parmezaan.' },
      { id: 'st6', text: 'Serveer met een lepel cottage cheese, extra parmezaan en basilicum. Lekker met bruine rijst, of met geroosterde zuurdesem en een handvol rucola.' },
    ],
    nutrition: { calories: 400, protein: 40 },
    source: {},
    status: 'published', favorite: false,
    createdAt: T, updatedAt: T,
  },
  {
    id: 'seed-cottage-cheese-pizza',
    title: 'High Protein Cottage Cheese Pizza',
    description: 'Dunne, krokante pizzabodem van cottage cheese en eiwit. Kan ook glutenvrij.',
    category: 'Diner', tags: ['High Protein', 'Glutenvrij'],
    prepTime: 10, cookTime: 20, servings: 1, difficulty: 'makkelijk',
    groups: [
      { id: 'g-bodem', name: 'De bodem' },
      { id: 'g-top', name: 'De toppings' },
    ],
    ingredients: [
      ing('b1', 'cottage cheese', 60, 'g', { groupId: 'g-bodem' }),
      ing('b2', 'vloeibaar eiwit', 80, 'ml', { groupId: 'g-bodem' }),
      ing('b3', 'bloem (kan glutenvrij)', 40, 'g', { groupId: 'g-bodem' }),
      ing('b4', 'kokosmeel', 1.5, 'tbsp', { groupId: 'g-bodem' }),
      ing('b5', 'bakpoeder', 1, 'tsp', { groupId: 'g-bodem' }),
      ing('b6', 'oregano', undefined, 'naar smaak', { groupId: 'g-bodem' }),
      ing('b7', 'lookpoeder', undefined, 'naar smaak', { groupId: 'g-bodem' }),
      ing('b8', 'chilivlokken', undefined, 'naar smaak', { groupId: 'g-bodem' }),
      ing('t1', 'marinarasaus', 80, 'ml', { groupId: 'g-top' }),
      ing('t2', 'parmezaan', undefined, 'naar smaak', { groupId: 'g-top' }),
      ing('t3', 'prosciutto', undefined, 'naar smaak', { groupId: 'g-top' }),
      ing('t4', 'rucola', 1, 'handvol', { groupId: 'g-top' }),
      ing('t5', 'pompoenpitten', undefined, 'naar smaak', { groupId: 'g-top' }),
    ],
    steps: [
      { id: 'st1', text: 'Oven voor op 175°C. Meng alle bodem-ingrediënten met een vork in een kom, giet op een bakplaat met bakpapier en spreid uit in een cirkel. Het beslag oogt dun, dat is juist goed.' },
      { id: 'st2', text: 'Bak 10 minuten, haal de bodem van het bakpapier en leg terug. Beleg met marinara en prosciutto.' },
      { id: 'st3', text: 'Bak nog 10 minuten tot de kaas bubbelt en de randen krokant zijn. Werk af met rucola, schilfers parmezaan en pompoenpitten.' },
    ],
    nutrition: {},
    source: {},
    status: 'published', favorite: false,
    createdAt: T, updatedAt: T,
  },
  {
    id: 'seed-traybake',
    title: 'Traybake: zoete aardappel, kip, pompoen & spinazie',
    description: 'Alles samen roosteren op één plaat, simpel en snel.',
    category: 'Diner', tags: ['Quick', 'Meal Prep'],
    servings: 2, difficulty: 'makkelijk',
    groups: [],
    ingredients: [
      ing('tb1', 'zoete aardappel', undefined, 'naar smaak'),
      ing('tb2', 'kip', undefined, 'naar smaak'),
      ing('tb3', 'pompoen', undefined, 'naar smaak'),
      ing('tb4', 'spinazie', undefined, 'naar smaak'),
      ing('tb5', 'ui', undefined, 'naar smaak'),
    ],
    steps: [
      { id: 'st1', text: 'Alles samen roosteren in de oven, simpel en snel. Kruid naar smaak.' },
    ],
    nutrition: {},
    source: {},
    status: 'published', favorite: false,
    createdAt: T, updatedAt: T,
  },
  {
    id: 'seed-tuna-cucumber-roll',
    title: 'Tuna Avocado Cucumber Roll',
    description: 'Sushi-style rolletjes van komkommerlinten, zonder koken.',
    category: 'Lunch', tags: ['High Protein', 'Quick'],
    prepTime: 15, servings: 1, difficulty: 'makkelijk',
    groups: [],
    ingredients: [
      ing('tc1', 'komkommer', 1, 'stuk', { preparation: 'in dunne linten geschaafd' }),
      ing('tc2', 'Griekse yoghurt', 2, 'tbsp'),
      ing('tc3', 'rijst', 100, 'g', { preparation: 'gekookt' }),
      ing('tc4', 'tonijn', 1, 'stuk', { preparation: 'blikje · of zalm, of wat je lekker vindt in sushi' }),
      ing('tc5', 'avocado', 0.5, 'stuk'),
      ing('tc6', 'serranopeper', undefined, 'naar smaak', { preparation: 'dun gesneden' }),
      ing('tc7', 'sesamzaadjes', undefined, 'naar smaak'),
    ],
    steps: [
      { id: 'st1', text: 'Schaaf de komkommer met een dunschiller in dunne linten en leg ze overlappend op keukenpapier. Dep het vocht goed weg.' },
      { id: 'st2', text: 'Besmeer met Griekse yoghurt.' },
      { id: 'st3', text: 'Beleg met rijst, tonijn en avocado.' },
      { id: 'st4', text: 'Rol op en werk af met dun gesneden serranopeper en sesamzaadjes.' },
    ],
    nutrition: {},
    source: { platform: 'Instagram', creator: '@senada.greca' },
    status: 'published', favorite: false,
    createdAt: T, updatedAt: T,
  },
]

// ── Store ────────────────────────────────────────────────────────
interface RecipeStore {
  recipes: Recipe[]
  hacks: LUHack[]

  saveRecipe: (recipe: Recipe) => void          // upsert: hele recept-object in één keer
  deleteRecipe: (id: string) => void
  toggleFavorite: (id: string) => void
  setStatus: (id: string, status: RecipeStatus) => void

  saveHack: (hack: LUHack) => void
  deleteHack: (id: string) => void
}

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set) => ({
      recipes: isOwnerAccount() ? SEED_RECIPES : [],
      hacks: [],

      saveRecipe: (recipe) => set(s => {
        const updated = { ...recipe, updatedAt: new Date().toISOString() }
        const exists = s.recipes.some(r => r.id === recipe.id)
        return {
          recipes: exists
            ? s.recipes.map(r => r.id === recipe.id ? updated : r)
            : [updated, ...s.recipes],
        }
      }),

      deleteRecipe: (id) => set(s => ({
        recipes: s.recipes.filter(r => r.id !== id),
        hacks: s.hacks.map(h => h.recipeId === id ? { ...h, recipeId: undefined } : h),
      })),

      toggleFavorite: (id) => set(s => ({
        recipes: s.recipes.map(r => r.id === id ? { ...r, favorite: !r.favorite } : r),
      })),

      setStatus: (id, status) => set(s => ({
        recipes: s.recipes.map(r => r.id === id ? { ...r, status } : r),
      })),

      saveHack: (hack) => set(s => {
        const exists = s.hacks.some(h => h.id === hack.id)
        return {
          hacks: exists ? s.hacks.map(h => h.id === hack.id ? hack : h) : [hack, ...s.hacks],
        }
      }),

      deleteHack: (id) => set(s => ({ hacks: s.hacks.filter(h => h.id !== id) })),
    }),
    {
      name: scopedKey('recipes-v1'),
      version: 1,
      // Voeg de seed-recepten eenmalig toe aan bestaande opslag, nooit dubbel.
      migrate: (persisted: any) => {
        if (persisted && Array.isArray(persisted.recipes) && isOwnerAccount()) {
          const existing = new Set(persisted.recipes.map((r: Recipe) => r.id))
          persisted.recipes = [...persisted.recipes, ...SEED_RECIPES.filter(r => !existing.has(r.id))]
        }
        return persisted
      },
    }
  )
)
