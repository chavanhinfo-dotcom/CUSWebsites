"use client";
// Option E's admin page (/option-e/admin): sign in, edit each section of the site's content, upload
// pictures, and save. A saved section is live on the site at once (the site reads it as it loads; see
// ../content.tsx). Each section is checked before it is saved, with the same checks the site applies.
import { useCallback, useEffect, useMemo, useState } from "react";
import { categoryMeta } from "@/lib/content";
import {
  ALBUMS, CATEGORIES, CLEAN, DEFAULT_CONTENT, MAX_FIGURES, SECTION_KEYS, initialsOf, mergeContent,
  type Company, type Dealership, type District, type Faq, type Figure, type Generation, type Leader, type Milestone, type Photo,
  type SectionKey, type Showroom, type SiteContent,
} from "../content";
import { fetchRows, isAdmin, refresh, saveRow, signIn, signOut, supabaseReady, uploadFile, type Session } from "../supabase";
import { LOGO_ALT, LOGO_JPEG } from "../logo";

const SECTIONS: Record<SectionKey, { title: string; blurb: string; invalid: string }> = {
  milestones: { title: "Journey milestones", blurb: "The stops of the 3D journey: each business, its year and its photograph.", invalid: "Keep at least two milestones, each with a year and a title (each year only once)." },
  dealerships: { title: "Dealerships", blurb: "The brand logos under “Select a dealership” and each brand’s showrooms, addresses and phone numbers.", invalid: "Keep at least one brand, each with a name and at least one named showroom." },
  leadership: { title: "Leadership", blurb: "The three generations: names, roles, their stories and portrait photographs.", invalid: "Keep at least one generation, each with a name and at least one named person." },
  gallery: { title: "Gallery", blurb: "The family’s photographs: upload several at once, then add a caption, album and year to each.", invalid: "Add at least one photograph." },
  faq: { title: "F.A.Q", blurb: "The questions and answers near the end of the page.", invalid: "Keep at least one question, each with an answer." },
  figures: { title: "Key figures", blurb: `The numbers on the “About the group” panel (up to ${MAX_FIGURES}).`, invalid: "Keep at least one figure, each with a number and a label." },
  company: { title: "Company & contact", blurb: "The group’s name, founding year, head office and contact details (shown in the footer).", invalid: "Check the founding year." },
  districts: { title: "Districts", blurb: "Where the group operates: the pins on the opening globe and the “Where we operate” list.", invalid: "Keep at least one district, each with a name, a state and its map position." },
};

/**
 * What is missing or wrong in a section, pointing at the item (e.g. "Milestone 17: add a title."), or null
 * when it can be saved. Nothing incomplete is ever dropped silently.
 */
function problem(key: SectionKey, c: SiteContent): string | null {
  const blank = (s?: string) => !s || !s.trim();
  const year = (y?: number) => y !== undefined && Number.isFinite(y) && y >= 1800 && y <= 2200;
  const web = (u?: string) => !u || /^https?:\/\//i.test(u.trim()) || (u.startsWith("/") && !u.startsWith("//"));
  const first = (list: (string | false | null | undefined)[]) => list.find(Boolean) || null;
  switch (key) {
    case "milestones": {
      const seen = new Set<number>();
      return first([
        c.milestones.length < 2 && "Keep at least two milestones.",
        ...c.milestones.map((m, i) => {
          const at = `Milestone ${i + 1}`;
          if (!year(m.year)) return `${at}: enter its year.`;
          if (seen.has(m.year)) return `${at}: ${m.year} is already used by another milestone.`;
          seen.add(m.year);
          if (blank(m.title)) return `${at}: add a title.`;
          if (!web(m.image)) return `${at}: the photo address should start with https://.`;
          return null;
        }),
      ]);
    }
    case "dealerships":
      return first([
        !c.dealerships.length && "Keep at least one brand.",
        ...c.dealerships.flatMap((d, i) => [
          blank(d.brand) && `Brand ${i + 1}: add its name.`,
          !web(d.logo) && `${d.brand || `Brand ${i + 1}`}: the logo address should start with https://.`,
          !d.showrooms.length && `${d.brand || `Brand ${i + 1}`}: add at least one showroom.`,
          ...d.showrooms.map((s, k) =>
            blank(s.name) ? `${d.brand || `Brand ${i + 1}`}, showroom ${k + 1}: add its name.`
            : s.since !== undefined && !year(s.since) ? `${s.name}: check the year it opened.`
            : !web(s.site) ? `${s.name}: the website should start with https://.` : null,
          ),
        ]),
      ]);
    case "leadership":
      return first([
        !c.leadership.length && "Keep at least one generation.",
        ...c.leadership.flatMap((g, i) => [
          blank(g.generation) && `Generation ${i + 1}: add its name.`,
          !g.people.length && `${g.generation || `Generation ${i + 1}`}: add at least one person.`,
          ...g.people.map((p, k) => (blank(p.name) ? `${g.generation || `Generation ${i + 1}`}, person ${k + 1}: add the name.` : !web(p.photo) ? `${p.name}: the portrait address should start with https://.` : null)),
        ]),
      ]);
    case "gallery":
      return first([
        !c.gallery.length && "Add at least one photograph.",
        ...c.gallery.map((p, i) => (!p.src ? `Photograph ${i + 1}${p.caption ? ` (${p.caption})` : ""}: upload its picture, or remove it.` : !web(p.src) ? `Photograph ${i + 1}: the picture address should start with https://.` : p.year !== undefined && !year(p.year) ? `Photograph ${i + 1}: check the year.` : null)),
      ]);
    case "faq":
      return first([!c.faq.length && "Keep at least one question.", ...c.faq.map((f, i) => (blank(f.q) ? `Question ${i + 1}: write the question.` : blank(f.a) ? `Question ${i + 1}: write the answer.` : null))]);
    case "figures":
      return first([!c.figures.length && "Keep at least one figure.", ...c.figures.map((f, i) => (!Number.isFinite(f.value) ? `Figure ${i + 1}: enter the number.` : blank(f.label) ? `Figure ${i + 1}: add its label.` : null))]);
    case "company":
      return first([blank(c.company.name) && "Add the group’s name.", !year(c.company.since) && "Check the founding year.", blank(c.company.hq) && "Add the head office."]);
    case "districts":
      return first([
        !c.districts.length && "Keep at least one district.",
        ...c.districts.map((d, i) => {
          const at = d.name || `District ${i + 1}`;
          if (blank(d.name)) return `District ${i + 1}: add its name.`;
          if (blank(d.state)) return `${at}: add its state.`;
          if (!Number.isFinite(d.lat) || Math.abs(d.lat) > 90) return `${at}: check the latitude (between -90 and 90).`;
          if (!Number.isFinite(d.lon) || Math.abs(d.lon) > 180) return `${at}: check the longitude (between -180 and 180).`;
          return null;
        }),
      ]);
  }
}

const STORE = "cus-admin-session";
const load = (): Session | null => {
  try {
    const s = JSON.parse(localStorage.getItem(STORE) ?? "null");
    return s && s.access_token ? s : null;
  } catch {
    return null;
  }
};
const store = (s: Session | null) => {
  try {
    if (s) localStorage.setItem(STORE, JSON.stringify(s));
    else localStorage.removeItem(STORE);
  } catch {
    // (private mode: the session simply is not remembered)
  }
};
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
type Meta = Partial<Record<SectionKey, { at?: string; by?: string | null }>>;

// ---------------------------------------------------------------- small building blocks

const input = "h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-[14px] outline-none transition focus:border-x-gold focus:ring-2 focus:ring-x-gold/25";
function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[12px] font-semibold text-x-ink/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-x-mute">{hint}</span>}
    </label>
  );
}
const Text = ({ value, onChange, placeholder }: { value?: string; onChange: (v: string) => void; placeholder?: string }) => (
  <input className={input} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
);
const Num = ({ value, onChange, placeholder, step }: { value?: number; onChange: (v: number | undefined) => void; placeholder?: string; step?: string }) => (
  <input
    className={input}
    type="number"
    step={step}
    value={value === undefined || Number.isNaN(value) ? "" : value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
  />
);
const Area = ({ value, onChange, rows = 3 }: { value?: string; onChange: (v: string) => void; rows?: number }) => (
  <textarea className={`${input} h-auto py-2 leading-relaxed`} rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
);

function Button({ kind = "solid", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "solid" | "outline" | "ghost" | "danger" }) {
  const look = {
    solid: "bg-x-ink text-white hover:bg-x-gold hover:text-x-ink",
    outline: "border border-x-ink/20 bg-white text-x-ink hover:border-x-ink",
    ghost: "text-x-mute hover:text-x-ink",
    danger: "text-[#b3261e] hover:bg-[#b3261e]/10",
  }[kind];
  return <button type="button" {...p} className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[12px] font-semibold uppercase tracking-[0.12em] transition disabled:pointer-events-none disabled:opacity-40 ${look} ${className}`} />;
}

/** A picture: preview, upload (to the media store), or a typed address; removable. */
function ImageField({ label, value, onChange, upload, shape = "wide" }: { label: string; value?: string; onChange: (v: string | undefined) => void; upload: (f: File) => Promise<string>; shape?: "wide" | "portrait" | "logo" }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const box = shape === "portrait" ? "aspect-[3/4] w-28" : shape === "logo" ? "h-16 w-36 bg-white p-2" : "aspect-[4/3] w-36";
  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-semibold text-x-ink/80">{label}</span>
      <div className="flex flex-wrap items-start gap-4">
        <div className={`grid shrink-0 place-items-center overflow-hidden rounded-lg border border-black/10 bg-[#ecebe7] ${box}`}>
          {value ? <img src={value} alt="" className={`h-full w-full ${shape === "logo" ? "object-contain" : "object-cover"}`} /> : <span className="text-[11px] text-x-mute">No picture</span>}
        </div>
        <div className="min-w-[220px] flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <label className={`inline-flex h-9 cursor-pointer items-center rounded-full border border-x-ink/20 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.12em] hover:border-x-ink ${busy ? "pointer-events-none opacity-50" : ""}`}>
              {busy ? "Uploading…" : value ? "Replace" : "Upload"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  if (f.size > 5 * 1024 * 1024) return setErr("That file is over 5 MB; please use a smaller one.");
                  setErr("");
                  setBusy(true);
                  try {
                    onChange(await upload(f));
                  } catch (x) {
                    setErr(`Upload failed: ${(x as Error).message}`);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
            {value && <Button kind="danger" className="!h-9" onClick={() => onChange(undefined)}>Remove</Button>}
          </div>
          <input className={`${input} !h-9 text-[12px]`} placeholder="…or paste a picture address (https://…)" value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} />
          {err && <p className="text-[12px] text-[#b3261e]">{err}</p>}
        </div>
      </div>
    </div>
  );
}

/** An editable list: each item in a card, with move up / down and remove; an add button below. */
function Items<T,>({ items, onChange, make, title, render, addLabel, max }: {
  items: T[];
  onChange: (v: T[]) => void;
  make: () => T;
  title: (t: T, i: number) => string;
  render: (t: T, set: (v: T) => void, i: number) => React.ReactNode;
  addLabel: string;
  max?: number;
}) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-4">
      {items.map((t, i) => (
        <div key={i} className="rounded-xl bg-white p-4 ring-1 ring-black/[0.06] md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
            <p className="min-w-0 truncate text-[14px] font-semibold">
              <span className="mr-2 text-x-gold">{String(i + 1).padStart(2, "0")}</span>
              {title(t, i) || <span className="text-x-mute">Untitled</span>}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="grid h-8 w-8 place-items-center rounded-full text-x-mute hover:bg-black/5 hover:text-x-ink disabled:opacity-30">↑</button>
              <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="grid h-8 w-8 place-items-center rounded-full text-x-mute hover:bg-black/5 hover:text-x-ink disabled:opacity-30">↓</button>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => window.confirm(`Remove “${title(t, i) || "this item"}”?`) && onChange(items.filter((_, k) => k !== i))}
                className="grid h-8 w-8 place-items-center rounded-full text-[#b3261e] hover:bg-[#b3261e]/10"
              >
                ✕
              </button>
            </div>
          </div>
          {render(t, (v) => onChange(items.map((x, k) => (k === i ? v : x))), i)}
        </div>
      ))}
      {(max === undefined || items.length < max) && (
        <button type="button" onClick={() => onChange([...items, make()])} className="w-full rounded-xl border-2 border-dashed border-black/10 py-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-x-mute transition hover:border-x-gold hover:text-x-ink">
          + {addLabel}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- the section editors

type Ed<T> = { value: T; onChange: (v: T) => void; upload: (f: File) => Promise<string> };

function MilestonesEditor({ value, onChange, upload }: Ed<Milestone[]>) {
  return (
    <Items<Milestone>
      items={value}
      onChange={onChange}
      addLabel="Add a milestone"
      make={() => ({ year: new Date().getFullYear(), title: "", short: "", category: "cars" })}
      title={(m) => [m.year, m.short || m.title].filter(Boolean).join(" · ")}
      render={(m, set) => (
        <div className="grid gap-4 md:grid-cols-[110px_1fr_1fr_180px]">
          <Field label="Year"><Num value={m.year} onChange={(v) => set({ ...m, year: v as number })} /></Field>
          <Field label="Short name" hint="On the signboard and the card"><Text value={m.short} onChange={(v) => set({ ...m, short: v })} /></Field>
          <Field label="Title"><Text value={m.title} onChange={(v) => set({ ...m, title: v })} /></Field>
          <Field label="Category" hint="Sets the building and the vehicle">
            <select className={input} value={m.category} onChange={(e) => set({ ...m, category: e.target.value as Milestone["category"] })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{categoryMeta[c].label}</option>)}
            </select>
          </Field>
          <div className="md:col-span-4"><ImageField label="Photo (on the milestone card)" value={m.image} onChange={(v) => set({ ...m, image: v })} upload={upload} /></div>
        </div>
      )}
    />
  );
}

function DealershipsEditor({ value, onChange, upload }: Ed<Dealership[]>) {
  return (
    <Items<Dealership>
      items={value}
      onChange={onChange}
      addLabel="Add a brand"
      make={() => ({ brand: "", business: "", showrooms: [{ name: "", note: "" }] })}
      title={(d) => d.brand}
      render={(d, set) => (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Brand"><Text value={d.brand} onChange={(v) => set({ ...d, brand: v })} /></Field>
            <Field label="Business" hint="e.g. Passenger cars"><Text value={d.business} onChange={(v) => set({ ...d, business: v })} /></Field>
            <Field label="Tag under the logo" hint="Optional, e.g. Arena"><Text value={d.tag} onChange={(v) => set({ ...d, tag: v || undefined })} /></Field>
          </div>
          <ImageField label="Logo" shape="logo" value={d.logo} onChange={(v) => set({ ...d, logo: v })} upload={upload} />
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-x-mute">Showrooms</p>
            <Items<Showroom>
              items={d.showrooms}
              onChange={(v) => set({ ...d, showrooms: v })}
              addLabel="Add a showroom"
              make={() => ({ name: "", note: "" })}
              title={(s) => s.name}
              render={(s, put) => (
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Name" className="md:col-span-2"><Text value={s.name} onChange={(v) => put({ ...s, name: v })} /></Field>
                  <Field label="Since (year)"><Num value={s.since} onChange={(v) => put({ ...s, since: v })} /></Field>
                  <Field label="Address" className="md:col-span-2"><Text value={s.address} onChange={(v) => put({ ...s, address: v || undefined })} /></Field>
                  <Field label="City"><Text value={s.city} onChange={(v) => put({ ...s, city: v || undefined })} /></Field>
                  <Field label="Sales phone"><Text value={s.sales} onChange={(v) => put({ ...s, sales: v || undefined })} /></Field>
                  <Field label="Service / parts phone"><Text value={s.service} onChange={(v) => put({ ...s, service: v || undefined })} /></Field>
                  <Field label="Website" hint="https://…"><Text value={s.site} onChange={(v) => put({ ...s, site: v || undefined })} /></Field>
                  <Field label="Description" className="md:col-span-3"><Area value={s.note} onChange={(v) => put({ ...s, note: v })} rows={2} /></Field>
                </div>
              )}
            />
          </div>
        </div>
      )}
    />
  );
}

function LeadershipEditor({ value, onChange, upload }: Ed<Generation[]>) {
  return (
    <>
      <p className="mb-4 rounded-lg bg-x-gold/10 px-4 py-3 text-[13px] text-x-ink/80">The first person of the first generation is shown large, as the founder. Portraits appear in black and white, in colour on hover.</p>
      <Items<Generation>
        items={value}
        onChange={onChange}
        addLabel="Add a generation"
        make={() => ({ generation: "", era: "", people: [{ name: "", initials: "", role: "", text: "" }] })}
        title={(g) => g.generation}
        render={(g, set) => (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Generation" hint="e.g. Second Generation"><Text value={g.generation} onChange={(v) => set({ ...g, generation: v })} /></Field>
              <Field label="Era" hint="e.g. 1960, or Growth & diversification"><Text value={g.era} onChange={(v) => set({ ...g, era: v })} /></Field>
            </div>
            <Items<Leader>
              items={g.people}
              onChange={(v) => set({ ...g, people: v })}
              addLabel="Add a person"
              make={() => ({ name: "", initials: "", role: "", text: "" })}
              title={(p) => p.name}
              render={(p, put) => (
                <div className="grid gap-4 md:grid-cols-[1fr_120px_1fr]">
                  <Field label="Name"><Text value={p.name} onChange={(v) => put({ ...p, name: v })} /></Field>
                  <Field label="Initials" hint="For the monogram"><Text value={p.initials} placeholder={initialsOf(p.name)} onChange={(v) => put({ ...p, initials: v.toUpperCase().slice(0, 3) })} /></Field>
                  <Field label="Role"><Text value={p.role} onChange={(v) => put({ ...p, role: v })} /></Field>
                  <Field label="Story" className="md:col-span-3"><Area value={p.text} onChange={(v) => put({ ...p, text: v })} /></Field>
                  <div className="md:col-span-3"><ImageField label="Portrait" shape="portrait" value={p.photo} onChange={(v) => put({ ...p, photo: v })} upload={upload} /></div>
                </div>
              )}
            />
          </div>
        )}
      />
    </>
  );
}

function GalleryEditor({ value, onChange, upload }: Ed<Photo[]>) {
  // the built-in frames awaiting photographs are not listed (nor kept): the first photograph replaces them
  const isFrame = (p: Photo) => !p.src && DEFAULT_CONTENT.gallery.some((f) => f.caption === p.caption && f.album === p.album);
  const photos = value.filter((p) => !isFrame(p));
  const [busy, setBusy] = useState("");
  const [album, setAlbum] = useState("Family");
  const add = async (files: File[]) => {
    const fresh: Photo[] = [];
    for (const [k, f] of files.entries()) {
      if (f.size > 5 * 1024 * 1024) continue;
      setBusy(`Uploading ${k + 1} of ${files.length}…`);
      try {
        fresh.push({ src: await upload(f), caption: "", album });
      } catch {
        // (a failed file is skipped; the rest still upload)
      }
    }
    setBusy("");
    onChange([...photos, ...fresh]);
  };
  const awaiting = value.some(isFrame);
  return (
    <>
      <datalist id="albums">{ALBUMS.map((a) => <option key={a} value={a} />)}</datalist>
      <div className="mb-6 rounded-xl border-2 border-dashed border-x-gold/40 bg-white p-6 text-center md:p-8">
        <p className="text-[15px] font-semibold">Add photographs</p>
        <p className="mt-1 text-[13px] text-x-mute">Choose several at once (JPG, PNG or WebP, up to 5 MB each). They go into the album below; captions can be added after.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <input list="albums" className={`${input} !w-48`} value={album} onChange={(e) => setAlbum(e.target.value)} aria-label="Album" />
          <label className={`inline-flex h-10 cursor-pointer items-center rounded-full bg-x-ink px-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-x-gold hover:text-x-ink ${busy ? "pointer-events-none opacity-60" : ""}`}>
            {busy || "Choose photographs"}
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const files = [...(e.target.files ?? [])];
                e.target.value = "";
                if (files.length) add(files);
              }}
            />
          </label>
        </div>
      </div>
      {awaiting && (
        <p className="mb-4 rounded-lg bg-x-gold/10 px-4 py-3 text-[13px] text-x-ink/80">
          The site shows these framed places until photographs are added. Once you upload, they are replaced by your photographs.
        </p>
      )}
      <Items<Photo>
        items={photos}
        onChange={onChange}
        addLabel="Add a photograph by its address"
        make={() => ({ src: undefined, caption: "", album })}
        title={(p) => [p.album, p.caption].filter(Boolean).join(" · ")}
        render={(p, set) => (
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <div className="md:row-span-2"><ImageField label="Photograph" value={p.src} onChange={(v) => set({ ...p, src: v })} upload={upload} /></div>
            <div className="grid gap-4 md:grid-cols-[1fr_200px_110px]">
              <Field label="Caption" hint="e.g. Diwali at the Solapur showroom"><Text value={p.caption} onChange={(v) => set({ ...p, caption: v })} /></Field>
              <Field label="Album"><input list="albums" className={input} value={p.album} onChange={(e) => set({ ...p, album: e.target.value })} /></Field>
              <Field label="Year"><Num value={p.year} onChange={(v) => set({ ...p, year: v })} /></Field>
            </div>
          </div>
        )}
      />
    </>
  );
}

function FaqEditor({ value, onChange }: Ed<Faq[]>) {
  return (
    <Items<Faq>
      items={value}
      onChange={onChange}
      addLabel="Add a question"
      make={() => ({ q: "", a: "" })}
      title={(f) => f.q}
      render={(f, set) => (
        <div className="grid gap-4">
          <Field label="Question"><Text value={f.q} onChange={(v) => set({ ...f, q: v })} /></Field>
          <Field label="Answer"><Area value={f.a} onChange={(v) => set({ ...f, a: v })} /></Field>
        </div>
      )}
    />
  );
}

function FiguresEditor({ value, onChange }: Ed<Figure[]>) {
  return (
    <Items<Figure>
      items={value}
      onChange={onChange}
      max={MAX_FIGURES}
      addLabel="Add a figure"
      make={() => ({ value: 0, suffix: "", label: "" })}
      title={(f) => `${Number.isFinite(f.value) ? f.value : ""}${f.suffix} ${f.label}`.trim()}
      render={(f, set) => (
        <div className="grid gap-4 md:grid-cols-[140px_100px_1fr]">
          <Field label="Number"><Num value={f.value} onChange={(v) => set({ ...f, value: v as number })} /></Field>
          <Field label="After it" hint="e.g. +"><Text value={f.suffix} onChange={(v) => set({ ...f, suffix: v.slice(0, 4) })} /></Field>
          <Field label="Label"><Text value={f.label} onChange={(v) => set({ ...f, label: v })} /></Field>
        </div>
      )}
    />
  );
}

function CompanyEditor({ value: c, onChange: set }: Ed<Company>) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-black/[0.06] md:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Group name"><Text value={c.name} onChange={(v) => set({ ...c, name: v })} /></Field>
        <Field label="Founded (year)"><Num value={c.since} onChange={(v) => set({ ...c, since: v as number })} /></Field>
        <Field label="Tagline" className="md:col-span-2"><Text value={c.tagline} onChange={(v) => set({ ...c, tagline: v })} /></Field>
        <Field label="Head office" hint="e.g. Solapur, Maharashtra"><Text value={c.hq} onChange={(v) => set({ ...c, hq: v })} /></Field>
        <Field label="Motto"><Text value={c.motto} onChange={(v) => set({ ...c, motto: v })} /></Field>
        <Field label="Head office address" hint="Shown in the footer" className="md:col-span-2"><Area value={c.address} onChange={(v) => set({ ...c, address: v || undefined })} rows={2} /></Field>
        <Field label="Phone"><Text value={c.phone} onChange={(v) => set({ ...c, phone: v || undefined })} /></Field>
        <Field label="Email"><Text value={c.email} onChange={(v) => set({ ...c, email: v || undefined })} /></Field>
      </div>
    </div>
  );
}

function DistrictsEditor({ value, onChange }: Ed<District[]>) {
  return (
    <>
      <p className="mb-4 rounded-lg bg-x-gold/10 px-4 py-3 text-[13px] text-x-ink/80">Map position: in Google Maps, right-click the place and click the two numbers at the top of the menu to copy them (latitude, longitude).</p>
      <Items<District>
        items={value}
        onChange={onChange}
        addLabel="Add a district"
        make={() => ({ name: "", state: "", lat: NaN, lon: NaN, hq: false })}
        title={(d) => [d.name, d.state].filter(Boolean).join(", ")}
        render={(d, set, i) => (
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_130px_130px_auto] md:items-end">
            <Field label="District"><Text value={d.name} onChange={(v) => set({ ...d, name: v })} /></Field>
            <Field label="State"><Text value={d.state} onChange={(v) => set({ ...d, state: v })} /></Field>
            <Field label="Latitude"><Num step="any" value={d.lat} onChange={(v) => set({ ...d, lat: v as number })} /></Field>
            <Field label="Longitude"><Num step="any" value={d.lon} onChange={(v) => set({ ...d, lon: v as number })} /></Field>
            <label className="flex h-10 cursor-pointer items-center gap-2 text-[13px] font-semibold">
              <input
                type="radio"
                name="hq"
                checked={d.hq}
                onChange={() => onChange(value.map((x, k) => ({ ...x, hq: k === i })))}
                className="h-4 w-4 accent-[#c9a24a]"
              />
              Head office
            </label>
          </div>
        )}
      />
    </>
  );
}

// ---------------------------------------------------------------- screens

function Shell({ children, session, onSignOut }: { children: React.ReactNode; session?: Session | null; onSignOut?: () => void }) {
  return (
    <div className="min-h-screen bg-[#f2f2ef] text-x-ink">
      {/* (its background is the logo's own ground, so the supplied file sits on it seamlessly) */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-black/[0.06] bg-[#fefefe] px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {/* the logo exactly as supplied, on its own ground */}
          <img src={LOGO_JPEG} alt={LOGO_ALT} className="h-12 w-auto" />
          <p className="micro truncate text-x-gold">Site admin</p>
        </div>
        <div className="flex items-center gap-2">
          {session && <span className="hidden text-[12px] text-x-mute md:inline">{session.email}</span>}
          <a href="/option-e/" target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-full border border-x-ink/20 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] hover:border-x-ink">View site ↗</a>
          {onSignOut && <Button kind="ghost" className="!h-9 !px-3" onClick={onSignOut}>Sign out</Button>}
        </div>
      </header>
      {children}
    </div>
  );
}

function Setup() {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <p className="micro text-x-gold">One-time setup</p>
        <h1 className="wide mt-4 text-[clamp(28px,4vw,48px)]">Connect the live database</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-x-mute">
          The admin page saves to a Supabase database (free tier is enough). Until it is connected, the site shows its built-in content.
        </p>
        <ol className="mt-10 space-y-5">
          {[
            ["Create a project", "At supabase.com, create a new project (any name, region: Mumbai)."],
            ["Create the tables", "Open SQL Editor, paste the contents of components/e/admin/setup.sql (first put your admin email on its last line) and run it."],
            ["Create your login", "Authentication → Users → Add user: the same email and a strong password. Then under Authentication → Sign In / Providers, turn off “Allow new users to sign up”."],
            ["Connect the site", "Project Settings → API: copy the Project URL and the anon public key into .env.local (and into Vercel → Settings → Environment Variables) as NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then rebuild / redeploy."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-4 rounded-xl bg-white p-5 ring-1 ring-black/[0.06]">
              <span className="wide text-[20px] text-x-gold">{i + 1}</span>
              <div>
                <p className="text-[15px] font-semibold">{t}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-x-mute">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>
    </Shell>
  );
}

function SignIn({ onSession, notice }: { onSession: (s: Session) => void; notice?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(notice ?? "");
  return (
    <Shell>
      <main className="grid min-h-[calc(100vh-64px)] place-items-center px-4 py-16">
        <form
          className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.06]"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setErr("");
            try {
              onSession(await signIn(email.trim(), password));
            } catch (x) {
              setErr(/invalid/i.test((x as Error).message) ? "That email and password don’t match." : (x as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="micro text-x-gold">Chavan Udyog Samuh</p>
          <h1 className="wide mt-3 text-[26px]">Site admin</h1>
          <p className="mt-2 text-[13px] text-x-mute">Sign in to update the website.</p>
          <div className="mt-8 space-y-4">
            <Field label="Email"><input className={input} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Password"><input className={input} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          </div>
          {err && <p className="mt-4 text-[13px] text-[#b3261e]">{err}</p>}
          <Button type="submit" className="mt-6 w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
      </main>
    </Shell>
  );
}

// ---------------------------------------------------------------- the app

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [booted, setBooted] = useState(false);
  const [notice, setNotice] = useState("");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [meta, setMeta] = useState<Meta>({});
  const [section, setSection] = useState<SectionKey>("milestones");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    setSession(load());
    setBooted(true);
  }, []);
  const use = useCallback((s: Session | null) => {
    store(s);
    setSession(s);
  }, []);

  // every request goes out with a fresh session (renewed shortly before it expires, or once on rejection)
  const authed = useCallback(
    async <T,>(fn: (s: Session) => Promise<T>): Promise<T> => {
      let s = session!;
      const renew = async () => {
        try {
          s = await refresh(s);
          use(s);
        } catch {
          use(null);
          setNotice("Your session has ended. Please sign in again.");
          throw new Error("Signed out");
        }
      };
      if (s.expires_at - Date.now() < 60_000) await renew();
      try {
        return await fn(s);
      } catch (e) {
        if (!/jwt|expired|401/i.test((e as Error).message)) throw e;
        await renew();
        return fn(s);
      }
    },
    [session, use],
  );

  // on sign-in: check the admin list, then load what is saved (the built-in content fills any gaps)
  useEffect(() => {
    if (!session) return;
    let alive = true;
    (async () => {
      try {
        const ok = await authed(isAdmin);
        if (!alive) return;
        setAllowed(ok);
        if (!ok) return;
        const rows = await fetchRows();
        if (!alive) return;
        const c = mergeContent(rows);
        setSaved(c);
        setDraft(clone(c));
        setMeta(Object.fromEntries(rows.map((r) => [r.key, { at: r.updated_at, by: r.updated_by }])) as Meta);
      } catch (e) {
        if (alive) setLoadErr((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
    // (only when the signed-in user changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email]);

  const dirty = useMemo(() => {
    const out = {} as Record<SectionKey, boolean>;
    SECTION_KEYS.forEach((k) => (out[k] = Boolean(saved && draft && JSON.stringify(saved[k]) !== JSON.stringify(draft[k]))));
    return out;
  }, [saved, draft]);
  const anyDirty = SECTION_KEYS.some((k) => dirty[k]);

  // a warning before leaving with unsaved changes
  useEffect(() => {
    if (!anyDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyDirty]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!supabaseReady) return <Setup />;
  if (!booted) return null;
  if (!session) return <SignIn notice={notice} onSession={(s) => { setNotice(""); use(s); }} />;

  const out = async () => {
    if (anyDirty && !window.confirm("You have unsaved changes. Sign out anyway?")) return;
    await signOut(session);
    use(null);
    setAllowed(null);
    setSaved(null);
    setDraft(null);
  };

  if (allowed === false) {
    return (
      <Shell session={session} onSignOut={out}>
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="wide text-[26px]">Not on the admin list</h1>
          <p className="mt-4 text-[14px] leading-relaxed text-x-mute">{session.email} can sign in, but is not allowed to edit the site. Add it to the site_admins table in Supabase (see components/e/admin/setup.sql).</p>
        </main>
      </Shell>
    );
  }
  if (!draft || !saved) {
    return (
      <Shell session={session} onSignOut={out}>
        <main className="grid min-h-[60vh] place-items-center px-4 text-center">
          {loadErr ? <p className="max-w-md text-[14px] text-[#b3261e]">Couldn’t load the content: {loadErr}</p> : <p className="micro text-x-mute">Loading the content…</p>}
        </main>
      </Shell>
    );
  }

  const info = SECTIONS[section];
  const m = meta[section];
  const upload = (f: File) => authed((s) => uploadFile(s, f, section));
  const set = <K extends SectionKey>(k: K) => (v: SiteContent[K]) => setDraft({ ...draft, [k]: v });
  const save = async () => {
    const issue = problem(section, draft);
    if (issue) return setToast({ ok: false, text: issue });
    const clean = CLEAN[section](draft[section]);
    if (!clean) return setToast({ ok: false, text: info.invalid });
    setBusy(true);
    try {
      const row = await authed((s) => saveRow(s, section, clean));
      setSaved({ ...saved, [section]: clone(clean) });
      setDraft({ ...draft, [section]: clone(clean) });
      setMeta({ ...meta, [section]: { at: row?.updated_at, by: row?.updated_by } });
      setToast({ ok: true, text: `${info.title} saved. The site shows it from the next visit.` });
    } catch (e) {
      setToast({ ok: false, text: `Couldn’t save: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };
  const editor = (() => {
    const props = { upload };
    switch (section) {
      case "milestones": return <MilestonesEditor value={draft.milestones} onChange={set("milestones")} {...props} />;
      case "dealerships": return <DealershipsEditor value={draft.dealerships} onChange={set("dealerships")} {...props} />;
      case "leadership": return <LeadershipEditor value={draft.leadership} onChange={set("leadership")} {...props} />;
      case "gallery": return <GalleryEditor value={draft.gallery} onChange={set("gallery")} {...props} />;
      case "faq": return <FaqEditor value={draft.faq} onChange={set("faq")} {...props} />;
      case "figures": return <FiguresEditor value={draft.figures} onChange={set("figures")} {...props} />;
      case "company": return <CompanyEditor value={draft.company} onChange={set("company")} {...props} />;
      case "districts": return <DistrictsEditor value={draft.districts} onChange={set("districts")} {...props} />;
    }
  })();

  return (
    <Shell session={session} onSignOut={out}>
      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 md:grid-cols-[250px_minmax(0,1fr)] md:gap-10 md:px-8 md:py-10">
        {/* the sections */}
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 md:sticky md:top-24 md:mx-0 md:block md:h-fit md:space-y-1 md:overflow-visible md:px-0" aria-label="Sections">
          {SECTION_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSection(k)}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-[14px] transition md:w-full ${k === section ? "bg-x-ink text-white" : "bg-white text-x-ink ring-1 ring-black/[0.06] hover:ring-black/20 md:bg-transparent md:ring-0 md:hover:bg-white"}`}
            >
              <span className="whitespace-nowrap font-semibold">{SECTIONS[k].title}</span>
              {dirty[k] && <span className="h-2 w-2 shrink-0 rounded-full bg-x-gold" title="Unsaved changes" />}
            </button>
          ))}
        </nav>

        <main className="min-w-0">
          {/* title and actions, kept in view while scrolling a long list */}
          <div className="sticky top-16 z-20 -mx-4 mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.06] bg-[#f2f2ef]/95 px-4 py-4 backdrop-blur md:mx-0 md:px-0">
            <div className="min-w-0">
              <h1 className="wide text-[clamp(22px,2.4vw,32px)]">{info.title}</h1>
              <p className="mt-1.5 max-w-2xl text-[13px] text-x-mute">{info.blurb}</p>
              <p className="mt-1.5 text-[11px] text-x-mute">
                {m?.at ? `Last saved ${new Date(m.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}${m.by ? ` by ${m.by}` : ""}` : "Showing the built-in content (not yet saved here)"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button kind="ghost" onClick={() => window.confirm("Replace this section with the site’s built-in content? (Nothing is saved until you click Save.)") && setDraft({ ...draft, [section]: clone(DEFAULT_CONTENT[section]) })}>
                Built-in
              </Button>
              <Button kind="outline" disabled={!dirty[section]} onClick={() => setDraft({ ...draft, [section]: clone(saved[section]) })}>Discard</Button>
              <Button disabled={!dirty[section] || busy} onClick={save}>{busy ? "Saving…" : "Save changes"}</Button>
            </div>
          </div>
          {editor}
        </main>
      </div>

      {toast && (
        <div role="status" className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl px-5 py-4 text-[14px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] ${toast.ok ? "bg-x-ink text-white" : "bg-[#b3261e] text-white"}`}>
          {toast.text}
        </div>
      )}
    </Shell>
  );
}
