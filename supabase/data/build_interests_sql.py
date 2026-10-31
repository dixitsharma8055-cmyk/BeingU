# Regenerates supabase/migrations/0002_interest_library.sql from interests.json.
# Run: python3 supabase/data/build_interests_sql.py
import json, re, pathlib
here = pathlib.Path(__file__).resolve().parent
d = json.loads((here / "interests.json").read_text(encoding="utf-8"))
def q(s): return "'" + s.replace("'", "''") + "'"
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
cats = [(k, k.replace("-", " ").title(), i) for i, k in enumerate(d, 1)]
out = ["-- BeingU — Migration 0002: interest library (generated; do not edit by hand)", "",
       "insert into public.interest_categories (slug, name_en, sort_order) values",
       ",\n".join(f"  ({q(s)}, {q(n)}, {o})" for s, n, o in cats), "on conflict (slug) do nothing;", "",
       "insert into public.interests (category_id, slug, name_en, is_approved) values"]
rows = [f"  ((select id from public.interest_categories where slug = {q(c)}), {q(slug(x))}, {q(x)}, true)"
        for c, vals in d.items() for x in vals]
out += [",\n".join(rows), "on conflict (slug) do nothing;"]
(here.parent / "migrations" / "0002_interest_library.sql").write_text("\n".join(out) + "\n", encoding="utf-8")
print("wrote", len(rows), "interests in", len(cats), "categories")
