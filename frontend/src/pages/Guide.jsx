import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Trash2, Lock, X, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

function ArticleCard({ a, onOpen, onDelete, isPrivate }) {
  return (
    <article
      className="rtr-card rtr-card-lift overflow-hidden cursor-pointer group"
      onClick={() => onOpen(a)}
      data-testid={`article-card-${a.id || a._id}`}
    >
      <div className="relative h-48 bg-[#1C1614] overflow-hidden">
        {a.image_url ? (
          <img
            src={a.image_url}
            alt={a.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-[#433530]">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1614] via-transparent to-transparent" />
        <span className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-full bg-[#1C1614]/80 border border-[#CBA279]/40 text-[#CBA279] uppercase tracking-widest">
          {a.category}
        </span>
        {isPrivate && (
          <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full bg-[#1C1614]/80 border border-[#9EB27A]/40 text-[#9EB27A] uppercase tracking-widest flex items-center gap-1">
            <Lock className="w-3 h-3" /> Private
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-serif text-xl text-[#E8E4DB] leading-tight">{a.title}</h3>
        <p className="text-sm text-[#A69A92] mt-2 line-clamp-2">{a.summary}</p>
        {isPrivate && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(a); }}
            className="mt-4 text-xs text-[#D47C5E] hover:text-[#E1B88F] inline-flex items-center gap-1"
            data-testid={`delete-private-${a._id}`}
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        )}
      </div>
    </article>
  );
}

function ArticleReader({ a, onBack }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 rtr-anim-in" data-testid="article-reader">
      <button onClick={onBack} className="text-[#CBA279] hover:text-[#E1B88F] text-sm mb-6 inline-flex items-center gap-2" data-testid="article-back-btn">
        <ArrowLeft className="w-4 h-4" /> Back to articles
      </button>
      {a.image_url && (
        <img src={a.image_url} alt={a.title} className="w-full h-72 object-cover rounded-2xl border border-[#433530]" />
      )}
      <div className="rtr-label mt-6">{a.category}</div>
      <h1 className="font-serif text-4xl sm:text-5xl text-[#E8E4DB] tracking-tight mt-2 leading-[1.1]">{a.title}</h1>
      <p className="text-[#A69A92] mt-3">{a.summary}</p>
      <article className="mt-8 text-[#E8E4DB] leading-relaxed text-base whitespace-pre-wrap">
        {a.content}
      </article>
    </div>
  );
}

function CreatePrivateModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", summary: "", content: "", category: "Notes", image_url: "" });
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!form.title || !form.content) { toast.error("Title and content required"); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/articles/private", form);
      toast.success("Saved to your private notes");
      onCreated(data);
      onClose();
      setForm({ title: "", summary: "", content: "", category: "Notes", image_url: "" });
    } catch (e) {
      toast.error("Couldn't save. Are you signed in?");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1614]/85 backdrop-blur grid place-items-center p-4" data-testid="private-modal">
      <div className="rtr-card rtr-grain max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="font-serif text-2xl text-[#E8E4DB]">New private note</div>
          <button onClick={onClose} className="text-[#A69A92] hover:text-[#E8E4DB]" data-testid="close-private-modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          {[
            ["title", "Title", "text"],
            ["summary", "Summary (optional)", "text"],
            ["category", "Category", "text"],
            ["image_url", "Image URL (optional)", "text"],
          ].map(([k, l, t]) => (
            <div key={k}>
              <label className="text-[10px] uppercase tracking-widest text-[#CBA279] mb-1 block">{l}</label>
              <input
                data-testid={`private-${k}-input`}
                type={t} value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="rtr-input"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#CBA279] mb-1 block">Content</label>
            <textarea
              data-testid="private-content-input"
              rows={8} value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="rtr-input"
              placeholder="What you observed, learned, or want to remember…"
            />
          </div>
        </div>
        <button onClick={submit} disabled={busy} className="rtr-btn-primary w-full mt-5" data-testid="save-private-btn">
          {busy ? "Saving…" : "Save note"}
        </button>
      </div>
    </div>
  );
}

export default function Guide() {
  const { user } = useAuth();
  const [curated, setCurated] = useState([]);
  const [privateArticles, setPrivateArticles] = useState([]);
  const [tab, setTab] = useState("curated");
  const [reading, setReading] = useState(null);
  const [modal, setModal] = useState(false);

  useEffect(() => { api.get("/articles/curated").then((r) => setCurated(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (user && user.email) api.get("/articles/private").then((r) => setPrivateArticles(r.data)).catch(() => {});
  }, [user]);

  const remove = async (a) => {
    try { await api.delete(`/articles/private/${a._id}`); setPrivateArticles((p) => p.filter((x) => x._id !== a._id)); toast.success("Removed"); }
    catch { toast.error("Delete failed"); }
  };

  if (reading) return <ArticleReader a={reading} onBack={() => setReading(null)} />;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 rtr-anim-in" data-testid="guide-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="rtr-label flex items-center gap-2"><BookOpen className="w-3 h-3" /> Field Guide</div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#E8E4DB] mt-2">Learn the craft, one row at a time</h1>
          <p className="text-[#A69A92] mt-3 max-w-2xl">
            Curated lessons on planting, homemade fertilizers, soil moisture, pests, and indigenous farming —
            plus a private corner for your own notes.
          </p>
        </div>
        {tab === "private" && user && user.email && (
          <button onClick={() => setModal(true)} className="rtr-btn-primary inline-flex items-center gap-2" data-testid="new-private-btn">
            <Plus className="w-4 h-4" /> New private note
          </button>
        )}
      </div>

      <div className="inline-flex rounded-full border border-[#433530] p-1 mb-8" data-testid="guide-tabs">
        <button
          onClick={() => setTab("curated")}
          className={`px-5 py-2 rounded-full text-sm transition-colors ${tab === "curated" ? "bg-[#9EB27A] text-[#1C1614]" : "text-[#A69A92] hover:text-[#E8E4DB]"}`}
          data-testid="tab-curated"
        >
          Curated articles
        </button>
        <button
          onClick={() => setTab("private")}
          className={`px-5 py-2 rounded-full text-sm transition-colors ${tab === "private" ? "bg-[#CBA279] text-[#1C1614]" : "text-[#A69A92] hover:text-[#E8E4DB]"}`}
          data-testid="tab-private"
        >
          My private notes
        </button>
      </div>

      {tab === "curated" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {curated.map((a) => (
            <ArticleCard key={a.id} a={a} onOpen={setReading} />
          ))}
        </div>
      ) : !user || !user.email ? (
        <div className="rtr-card p-10 text-center" data-testid="private-signin-prompt">
          <Lock className="w-8 h-8 text-[#CBA279] mx-auto mb-4" />
          <div className="font-serif text-2xl text-[#E8E4DB]">Sign in to keep private notes</div>
          <div className="text-[#A69A92] mt-2">Your notes stay separate from the public guide.</div>
          <Link to="/login" className="rtr-btn-primary inline-block mt-6" data-testid="private-signin-cta">
            Sign in
          </Link>
        </div>
      ) : privateArticles.length === 0 ? (
        <div className="rtr-card p-10 text-center" data-testid="private-empty">
          <div className="font-serif text-2xl text-[#E8E4DB]">No notes yet</div>
          <div className="text-[#A69A92] mt-2">Save soil observations, planting dates, or your own articles.</div>
          <button onClick={() => setModal(true)} className="rtr-btn-primary mt-6" data-testid="private-empty-cta">
            <Plus className="w-4 h-4 inline mr-1" /> Add your first
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {privateArticles.map((a) => (
            <ArticleCard key={a._id} a={a} onOpen={setReading} onDelete={remove} isPrivate />
          ))}
        </div>
      )}

      <CreatePrivateModal
        open={modal}
        onClose={() => setModal(false)}
        onCreated={(a) => setPrivateArticles((p) => [a, ...p])}
      />
    </div>
  );
}
