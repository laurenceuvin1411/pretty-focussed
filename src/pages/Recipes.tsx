import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus, Heart, Search, X, ChevronLeft, Clock, Users, Flame,
  Trash2, Copy, GripVertical, Sparkles, ArrowUpRight, Check, Minus,
  ImagePlus, ChefHat,
} from 'lucide-react'
import {
  useRecipeStore, emptyRecipe, formatQty, scaleQty,
  RECIPE_CATEGORIES, RECIPE_TAGS, UNITS, UNSCALED_UNITS, HACK_CATEGORIES, SOURCE_PLATFORMS,
} from '../store/recipeStore'
import type { Recipe, Ingredient, LUHack, Difficulty } from '../store/recipeStore'
import { saveContentFile, getContentFile, deleteContentFile } from '../utils/contentFiles'

// Persoonlijke health-ruimte: zachter en vrouwelijker dan de rest van het OS
// Zacht pastelroze, poederig zoals de Gisou-referentie
const ROSE = '#F2DCE3'        // soft powder pink
const ROSE_SOFT = '#FAEFF2'   // bijna wit, voor grote vlakken
const ROSE_DEEP = '#A57A8B'   // gedempte mauve, leesbaar als tekst
const ROSE_BG = 'rgba(242,220,227,0.45)'
// Futuristische zachte gradient-mesh voor hero's en vlakken
const MESH = 'linear-gradient(135deg, #FAEFF2 0%, #F2DCE3 42%, #EFE4EC 72%, #F7EFE8 100%)'
const GLASS = 'rgba(255,255,255,0.72)'

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 11, border: '1px solid var(--color-border)',
  background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6,
}

// ── Afbeeldingen via IndexedDB (zelfde infra als content-bestanden) ──
function useRecipeImage(recipeId: string, hasImage?: boolean, version = 0) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    if (hasImage) {
      getContentFile(`recipe-${recipeId}`).then(f => {
        if (f && !cancelled) {
          objectUrl = URL.createObjectURL(f.blob)
          setUrl(objectUrl)
        }
      })
    } else {
      setUrl(null)
    }
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [recipeId, hasImage, version])
  return url
}

function ImagePlaceholder({ title, height = 180 }: { title: string; height?: number }) {
  return (
    <div style={{ height, background: MESH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ChefHat size={28} color={ROSE_DEEP} style={{ opacity: 0.6 }} aria-label={title ? `Afbeelding voor ${title}` : 'Receptafbeelding'} />
    </div>
  )
}

// ── Recipe card ──────────────────────────────────────────────────
function RecipeCard({ recipe, onOpen }: { recipe: Recipe; onOpen: () => void }) {
  const { toggleFavorite } = useRecipeStore()
  const img = useRecipeImage(recipe.id, recipe.hasImage)
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)

  return (
    <div
      onClick={onOpen}
      style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.6)', background: 'var(--color-card)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 260ms cubic-bezier(.16,1,.3,1), box-shadow 260ms', position: 'relative', boxShadow: '0 4px 20px rgba(165,122,139,0.10)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 14px 38px rgba(165,122,139,0.20)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(165,122,139,0.10)' }}
    >
      <div style={{ position: 'relative' }}>
        {img
          ? <img src={img} alt={recipe.title} loading="lazy" style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
          : <ImagePlaceholder title={recipe.title} height={190} />}
        {/* zachte fade naar de kaart, geeft het zwevende gevoel */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0) 55%, rgba(255,255,255,0.35) 100%)', pointerEvents: 'none' }} />
      </div>

      <button
        onClick={e => { e.stopPropagation(); toggleFavorite(recipe.id) }}
        aria-label={recipe.favorite ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'}
        style={{ position: 'absolute', top: 13, right: 13, width: 36, height: 36, borderRadius: 14, border: '1px solid rgba(255,255,255,0.7)', background: GLASS, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.10)' }}
      >
        <Heart size={15} color={ROSE_DEEP} fill={recipe.favorite ? ROSE_DEEP : 'none'} />
      </button>

      {recipe.status === 'draft' && (
        <span style={{ position: 'absolute', top: 15, left: 13, fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: GLASS, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', color: ROSE_DEEP, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>DRAFT</span>
      )}

      <div style={{ padding: '14px 16px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: 4 }}>{recipe.title || 'Zonder titel'}</p>
        {recipe.description && (
          <p style={{ fontSize: 11.5, color: 'var(--color-subtle)', lineHeight: 1.5, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{recipe.description}</p>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-muted)', marginBottom: 8, flexWrap: 'wrap' }}>
          {totalTime > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {totalTime} min</span>}
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10} /> {recipe.servings}</span>
          {recipe.nutrition.calories != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Flame size={10} /> {recipe.nutrition.calories} kcal</span>}
          {recipe.nutrition.protein != null && <span>{recipe.nutrition.protein}g eiwit</span>}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: ROSE_BG, color: ROSE_DEEP, fontFamily: 'var(--font-mono)' }}>{recipe.category}</span>
          {recipe.tags.slice(0, 2).map(t => (
            <span key={t} style={{ fontSize: 9, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--color-surface)', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Ingredient row in de builder ─────────────────────────────────
function IngredientRow({ ing, onChange, onDelete, onDuplicate, onDragStart, onDrop }: {
  ing: Ingredient
  onChange: (updates: Partial<Ingredient>) => void
  onDelete: () => void
  onDuplicate: () => void
  onDragStart: () => void
  onDrop: () => void
}) {
  const [showExtra, setShowExtra] = useState(!!(ing.preparation || ing.notes || ing.optional))
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop() }}
      style={{ padding: '8px 10px', borderRadius: 11, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <GripVertical size={12} color="var(--color-subtle)" style={{ cursor: 'grab', flexShrink: 0 }} />
        <input
          value={ing.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="Ingrediënt..."
          aria-label="Ingrediëntnaam"
          style={{ ...inputStyle, flex: 2, minWidth: 90, padding: '7px 10px', fontSize: 12.5 }}
        />
        <input
          type="number"
          value={ing.quantity ?? ''}
          onChange={e => onChange({ quantity: e.target.value === '' ? undefined : Number(e.target.value) })}
          placeholder="200"
          aria-label="Hoeveelheid"
          min={0}
          step="any"
          style={{ ...inputStyle, width: 68, padding: '7px 8px', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}
        />
        <select
          value={ing.unit}
          onChange={e => onChange({ unit: e.target.value })}
          aria-label="Eenheid"
          style={{ ...inputStyle, width: 92, padding: '7px 8px', fontSize: 12, cursor: 'pointer' }}
        >
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <button onClick={() => setShowExtra(v => !v)} title="Bereiding, notitie, optioneel" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--color-border)', background: showExtra ? ROSE_BG : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showExtra ? ROSE_DEEP : 'var(--color-subtle)', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>+</button>
        <button onClick={onDuplicate} title="Dupliceer" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}><Copy size={10} /></button>
        <button onClick={onDelete} title="Verwijder" aria-label="Verwijder ingrediënt" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}><Trash2 size={10} /></button>
      </div>
      {showExtra && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6, paddingLeft: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={ing.preparation ?? ''} onChange={e => onChange({ preparation: e.target.value || undefined })} placeholder="Bereiding (bv. geraspt)" style={{ ...inputStyle, flex: 1, minWidth: 120, padding: '6px 10px', fontSize: 11.5 }} />
          <input value={ing.notes ?? ''} onChange={e => onChange({ notes: e.target.value || undefined })} placeholder="Notitie" style={{ ...inputStyle, flex: 1, minWidth: 100, padding: '6px 10px', fontSize: 11.5 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={!!ing.optional} onChange={e => onChange({ optional: e.target.checked || undefined })} style={{ accentColor: ROSE_DEEP }} />
            optioneel
          </label>
        </div>
      )}
    </div>
  )
}

// ── Recipe form ──────────────────────────────────────────────────
function RecipeForm({ initial, onSaved, onCancel }: { initial: Recipe; onSaved: (id: string) => void; onCancel: () => void }) {
  const { saveRecipe } = useRecipeStore()
  const [r, setR] = useState<Recipe>(initial)
  const [error, setError] = useState<string | null>(null)
  const [imgVersion, setImgVersion] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const dragIngId = useRef<string | null>(null)
  const dragStepId = useRef<string | null>(null)
  const img = useRecipeImage(r.id, r.hasImage, imgVersion)

  const set = (updates: Partial<Recipe>) => setR(prev => ({ ...prev, ...updates }))

  function updateIng(id: string, updates: Partial<Ingredient>) {
    set({ ingredients: r.ingredients.map(i => i.id === id ? { ...i, ...updates } : i) })
  }
  function addIng(groupId?: string) {
    set({ ingredients: [...r.ingredients, { id: crypto.randomUUID(), name: '', unit: 'g', groupId }] })
  }
  function reorderIng(fromId: string, toId: string) {
    const list = [...r.ingredients]
    const from = list.findIndex(i => i.id === fromId)
    const to = list.findIndex(i => i.id === toId)
    if (from < 0 || to < 0) return
    const [moved] = list.splice(from, 1)
    // neem de groep van de plek waar je dropt over
    moved.groupId = list[to]?.groupId ?? r.ingredients.find(i => i.id === toId)?.groupId
    list.splice(to, 0, moved)
    set({ ingredients: list })
  }

  function addStep() {
    set({ steps: [...r.steps, { id: crypto.randomUUID(), text: '' }] })
  }
  function reorderStep(fromId: string, toId: string) {
    const list = [...r.steps]
    const from = list.findIndex(s => s.id === fromId)
    const to = list.findIndex(s => s.id === toId)
    if (from < 0 || to < 0) return
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved)
    set({ steps: list })
  }

  async function handleImage(file: File) {
    try {
      await saveContentFile(`recipe-${r.id}`, file)
      set({ hasImage: true })
      setImgVersion(v => v + 1)
    } catch {
      setError('Afbeelding uploaden lukte niet. Probeer een kleinere foto.')
    }
  }

  function validate(): string | null {
    if (!r.title.trim()) return 'Geef je recept een naam.'
    if (!r.servings || r.servings < 1) return 'Aantal porties moet minstens 1 zijn.'
    const badQty = r.ingredients.some(i => i.name.trim() && i.quantity != null && (isNaN(i.quantity) || i.quantity < 0))
    if (badQty) return 'Controleer de hoeveelheden: alleen positieve getallen.'
    return null
  }

  function save(status: 'draft' | 'published') {
    const problem = validate()
    if (problem) { setError(problem); return }
    const clean: Recipe = {
      ...r,
      ingredients: r.ingredients.filter(i => i.name.trim()),
      steps: r.steps.filter(s => s.text.trim()),
      status,
    }
    saveRecipe(clean)
    onSaved(clean.id)
  }

  // groepen + losse ingrediënten
  const ungrouped = r.ingredients.filter(i => !i.groupId || !r.groups.some(g => g.id === i.groupId))

  const num = (v: string) => v === '' ? undefined : Number(v)

  return (
    <div style={{ maxWidth: 680 }}>
      <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', fontSize: 12, fontFamily: 'inherit', padding: 0, marginBottom: 18 }}>
        <ChevronLeft size={13} /> Terug
      </button>

      <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-ink)', marginBottom: 20 }}>
        {initial.title ? 'Recept bewerken' : 'Nieuw recept'}
      </h2>

      {error && (
        <div style={{ padding: '11px 15px', borderRadius: 11, background: 'rgba(196,90,90,0.07)', border: '1px solid rgba(196,90,90,0.2)', marginBottom: 16, fontSize: 12.5, color: 'var(--color-ink)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Basis ── */}
        <div style={{ borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: 18 }}>
          <p style={{ ...labelStyle, color: ROSE_DEEP, marginBottom: 12 }}>Basis</p>

          {/* Foto */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); e.target.value = '' }} />
          {img ? (
            <div style={{ position: 'relative', borderRadius: 13, overflow: 'hidden', marginBottom: 14 }}>
              <img src={img} alt={r.title || 'Receptfoto'} style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 6 }}>
                <button onClick={() => fileRef.current?.click()} style={{ padding: '6px 12px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-ink)' }}>Vervang</button>
                <button onClick={async () => { await deleteContentFile(`recipe-${r.id}`); set({ hasImage: false }); setImgVersion(v => v + 1) }} style={{ padding: '6px 12px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.92)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--color-muted)' }}>Verwijder</button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} data-testid="upload-photo"
              style={{ width: '100%', height: 110, borderRadius: 13, border: `1.5px dashed ${ROSE}`, background: ROSE_BG, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14, color: ROSE_DEEP, fontFamily: 'inherit' }}>
              <ImagePlus size={18} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Foto toevoegen</span>
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={r.title} onChange={e => set({ title: e.target.value })} placeholder="Naam van het recept..." data-testid="recipe-title"
              style={{ ...inputStyle, fontSize: 15, fontWeight: 600, padding: '12px 15px' }} />
            <textarea value={r.description} onChange={e => set({ description: e.target.value })} placeholder="Korte beschrijving..." rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              <div><label style={labelStyle}>Categorie</label>
                <select value={r.category} onChange={e => set({ category: e.target.value })} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                  {RECIPE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Porties *</label>
                <input type="number" min={1} value={r.servings} onChange={e => set({ servings: Math.max(1, Number(e.target.value) || 1) })} data-testid="recipe-servings" style={{ ...inputStyle, width: '100%', fontFamily: 'var(--font-mono)' }} />
              </div>
              <div><label style={labelStyle}>Bereidingstijd (min)</label>
                <input type="number" min={0} value={r.prepTime ?? ''} onChange={e => set({ prepTime: num(e.target.value) })} style={{ ...inputStyle, width: '100%', fontFamily: 'var(--font-mono)' }} />
              </div>
              <div><label style={labelStyle}>Kooktijd (min)</label>
                <input type="number" min={0} value={r.cookTime ?? ''} onChange={e => set({ cookTime: num(e.target.value) })} style={{ ...inputStyle, width: '100%', fontFamily: 'var(--font-mono)' }} />
              </div>
              <div><label style={labelStyle}>Moeilijkheid</label>
                <select value={r.difficulty ?? ''} onChange={e => set({ difficulty: (e.target.value || undefined) as Difficulty | undefined })} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                  <option value="">Kies...</option>
                  <option value="makkelijk">Makkelijk</option>
                  <option value="gemiddeld">Gemiddeld</option>
                  <option value="uitdagend">Uitdagend</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Tags</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {RECIPE_TAGS.map(t => {
                  const active = r.tags.includes(t)
                  return (
                    <button key={t} onClick={() => set({ tags: active ? r.tags.filter(x => x !== t) : [...r.tags, t] })}
                      style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                        border: `1.5px solid ${active ? ROSE_DEEP : 'var(--color-border)'}`,
                        background: active ? ROSE_BG : 'transparent',
                        color: active ? ROSE_DEEP : 'var(--color-muted)' }}>
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Ingrediënten ── */}
        <div style={{ borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ ...labelStyle, color: ROSE_DEEP, marginBottom: 0 }}>Ingrediënten</p>
            <button onClick={() => set({ groups: [...r.groups, { id: crypto.randomUUID(), name: '' }] })}
              style={{ fontSize: 11, color: 'var(--color-subtle)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              + groep (bv. deeg / topping)
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {ungrouped.map(ing => (
              <IngredientRow key={ing.id} ing={ing}
                onChange={u => updateIng(ing.id, u)}
                onDelete={() => set({ ingredients: r.ingredients.filter(i => i.id !== ing.id) })}
                onDuplicate={() => set({ ingredients: [...r.ingredients, { ...ing, id: crypto.randomUUID() }] })}
                onDragStart={() => { dragIngId.current = ing.id }}
                onDrop={() => { if (dragIngId.current && dragIngId.current !== ing.id) reorderIng(dragIngId.current, ing.id); dragIngId.current = null }}
              />
            ))}
            <button onClick={() => addIng()} data-testid="add-ingredient"
              style={{ padding: '10px', borderRadius: 11, border: '1.5px dashed var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--color-subtle)', fontFamily: 'inherit' }}>
              + Ingrediënt toevoegen
            </button>

            {r.groups.map(g => (
              <div key={g.id} style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 7 }}>
                  <input value={g.name} onChange={e => set({ groups: r.groups.map(x => x.id === g.id ? { ...x, name: e.target.value } : x) })}
                    placeholder="Groepsnaam (bv. Saus)" style={{ ...inputStyle, flex: 1, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: ROSE_DEEP }} />
                  <button onClick={() => set({ groups: r.groups.filter(x => x.id !== g.id), ingredients: r.ingredients.map(i => i.groupId === g.id ? { ...i, groupId: undefined } : i) })}
                    title="Groep verwijderen (ingrediënten blijven)" style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}><Trash2 size={11} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 10, borderLeft: `2px solid ${ROSE}` }}>
                  {r.ingredients.filter(i => i.groupId === g.id).map(ing => (
                    <IngredientRow key={ing.id} ing={ing}
                      onChange={u => updateIng(ing.id, u)}
                      onDelete={() => set({ ingredients: r.ingredients.filter(i => i.id !== ing.id) })}
                      onDuplicate={() => set({ ingredients: [...r.ingredients, { ...ing, id: crypto.randomUUID() }] })}
                      onDragStart={() => { dragIngId.current = ing.id }}
                      onDrop={() => { if (dragIngId.current && dragIngId.current !== ing.id) reorderIng(dragIngId.current, ing.id); dragIngId.current = null }}
                    />
                  ))}
                  <button onClick={() => addIng(g.id)}
                    style={{ padding: '8px', borderRadius: 10, border: '1.5px dashed var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 11.5, color: 'var(--color-subtle)', fontFamily: 'inherit' }}>
                    + Ingrediënt in deze groep
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bereiding ── */}
        <div style={{ borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: 18 }}>
          <p style={{ ...labelStyle, color: ROSE_DEEP, marginBottom: 12 }}>Bereiding</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {r.steps.map((s, i) => (
              <div key={s.id}
                draggable
                onDragStart={() => { dragStepId.current = s.id }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (dragStepId.current && dragStepId.current !== s.id) reorderStep(dragStepId.current, s.id); dragStepId.current = null }}
                style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}
              >
                <GripVertical size={12} color="var(--color-subtle)" style={{ cursor: 'grab', flexShrink: 0, marginTop: 12 }} />
                <span style={{ width: 24, height: 24, borderRadius: 8, background: ROSE_BG, color: ROSE_DEEP, fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 6 }}>{i + 1}</span>
                <textarea
                  value={s.text}
                  onChange={e => set({ steps: r.steps.map(x => x.id === s.id ? { ...x, text: e.target.value } : x) })}
                  placeholder={`Stap ${i + 1}...`}
                  rows={Math.max(1, Math.ceil(s.text.length / 60))}
                  style={{ ...inputStyle, flex: 1, resize: 'vertical', lineHeight: 1.5, padding: '8px 12px', fontSize: 12.5 }}
                />
                <button onClick={() => set({ steps: r.steps.filter(x => x.id !== s.id) })} title="Verwijder stap"
                  style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0, marginTop: 6 }}><Trash2 size={10} /></button>
              </div>
            ))}
            <button onClick={addStep} data-testid="add-step"
              style={{ padding: '10px', borderRadius: 11, border: '1.5px dashed var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--color-subtle)', fontFamily: 'inherit' }}>
              + Stap toevoegen
            </button>
          </div>
        </div>

        {/* ── Voedingswaarden ── */}
        <div style={{ borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: 18 }}>
          <p style={{ ...labelStyle, color: ROSE_DEEP, marginBottom: 4 }}>Voedingswaarden · per portie</p>
          <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginBottom: 12 }}>Optioneel. Laat leeg wat je niet weet.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10 }}>
            {([['calories', 'kcal'], ['protein', 'eiwit (g)'], ['carbs', 'koolh. (g)'], ['fat', 'vet (g)'], ['fiber', 'vezels (g)'], ['sugar', 'suiker (g)']] as const).map(([key, label]) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input type="number" min={0} step="any" value={r.nutrition[key] ?? ''} data-testid={`nutrition-${key}`}
                  onChange={e => set({ nutrition: { ...r.nutrition, [key]: num(e.target.value) } })}
                  style={{ ...inputStyle, width: '100%', fontFamily: 'var(--font-mono)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Bron ── */}
        <div style={{ borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: 18 }}>
          <p style={{ ...labelStyle, color: ROSE_DEEP, marginBottom: 12 }}>Bron · optioneel</p>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr', gap: 10 }}>
            <select value={r.source.platform ?? ''} onChange={e => set({ source: { ...r.source, platform: e.target.value || undefined } })} style={{ ...inputStyle, cursor: 'pointer' }} aria-label="Platform">
              <option value="">Platform...</option>
              {SOURCE_PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <input value={r.source.creator ?? ''} onChange={e => set({ source: { ...r.source, creator: e.target.value || undefined } })} placeholder="@creator" style={inputStyle} data-testid="source-creator" />
            <input value={r.source.url ?? ''} onChange={e => set({ source: { ...r.source, url: e.target.value || undefined } })} placeholder="https://..." style={inputStyle} />
          </div>
        </div>

        {/* ── Acties ── */}
        <div style={{ display: 'flex', gap: 10, paddingBottom: 30 }}>
          <button onClick={() => save('draft')} data-testid="save-draft"
            style={{ flex: 1, padding: '14px', borderRadius: 13, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-ink)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Bewaar als draft
          </button>
          <button onClick={() => save('published')} data-testid="save-publish"
            style={{ flex: 2, padding: '14px', borderRadius: 13, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            Publiceer recept
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Recipe detail ────────────────────────────────────────────────
function RecipeDetail({ recipeId, onBack, onEdit }: { recipeId: string; onBack: () => void; onEdit: () => void }) {
  const { recipes, hacks, toggleFavorite, deleteRecipe } = useRecipeStore()
  const recipe = recipes.find(r => r.id === recipeId)
  const [servings, setServings] = useState(recipe?.servings ?? 2)
  const [macroMode, setMacroMode] = useState<'serving' | 'total'>('serving')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const img = useRecipeImage(recipeId, recipe?.hasImage)

  useEffect(() => { if (recipe) setServings(recipe.servings) }, [recipeId])

  if (!recipe) return null
  const recipeHacks = hacks.filter(h => h.recipeId === recipeId)
  const n = recipe.nutrition
  const hasNutrition = [n.calories, n.protein, n.carbs, n.fat].some(v => v != null)

  function renderIngredient(ing: Ingredient) {
    const isChecked = checked.has(ing.id)
    const scalable = ing.quantity != null && !UNSCALED_UNITS.has(ing.unit)
    const qty = scalable ? formatQty(scaleQty(ing.quantity!, recipe!.servings, servings)) : null
    return (
      <button
        key={ing.id}
        onClick={() => setChecked(prev => { const next = new Set(prev); next.has(ing.id) ? next.delete(ing.id) : next.add(ing.id); return next })}
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
      >
        <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${isChecked ? ROSE_DEEP : 'rgba(124,127,132,0.3)'}`, background: isChecked ? ROSE_DEEP : 'transparent', transition: 'all 150ms' }}>
          {isChecked && <Check size={11} color="#fff" strokeWidth={3} />}
        </span>
        <span style={{ fontSize: 14.5, color: isChecked ? 'var(--color-muted)' : 'var(--color-ink)', textDecoration: isChecked ? 'line-through' : 'none', lineHeight: 1.4 }}>
          {qty != null && <strong style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{qty} {ing.unit} </strong>}
          {qty == null && ing.unit === 'naar smaak' && <span style={{ color: 'var(--color-subtle)', fontSize: 12 }}>naar smaak · </span>}
          {ing.name}
          {ing.preparation && <span style={{ color: 'var(--color-subtle)' }}>, {ing.preparation}</span>}
          {ing.optional && <span style={{ fontSize: 10.5, color: ROSE_DEEP, fontFamily: 'var(--font-mono)' }}> · optioneel</span>}
        </span>
      </button>
    )
  }

  const ungrouped = recipe.ingredients.filter(i => !i.groupId || !recipe.groups.some(g => g.id === i.groupId))
  // per portie blijft constant; in totaal-modus schalen alle macro's mee met de porties
  const macroFactor = macroMode === 'total' ? servings : 1

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', fontSize: 12, fontFamily: 'inherit', padding: 0 }}>
          <ChevronLeft size={13} /> Alle recepten
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => toggleFavorite(recipe.id)} aria-label="Favoriet"
            style={{ width: 34, height: 34, borderRadius: 11, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={14} color={ROSE_DEEP} fill={recipe.favorite ? ROSE_DEEP : 'none'} />
          </button>
          <button onClick={onEdit} style={{ padding: '8px 16px', borderRadius: 11, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-ink)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Bewerk</button>
          <button onClick={() => { if (confirm('Recept verwijderen?')) { deleteContentFile(`recipe-${recipe.id}`); deleteRecipe(recipe.id); onBack() } }}
            title="Verwijder recept" style={{ width: 34, height: 34, borderRadius: 11, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', marginBottom: 22, border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 10px 40px rgba(165,122,139,0.16)' }}>
        {img
          ? <img src={img} alt={recipe.title} style={{ width: '100%', height: 300, objectFit: 'cover', display: 'block' }} />
          : <ImagePlaceholder title={recipe.title} height={220} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0) 60%, rgba(255,255,255,0.25) 100%)', pointerEvents: 'none' }} />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-ink)', lineHeight: 1.15, marginBottom: 8 }}>{recipe.title}</h1>
      {recipe.description && <p style={{ fontSize: 14, color: 'var(--color-subtle)', lineHeight: 1.6, marginBottom: 12 }}>{recipe.description}</p>}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 11px', borderRadius: 99, background: ROSE_BG, color: ROSE_DEEP, fontFamily: 'var(--font-mono)' }}>{recipe.category}</span>
        {recipe.tags.map(t => (
          <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '4px 11px', borderRadius: 99, background: 'var(--color-surface)', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{t}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', marginBottom: 24, flexWrap: 'wrap' }}>
        {recipe.prepTime != null && <span>Prep {recipe.prepTime} min</span>}
        {recipe.cookTime != null && <span>Koken {recipe.cookTime} min</span>}
        {recipe.difficulty && <span style={{ textTransform: 'capitalize' }}>{recipe.difficulty}</span>}
        {recipe.status === 'draft' && <span style={{ color: ROSE_DEEP, fontWeight: 700 }}>DRAFT</span>}
      </div>

      {/* Servings selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderRadius: 22, background: MESH, border: '1px solid rgba(255,255,255,0.6)', marginBottom: 26, boxShadow: '0 6px 24px rgba(165,122,139,0.12)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ROSE_DEEP, fontFamily: 'var(--font-mono)', flex: 1 }}>Porties</span>
        <button onClick={() => setServings(v => Math.max(1, v - 1))} data-testid="servings-minus" aria-label="Minder porties"
          style={{ width: 42, height: 42, borderRadius: 16, border: '1px solid rgba(255,255,255,0.8)', background: GLASS, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROSE_DEEP, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <span data-testid="servings-value" style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', minWidth: 34, textAlign: 'center', letterSpacing: '-0.02em' }}>{servings}</span>
        <button onClick={() => setServings(v => v + 1)} data-testid="servings-plus" aria-label="Meer porties"
          style={{ width: 42, height: 42, borderRadius: 16, border: '1px solid rgba(255,255,255,0.8)', background: GLASS, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROSE_DEEP, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Ingrediënten */}
      {recipe.ingredients.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ ...labelStyle, color: ROSE_DEEP, fontSize: 10, marginBottom: 10 }}>Ingrediënten</p>
          <div style={{ borderRadius: 15, border: '1px solid var(--color-border)', background: 'var(--color-card)', overflow: 'hidden' }} data-testid="ingredient-list">
            {ungrouped.map(renderIngredient)}
            {recipe.groups.map(g => {
              const items = recipe.ingredients.filter(i => i.groupId === g.id)
              if (!items.length) return null
              return (
                <div key={g.id}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE_DEEP, fontFamily: 'var(--font-mono)', padding: '12px 14px 6px', background: 'rgba(239,208,216,0.12)' }}>{g.name || 'Groep'}</p>
                  {items.map(renderIngredient)}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Method */}
      {recipe.steps.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ ...labelStyle, color: ROSE_DEEP, fontSize: 10, marginBottom: 12 }}>Bereiding</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {recipe.steps.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ width: 28, height: 28, borderRadius: 10, background: ROSE_BG, color: ROSE_DEEP, fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <p style={{ fontSize: 15, color: 'var(--color-ink)', lineHeight: 1.65, paddingTop: 3 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <p style={{ ...labelStyle, color: ROSE_DEEP, fontSize: 10, marginBottom: 0, flex: 1 }}>Voedingswaarden</p>
          {hasNutrition && (
            <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 99, background: ROSE_BG }} data-testid="macro-toggle">
              {([['serving', 'Per portie'], ['total', `Alle ${servings}`]] as const).map(([mode, label]) => (
                <button key={mode} onClick={() => setMacroMode(mode)}
                  style={{
                    padding: '5px 13px', borderRadius: 99, fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', border: 'none', transition: 'all 180ms',
                    background: macroMode === mode ? '#fff' : 'transparent',
                    color: macroMode === mode ? ROSE_DEEP : 'var(--color-subtle)',
                    boxShadow: macroMode === mode ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        {hasNutrition ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }} data-testid="nutrition-card">
              {([['calories', 'kcal', ''], ['protein', 'eiwit', 'g'], ['fat', 'vet', 'g'], ['carbs', 'koolhydraten', 'g'], ['fiber', 'vezels', 'g'], ['sugar', 'suiker', 'g']] as const).map(([key, label, suffix]) => (
                n[key] != null ? (
                  <div key={key} style={{ borderRadius: 18, border: `1px solid ${ROSE}`, background: `linear-gradient(160deg, ${ROSE_BG} 0%, var(--color-card) 70%)`, padding: '16px 16px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <p style={{ fontSize: 21, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', letterSpacing: '-0.02em' }} data-testid={`macro-${key}`}>
                      {formatQty(n[key]! * macroFactor)}{suffix}
                    </p>
                    <p style={{ fontSize: 9.5, color: 'var(--color-subtle)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>{label}</p>
                  </div>
                ) : null
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginTop: 10 }} data-testid="nutrition-total">
              {macroMode === 'serving'
                ? `Per portie · maal ${servings} voor het hele recept`
                : `Totaal voor ${servings} ${servings === 1 ? 'portie' : 'porties'}`}
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 12.5, color: 'var(--color-subtle)', padding: '14px 16px', borderRadius: 15, border: `1.5px dashed ${ROSE}` }}>Voedingswaarden nog niet toegevoegd.</p>
        )}
      </div>

      {/* LU Hacks */}
      {recipeHacks.map(h => (
        <div key={h.id} style={{ borderRadius: 16, border: `1.5px solid ${ROSE}`, background: ROSE_BG, padding: '16px 20px', marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: ROSE_DEEP, fontFamily: 'var(--font-mono)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={11} /> Laurence's tip
          </p>
          {h.title && <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 3 }}>{h.title}</p>}
          <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.6, fontStyle: 'italic' }}>{h.content}</p>
        </div>
      ))}

      {/* Source */}
      {(recipe.source.creator || recipe.source.platform || recipe.source.url) && (
        <div style={{ marginBottom: 40, marginTop: 20 }}>
          {recipe.source.url ? (
            <a href={recipe.source.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12.5, color: ROSE_DEEP, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              Geïnspireerd door {recipe.source.creator || recipe.source.platform} {recipe.source.platform && recipe.source.creator ? `op ${recipe.source.platform}` : ''} <ArrowUpRight size={12} />
            </a>
          ) : (
            <p style={{ fontSize: 12.5, color: 'var(--color-subtle)' }}>
              Geïnspireerd door {recipe.source.creator || ''}{recipe.source.creator && recipe.source.platform ? ' op ' : ''}{recipe.source.platform || ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── LU Hack form + library ───────────────────────────────────────
function HackForm({ initial, onDone }: { initial?: LUHack; onDone: () => void }) {
  const { saveHack, recipes } = useRecipeStore()
  const [hack, setHack] = useState<LUHack>(initial ?? {
    id: crypto.randomUUID(), title: '', content: '', category: 'Kitchen Hack',
    createdAt: new Date().toISOString(),
  })

  function save() {
    if (!hack.content.trim()) return
    saveHack(hack)
    onDone()
  }

  return (
    <div style={{ borderRadius: 16, border: `1.5px solid ${ROSE}`, background: 'var(--color-card)', padding: 18, marginBottom: 16 }}>
      <p style={{ ...labelStyle, color: ROSE_DEEP, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}><Sparkles size={11} /> {initial ? 'Tip bewerken' : 'Nieuwe tip'}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={hack.title} onChange={e => setHack(h => ({ ...h, title: e.target.value }))} placeholder="Titel (optioneel)..." style={inputStyle} data-testid="hack-title" />
        <textarea value={hack.content} onChange={e => setHack(h => ({ ...h, content: e.target.value }))} placeholder="De hack zelf. Kort en praktisch..." rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} data-testid="hack-content" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <select value={hack.category} onChange={e => setHack(h => ({ ...h, category: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }} aria-label="Hack categorie">
            {HACK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={hack.recipeId ?? ''} onChange={e => setHack(h => ({ ...h, recipeId: e.target.value || undefined }))} style={{ ...inputStyle, cursor: 'pointer' }} aria-label="Gekoppeld recept">
            <option value="">Niet gekoppeld aan recept</option>
            {recipes.map(r => <option key={r.id} value={r.id}>{r.title || 'Zonder titel'}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onDone} style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Annuleer</button>
          <button onClick={save} disabled={!hack.content.trim()} data-testid="hack-save"
            style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: hack.content.trim() ? 'var(--color-ink)' : 'var(--color-border)', color: hack.content.trim() ? 'var(--color-bg)' : 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: hack.content.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
            Bewaar hack
          </button>
        </div>
      </div>
    </div>
  )
}

function HacksLibrary({ onOpenRecipe }: { onOpenRecipe: (id: string) => void }) {
  const { hacks, recipes, deleteHack } = useRecipeStore()
  const [editing, setEditing] = useState<LUHack | 'new' | null>(null)

  return (
    <div style={{ maxWidth: 680 }}>
      {editing !== null
        ? <HackForm initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        : (
          <button onClick={() => setEditing('new')} data-testid="add-hack"
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 12, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 18 }}>
            <Plus size={14} /> Tip toevoegen
          </button>
        )}

      {hacks.length === 0 && editing === null ? (
        <div style={{ padding: '48px 24px', borderRadius: 18, border: `1.5px dashed ${ROSE}`, textAlign: 'center', background: ROSE_BG }}>
          <Sparkles size={20} color={ROSE_DEEP} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Nog geen tips.</p>
          <p style={{ fontSize: 12.5, color: 'var(--color-subtle)' }}>Verzamel de kleine trucjes die koken makkelijker maken.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {hacks.map(h => {
            const linked = h.recipeId ? recipes.find(r => r.id === h.recipeId) : null
            return (
              <div key={h.id} style={{ borderRadius: 16, border: `1.5px solid ${ROSE}`, background: ROSE_BG, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: ROSE_DEEP, fontFamily: 'var(--font-mono)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={11} /> Laurence's tip · {h.category}
                  </p>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => setEditing(h)} style={{ fontSize: 10.5, color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>bewerk</button>
                    <button onClick={() => deleteHack(h.id)} title="Verwijder" style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}><Trash2 size={10} /></button>
                  </div>
                </div>
                {h.title && <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 3 }}>{h.title}</p>}
                <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.6, fontStyle: 'italic' }}>{h.content}</p>
                {linked && (
                  <button onClick={() => onOpenRecipe(linked.id)} style={{ fontSize: 11, color: ROSE_DEEP, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, padding: 0, marginTop: 8 }}>
                    → {linked.title}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Library ──────────────────────────────────────────────────────
function Library({ onOpen, onNew }: { onOpen: (id: string) => void; onNew: () => void }) {
  const { recipes } = useRecipeStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [tag, setTag] = useState<string>('')
  const [onlyFavs, setOnlyFavs] = useState(false)

  const visible = useMemo(() => {
    let list = [...recipes]
    if (onlyFavs) list = list.filter(r => r.favorite)
    if (category) list = list.filter(r => r.category === category)
    if (tag) list = list.filter(r => r.tags.includes(tag))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q)) ||
        r.category.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [recipes, search, category, tag, onlyFavs])

  return (
    <div>
      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} color="var(--color-subtle)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek recepten, ingrediënten..." data-testid="recipe-search"
            style={{ ...inputStyle, width: '100%', paddingLeft: 34, borderRadius: 13 }} />
        </div>
        <button onClick={() => setOnlyFavs(v => !v)} data-testid="filter-favs"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 13, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
            border: `1.5px solid ${onlyFavs ? ROSE_DEEP : 'var(--color-border)'}`,
            background: onlyFavs ? ROSE_BG : 'transparent',
            color: onlyFavs ? ROSE_DEEP : 'var(--color-muted)' }}>
          <Heart size={12} fill={onlyFavs ? ROSE_DEEP : 'none'} /> Favorieten
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {RECIPE_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(category === c ? '' : c)}
            style={{ padding: '5px 13px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
              border: `1.5px solid ${category === c ? ROSE_DEEP : 'var(--color-border)'}`,
              background: category === c ? ROSE_BG : 'transparent',
              color: category === c ? ROSE_DEEP : 'var(--color-muted)' }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
        {RECIPE_TAGS.map(t => (
          <button key={t} onClick={() => setTag(tag === t ? '' : t)}
            style={{ padding: '4px 11px', borderRadius: 99, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-mono)', transition: 'all 150ms',
              border: `1px solid ${tag === t ? ROSE_DEEP : 'var(--color-border)'}`,
              background: tag === t ? ROSE_BG : 'transparent',
              color: tag === t ? ROSE_DEEP : 'var(--color-subtle)' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div style={{ padding: '56px 24px', borderRadius: 20, border: `1.5px dashed ${ROSE}`, textAlign: 'center', background: ROSE_BG }}>
          <ChefHat size={22} color={ROSE_DEEP} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>
            {recipes.length === 0 ? 'Je receptenbibliotheek is leeg.' : 'Geen recepten gevonden.'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-subtle)', marginBottom: 18 }}>
            {recipes.length === 0 ? 'Start je LU recipe collectie.' : 'Pas je filters of zoekopdracht aan.'}
          </p>
          {recipes.length === 0 && (
            <button onClick={onNew}
              style={{ padding: '11px 22px', borderRadius: 12, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Je eerste recept
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }} data-testid="recipe-grid">
          {visible.map(r => <RecipeCard key={r.id} recipe={r} onOpen={() => onOpen(r.id)} />)}
        </div>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
type View =
  | { mode: 'library' }
  | { mode: 'hacks' }
  | { mode: 'detail'; id: string }
  | { mode: 'edit'; recipe: Recipe }

export function Recipes() {
  const { recipes } = useRecipeStore()
  const [view, setView] = useState<View>({ mode: 'library' })

  return (
    <div style={{ maxWidth: 1020 }}>
      {/* Header */}
      {(view.mode === 'library' || view.mode === 'hacks') && (
        <>
          <div style={{ position: 'relative', borderRadius: 28, background: MESH, padding: '26px 28px', marginBottom: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.6)' }}>
            {/* zachte lichtvlekken voor de futuristische mesh-look */}
            <div style={{ position: 'absolute', top: -60, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -80, left: '35%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(247,239,232,0.7) 0%, rgba(247,239,232,0) 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-ink)', lineHeight: 1.05 }}>
                  Laurence's <span style={{ color: ROSE_DEEP }}>Recipes</span>
                </h1>
                <p style={{ fontSize: 13, color: ROSE_DEEP, marginTop: 7, fontStyle: 'italic', fontFamily: 'var(--font-serif)', opacity: 0.85 }}>
                  Simple recipes. Smarter choices. Better everyday food.
                </p>
              </div>
              {view.mode === 'library' && (
                <button onClick={() => setView({ mode: 'edit', recipe: emptyRecipe() })} data-testid="add-recipe"
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 24px', borderRadius: 99, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(0,0,0,0.16)' }}>
                  <Plus size={14} /> Recept toevoegen
                </button>
              )}
            </div>
          </div>

          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
            {([['library', 'Recepten', recipes.length], ['hacks', "Laurence's tips", null]] as const).map(([mode, label, count]) => (
              <button key={mode} onClick={() => setView({ mode: mode as 'library' | 'hacks' })}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: view.mode === mode ? 700 : 500,
                  color: view.mode === mode ? 'var(--color-ink)' : 'var(--color-subtle)',
                  borderBottom: `2px solid ${view.mode === mode ? ROSE_DEEP : 'transparent'}`, marginBottom: -1 }}>
                {label}{count != null && count > 0 && <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-subtle)' }}>{count}</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {view.mode === 'library' && <Library onOpen={id => setView({ mode: 'detail', id })} onNew={() => setView({ mode: 'edit', recipe: emptyRecipe() })} />}
      {view.mode === 'hacks' && <HacksLibrary onOpenRecipe={id => setView({ mode: 'detail', id })} />}
      {view.mode === 'detail' && (
        <RecipeDetail
          recipeId={view.id}
          onBack={() => setView({ mode: 'library' })}
          onEdit={() => {
            const r = recipes.find(x => x.id === view.id)
            if (r) setView({ mode: 'edit', recipe: r })
          }}
        />
      )}
      {view.mode === 'edit' && (
        <RecipeForm
          initial={view.recipe}
          onSaved={id => setView({ mode: 'detail', id })}
          onCancel={() => setView(view.recipe.title ? { mode: 'detail', id: view.recipe.id } : { mode: 'library' })}
        />
      )}
    </div>
  )
}
