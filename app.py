#!/usr/bin/env python3
"""Web app + JSON API for the CKD models.

  python app.py                # http://127.0.0.1:5000
  POST /api/predict  {"model": "screen"|"stage", "values": {...}}
  GET  /api/schema/<model>
  GET  /api/health

Research / educational tool - NOT a medical device.
"""
import pandas as pd
from flask import Flask, jsonify, render_template_string, request

from ckd_common import SPECS, load_bundle, predict_frame

app = Flask(__name__)
_BUNDLES: dict = {}


def bundle(key: str) -> dict:
    if key not in SPECS:
        raise KeyError(key)
    if key not in _BUNDLES:
        _BUNDLES[key] = load_bundle(key)
    return _BUNDLES[key]


@app.get("/api/health")
def health():
    out = {}
    for k in SPECS:
        try:
            b = bundle(k)
            out[k] = {"loaded": True, "model": b["model_name"], "trained_at": b["trained_at"]}
        except FileNotFoundError:
            out[k] = {"loaded": False}
    return jsonify(out)


@app.get("/api/schema/<key>")
def schema(key):
    try:
        b = bundle(key)
    except KeyError:
        return jsonify(error="unknown model"), 404
    except FileNotFoundError as e:
        return jsonify(error=str(e)), 503
    return jsonify(
        title=b["title"], task=b["task"], classes=b["classes"], model=b["model_name"],
        metrics=b["metrics_holdout"], label_defining_features=b["label_defining_features"],
        known_rule=SPECS[key].get("known_rule"),
        features=[{"name": f, "min": b["ranges"][f][0], "max": b["ranges"][f][1],
                   "median": b["medians"][f], "binary": f in b["binary_features"]} for f in b["features"]],
        examples=b["examples"],
    )


@app.post("/api/predict")
def predict():
    body = request.get_json(silent=True) or {}
    key, values = body.get("model"), body.get("values")
    if key not in SPECS or not isinstance(values, dict):
        return jsonify(error='expected {"model": "screen"|"stage", "values": {...}}'), 400
    try:
        b = bundle(key)
    except FileNotFoundError as e:
        return jsonify(error=str(e)), 503
    clean = {k: (None if v in ("", None) else v) for k, v in values.items()}
    res = predict_frame(b, pd.DataFrame([clean])).iloc[0]
    probs = {c: float(res[f"p[{c}]"]) for c in b["classes"]}
    return jsonify(prediction=res["prediction"], confidence=float(res["confidence"]),
                   ckd_probability=float(res["ckd_probability"]), probabilities=probs,
                   warnings=res["warnings"] or None)


PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>CKD Prediction</title>
<style>
:root{--bg:#f4f6f9;--card:#fff;--ink:#1d2733;--mute:#66758a;--line:#dde3ea;--blue:#1f5fa8;--red:#c0392b;--green:#1e8449;--amber:#b9770e}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--ink)}
header{background:var(--blue);color:#fff;padding:18px 24px}header h1{margin:0;font-size:20px}header p{margin:2px 0 0;opacity:.85;font-size:13px}
.wrap{max-width:1080px;margin:20px auto;padding:0 16px;display:grid;grid-template-columns:1fr 340px;gap:18px}
@media(max-width:860px){.wrap{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px}
.tabs{display:flex;gap:8px;margin-bottom:14px}.tabs button{flex:1;padding:9px;border:1px solid var(--line);background:#fff;border-radius:8px;cursor:pointer;font-weight:600;color:var(--mute)}
.tabs button.on{background:var(--blue);border-color:var(--blue);color:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
label{font-size:12px;color:var(--mute);display:block;margin-bottom:2px}
input,select{width:100%;padding:7px 8px;border:1px solid var(--line);border-radius:6px;font-size:14px}
.row{display:flex;gap:10px;margin-top:14px;align-items:center;flex-wrap:wrap}
.btn{background:var(--blue);color:#fff;border:0;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;font-size:15px}
.btn.ghost{background:#fff;color:var(--blue);border:1px solid var(--blue)}
#res h2{margin:.2em 0;font-size:20px}.bar{height:10px;background:#e8edf2;border-radius:5px;overflow:hidden;margin:2px 0 8px}.bar i{display:block;height:100%;background:var(--blue)}
.pl{display:flex;justify-content:space-between;font-size:13px}.warn{background:#fff6e5;border:1px solid #f3d9a4;color:var(--amber);padding:8px 10px;border-radius:6px;font-size:13px;margin-top:10px}
.disc{font-size:12px;color:var(--mute);margin-top:14px}.pill{display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:700;color:#fff}
small.m{color:var(--mute)}
</style></head><body>
<header><h1>Chronic Kidney Disease Prediction</h1><p>Machine-learning decision support &middot; research &amp; educational use only</p></header>
<div class="wrap">
 <div class="card"><div class="tabs">
   <button id="t-screen" onclick="load('screen')">Screening (CKD / no CKD)</button>
   <button id="t-stage" onclick="load('stage')">Staging (5 classes)</button></div>
  <div class="row" style="margin:0 0 12px"><label style="margin:0">Load example:</label><select id="ex" style="width:auto" onchange="loadEx()"></select></div>
  <form id="f" onsubmit="return false"><div class="grid" id="fields"></div></form>
  <div class="row"><button class="btn" onclick="run()">Predict</button><button class="btn ghost" onclick="clearAll()">Clear</button>
  <small class="m">Leave a field blank if the test was not done (accuracy drops).</small></div></div>
 <div>
  <div class="card" id="res"><b>Result</b><p style="color:var(--mute)">Fill in the form and press Predict.</p></div>
  <div class="card" id="meta" style="margin-top:14px;font-size:13px"></div>
 </div></div>
<div class="wrap" style="grid-template-columns:1fr"><div class="disc">&#9888; Not a medical device. Models were trained on synthetic data whose labels follow fixed clinical rules; do not use for diagnosis or treatment decisions. Always confirm with a clinician and standard CKD-EPI eGFR / UACR testing.</div></div>
<script>
let S=null,K=null;
const $=id=>document.getElementById(id);
async function load(k){K=k;S=await (await fetch('/api/schema/'+k)).json();
 for(const x of['screen','stage'])$('t-'+x).classList.toggle('on',x===k);
 $('fields').innerHTML=S.features.map(f=>f.binary
   ?`<div><label>${f.name.replace(/_/g,' ')}</label><select name="${f.name}"><option value="">-</option><option value="0">No / 0</option><option value="1">Yes / 1</option></select></div>`
   :`<div><label>${f.name.replace(/_/g,' ')} <small>(${f.min}&ndash;${f.max})</small></label><input name="${f.name}" type="number" step="any" placeholder="${f.median}"></div>`).join('');
 $('ex').innerHTML='<option value="">-- choose --</option>'+S.classes.map(c=>`<option>${c}</option>`).join('');
 const m=S.metrics;$('meta').innerHTML=`<b>${S.title}</b><br>Model: ${S.model}<br>Hold-out accuracy: <b>${(m.accuracy*100).toFixed(2)}%</b><br>Balanced accuracy: ${(m.balanced_accuracy*100).toFixed(2)}%<br><small class="m">${S.known_rule?'Labelling rule found in data: '+S.known_rule:'Label-defining inputs: '+S.label_defining_features.join(', ')}</small>`;
 $('res').innerHTML='<b>Result</b><p style="color:var(--mute)">Fill in the form and press Predict.</p>';}
function loadEx(){const c=$('ex').value;if(!c)return;const e=S.examples[c];
 for(const el of $('f').elements)if(el.name&&e[el.name]!==undefined)el.value=e[el.name];}
function clearAll(){$('f').reset();$('ex').value='';}
async function run(){const v={};for(const el of $('f').elements)if(el.name&&el.value!=='')v[el.name]=Number(el.value);
 const r=await fetch('/api/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:K,values:v})});
 const d=await r.json();if(!r.ok){$('res').innerHTML='<b>Error</b><p>'+d.error+'</p>';return;}
 const bad=d.ckd_probability>=.5,col=bad?'var(--red)':'var(--green)';
 $('res').innerHTML=`<b>Result</b><h2>${d.prediction}</h2><span class="pill" style="background:${col}">P(CKD) ${(d.ckd_probability*100).toFixed(1)}%</span>
 <div style="margin-top:12px">${Object.entries(d.probabilities).map(([c,p])=>`<div class="pl"><span>${c}</span><span>${(p*100).toFixed(1)}%</span></div><div class="bar"><i style="width:${p*100}%"></i></div>`).join('')}</div>
 ${d.warnings?`<div class="warn">${d.warnings}</div>`:''}`;}
load('screen');
</script></body></html>"""


@app.get("/")
def index():
    return render_template_string(PAGE)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
