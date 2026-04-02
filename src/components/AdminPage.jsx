import { useEffect, useRef, useState } from 'react';
import { DatabaseService } from '../services/DatabaseService.js';

function Labeled({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{label}</label>
      {children}
    </div>
  );
}

function LangTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 mb-3">
      <button
        type="button"
        onClick={() => onChange('ru')}
        className={`px-3 py-1.5 rounded-lg text-sm ${active === 'ru' ? 'bg-primary text-primary-foreground' : 'bg-input border border-border text-foreground'}`}
      >
        Русский
      </button>
      <button
        type="button"
        onClick={() => onChange('en')}
        className={`px-3 py-1.5 rounded-lg text-sm ${active === 'en' ? 'bg-primary text-primary-foreground' : 'bg-input border border-border text-foreground'}`}
      >
        English
      </button>
    </div>
  );
}

export default function AdminPage() {
  const fileInputRef = useRef(null);
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeLangTab, setActiveLangTab] = useState('ru');
  const [form, setForm] = useState({
    id: null,
    // Common
    image: '',
    tags: '',
    rating: 5.0,
    mature: 1,
    // RU
    ru_title: '',
    ru_description: '',
    ru_category: '',
    ru_protagonist_name: '',
    ru_protagonist_gender: 'Male',
    ru_protagonist_age: '',
    ru_protagonist_archetype: '',
    ru_protagonist_description: '',
    ru_characters: '', // one per line: Name - Role
    ru_opening: '',    // one per line
    ru_starter_choices: '', // one per line
    ru_chapters: '',   // one per line
    ru_summary: '',
    // EN
    en_title: '',
    en_description: '',
    en_category: '',
    en_protagonist_name: '',
    en_protagonist_gender: 'Male',
    en_protagonist_age: '',
    en_protagonist_archetype: '',
    en_protagonist_description: '',
    en_characters: '',
    en_opening: '',
    en_starter_choices: '',
    en_chapters: '',
    en_summary: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.getStories({});
      setStories(data || []);
    } catch (e) {
      setError('Failed to load stories');
    }
    setLoading(false);
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  const resetForm = () => {
    setForm({
      id: null,
      image: '',
      tags: '',
      rating: 5.0,
      mature: 1,
      ru_title: '',
      ru_description: '',
      ru_category: '',
      ru_protagonist_name: '',
      ru_protagonist_gender: 'Male',
      ru_protagonist_age: '',
      ru_protagonist_archetype: '',
      ru_protagonist_description: '',
      ru_characters: '',
      ru_opening: '',
      ru_starter_choices: '',
      ru_chapters: '',
      ru_summary: '',
      en_title: '',
      en_description: '',
      en_category: '',
      en_protagonist_name: '',
      en_protagonist_gender: 'Male',
      en_protagonist_age: '',
      en_protagonist_archetype: '',
      en_protagonist_description: '',
      en_characters: '',
      en_opening: '',
      en_starter_choices: '',
      en_chapters: '',
      en_summary: '',
    });
  };

  const linesToList = (txt) => (txt || '').split('\n').map(s => s.trim()).filter(Boolean);
  const parseCharacters = (txt) => {
    return linesToList(txt).map(line => {
      const [name, role] = line.split(' - ').map(s => s?.trim() || '');
      return { name, role };
    });
  };

  const fillEdit = (s) => {
    const ru = {
      title: s.title || '',
      description: s.description || '',
      category: s.category || '',
      protagonist: typeof s.protagonist_json === 'string' ? JSON.parse(s.protagonist_json || '{}') : (s.protagonist_json || {}),
      characters: typeof s.characters_json === 'string' ? JSON.parse(s.characters_json || '[]') : (s.characters_json || []),
      plot: typeof s.plot_json === 'string' ? JSON.parse(s.plot_json || '{}') : (s.plot_json || {}),
    };
    const tr = typeof s.translations_json === 'string' ? (() => { try { return JSON.parse(s.translations_json); } catch { return {}; } })() : (s.translations_json || {});
    const en = tr?.en || {};
    setForm({
      id: s.id,
      image: s.image || '',
      tags: Array.isArray(s.tags_json) ? s.tags_json.join(', ') : (() => { try { const t = JSON.parse(s.tags_json||'[]'); return Array.isArray(t)?t.join(', '):''; } catch { return '';} })(),
      rating: s.rating ?? 5.0,
      mature: s.mature ?? 1,
      ru_title: ru.title,
      ru_description: ru.description,
      ru_category: ru.category,
      ru_protagonist_name: ru.protagonist?.name || '',
      ru_protagonist_gender: ru.protagonist?.gender || 'Male',
      ru_protagonist_age: ru.protagonist?.age || '',
      ru_protagonist_archetype: ru.protagonist?.archetype || '',
      ru_protagonist_description: ru.protagonist?.description || '',
      ru_characters: (ru.characters || []).map(c => `${c.name} - ${c.role}`).join('\n'),
      ru_opening: (ru.plot?.opening || []).join('\n'),
      ru_starter_choices: (ru.plot?.starter_choices || []).join('\n'),
      ru_chapters: (ru.plot?.chapters || []).join('\n'),
      ru_summary: ru.plot?.summary || '',
      en_title: en.title || '',
      en_description: en.description || '',
      en_category: en.category || '',
      en_protagonist_name: en.protagonist?.name || '',
      en_protagonist_gender: en.protagonist?.gender || 'Male',
      en_protagonist_age: en.protagonist?.age || '',
      en_protagonist_archetype: en.protagonist?.archetype || '',
      en_protagonist_description: en.protagonist?.description || '',
      en_characters: (en.characters || []).map(c => `${c.name} - ${c.role}`).join('\n'),
      en_opening: (en.plot?.opening || []).join('\n'),
      en_starter_choices: (en.plot?.starter_choices || []).join('\n'),
      en_chapters: (en.plot?.chapters || []).join('\n'),
      en_summary: en.plot?.summary || '',
    });
    setActiveLangTab('ru');
  };

  const buildPayload = () => {
    const tags = (form.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const ru = {
      title: form.ru_title,
      description: form.ru_description,
      category: form.ru_category,
      protagonist: {
        name: form.ru_protagonist_name,
        gender: form.ru_protagonist_gender,
        age: form.ru_protagonist_age,
        archetype: form.ru_protagonist_archetype,
        description: form.ru_protagonist_description,
      },
      characters: parseCharacters(form.ru_characters),
      plot: {
        opening: linesToList(form.ru_opening),
        starter_choices: linesToList(form.ru_starter_choices),
        chapters: linesToList(form.ru_chapters),
        summary: form.ru_summary,
      }
    };
    const en = {
      title: form.en_title,
      description: form.en_description,
      category: form.en_category,
      protagonist: {
        name: form.en_protagonist_name,
        gender: form.en_protagonist_gender,
        age: form.en_protagonist_age,
        archetype: form.en_protagonist_archetype,
        description: form.en_protagonist_description,
      },
      characters: parseCharacters(form.en_characters),
      plot: {
        opening: linesToList(form.en_opening),
        starter_choices: linesToList(form.en_starter_choices),
        chapters: linesToList(form.en_chapters),
        summary: form.en_summary,
      }
    };
    return {
      title: ru.title,
      description: ru.description,
      category: ru.category,
      image: form.image,
      tags,
      rating: Number(form.rating) || 5.0,
      plays: 0,
      mature: Number(form.mature) ? 1 : 0,
      protagonist: ru.protagonist,
      characters: ru.characters,
      plot: ru.plot,
      translations: { en }
    };
  };

  const createStory = async () => {
    setError('');
    try {
      await fetch('/api/story-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, story: buildPayload() })
      }).then(r => r.json());
      resetForm();
      load();
    } catch (e) {
      setError('Create failed');
    }
  };

  const updateStory = async () => {
    if (!form.id) return;
    setError('');
    try {
      await fetch('/api/story-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id: form.id, story: buildPayload() })
      }).then(r => r.json());
      resetForm();
      load();
    } catch (e) {
      setError('Update failed');
    }
  };

  const deleteStory = async (id) => {
    setError('');
    try {
      await fetch('/api/story-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id })
      }).then(r => r.json());
      if (form.id === id) resetForm();
      load();
    } catch (e) {
      setError('Delete failed');
    }
  };

  const onPickImage = () => fileInputRef.current?.click();
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, image: typeof reader.result === 'string' ? reader.result : '' }));
    };
    reader.readAsDataURL(file);
  };

  if (!authed) {
    return (
      <div className="p-6 min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Admin Login</h2>
          <Labeled label="Admin password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </Labeled>
          <button
            type="button"
            onClick={() => setAuthed(password === '1209348756')}
            className="mt-4 w-full bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-semibold"
          >
            Enter
          </button>
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-background text-foreground">
      <h2 className="text-2xl font-bold mb-4">Admin — Stories</h2>
      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-semibold mb-3">{form.id ? 'Edit Story' : 'Create Story'}</h3>
          <div className="space-y-4">
            <Labeled label="Cover image">
              <div className="flex items-center gap-3">
                <button type="button" onClick={onPickImage} className="w-20 h-20 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center text-sm text-muted-foreground">
                  {form.image ? <img src={form.image} alt="cover" className="w-full h-full object-cover"/> : 'Upload'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </div>
            </Labeled>
            <Labeled label="Tags (comma-separated)">
              <input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.tags} onChange={(e)=>setForm({...form,tags:e.target.value})} />
            </Labeled>
            <div className="flex gap-3">
              <Labeled label="Rating (0..5)">
                <input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.rating} onChange={(e)=>setForm({...form,rating:e.target.value})} />
              </Labeled>
              <Labeled label="Mature content">
                <select className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.mature} onChange={(e)=>setForm({...form,mature:e.target.value})}>
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </Labeled>
            </div>

            <LangTabs active={activeLangTab} onChange={setActiveLangTab} />
            {activeLangTab === 'ru' ? (
              <div className="space-y-3">
                <Labeled label="Title (RU)"><input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.ru_title} onChange={(e)=>setForm({...form,ru_title:e.target.value})} /></Labeled>
                <Labeled label="Description (RU)"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.ru_description} onChange={(e)=>setForm({...form,ru_description:e.target.value})} /></Labeled>
                <Labeled label="Category (RU)"><input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.ru_category} onChange={(e)=>setForm({...form,ru_category:e.target.value})} /></Labeled>
                <div className="grid md:grid-cols-2 gap-3">
                  <Labeled label="Protagonist name (RU)"><input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.ru_protagonist_name} onChange={(e)=>setForm({...form,ru_protagonist_name:e.target.value})} /></Labeled>
                  <Labeled label="Protagonist gender (RU)">
                    <select className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.ru_protagonist_gender} onChange={(e)=>setForm({...form,ru_protagonist_gender:e.target.value})}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </Labeled>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <Labeled label="Protagonist age (RU)"><input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.ru_protagonist_age} onChange={(e)=>setForm({...form,ru_protagonist_age:e.target.value})} /></Labeled>
                  <Labeled label="Protagonist archetype (RU)"><input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.ru_protagonist_archetype} onChange={(e)=>setForm({...form,ru_protagonist_archetype:e.target.value})} /></Labeled>
                </div>
                <Labeled label="Protagonist description (RU)"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.ru_protagonist_description} onChange={(e)=>setForm({...form,ru_protagonist_description:e.target.value})} /></Labeled>
                <Labeled label="Characters (RU) — one per line: Name - Role"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.ru_characters} onChange={(e)=>setForm({...form,ru_characters:e.target.value})} /></Labeled>
                <Labeled label="Opening lines (RU) — one per line"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.ru_opening} onChange={(e)=>setForm({...form,ru_opening:e.target.value})} /></Labeled>
                <Labeled label="Starter choices (RU) — one per line"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.ru_starter_choices} onChange={(e)=>setForm({...form,ru_starter_choices:e.target.value})} /></Labeled>
                <Labeled label="Chapters (RU) — one per line"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.ru_chapters} onChange={(e)=>setForm({...form,ru_chapters:e.target.value})} /></Labeled>
                <Labeled label="Summary (RU)"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.ru_summary} onChange={(e)=>setForm({...form,ru_summary:e.target.value})} /></Labeled>
              </div>
            ) : (
              <div className="space-y-3">
                <Labeled label="Title (EN)"><input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.en_title} onChange={(e)=>setForm({...form,en_title:e.target.value})} /></Labeled>
                <Labeled label="Description (EN)"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.en_description} onChange={(e)=>setForm({...form,en_description:e.target.value})} /></Labeled>
                <Labeled label="Category (EN)"><input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.en_category} onChange={(e)=>setForm({...form,en_category:e.target.value})} /></Labeled>
                <div className="grid md:grid-cols-2 gap-3">
                  <Labeled label="Protagonist name (EN)"><input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.en_protagonist_name} onChange={(e)=>setForm({...form,en_protagonist_name:e.target.value})} /></Labeled>
                  <Labeled label="Protagonist gender (EN)">
                    <select className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.en_protagonist_gender} onChange={(e)=>setForm({...form,en_protagonist_gender:e.target.value})}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </Labeled>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <Labeled label="Protagonist age (EN)"><input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.en_protagonist_age} onChange={(e)=>setForm({...form,en_protagonist_age:e.target.value})} /></Labeled>
                  <Labeled label="Protagonist archetype (EN)"><input className="w-full bg-input border border-border rounded-xl px-3 py-2" value={form.en_protagonist_archetype} onChange={(e)=>setForm({...form,en_protagonist_archetype:e.target.value})} /></Labeled>
                </div>
                <Labeled label="Protagonist description (EN)"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.en_protagonist_description} onChange={(e)=>setForm({...form,en_protagonist_description:e.target.value})} /></Labeled>
                <Labeled label="Characters (EN) — one per line: Name - Role"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.en_characters} onChange={(e)=>setForm({...form,en_characters:e.target.value})} /></Labeled>
                <Labeled label="Opening lines (EN) — one per line"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.en_opening} onChange={(e)=>setForm({...form,en_opening:e.target.value})} /></Labeled>
                <Labeled label="Starter choices (EN) — one per line"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.en_starter_choices} onChange={(e)=>setForm({...form,en_starter_choices:e.target.value})} /></Labeled>
                <Labeled label="Chapters (EN) — one per line"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.en_chapters} onChange={(e)=>setForm({...form,en_chapters:e.target.value})} /></Labeled>
                <Labeled label="Summary (EN)"><textarea className="w-full bg-input border border-border rounded-xl px-3 py-2 min-h-20" value={form.en_summary} onChange={(e)=>setForm({...form,en_summary:e.target.value})} /></Labeled>
              </div>
            )}

            <div className="flex gap-3">
              {form.id ? (
                <>
                  <button className="flex-1 bg-primary text-primary-foreground rounded-xl px-4 py-2" onClick={updateStory}>Save</button>
                  <button className="flex-1 bg-muted text-foreground rounded-xl px-4 py-2" onClick={resetForm}>Cancel</button>
                </>
              ) : (
                <button className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-2" onClick={createStory}>Create</button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Stories ({stories.length})</h3>
            <button className="text-sm underline" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Reload'}</button>
          </div>
          <div className="divide-y divide-border">
            {stories.map(s => (
              <div key={s.id} className="py-3 flex items-center gap-3">
                <img src={s.image} alt="" className="w-12 h-12 rounded object-cover border border-border" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.category}</p>
                </div>
                <button className="text-sm text-primary" onClick={()=>fillEdit(s)}>Edit</button>
                <button className="text-sm text-destructive ml-2" onClick={()=>deleteStory(s.id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

