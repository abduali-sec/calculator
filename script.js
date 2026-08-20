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
// safe evaluator using math.js
function safeEval(expr){
  try{
    if(typeof math === 'undefined') throw new Error('math.js not loaded')
    // math.evaluate supports ^ as power and many functions
    return math.evaluate(expr)
  }catch(e){
    throw e
  }
}

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
      <div class="row" style="margin-top:8px">
        <button id="plot" class="btn">Plot</button>
        <button id="zoomIn" class="btn" style="margin-left:8px">Zoom +</button>
        <button id="zoomOut" class="btn" style="margin-left:8px">Zoom -</button>
        <button id="resetView" class="btn" style="margin-left:8px">Reset</button>
        <label style="margin-left:12px"><input type="checkbox" id="gridToggle" checked/> Grid</label>
        <div id="gmsg" class="muted" style="margin-left:12px"></div>
      </div>
      <canvas id="graph" width="800" height="360" style="margin-top:12px;max-width:100%;border-radius:8px;border:1px solid #e6e6e6"></canvas>
    </div>
  `
  const canvas = panel.querySelector('#graph')
  const ctx = canvas.getContext('2d')
  const plot = panel.querySelector('#plot')
  const fexpr = panel.querySelector('#fexpr')
  const msg = panel.querySelector('#gmsg')
  const zoomIn = panel.querySelector('#zoomIn')
  const zoomOut = panel.querySelector('#zoomOut')
  const resetView = panel.querySelector('#resetView')
  const gridToggle = panel.querySelector('#gridToggle')

  // view state
  const view = { x:0, y:0, scale:40 }
  let isPanning=false, panStart={x:0,y:0}, viewStart={x:0,y:0}

  function draw(fn){
    const W = canvas.width; const H = canvas.height
    ctx.clearRect(0,0,W,H)
    // axes
    ctx.strokeStyle = '#ddd'; ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke()
    ctx.strokeStyle = '#000'; ctx.beginPath()
    const scaleX = view.scale // px per unit
    const scaleY = view.scale
    let first=true
    for(let px=0; px<=W; px++){
      const x = view.x + (px - W/2)/scaleX
      let y
      try{ y = fn(x) }catch(e){ y = NaN }
      const py = H/2 - y*scaleY
      if(!Number.isFinite(py)) { first=true; continue }
      if(first){ ctx.moveTo(px,py); first=false } else ctx.lineTo(px,py)
    }
    ctx.stroke()
    // draw grid and ticks if enabled
    if(panel.querySelector('#gridToggle') && panel.querySelector('#gridToggle').checked){
      drawGrid(ctx,W,H,view)
    }
    drawTicks(ctx,W,H,view)
  }

function niceStep(scale){
  const steps = [1,2,5]
  const exp = Math.floor(Math.log10(1/scale))
  const base = Math.pow(10, -exp)
  for(const s of steps){ const val = s*base; if(val*scale*40 >= 30) return val }
  return Math.pow(10,-exp)
}

function drawGrid(ctx,W,H,view){
  ctx.save()
  ctx.strokeStyle = '#eee'
  ctx.lineWidth = 1
  const approxPxPerUnit = view.scale
  // choose step in world units so grid roughly every 50px
  const rawStep = 50/approxPxPerUnit
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const step = Math.round(rawStep/pow) * pow
  // vertical lines
  const startX = view.x - (W/2)/view.scale
  const endX = view.x + (W/2)/view.scale
  const startI = Math.floor(startX/step)
  const endI = Math.ceil(endX/step)
  for(let i=startI;i<=endI;i++){
    const x = i*step
    const px = W/2 + (x - view.x)*view.scale
    ctx.beginPath(); ctx.moveTo(px,0); ctx.lineTo(px,H); ctx.stroke()
  }
  // horizontal
  const startY = view.y - (H/2)/view.scale
  const endY = view.y + (H/2)/view.scale
  const startJ = Math.floor(startY/step)
  const endJ = Math.ceil(endY/step)
  for(let j=startJ;j<=endJ;j++){
    const y = j*step
    const py = H/2 - (y - view.y)*view.scale
    ctx.beginPath(); ctx.moveTo(0,py); ctx.lineTo(W,py); ctx.stroke()
  }
  ctx.restore()
}

function drawTicks(ctx,W,H,view){
  ctx.save()
  ctx.fillStyle='#666'; ctx.font='12px sans-serif'
  // x ticks
  const approxPxPerUnit = view.scale
  const rawStep = 50/approxPxPerUnit
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const step = Math.round(rawStep/pow) * pow
  const startX = view.x - (W/2)/view.scale
  const endX = view.x + (W/2)/view.scale
  const startI = Math.floor(startX/step)
  const endI = Math.ceil(endX/step)
  for(let i=startI;i<=endI;i++){
    const x = i*step
    const px = W/2 + (x - view.x)*view.scale
    ctx.fillText((x).toFixed(2), px+4, H/2+14)
  }
  // y ticks
  const startY = view.y - (H/2)/view.scale
  const endY = view.y + (H/2)/view.scale
  const startJ = Math.floor(startY/step)
  const endJ = Math.ceil(endY/step)
  for(let j=startJ;j<=endJ;j++){
    const y = j*step
    const py = H/2 - (y - view.y)*view.scale
    ctx.fillText((y).toFixed(2), W/2+6, py-4)
  }
  ctx.restore()
}
  function render(fn){ draw(fn) }

  function compileFn(expr){ if(typeof math === 'undefined') throw new Error('math.js required'); return math.compile(expr) }

  plot.addEventListener('click', ()=>{
    const expr = fexpr.value.trim(); if(!expr){ msg.textContent='Enter expression'; return }
    try{
      const node = compileFn(expr)
      const fn = (x)=>{ const scope = {x: useDeg ? x * Math.PI/180 : x}; return node.evaluate(scope) }
      render(fn); msg.textContent = 'Plotted'
    }catch(e){ msg.textContent = 'Error parsing' }
  })

  // zoom controls
  function zoomAt(px, py, factor){
    const W = canvas.width, H = canvas.height
    const worldX = view.x + (px - W/2)/view.scale
    const worldY = view.y + (H/2 - py)/view.scale
    view.scale *= factor
    // keep point under cursor stable
    view.x = worldX - (px - W/2)/view.scale
    view.y = worldY - (H/2 - py)/view.scale
  }
  zoomIn.addEventListener('click', ()=>{ zoomAt(canvas.width/2, canvas.height/2, 1.25); const expr=fexpr.value.trim(); if(expr){ plot.click() } })
  zoomOut.addEventListener('click', ()=>{ zoomAt(canvas.width/2, canvas.height/2, 0.8); const expr=fexpr.value.trim(); if(expr){ plot.click() } })
  resetView.addEventListener('click', ()=>{ view.x=0; view.y=0; view.scale=40; const expr=fexpr.value.trim(); if(expr){ plot.click() } })

  // mouse wheel zoom
  canvas.addEventListener('wheel', (ev)=>{
    ev.preventDefault()
    const delta = ev.deltaY>0 ? 0.9 : 1.1
    const rect = canvas.getBoundingClientRect()
    const px = ev.clientX - rect.left, py = ev.clientY - rect.top
    zoomAt(px, py, delta)
    const expr=fexpr.value.trim(); if(expr){ plot.click() }
  })

  // pan
  canvas.addEventListener('mousedown', (ev)=>{ isPanning=true; panStart={x:ev.clientX,y:ev.clientY}; viewStart={x:view.x,y:view.y} })
  window.addEventListener('mousemove', (ev)=>{ if(!isPanning) return; const dx = ev.clientX - panStart.x, dy = ev.clientY - panStart.y; view.x = viewStart.x - dx/view.scale; view.y = viewStart.y + dy/view.scale; const expr=fexpr.value.trim(); if(expr){ plot.click() } })
  window.addEventListener('mouseup', ()=>{ isPanning=false })

  // grid toggle handled in draw
}

// --- Algebraic solver ---
function renderAlgebra(){
  panel.innerHTML = `
    <div class="card">
      <h3>🧮 Algebraic Solver</h3>
      <p class="muted">Solve linear, quadratic equations and 2x2 linear systems.</p>
      <div class="row" style="margin-top:8px">
        <select id="algType" class="field">
          <option value="linear">Linear ax + b = 0</option>
          <option value="quadratic">Quadratic ax² + bx + c = 0</option>
          <option value="system2">System 2x2</option>
          <option value="systemN">Linear system N×N (matrix)</option>
          <option value="nonlinear">Nonlinear equation (single variable, Newton)</option>
        </select>
      </div>
      <div id="algBody" style="margin-top:10px"></div>
    </div>
  `
  const algType = panel.querySelector('#algType')
  const algBody = panel.querySelector('#algBody')
  function renderBody(){
    const t = algType.value
    if(t==='linear'){
      algBody.innerHTML = `<div class=\"row\"><input id=\"a\" class=\"field\" placeholder=\"a\"/><input id=\"b\" class=\"field\" placeholder=\"b\"/></div><div class=\"row\" style=\"margin-top:8px\"><button id=\"solveLin\" class=\"btn\">Solve</button><div id=\"out\" class=\"muted\" style=\"margin-left:12px\"></div></div>`
      algBody.querySelector('#solveLin').addEventListener('click', ()=>{
        const a = parseFloat(algBody.querySelector('#a').value)
        const b = parseFloat(algBody.querySelector('#b').value)
        const out = algBody.querySelector('#out')
        if(isNaN(a) || isNaN(b)){ out.textContent='Invalid' ; return }
        if(a===0){ out.textContent = b===0? 'Infinite solutions' : 'No solution' ; return }
        out.textContent = String(-b/a)
      })
    }else if(t==='quadratic'){
      algBody.innerHTML = `<div class=\"row\"><input id=\"qa\" class=\"field\" placeholder=\"a\"/><input id=\"qb\" class=\"field\" placeholder=\"b\"/><input id=\"qc\" class=\"field\" placeholder=\"c\"/></div><div class=\"row\" style=\"margin-top:8px\"><button id=\"solveQuad\" class=\"btn\">Solve</button><div id=\"qout\" class=\"muted\" style=\"margin-left:12px\"></div></div>`
      algBody.querySelector('#solveQuad').addEventListener('click', ()=>{
        const a = parseFloat(algBody.querySelector('#qa').value)
        const b = parseFloat(algBody.querySelector('#qb').value)
        const c = parseFloat(algBody.querySelector('#qc').value)
        const out = algBody.querySelector('#qout')
        if(isNaN(a) || isNaN(b) || isNaN(c)){ out.textContent='Invalid'; return }
        if(a===0){ out.textContent = b===0? (c===0? 'Infinite' : 'No solution') : `Linear: ${-c/b}`; return }
        const D = b*b - 4*a*c
        if(D<0){ out.textContent = `Complex: ${(-b/(2*a)).toFixed(4)} ± ${Math.sqrt(-D)/(2*a).toFixed(4)}i`; return }
        const x1 = (-b + Math.sqrt(D))/(2*a)
        const x2 = (-b - Math.sqrt(D))/(2*a)
        out.textContent = `x1=${x1}, x2=${x2}`
      })
    }else if(t==='system2'){
      algBody.innerHTML = `<div class=\"row\"><input id=\"a1\" class=\"field\" placeholder=\"a1\"/><input id=\"b1\" class=\"field\" placeholder=\"b1\"/><input id=\"c1\" class=\"field\" placeholder=\"c1\"/></div><div class=\"row\" style=\"margin-top:6px\"><input id=\"a2\" class=\"field\" placeholder=\"a2\"/><input id=\"b2\" class=\"field\" placeholder=\"b2\"/><input id=\"c2\" class=\"field\" placeholder=\"c2\"/></div><div class=\"row\" style=\"margin-top:8px\"><button id=\"solveSys\" class=\"btn\">Solve</button><div id=\"sout\" class=\"muted\" style=\"margin-left:12px\"></div></div>`
      algBody.querySelector('#solveSys').addEventListener('click', ()=>{
        const a1=parseFloat(algBody.querySelector('#a1').value), b1=parseFloat(algBody.querySelector('#b1').value), c1=parseFloat(algBody.querySelector('#c1').value)
        const a2=parseFloat(algBody.querySelector('#a2').value), b2=parseFloat(algBody.querySelector('#b2').value), c2=parseFloat(algBody.querySelector('#c2').value)
        const out = algBody.querySelector('#sout')
        if([a1,b1,c1,a2,b2,c2].some(x=>isNaN(x))){ out.textContent='Invalid'; return }
        const det = a1*b2 - a2*b1
        if(det===0){ out.textContent='No unique solution'; return }
        const x = (c1*b2 - c2*b1)/det
        const y = (a1*c2 - a2*c1)/det
        out.textContent = `x=${x}, y=${y}`
      })
    }
    else if(t==='systemN'){
      algBody.innerHTML = `<div class=\"row\"><textarea id=\"matA\" class=\"field\" placeholder=\"A matrix rows\n2 1\n1 3\" style=\"width:100%;height:80px\"></textarea></div><div class=\"row\" style=\"margin-top:6px\"><textarea id=\"vecB\" class=\"field\" placeholder=\"b vector\n5\n6\" style=\"width:100%;height:60px\"></textarea></div><div class=\"row\" style=\"margin-top:8px\"><button id=\"solveN\" class=\"btn\">Solve</button><div id=\"nout\" class=\"muted\" style=\"margin-left:12px\"></div></div>`
      algBody.querySelector('#solveN').addEventListener('click', ()=>{
        try{
          const A = parseMatrix(algBody.querySelector('#matA').value)
          const b = algBody.querySelector('#vecB').value.trim().split(/\n+/).map(r=>parseFloat(r))
          const n=A.length
          if(A[0].length!==n || b.length!==n){ algBody.querySelector('#nout').textContent='Dimension mismatch'; return }
          let x
          if(typeof math !== 'undefined' && math.lusolve){ x = math.lusolve(A, b) } else { x = math.multiply(math.inv(A), b) }
          // format x
          const flat = Array.isArray(x[0])? x.map(r=>r[0]) : x
          algBody.querySelector('#nout').textContent = flat.map((v,i)=>`x${i}=${Number(v).toFixed(6)}`).join(' ')
        }catch(e){ algBody.querySelector('#nout').textContent='Error' }
      })
    }
    else if(t==='nonlinear'){
      algBody.innerHTML = `<div class=\"row\"><input id=\"neq\" class=\"field\" placeholder=\"f(x)=0, e.g. x^3-2*x-5\"/></div><div class=\"row\" style=\"margin-top:6px\"><input id=\"guess\" class=\"field\" placeholder=\"initial guess\"/></div><div class=\"row\" style=\"margin-top:8px\"><button id=\"solveNon\" class=\"btn\">Solve (Newton)</button><div id=\"nout\" class=\"muted\" style=\"margin-left:12px\"></div></div>`
      algBody.querySelector('#solveNon').addEventListener('click', ()=>{
        const expr = algBody.querySelector('#neq').value
        const guess = parseFloat(algBody.querySelector('#guess').value) || 0
        const out = algBody.querySelector('#nout')
        try{
          if(typeof math === 'undefined') { out.textContent='math.js required'; return }
          const node = math.compile(expr)
          const dnode = math.derivative(expr, 'x')
          let x = guess
          let i=0
          while(i<60){
            const fx = node.evaluate({x})
            const dfx = dnode.evaluate({x})
            if(Math.abs(dfx) < 1e-12) break
            const nx = x - fx/dfx
            if(Math.abs(nx-x) < 1e-10){ x=nx; break }
            x=nx; i++
          }
          out.textContent = `x=${x}`
        }catch(e){ out.textContent='Error' }
      })
    }
  }
  algType.addEventListener('change', renderBody)
  renderBody()
}

// --- Matrix operations ---
function parseMatrix(text){
  const rows = text.trim().split(/\n+/).map(r=>r.trim()).filter(r=>r.length)
  return rows.map(r=>r.split(/[ ,]+/).map(v=>parseFloat(v)))
}

function renderMatrix(){
  panel.innerHTML = `
    <div class="card">
      <h3>🧪 Matrix Operations (table input)</h3>
      <p class="muted">Use the table controls to build matrices A and B. Supports up to 8x8.</p>
      <div class="row">
        <div style="flex:1">
          <label>A: rows <input id="aRows" type="number" min="1" max="8" value="2" style="width:60px"/> cols <input id="aCols" type="number" min="1" max="8" value="2" style="width:60px"/> <button id="buildA" class="btn">Build A</button></label>
          <div id="tableA" style="margin-top:8px"></div>
        </div>
        <div style="flex:1;margin-left:12px">
          <label>B: rows <input id="bRows" type="number" min="1" max="8" value="2" style="width:60px"/> cols <input id="bCols" type="number" min="1" max="8" value="2" style="width:60px"/> <button id="buildB" class="btn">Build B</button></label>
          <div id="tableB" style="margin-top:8px"></div>
        </div>
      </div>
      <div class="row" style="margin-top:8px"><button id="mTranspose" class="btn">Transpose A</button><button id="mDet" class="btn" style="margin-left:8px">Determinant A</button><button id="mInv" class="btn" style="margin-left:8px">Inverse A (2x2)</button><button id="mMul" class="btn" style="margin-left:8px">A × B</button><div id="mOut" class="muted" style="margin-left:12px"></div></div>
    </div>
  `
  const mOut = panel.querySelector('#mOut')
  function buildTable(containerId, rows, cols){
    const container = panel.querySelector(containerId)
    const table = document.createElement('table')
    table.style.borderCollapse='collapse'
    for(let i=0;i<rows;i++){
      const tr = document.createElement('tr')
      for(let j=0;j<cols;j++){
        const td = document.createElement('td')
        td.style.padding='4px'
        const inp = document.createElement('input')
        inp.type='number'; inp.value='0'; inp.style.width='80px'; inp.className='field'
        td.appendChild(inp); tr.appendChild(td)
      }
      table.appendChild(tr)
    }
    container.innerHTML=''; container.appendChild(table)
  }
  function readTable(containerId){
    const container = panel.querySelector(containerId)
    const table = container.querySelector('table')
    if(!table) return []
    return Array.from(table.rows).map(r=>Array.from(r.cells).map(c=>parseFloat(c.firstChild.value||0)))
  }
  // build initial
  panel.querySelector('#buildA').addEventListener('click', ()=>{ buildTable('#tableA', Number(panel.querySelector('#aRows').value), Number(panel.querySelector('#aCols').value)) })
  panel.querySelector('#buildB').addEventListener('click', ()=>{ buildTable('#tableB', Number(panel.querySelector('#bRows').value), Number(panel.querySelector('#bCols').value)) })
  // initial build
  panel.querySelector('#buildA').click(); panel.querySelector('#buildB').click()
  panel.querySelector('#mTranspose').addEventListener('click', ()=>{
    try{ const A = readTable('#tableA'); const T = A[0].map((_,i)=>A.map(r=>r[i])); mOut.textContent = T.map(r=>r.join(' ')).join(' | ')}catch(e){ mOut.textContent='Error' }
  })
  panel.querySelector('#mDet').addEventListener('click', ()=>{
    try{ const A = readTable('#tableA'); const n=A.length; if(n===0 || n!==A[0].length){ mOut.textContent='Not square'; return }
      let det
      if(n===2){ det = A[0][0]*A[1][1]-A[0][1]*A[1][0] }
      else if(n===3){ det = A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1]) - A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0]) + A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]) }
      else { mOut.textContent='Det only for 2x2 or 3x3'; return }
      mOut.textContent = String(det)
    }catch(e){ mOut.textContent='Error' }
  })
  panel.querySelector('#mInv').addEventListener('click', ()=>{
    try{ const A = readTable('#tableA'); if(A.length!==2 || A[0].length!==2){ mOut.textContent='Inverse only for 2x2'; return }
      const [[a,b],[c,d]] = A; const det = a*d - b*c; if(det===0){ mOut.textContent='Singular'; return }
      const inv = [[d/det, -b/det], [-c/det, a/det]]; mOut.textContent = inv.map(r=>r.join(' ')).join(' | ')
    }catch(e){ mOut.textContent='Error' }
  })
  panel.querySelector('#mMul').addEventListener('click', ()=>{
    try{ const A=readTable('#tableA'); const B=readTable('#tableB'); const r=A.length; const mid=A[0].length; const c=B[0].length; if(mid!==B.length){ mOut.textContent='Incompatible'; return }
      const R = Array.from({length:r}, ()=>Array.from({length:c}, ()=>0))
      for(let i=0;i<r;i++) for(let j=0;j<c;j++) for(let k=0;k<mid;k++) R[i][j]+=A[i][k]*B[k][j]
      mOut.textContent = R.map(r=>r.join(' ')).join(' | ')
    }catch(e){ mOut.textContent='Error' }
  })
}

// --- Statistics ---
function parseNums(text){ return text.split(/[,\s]+/).map(s=>parseFloat(s)).filter(x=>!isNaN(x)) }

function renderStats(){
  panel.innerHTML = `
    <div class="card">
      <h3>📈 Statistics</h3>
      <p class="muted">Enter numbers separated by spaces or commas.</p>
      <div class="row"><input id="nums" class="field" placeholder="e.g. 1 2 3 4 5" /></div>
      <div class="row" style="margin-top:8px"><button id="calcStats" class="btn">Compute</button><div id="statsOut" class="muted" style="margin-left:12px"></div></div>
    </div>
  `
  panel.querySelector('#calcStats').addEventListener('click', ()=>{
    const arr = parseNums(panel.querySelector('#nums').value)
    const out = panel.querySelector('#statsOut')
    if(arr.length===0){ out.textContent='No numbers'; return }
    const n = arr.length
    const mean = arr.reduce((a,b)=>a+b,0)/n
    const sorted = [...arr].sort((a,b)=>a-b)
    const median = (n%2===1)? sorted[(n-1)/2] : (sorted[n/2-1]+sorted[n/2])/2
    const variance = arr.reduce((s,x)=>s+(x-mean)**2,0)/n
    const std = Math.sqrt(variance)
    out.textContent = `n=${n} mean=${mean.toFixed(4)} median=${median} var=${variance.toFixed(4)} std=${std.toFixed(4)}`
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
  panel.querySelector('#btn-sin').addEventListener('click', ()=>{ sexpr.value += 'sin(' })
  panel.querySelector('#btn-cos').addEventListener('click', ()=>{ sexpr.value += 'cos(' })
  panel.querySelector('#btn-sqrt').addEventListener('click', ()=>{ sexpr.value += 'sqrt(' })
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
