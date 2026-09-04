import json, os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
content_dir = os.path.join(base, "content")

REQUIRED = ["w", "ph", "pos", "cn", "ex"]

sources = ["_part1.json", "_part2.json", "_part3.json", "_part4.json", "_part5.json"]
merged = []
seen = set()
errors = []

for name in sources:
    path = os.path.join(content_dir, name)
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            errors.append(f"{name}[{i}] not object")
            continue
        missing = [k for k in REQUIRED if k not in item or not str(item.get(k, "")).strip()]
        if missing:
            errors.append(f"{name}[{i}] missing {missing}: {item.get('w','?')}")
            continue
        w = item["w"].strip().lower()
        if w in seen:
            continue
        seen.add(w)
        merged.append({
            "w": item["w"].strip(),
            "ph": item["ph"].strip(),
            "pos": item["pos"].strip(),
            "cn": item["cn"].strip(),
            "ex": item["ex"].strip(),
        })

out = os.path.join(content_dir, "words.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

print("Total merged words:", len(merged))
print("Validation errors:", len(errors))
for e in errors[:20]:
    print("  -", e)
