import React, { useState } from 'react';
import { Pet, SpeciesType } from '../types';
import { Plus, Trash2, Edit2, X, Sparkles, Camera, Calendar, Heart, ShieldAlert } from 'lucide-react';
import { compressImageToBase64, getSpeciesEmoji, calculateAgeInPolish } from '../utils';

interface PetManagerProps {
  currentPets: Pet[];
  selectedPetId?: string;
  onSelectPet: (id: string) => void;
  onAddPet: (pet: Omit<Pet, 'id' | 'createdAt'>) => Promise<void>;
  onUpdatePet: (pet: Pet) => Promise<void>;
  onDeletePet: (id: string) => Promise<void>;
  onClose?: () => void;
}

export default function PetManager({
  currentPets,
  selectedPetId,
  onSelectPet,
  onAddPet,
  onUpdatePet,
  onDeletePet,
  onClose,
}: PetManagerProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null); // null means creating new
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<SpeciesType>('pies');
  const [customSpecies, setCustomSpecies] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDeleteId, setShowConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setSpecies('pies');
    setCustomSpecies('');
    setBirthDate('');
    setAvatar(undefined);
    setNotes('');
    setEditingPet(null);
    setIsEditing(false);
    setShowConfirmDeleteId(null);
  };

  const handleOpenNewForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (pet: Pet) => {
    setEditingPet(pet);
    setIsEditing(true);
    setName(pet.name);
    setSpecies(pet.species);
    setCustomSpecies(pet.customSpecies || '');
    setBirthDate(pet.birthDate || '');
    setAvatar(pet.avatar);
    setNotes(pet.notes || '');
    setIsFormOpen(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const base64 = await compressImageToBase64(file, 400); // Small avatar sized max 400px
      setAvatar(base64);
    } catch (err) {
      console.error('Błąd podczas ładowania zdjęcia:', err);
      alert('Nie udało się załadować zdjęcia. Spróbuj innego pliku.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const petPayload = {
        name: name.trim(),
        species,
        customSpecies: species === 'inne' ? customSpecies.trim() : undefined,
        birthDate: birthDate || undefined,
        avatar,
        notes: notes.trim() || undefined,
      };

      if (isEditing && editingPet) {
        await onUpdatePet({
          ...editingPet,
          ...petPayload,
        });
      } else {
        await onAddPet(petPayload);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error('Błąd zapisu pupilka:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await onDeletePet(id);
      setShowConfirmDeleteId(null);
      if (selectedPetId === id && currentPets.length > 1) {
        // Fallback selection
        const remaining = currentPets.filter(p => p.id !== id);
        onSelectPet(remaining[0].id);
      }
    } catch (err) {
      console.error('Błąd usuwania pupila:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-natural-sand text-natural-primary">
      <div className="flex items-center justify-between border-b border-natural-border/60 pb-4 mb-4">
        <div>
          <h2 className="text-xl font-serif font-bold tracking-tight text-natural-dark flex items-center gap-1.5">
            <Heart size={20} className="fill-natural-clay/80 stroke-natural-clay" />
            Twoje Zwierzaki
          </h2>
          <p className="text-natural-primary/75 text-xs">Dodawaj profile i wybieraj aktywnego pupila</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-natural-primary/55 hover:bg-natural-highlight hover:text-natural-dark transition cursor-pointer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Grid of registered pets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[300px] md:max-h-none pr-1">
        {currentPets.map((pet) => {
          const isSelected = selectedPetId === pet.id;
          return (
            <div
              key={pet.id}
              onClick={() => onSelectPet(pet.id)}
              className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-natural-highlight/85 border-natural-sage ring-2 ring-natural-sage/20'
                  : 'bg-natural-cream border-natural-border hover:border-natural-clay/50 hover:shadow-xs'
              }`}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-natural-border flex items-center justify-center bg-natural-highlight shrink-0 shadow-xs">
                  {pet.avatar ? (
                    <img
                      src={pet.avatar}
                      alt={pet.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{getSpeciesEmoji(pet.species)}</span>
                  )}
                </div>

                {/* Pet Bio */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-natural-dark truncate flex items-center gap-1.5">
                    {pet.name}
                    {isSelected && (
                      <span className="inline-flex w-2.5 h-2.5 rounded-full bg-natural-olive animate-pulse border border-white" />
                    )}
                  </h3>
                  <p className="text-xs text-natural-primary/70 capitalize truncate mt-0.5">
                    {pet.species === 'inne' && pet.customSpecies
                      ? pet.customSpecies
                      : `${getSpeciesEmoji(pet.species)} ${pet.species}`}
                  </p>
                  <p className="text-[10px] text-natural-clay mt-1 font-medium flex items-center gap-1">
                    <Calendar size={10} />
                    {pet.birthDate ? calculateAgeInPolish(pet.birthDate) : 'Nie podany wiek'}
                  </p>
                </div>
              </div>

              {/* Display custom note excerpt if any */}
              {pet.notes && (
                <p className="text-[11px] text-natural-primary/70 italic mt-3 pt-2 border-t border-dashed border-natural-border/60 line-clamp-1">
                  „{pet.notes}”
                </p>
              )}

              {/* Action indicators */}
              <div className="flex items-center justify-end gap-1.5 mt-4 pt-2 border-t border-natural-border/50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditForm(pet);
                  }}
                  className="p-1 rounded-md text-natural-primary/60 hover:bg-natural-cream hover:text-natural-dark transition cursor-pointer"
                  title="Edytuj profil"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirmDeleteId(pet.id);
                  }}
                  className="p-1 rounded-md text-natural-primary/60 hover:bg-destructive/5 hover:text-destructive transition cursor-pointer"
                  title="Usuń profil"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Confirm Delete Overlay for safety */}
              {showConfirmDeleteId === pet.id && (
                <div
                  className="absolute inset-0 bg-natural-cream/95 rounded-2xl p-3 flex flex-col justify-center items-center text-center z-10 transition-all border border-destructive/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ShieldAlert size={20} className="text-destructive mb-1" />
                  <p className="text-xs font-bold text-destructive">Usunąć {pet.name}?</p>
                  <p className="text-[9px] text-natural-primary/70 mt-0.5 leading-tight px-2">
                    Skasuje to również bezpowrotnie wszystkie jego wpisy w pamiętniku!
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmDeleteId(null)}
                      className="px-2 py-1 text-[10px] font-semibold bg-natural-highlight border border-natural-border hover:bg-natural-sand rounded text-natural-primary transition cursor-pointer"
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pet.id)}
                      className="px-2 py-1 text-[10px] font-semibold bg-destructive text-white hover:bg-destructive-hover rounded hover:shadow-xs transition cursor-pointer"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Create Card Button */}
        <button
          type="button"
          onClick={handleOpenNewForm}
          className="p-5 rounded-2xl border-2 border-dashed border-natural-border hover:border-natural-sage text-natural-primary hover:text-natural-dark hover:bg-natural-highlight transition-all duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center h-full min-h-[120px]"
        >
          <div className="p-2 rounded-full bg-natural-highlight text-natural-primary group-hover:bg-natural-highlight">
            <Plus size={18} />
          </div>
          <span className="text-xs font-semibold">Dodaj nowego pupila</span>
        </button>
      </div>

      {/* Slide-out or expanding Add/Edit Form */}
      {isFormOpen && (
        <div className="mt-4 p-4 rounded-2xl bg-natural-cream border border-natural-border shadow-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between mb-3 border-b border-natural-border/50 pb-2">
            <h3 className="font-serif font-bold text-natural-dark text-sm flex items-center gap-1">
              <Sparkles size={14} className="text-natural-secondary" />
              {isEditing ? `Edycja: ${name}` : 'Nowy Pupil'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-natural-primary/60 hover:text-natural-dark p-0.5 rounded cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Pet Name */}
              <div>
                <label className="block text-xs font-serif font-bold text-natural-primary mb-1">
                  Imię pupila <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Leon, Luna"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-natural-border rounded-xl focus:border-natural-sage focus:outline-none focus:ring-1 focus:ring-natural-sage/20 transition text-natural-primary font-medium"
                />
              </div>

              {/* Species picker */}
              <div>
                <label className="block text-xs font-serif font-bold text-natural-primary mb-1">Gatunek</label>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value as SpeciesType)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-natural-border rounded-xl focus:border-natural-sage focus:outline-none focus:ring-1 focus:ring-natural-sage/20 transition capitalize text-natural-primary font-medium"
                >
                  <option value="pies">🐶 Pies</option>
                  <option value="kot">🐱 Kot</option>
                  <option value="jaszczurka">🦎 Jaszczurka / Gad</option>
                  <option value="chomik">🐹 Chomik / Gryzoń</option>
                  <option value="papuga">🦜 Papuga / Ptak</option>
                  <option value="krolik">🐰 Królik</option>
                  <option value="rybki">🐠 Rybki</option>
                  <option value="inne">🐾 Inne zwierzątko</option>
                </select>
              </div>

              {/* Custom Species if Option "Other" is active */}
              {species === 'inne' && (
                <div>
                  <label className="block text-xs font-serif font-bold text-natural-primary mb-1">
                    Nazwa gatunku <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Fretka, Patyczak"
                    value={customSpecies}
                    onChange={(e) => setCustomSpecies(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-natural-border rounded-xl focus:border-natural-sage focus:outline-none focus:ring-1 focus:ring-natural-sage/20 transition text-natural-primary font-medium"
                  />
                </div>
              )}

              {/* Birthdate */}
              <div>
                <label className="block text-xs font-serif font-bold text-natural-primary mb-1">Data urodzenia (orientacyjna)</label>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-natural-border rounded-xl focus:border-natural-sage focus:outline-none focus:ring-1 focus:ring-natural-sage/20 transition text-natural-primary font-medium"
                />
              </div>

              {/* Photo representation */}
              <div className="md:col-span-2 flex items-center gap-4 py-1">
                <div className="relative w-16 h-16 rounded-full border border-natural-border overflow-hidden bg-natural-highlight flex items-center justify-center shadow-inner">
                  {avatar ? (
                    <img src={avatar} alt="Podgląd" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{getSpeciesEmoji(species)}</span>
                  )}
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-serif font-bold text-natural-primary mb-1">Zdjęcie profilowe</label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-natural-border bg-white hover:bg-natural-highlight text-natural-primary text-xs font-medium rounded-xl transition shadow-xs">
                      <Camera size={13} className="text-natural-secondary" />
                      Wybierz zdjęcie
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar(undefined)}
                        className="text-xs text-destructive hover:underline cursor-pointer"
                      >
                        Skasuj
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-natural-clay mt-1">Szybko przeskalujemy i zoptymalizujemy pod offline</p>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-serif font-bold text-natural-primary mb-1">Dodatkowe dane (np. lekarstwa, charakterystyka)</label>
                <textarea
                  placeholder="np. Alergia na kurczaka, nie lubi hałasu..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-natural-border rounded-xl focus:border-natural-sage focus:outline-none focus:ring-1 focus:ring-natural-sage/20 transition text-natural-primary font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-natural-border/50">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-natural-primary/70 hover:bg-natural-highlight hover:text-natural-dark rounded-xl transition cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-1.5 text-xs font-bold bg-natural-olive hover:bg-natural-dark text-white hover:shadow-md rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Zapisywanie...' : isEditing ? 'Zapisz zmiany' : 'Dodaj Zwierzaka'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
