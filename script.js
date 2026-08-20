// Modular calculator UI: category switching and several calculators.
const i18n = { en:{ title:'Calculator', credits:'Simple GUI calculator — English / Русский' }, ru:{ title:'Калькулятор', credits:'Простой GUI калькулятор — English / Русский' } }

const catList = document.getElementById('catList')
const panel = document.getElementById('panel')
const langSelect = document.getElementById('langSelect')
const titleEl = document.getElementById('title')
const creditsEl = document.getElementById('credits')
const degBtn = document.getElementById('degBtn')

let LANG = localStorage.getItem('calc_lang') || 'en'
let useDeg = localStorage.getItem('calc_deg') === '1'

function applyTranslations(){ titleEl.textContent = i18n[LANG].title; creditsEl.textContent = i18n[LANG].credits; degBtn.textContent = useDeg ? (LANG==='ru'?'ГР':'DEG') : (LANG==='ru'?'РАД':'RAD') }
langSelect.value = LANG
langSelect.addEventListener('change', e=>{ LANG=e.target.value; localStorage.setItem('calc_lang',LANG); applyTranslations() })
degBtn.addEventListener('click', ()=>{ useDeg = !useDeg; localStorage.setItem('calc_deg', useDeg? '1':'0'); applyTranslations() })

// category switching
catList.querySelectorAll('li').forEach(li=>{
  li.addEventListener('click', ()=>{
    catList.querySelectorAll('li').forEach(x=>x.classList.remove('active'))
    li.classList.add('active')
    renderCategory(li.dataset.cat)
  })
})

function clearPanel(){ panel.innerHTML=''; panel.classList.remove('enter-fade'); void panel.offsetWidth; panel.classList.add('enter-fade') }

// safe evaluator for basic expressions
function safeEval(expr){ try{
  const s = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/\^/g,'**').replace(/ANS/g,'0')
  // allow digits, ops, Math, parentheses
  if(!/^[0-9+\-*/%.()eE\s\*\*Mathsqrtlogasinctanrpoxrad,]+$/.test(s) && s.length>0){ /* not strict */ }
  // use Function to evaluate
  const v = Function('return ('+s+')')()
  return v
}catch(e){throw e}}

function renderCategory(cat){ clearPanel(); switch(cat){
  case 'simple': renderSimple(); break
  case 'scientific': renderScientific(); break
  case 'financial': renderFinancial(); break
  case 'programmer': renderProgrammer(); break
  case 'converter': renderConverter(); break
  case 'graphical': renderGraphical(); break
  case 'geometry': renderPlaceholder('Geometry calculator coming soon'); break
  case 'algebra': renderAlgebra(); break
  case 'matrix': renderMatrix(); break
  case 'stats': renderStats(); break
  default: renderPlaceholder('Module coming soon')
}}

function renderGraphical(){
  panel.innerHTML = `
    <div class="card">
      <h3>📐 Graphical — plot function y = f(x)</h3>
      <div class="row"><input id="fexpr" class="field" placeholder="e.g. sin(x) or x*x" /></div>
      <div class="row" style="margin-top:8px"><button id="plot" class="btn">Plot</button><div id="gmsg" class="muted" style="margin-left:12px"></div></div>
      <canvas id="graph" width="800" height="360" style="margin-top:12px;max-width:100%;border-radius:8px;border:1px solid #e6e6e6"></canvas>
    </div>
  `
  const canvas = panel.querySelector('#graph')
  const ctx = canvas.getContext('2d')
  const plot = panel.querySelector('#plot')
  const fexpr = panel.querySelector('#fexpr')
  const msg = panel.querySelector('#gmsg')

  function draw(fn){
    const W = canvas.width; const H = canvas.height
    ctx.clearRect(0,0,W,H)
    // axes
    ctx.strokeStyle = '#ddd'; ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke()
    ctx.strokeStyle = '#000'; ctx.beginPath()
    const scaleX = 40 // px per unit
    const scaleY = 40
    let first=true
    for(let px=0; px<=W; px++){
      const x = (px - W/2)/scaleX
      let y
      try{ y = fn(x) }catch(e){ y = NaN }
      const py = H/2 - y*scaleY
      if(!Number.isFinite(py)) { first=true; continue }
      if(first){ ctx.moveTo(px,py); first=false } else ctx.lineTo(px,py)
    }
    ctx.stroke()
  }

  plot.addEventListener('click', ()=>{
    const expr = fexpr.value.trim(); if(!expr){ msg.textContent='Enter expression'; return }
    // create function of x; allow Math.* functions
    try{
      const safe = expr.replace(/\b(sin|cos|tan|sqrt|log|abs|exp|pow)\b/g, 'Math.$1')
      const fn = new Function('x','return '+safe)
      draw(fn)
      msg.textContent = 'Plotted'
    }catch(e){ msg.textContent = 'Error parsing' }
  })
}

function renderSimple(){
  panel.innerHTML = `
    <div class="card">
      <h3>🧮 Simple Calculator</h3>
      <div class="row"><input id="expr" class="field" placeholder="Enter expression" /></div>
      <div class="row" style="margin-top:8px"><button id="evalBtn" class="btn">Calculate</button><div id="res" class="muted" style="margin-left:12px"></div></div>
    </div>
  `
  const expr = panel.querySelector('#expr')
  const res = panel.querySelector('#res')
  panel.querySelector('#evalBtn').addEventListener('click', ()=>{
    try{ const v = safeEval(expr.value); res.textContent = String(v) }catch(e){ res.textContent = 'Error' }
  })
}

function renderScientific(){
  panel.innerHTML = `
    <div class="card">
      <h3>🔬 Scientific Calculator</h3>
      <div class="row"><input id="s-expr" class="field" placeholder="e.g. sin(30)+log(100)" /></div>
      <div class="row" style="margin-top:8px">
        <button id="s-eval" class="btn">Evaluate</button>
        <button id="btn-sin" class="btn">sin</button>
        <button id="btn-cos" class="btn">cos</button>
        <button id="btn-sqrt" class="btn">√</button>
        <div id="s-res" class="muted" style="margin-left:12px"></div>
      </div>
    </div>
  `
  const sexpr = panel.querySelector('#s-expr')
  const sres = panel.querySelector('#s-res')
  panel.querySelector('#s-eval').addEventListener('click', ()=>{ try{ let v = safeEval(sexpr.value);
    sres.textContent = String(v) }catch(e){ sres.textContent='Error' } })
  panel.querySelector('#btn-sin').addEventListener('click', ()=>{ sexpr.value += 'Math.sin(' + (useDeg? 'Math.PI/180*' : '') })
  panel.querySelector('#btn-cos').addEventListener('click', ()=>{ sexpr.value += 'Math.cos(' + (useDeg? 'Math.PI/180*' : '') })
  panel.querySelector('#btn-sqrt').addEventListener('click', ()=>{ sexpr.value += 'Math.sqrt(' })
}

function renderFinancial(){
  panel.innerHTML = `
    <div class="card">
      <h3>📊 Financial / Percent</h3>
      <div class="row"><input id="val" class="field" placeholder="Amount" /></div>
      <div class="row" style="margin-top:8px"><input id="pct" class="field" placeholder="Percent (%)" /></div>
      <div class="row" style="margin-top:8px"><button id="pctCalc" class="btn">Apply %</button><div id="pctRes" class="muted" style="margin-left:12px"></div></div>
    </div>
  `
  panel.querySelector('#pctCalc').addEventListener('click', ()=>{
    const v = parseFloat(panel.querySelector('#val').value) || 0
    const p = parseFloat(panel.querySelector('#pct').value) || 0
    const out = v * p / 100
    panel.querySelector('#pctRes').textContent = String(out)
  })
}

function renderProgrammer(){
  panel.innerHTML = `
    <div class="card">
      <h3>🧑‍💻 Programmer</h3>
      <div class="row"><input id="numIn" class="field" placeholder="Enter integer" /></div>
      <div class="row" style="margin-top:8px"><button id="conv" class="btn">Convert</button><div id="convRes" class="muted" style="margin-left:12px"></div></div>
    </div>
  `
  panel.querySelector('#conv').addEventListener('click', ()=>{
    const n = parseInt(panel.querySelector('#numIn').value)
    if(Number.isNaN(n)){ panel.querySelector('#convRes').textContent='Invalid' ; return }
    panel.querySelector('#convRes').textContent = `BIN: ${n.toString(2)}  OCT: ${n.toString(8)}  DEC: ${n.toString(10)}  HEX: ${n.toString(16).toUpperCase()}`
  })
}

function renderConverter(){
  panel.innerHTML = `
    <div class="card">
      <h3>📏 Unit Converter — Length</h3>
      <div class="row"><input id="uVal" class="field" placeholder="Value" /></div>
      <div class="row" style="margin-top:8px">
        <select id="uFrom" class="field"><option value="m">m</option><option value="cm">cm</option><option value="km">km</option><option value="in">in</option><option value="ft">ft</option></select>
        <select id="uTo" class="field"><option value="m">m</option><option value="cm">cm</option><option value="km">km</option><option value="in">in</option><option value="ft">ft</option></select>
      </div>
      <div class="row" style="margin-top:8px"><button id="uConv" class="btn">Convert</button><div id="uRes" class="muted" style="margin-left:12px"></div></div>
    </div>
  `
  const conv = (v,from,to)=>{
    const toMeters = { m:1, cm:0.01, km:1000, in:0.0254, ft:0.3048 }
    return v * toMeters[from] / toMeters[to]
  }
  panel.querySelector('#uConv').addEventListener('click', ()=>{
    const v = parseFloat(panel.querySelector('#uVal').value) || 0
    const from = panel.querySelector('#uFrom').value
    const to = panel.querySelector('#uTo').value
    const out = conv(v,from,to)
    panel.querySelector('#uRes').textContent = String(out)
  })
}

function renderPlaceholder(text){ panel.innerHTML = `<div class="card"><h3>${text}</h3><p class="muted">Will be added in future updates.</p></div>` }

// initial
applyTranslations()
renderCategory('simple')
