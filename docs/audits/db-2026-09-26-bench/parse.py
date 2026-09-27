import sys, json
raw = sys.stdin.read(); label = sys.argv[1]
i = raw.find("[")
try:
    p = json.loads(raw[i:raw.rfind("]") + 1])[0]
    pl = p["Plan"]
    blocks = pl.get("Shared Hit Blocks", 0) + pl.get("Shared Read Blocks", 0)
    print(f"{label:<40} {p['Execution Time']:>10.1f} ms  rows={pl.get('Actual Rows')}  buffers={blocks}")
except Exception:
    print(f"{label:<40} ERROR {raw.strip()[-160:]}")
