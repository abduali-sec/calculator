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
  case 'geometry': renderGeometry(); break
  case 'todo': renderTodo(); break
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

// --- Geometry calculator ---
function renderGeometry(){
  panel.innerHTML = `
    <div class="card">
      <h3>📐 Geometry</h3>
      <p class="muted">Area and perimeter for common shapes.</p>
      <div class="row"><select id="shape" class="field"><option value="circle">Circle</option><option value="rect">Rectangle</option><option value="triangle">Triangle</option></select></div>
      <div id="shapeBody" style="margin-top:10px"></div>
    </div>
  `
  const shape = panel.querySelector('#shape')
  const body = panel.querySelector('#shapeBody')
  function renderShape(){
    const s = shape.value
    if(s==='circle'){
      body.innerHTML = `<div class=\"row\"><input id=\"r\" class=\"field\" placeholder=\"radius\"/></div><div class=\"row\" style=\"margin-top:8px\"><button id=\"calc\" class=\"btn\">Compute</button><div id=\"out\" class=\"muted\" style=\"margin-left:12px\"></div></div>`
      body.querySelector('#calc').addEventListener('click', ()=>{ const r = parseFloat(body.querySelector('#r').value); if(isNaN(r)){ body.querySelector('#out').textContent='Invalid' ; return } const area = Math.PI*r*r; const per = 2*Math.PI*r; body.querySelector('#out').textContent = `Area=${area.toFixed(4)} Perimeter=${per.toFixed(4)}` })
    }else if(s==='rect'){
      body.innerHTML = `<div class=\"row\"><input id=\"w\" class=\"field\" placeholder=\"width\"/><input id=\"h\" class=\"field\" placeholder=\"height\"/></div><div class=\"row\" style=\"margin-top:8px\"><button id=\"calc\" class=\"btn\">Compute</button><div id=\"out\" class=\"muted\" style=\"margin-left:12px\"></div></div>`
      body.querySelector('#calc').addEventListener('click', ()=>{ const w = parseFloat(body.querySelector('#w').value), h = parseFloat(body.querySelector('#h').value); if(isNaN(w)||isNaN(h)){ body.querySelector('#out').textContent='Invalid'; return } body.querySelector('#out').textContent = `Area=${(w*h).toFixed(4)} Perimeter=${(2*(w+h)).toFixed(4)}` })
    }else{
      body.innerHTML = `<div class=\"row\"><input id=\"a\" class=\"field\" placeholder=\"side a\"/><input id=\"b\" class=\"field\" placeholder=\"side b\"/><input id=\"c\" class=\"field\" placeholder=\"side c\"/></div><div class=\"row\" style=\"margin-top:8px\"><button id=\"calc\" class=\"btn\">Compute</button><div id=\"out\" class=\"muted\" style=\"margin-left:12px\"></div></div>`
      body.querySelector('#calc').addEventListener('click', ()=>{ const a=parseFloat(body.querySelector('#a').value), b=parseFloat(body.querySelector('#b').value), c=parseFloat(body.querySelector('#c').value); const out = body.querySelector('#out'); if([a,b,c].some(x=>isNaN(x))){ out.textContent='Invalid'; return } const s=(a+b+c)/2; const area=Math.sqrt(Math.max(0,s*(s-a)*(s-b)*(s-c))); out.textContent = `Area=${area.toFixed(4)} Perimeter=${(a+b+c).toFixed(4)}` })
    }
  }
  shape.addEventListener('change', renderShape)
  renderShape()
}

// --- To-Do module ---
function renderTodo(){
  panel.innerHTML = `
    <div class="card">
      <h3>📝 To-Do</h3>
      <div class="row" style="gap:8px">
        <input id="tTitle" class="field" placeholder="Title" />
        <select id="tType" class="field"><option value="simple">Simple</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="goal">Goal</option><option value="priority">Priority</option><option value="shopping">Shopping</option><option value="study">Study</option><option value="dev">Developer</option><option value="habit">Habit</option></select>
      </div>
      <div class="row" style="margin-top:8px"><input id="tNotes" class="field" placeholder="Notes / checklist (one per line for subtasks)"/></div>
      <div class="row" style="margin-top:8px">
        <select id="tPriority" class="field"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
        <input id="tDue" type="date" class="field" />
        <input id="tAssignee" class="field" placeholder="Assignee (team)" />
        <input id="tProject" class="field" placeholder="Project" />
      </div>
      <div class="row" style="margin-top:8px">
        <input id="tRecurrence" class="field" placeholder="Recurrence (RRULE), e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR" />
        <button id="recDaily" class="btn">Daily</button>
        <button id="recWeekly" class="btn">Weekly</button>
        <button id="recWeekdays" class="btn">Weekdays</button>
        <button id="openRrule" class="btn">Open RRULE Builder</button>
      </div>
      <div id="rruleBuilder" style="display:none;margin-top:8px" class="card small">
        <div class="row"><label>Шаблон:</label><select id="rbTemplate" class="field"><option value="">(нет)</option></select> <button id="rbSaveTemplate" class="btn">Сохранить как шаблон</button></div>
        <div class="row" style="margin-top:6px"><label>Частота:</label><select id="rbFreq" class="field"><option value="DAILY">Ежедневно</option><option value="WEEKLY">Еженедельно</option><option value="MONTHLY">Ежемесячно</option><option value="YEARLY">Ежегодно</option></select> <label>Интервал</label><input id="rbInterval" class="field" type="number" value="1" style="width:80px"/></div>
        <div class="row" style="margin-top:8px"><label>Weekdays:</label><div style="display:flex;gap:6px"><label><input type="checkbox" value="MO" class="rbDay"/>Mo</label><label><input type="checkbox" value="TU" class="rbDay"/>Tu</label><label><input type="checkbox" value="WE" class="rbDay"/>We</label><label><input type="checkbox" value="TH" class="rbDay"/>Th</label><label><input type="checkbox" value="FR" class="rbDay"/>Fr</label><label><input type="checkbox" value="SA" class="rbDay"/>Sa</label><label><input type="checkbox" value="SU" class="rbDay"/>Su</label></div></div>
        <div class="row" style="margin-top:8px"><label>Повторений (Count)</label><input id="rbCount" class="field" type="number" style="width:100px"/> <label>До (Until)</label><input id="rbUntil" type="date" class="field"/></div>
        <div class="row" style="margin-top:8px"><button id="rbApply" class="btn">Apply</button> <button id="rbPreview" class="btn">Preview Next</button> <div id="rbPreviewOut" class="muted" style="margin-left:8px"></div></div>
      </div>
      <div class="row" style="margin-top:8px">
        <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="optSound"/> Sound</label>
        <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="optNotify"/> Desktop Notify</label>
      </div>
      <div class="row" style="margin-top:8px">
        <button id="addTask" class="btn" title="Add task">Add Task</button>
        <button id="showKanban" class="btn" title="Open Kanban">Kanban</button>
        <button id="showEisen" class="btn" title="Eisenhower matrix">Eisenhower</button>
        <button id="showCal" class="btn" title="Group by due date">Calendar</button>
        <button id="exportJson" class="btn" title="Export tasks as JSON">Export JSON</button>
        <button id="exportCsv" class="btn" title="Export tasks as CSV">Export CSV</button>
        <button id="importBtn" class="btn" title="Import tasks from JSON/CSV">Import</button>
        <button id="fileImport" class="btn" title="Import from file">Import File</button>
        <button id="shareBtn" class="btn" title="Generate shareable URL">Share</button>
        <button id="pomHistory" class="btn" title="Pomodoro history">Pom History</button>
        <div id="todoMsg" class="muted" style="margin-left:12px"></div>
      </div>
      <input id="filePicker" type="file" accept="application/json,text/csv" style="display:none" />
      <div id="todoPanel" style="margin-top:12px"></div>
    </div>
  `
  // storage
  const KEY = 'todo_tasks_v1'
  function loadTasks(){ try{ return JSON.parse(localStorage.getItem(KEY) || '[]') }catch(e){ return [] } }
  function saveTasks(tasks){ localStorage.setItem(KEY, JSON.stringify(tasks)) }
  let tasks = loadTasks()
  // expand recurring tasks into occurrences for the upcoming window
  function expandRecurrences(){
    try{
      if(typeof RRule === 'undefined') return
      const now = new Date()
      const end = new Date(now.getTime() + 30*24*3600*1000) // next 30 days
      const parents = tasks.filter(t=>t.recurrence && !t.parentId)
      parents.forEach(p=>{
        try{
          const rule = RRule.fromString(p.recurrence)
          const occs = rule.between(now, end, true)
          occs.forEach(d=>{
            const iso = d.toISOString().slice(0,10)
            const exists = tasks.some(x=> x.parentId===p.id && x.occurrenceDate===iso)
            if(!exists){ const child = { id: p.id+'#'+iso, title: p.title+' (экземпляр)', notes: p.notes, type: p.type, priority: p.priority, due: iso, status:'todo', parentId: p.id, occurrenceDate: iso, created: new Date().toISOString(), generated:true, pomSessions:0 }; tasks.unshift(child) }
          })
        }catch(e){}
      })
      saveTasks(tasks)
    }catch(e){}
  }
  expandRecurrences()

  const tTitle = panel.querySelector('#tTitle'), tNotes = panel.querySelector('#tNotes'), tType = panel.querySelector('#tType'), tPriority = panel.querySelector('#tPriority'), tDue = panel.querySelector('#tDue'), tAssignee = panel.querySelector('#tAssignee'), tProject = panel.querySelector('#tProject'), tRecurrence = panel.querySelector('#tRecurrence'), recDaily = panel.querySelector('#recDaily'), recWeekly = panel.querySelector('#recWeekly'), recWeekdays = panel.querySelector('#recWeekdays'), optSound = panel.querySelector('#optSound'), optNotify = panel.querySelector('#optNotify'), filePicker = panel.querySelector('#filePicker'), fileImportBtn = panel.querySelector('#fileImport'), pomHistoryBtn = panel.querySelector('#pomHistory'), todoMsg = panel.querySelector('#todoMsg'), todoPanel = panel.querySelector('#todoPanel')

  // settings
  const SKEY = 'todo_settings_v1'
  function loadSettings(){ try{ return JSON.parse(localStorage.getItem(SKEY) || '{}') }catch(e){ return {} } }
  function saveSettings(s){ localStorage.setItem(SKEY, JSON.stringify(s)) }
  const settings = Object.assign({sound:true, notify:false}, loadSettings())
  optSound.checked = !!settings.sound
  optNotify.checked = !!settings.notify
  optSound.addEventListener('change', ()=>{ settings.sound = optSound.checked; saveSettings(settings) })
  optNotify.addEventListener('change', ()=>{ settings.notify = optNotify.checked; saveSettings(settings); if(settings.notify && Notification && Notification.permission!=='granted'){ Notification.requestPermission() } })

  // recurrence helper buttons
  recDaily.addEventListener('click', ()=>{ tRecurrence.value = 'FREQ=DAILY' })
  recWeekly.addEventListener('click', ()=>{ tRecurrence.value = 'FREQ=WEEKLY' })
  recWeekdays.addEventListener('click', ()=>{ tRecurrence.value = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' })
  // RRULE Builder toggle
  const openRrule = panel.querySelector('#openRrule')
  const rruleBuilder = panel.querySelector('#rruleBuilder')
  const rbFreq = panel.querySelector('#rbFreq')
  const rbInterval = panel.querySelector('#rbInterval')
  const rbDayChecks = Array.from(panel.querySelectorAll('.rbDay'))
  const rbCount = panel.querySelector('#rbCount')
  const rbUntil = panel.querySelector('#rbUntil')
  const rbApply = panel.querySelector('#rbApply')
  const rbPreview = panel.querySelector('#rbPreview')
  const rbPreviewOut = panel.querySelector('#rbPreviewOut')
  openRrule.addEventListener('click', ()=>{ rruleBuilder.style.display = rruleBuilder.style.display==='none' ? 'block' : 'none' })
  rbApply.addEventListener('click', ()=>{
    // build rrule string
    const opts = { freq: RRule[rbFreq.value], interval: parseInt(rbInterval.value)||1 }
    const byweekday = rbDayChecks.filter(c=>c.checked).map(c=>RRule[c.value])
    if(byweekday.length) opts.byweekday = byweekday
    if(rbCount.value) opts.count = parseInt(rbCount.value)
    if(rbUntil.value) opts.until = new Date(rbUntil.value)
    try{ const rule = new RRule(opts); tRecurrence.value = rule.toString(); rbPreviewOut.textContent = 'Applied'; }catch(e){ rbPreviewOut.textContent = 'Error' }
  })
  rbPreview.addEventListener('click', ()=>{
    try{ const txt = tRecurrence.value.trim(); if(!txt){ rbPreviewOut.textContent='No RRULE'; return }
      const rule = RRule.fromString(txt); const next = rule.all((date, i)=> i<5)
      rbPreviewOut.textContent = next.map(d=>d.toISOString().slice(0,16).replace('T',' ')).join(', ')
    }catch(e){ rbPreviewOut.textContent='Invalid' }
  })

  // RRULE templates store
  const TPL_KEY = 'rr_templates_v1'
  function loadTemplates(){ try{ return JSON.parse(localStorage.getItem(TPL_KEY)||'[]') }catch(e){ return [] } }
  function saveTemplates(t){ localStorage.setItem(TPL_KEY, JSON.stringify(t)) }
  function refreshTemplateList(){ const sel = panel.querySelector('#rbTemplate'); sel.innerHTML = '<option value="">(нет)</option>'; const tpls = loadTemplates(); tpls.forEach(tp=>{ const opt = document.createElement('option'); opt.value = tp.value; opt.textContent = tp.name; sel.appendChild(opt) }) }
  refreshTemplateList()
  panel.querySelector('#rbSaveTemplate').addEventListener('click', ()=>{
    const name = prompt('Название шаблона (на русском)')
    if(!name) return
    const val = tRecurrence.value || ''
    const tpls = loadTemplates(); tpls.unshift({name, value: val}); saveTemplates(tpls); refreshTemplateList(); todoMsg.textContent='Шаблон сохранён'
  })
  panel.querySelector('#rbTemplate').addEventListener('change', (e)=>{ const v = e.target.value; if(v) tRecurrence.value = v })

  // encrypted token storage using Web Crypto
  const TOKEN_KEY = 'gh_token_enc_v1'
  async function deriveKey(pass, salt){ const enc = new TextEncoder(); const keyMat = await crypto.subtle.importKey('raw', enc.encode(pass), {name:'PBKDF2'}, false, ['deriveKey']); return crypto.subtle.deriveKey({ name:'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, keyMat, { name:'AES-GCM', length: 256 }, false, ['encrypt','decrypt']) }
  async function saveTokenEncrypted(token){ const pass = prompt('Enter passphrase to encrypt token'); if(!pass) return; const salt = crypto.getRandomValues(new Uint8Array(16)); const key = await deriveKey(pass, salt); const iv = crypto.getRandomValues(new Uint8Array(12)); const enc = new TextEncoder(); const cipher = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(token)); const stored = { salt: Array.from(salt), iv: Array.from(iv), data: Array.from(new Uint8Array(cipher)) }; localStorage.setItem(TOKEN_KEY, JSON.stringify(stored)); todoMsg.textContent='Token saved (encrypted)'; }
  async function loadTokenDecrypted(){ try{ const raw = localStorage.getItem(TOKEN_KEY); if(!raw) return null; const obj = JSON.parse(raw); const pass = prompt('Enter passphrase to decrypt token'); if(!pass) return null; const salt = new Uint8Array(obj.salt); const iv = new Uint8Array(obj.iv); const key = await deriveKey(pass, salt); const dec = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, new Uint8Array(obj.data)); return new TextDecoder().decode(dec); }catch(e){ return null } }
  // button to save token
  const saveTokenBtn = document.createElement('button'); saveTokenBtn.className='btn'; saveTokenBtn.textContent='Save GH Token'; saveTokenBtn.style.marginLeft='8px'; panel.querySelector('#addTask').parentNode.appendChild(saveTokenBtn)
  saveTokenBtn.addEventListener('click', ()=>{ const token = prompt('Paste GitHub token (PAT)'); if(!token) return; saveTokenEncrypted(token) })

  // file import handler
  fileImportBtn.addEventListener('click', ()=> filePicker.click())
  filePicker.addEventListener('change', (ev)=>{
    const f = ev.target.files && ev.target.files[0]; if(!f) return
    const rdr = new FileReader(); rdr.onload = ()=>{ parseAndImport(String(rdr.result)) }; rdr.readAsText(f)
  })

  // small helper to parse/import content
  function parseAndImport(input){ if(!input) return; try{ if(input.includes('#share=')){ const frag = input.split('#share=')[1]; const json = atob(decodeURIComponent(frag)); const arr = JSON.parse(json); tasks = arr.concat(tasks); saveTasks(tasks); renderList(); todoMsg.textContent='Imported from share URL'; return } if(input.trim().startsWith('{') || input.trim().startsWith('[')){ const arr = JSON.parse(input); tasks = arr.concat(tasks); saveTasks(tasks); renderList(); todoMsg.textContent='Imported JSON'; return } const lines = input.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length); if(lines[0].includes(',')){ const cols = lines[0].split(',').map(c=>c.trim()); const out = []; for(let i=1;i<lines.length;i++){ const vals = lines[i].split(','); const obj = {}; for(let j=0;j<cols.length;j++) obj[cols[j]] = vals[j] ? vals[j].replace(/^"|"$/g,'') : ''; obj.id = obj.id || ('t'+Date.now()+i); out.push(obj) } tasks = out.concat(tasks); saveTasks(tasks); renderList(); todoMsg.textContent='Imported CSV'; return } }catch(e){ todoMsg.textContent='Import error' } }

  // Pomodoro history
  const POM_HIST = 'pom_history_v1'
  function loadPomHistory(){ try{ return JSON.parse(localStorage.getItem(POM_HIST) || '[]') }catch(e){ return [] } }
  function savePomHistory(h){ localStorage.setItem(POM_HIST, JSON.stringify(h)) }
  let pomHistory = loadPomHistory()

  function pushPomSession(taskId, seconds){ pomHistory.unshift({taskId, seconds, ts: Date.now()}); if(pomHistory.length>1000) pomHistory.pop(); savePomHistory(pomHistory) }

  pomHistoryBtn.addEventListener('click', ()=>{ renderPomHistory() })

  function renderPomHistory(){ todoPanel.innerHTML=''; const card = document.createElement('div'); card.className='card'; card.innerHTML = `<h4>Pomodoro History</h4><canvas id="pomCanvas" width="800" height="240" style="max-width:100%"></canvas>`; todoPanel.appendChild(card); const cvs = card.querySelector('#pomCanvas'); const ctx = cvs.getContext('2d'); // aggregate by day
    // build per-task per-day aggregation
    const daysSet = new Set()
    const tasksMap = {}
    tasks.forEach(t=> tasksMap[t.id]=t.title)
    pomHistory.forEach(s=>{ const d = new Date(s.ts).toISOString().slice(0,10); daysSet.add(d) })
    const days = Array.from(daysSet).sort()
    const taskIds = Array.from(new Set(pomHistory.map(s=>s.taskId)))
    const data = {} // data[taskId][day]=minutes
    taskIds.forEach(id=>{ data[id]={}; days.forEach(d=>data[id][d]=0) })
    pomHistory.forEach(s=>{ const d = new Date(s.ts).toISOString().slice(0,10); data[s.taskId][d] = (data[s.taskId][d]||0) + s.seconds/60 })
    if(days.length===0){ const msg = document.createElement('div'); msg.className='muted'; msg.textContent='No history'; card.appendChild(msg); return }
    // prepare datasets for Chart.js (stacked bars)
    const colors = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2']
    const datasets = taskIds.map((id,ti)=>({ label: tasksMap[id]||id, data: days.map(d=> Number((data[id][d]||0).toFixed(2))), backgroundColor: colors[ti%colors.length], stack: 'stack1' }))
    // create chart
    if(window._pomChart){ window._pomChart.destroy(); window._pomChart = null }
    const chart = new Chart(cvs, { type: 'bar', data: { labels: days, datasets }, options: { responsive:true, maintainAspectRatio:false, plugins: { legend:{ position:'bottom' }, tooltip:{ mode:'index', intersect:false }, zoom:{ zoom:{ wheel:{ enabled:true }, pinch:{ enabled:true }, mode:'x' }, pan:{ enabled:true, mode:'x' } } }, scales:{ x:{ stacked:true }, y:{ stacked:true, title:{ display:true, text:'Minutes' } } } })
    window._pomChart = chart
    // legend already handled by chart, add export buttons
    const btnRow = document.createElement('div'); btnRow.style.marginTop='8px';
    const expCsv = document.createElement('button'); expCsv.className='btn'; expCsv.textContent='Export CSV'; expCsv.addEventListener('click', ()=>{
      const cols = ['date'].concat(taskIds.map(id=>`task_${id}`))
      const rows = days.map(d=> [d].concat(taskIds.map(id=> (data[id][d]||0).toFixed(2) )) )
      const csv = [cols.join(',')].concat(rows.map(r=> r.join(','))).join('\n')
      const blob = new Blob([csv], {type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='pom_history.csv'; a.click(); URL.revokeObjectURL(url)
    })
    const expPng = document.createElement('button'); expPng.className='btn'; expPng.textContent='Export PNG'; expPng.style.marginLeft='8px'; expPng.addEventListener('click', ()=>{ const url = chart.toBase64Image(); const a=document.createElement('a'); a.href = url; a.download='pom_history.png'; a.click() })
    btnRow.appendChild(expCsv); btnRow.appendChild(expPng); card.appendChild(btnRow)
  }

  function renderList(){
    todoPanel.innerHTML = ''
    const list = document.createElement('div')
    list.style.display='flex'; list.style.flexDirection='column'; list.style.gap='8px'
    tasks.forEach(t=>{
      const el = document.createElement('div'); el.className='card'; el.style.padding='8px'; el.draggable=true
      // compute next occurrence if recurrence present
      let nextInfo = ''
      if(t.recurrence && typeof RRule !== 'undefined'){
        try{ const rule = RRule.fromString(t.recurrence); const next = rule.after(new Date(), true); if(next) nextInfo = ' Next: '+ next.toISOString().slice(0,16).replace('T',' ')}catch(e){ nextInfo = '' }
      }
      el.innerHTML = `<strong>${t.title}</strong> <span class=\"muted\">[${t.type}]</span><div style=\"margin-top:6px\">${t.notes? t.notes.replace(/\n/g,'<br/>') : ''}</div><div class=\"muted\" style=\"margin-top:6px\">Priority: ${t.priority} ${t.due? ' Due:'+t.due : ''} ${t.recurrence? ' Recurrence' : ''}${nextInfo} ${t.project? ' Project:'+t.project : ''} ${t.assignee? ' Assignee:'+t.assignee : ''}</div><div style=\"margin-top:6px\"><button class=\"btn\" data-id=\"${t.id}\" data-act=\"edit\">Edit</button> <button class=\"btn\" data-id=\"${t.id}\" data-act=\"del\">Delete</button> <button class=\"btn\" data-id=\"${t.id}\" data-act=\"pom\">Pomodoro</button></div>`
      // drag data
      el.addEventListener('dragstart', (ev)=>{ ev.dataTransfer.setData('text/plain', t.id) })
      list.appendChild(el)
    })
    todoPanel.appendChild(list)
    // actions
    todoPanel.querySelectorAll('button').forEach(b=>{ b.addEventListener('click', (ev)=>{
      const id = ev.target.dataset.id; const act = ev.target.dataset.act
      if(act==='del'){ tasks = tasks.filter(x=>x.id!==id); saveTasks(tasks); renderList(); todoMsg.textContent='Deleted' }
      if(act==='edit'){ const task = tasks.find(x=>x.id===id); if(task){ tTitle.value=task.title; tNotes.value=task.notes; tType.value=task.type; tPriority.value=task.priority; tDue.value=task.due||''; tAssignee.value=task.assignee||''; tProject.value=task.project||''; todoMsg.textContent='Loaded for edit'; tasks = tasks.filter(x=>x.id!==id); saveTasks(tasks); renderList() } }
      if(act==='pom'){ startPomodoro(id) }
    }) })
  }

  function addTask(){
    const title = tTitle.value.trim(); if(!title){ todoMsg.textContent='Title required'; return }
    const notes = tNotes.value.trim()
    const recurRaw = tRecurrence.value.trim()
    let recur = null
    if(recurRaw){ try{ if(typeof RRule !== 'undefined'){ const r = RRule.fromString(recurRaw); recur = r.toString() } else { recur = recurRaw } }catch(e){ todoMsg.textContent='Bad recurrence format'; return } }
    const obj = { id: 't'+Date.now(), title, notes, type: tType.value, priority: tPriority.value, due: tDue.value||null, assignee: tAssignee.value||null, project: tProject.value||null, recurrence: recur, status:'todo', created: new Date().toISOString(), pomSessions:0, pomTotalSeconds:0 }
    tasks.unshift(obj); saveTasks(tasks); expandRecurrences(); renderList(); todoMsg.textContent='Added'; tTitle.value=''; tNotes.value=''
  }
  panel.querySelector('#addTask').addEventListener('click', addTask)

  // Export/Import/Share buttons (added to UI if present)
  const exportJsonBtn = panel.querySelector('#exportJson')
  const exportCsvBtn = panel.querySelector('#exportCsv')
  const importBtn = panel.querySelector('#importBtn')
  const shareBtn = panel.querySelector('#shareBtn')
  if(exportJsonBtn){ exportJsonBtn.addEventListener('click', ()=>{
    const payload = JSON.stringify(tasks, null, 2)
    const blob = new Blob([payload], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='tasks.json'; a.click(); URL.revokeObjectURL(url); todoMsg.textContent='Exported JSON'
  }) }
  if(exportCsvBtn){ exportCsvBtn.addEventListener('click', ()=>{
    const cols = ['id','title','notes','type','priority','due','assignee','project','status','created','pomSessions','pomTotalSeconds','recurrence']
    const rows = tasks.map(t=> cols.map(c=>`"${String(t[c]||'').replace(/"/g,'""')}"`).join(','))
    const csv = cols.join(',')+'\n'+rows.join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='tasks.csv'; a.click(); URL.revokeObjectURL(url); todoMsg.textContent='Exported CSV'
  }) }
  if(importBtn){ importBtn.addEventListener('click', ()=>{
    const input = prompt('Paste JSON or CSV here (or a share URL)')
    if(!input) return
    try{
      if(input.includes('#share=')){
        const frag = input.split('#share=')[1]
        const json = atob(decodeURIComponent(frag))
        const arr = JSON.parse(json)
        tasks = arr.concat(tasks); saveTasks(tasks); expandRecurrences(); renderList(); todoMsg.textContent='Imported from share URL'; return
      }
      if(input.trim().startsWith('{') || input.trim().startsWith('[')){
        const arr = JSON.parse(input)
        tasks = arr.concat(tasks); saveTasks(tasks); expandRecurrences(); renderList(); todoMsg.textContent='Imported JSON'; return
      }
      const lines = input.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length)
      if(lines[0].includes(',')){
        const cols = lines[0].split(',').map(c=>c.trim())
        const out = []
        for(let i=1;i<lines.length;i++){
          const vals = lines[i].split(',')
          const obj = {}
          for(let j=0;j<cols.length;j++) obj[cols[j]] = vals[j] ? vals[j].replace(/^"|"$/g,'') : ''
          obj.id = obj.id || ('t'+Date.now()+i)
          out.push(obj)
        }
        tasks = out.concat(tasks); saveTasks(tasks); expandRecurrences(); renderList(); todoMsg.textContent='Imported CSV'; return
      }
    }catch(e){ todoMsg.textContent='Import error' }
  }) }
  if(shareBtn){ shareBtn.addEventListener('click', async ()=>{
    const json = JSON.stringify(tasks)
    // try load encrypted token
    let token = await loadTokenDecrypted().catch(()=>null)
    if(!token){ token = prompt('Enter GitHub token for Gist upload (leave empty to use share URL)') }
    if(token){
      fetch('https://api.github.com/gists', { method:'POST', headers: { Authorization: 'token '+token, 'Content-Type':'application/json' }, body: JSON.stringify({ public:false, files: { 'tasks.json': { content: json } }, description: 'Shared tasks' }) }).then(r=>r.json()).then(j=>{
        if(j && j.html_url){ navigator.clipboard.writeText(j.html_url); todoMsg.textContent='Gist created and URL copied' } else { todoMsg.textContent='Gist failed' }
      }).catch(e=>{ todoMsg.textContent='Gist error' })
    } else {
      const frag = encodeURIComponent(btoa(json))
      const url = location.href.split('#')[0] + '#share=' + frag
      navigator.clipboard.writeText(url).then(()=> todoMsg.textContent='Share URL copied to clipboard')
    }
  }) }

  // Kanban view
  panel.querySelector('#showKanban').addEventListener('click', ()=>{
    todoPanel.innerHTML=''
    const cols = ['todo','inprogress','done']
    const container = document.createElement('div'); container.style.display='flex'; container.style.gap='12px'
    cols.forEach(c=>{
      const col = document.createElement('div'); col.style.flex='1'; col.style.minHeight='200px'; col.style.border='1px dashed #ccc'; col.style.padding='8px'
      const hdr = document.createElement('div'); hdr.innerHTML = `<strong>${c.toUpperCase()}</strong>`; col.appendChild(hdr)
      const list = document.createElement('div'); list.dataset.col=c; list.style.minHeight='150px'
      list.addEventListener('dragover', ev=>{ ev.preventDefault() })
      list.addEventListener('drop', ev=>{ const id = ev.dataTransfer.getData('text/plain'); const task = tasks.find(x=>x.id===id); if(task){ task.status = list.dataset.col; saveTasks(tasks); renderTodo(); } })
      col.appendChild(list); container.appendChild(col)
    })
    todoPanel.appendChild(container)
    // populate
    tasks.forEach(t=>{
      const node = document.createElement('div'); node.className='card'; node.style.marginTop='6px'; node.textContent = t.title; node.draggable=true; node.addEventListener('dragstart', ev=>ev.dataTransfer.setData('text/plain', t.id))
      const col = todoPanel.querySelector(`[data-col="${t.status||'todo'}"]`)
      if(col) col.appendChild(node)
    })
  })

  // Eisenhower
  panel.querySelector('#showEisen').addEventListener('click', ()=>{
    todoPanel.innerHTML=''
    const wrap = document.createElement('div'); wrap.style.display='grid'; wrap.style.gridTemplateColumns='1fr 1fr'; wrap.style.gap='8px'
    const q = ['Urgent+Important','Not Urgent+Important','Urgent+Not Important','Not Urgent+Not Important']
    q.forEach((label,i)=>{ const box=document.createElement('div'); box.className='card'; box.innerHTML=`<strong>${label}</strong>`; box.style.minHeight='120px'; wrap.appendChild(box) })
    // distribute
    tasks.forEach(t=>{
      const dueSoon = t.due && (new Date(t.due) - Date.now()) < 48*3600*1000
      const important = t.priority==='high'
      const idx = important ? (dueSoon?0:1) : (dueSoon?2:3)
      const node = document.createElement('div'); node.textContent = t.title; wrap.children[idx].appendChild(node)
    })
    todoPanel.appendChild(wrap)
  })

  // Calendar (simple grouped by date)
  panel.querySelector('#showCal').addEventListener('click', ()=>{
    todoPanel.innerHTML=''
    const byDate = {}
    tasks.forEach(t=>{ const k = t.due||'No date'; (byDate[k]||(byDate[k]=[])).push(t) })
    Object.keys(byDate).sort().forEach(d=>{ const card=document.createElement('div'); card.className='card'; card.innerHTML=`<strong>${d}</strong><div>${byDate[d].map(x=>x.title).join('<br/>')}</div>`; todoPanel.appendChild(card) })
  })

  // Pomodoro
  let pomTimer = null, pomRemaining = 0, pomTaskId = null
  function formatTime(s){ const m = Math.floor(s/60); const sec = s%60; return `${m}:${sec.toString().padStart(2,'0')}` }

  // create visual timer area (insert before todoPanel)
  const timerArea = document.createElement('div'); timerArea.style.marginTop='12px'; timerArea.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><div id=\"pomDisplay\" class=\"muted\">Idle</div><div style=\"flex:1;background:#f0f0f0;height:12px;border-radius:6px;overflow:hidden\"><div id=\"pomBar\" style=\"height:100%;width:0%;background:#333\"></div></div><button id=\"pomStart\" class=\"btn\">Start</button><button id=\"pomPause\" class=\"btn\">Pause</button><button id=\"pomStop\" class=\"btn\">Stop</button></div>`
  todoPanel.parentNode.insertBefore(timerArea, todoPanel)
  const pomDisplay = timerArea.querySelector('#pomDisplay'), pomBar = timerArea.querySelector('#pomBar'), pomStartBtn = timerArea.querySelector('#pomStart'), pomPauseBtn = timerArea.querySelector('#pomPause'), pomStopBtn = timerArea.querySelector('#pomStop')

  function beep(){ try{ const ctx = new (window.AudioContext||window.webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.type='sine'; o.frequency.value = 880; g.gain.value=0.02; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>{ o.stop(); ctx.close() }, 300) }catch(e){} }

  function stopPomodoro(){ if(pomTimer){ clearInterval(pomTimer); pomTimer=null; pomTaskId=null; pomDisplay.textContent='Idle'; pomBar.style.width='0%' } }
  function startPomodoroFor(id, len=25*60){ stopPomodoro(); pomTaskId=id; pomRemaining=len; const start = Date.now(); pomDisplay.textContent = formatTime(pomRemaining); pomBar.style.width='0%'; pomTimer = setInterval(()=>{ pomRemaining--; const percent = ((len - pomRemaining)/len)*100; pomBar.style.width = percent+'%'; if(pomRemaining%60===0) pomDisplay.textContent = formatTime(pomRemaining); if(pomRemaining<=0){ stopPomodoro(); const t = tasks.find(x=>x.id===id); if(t){ t.pomSessions = (t.pomSessions||0)+1; t.pomTotalSeconds = (t.pomTotalSeconds||0)+len; saveTasks(tasks); renderList(); todoMsg.textContent='Pomodoro complete'; pushPomSession(id,len); if(settings.sound) beep(); if(settings.notify && window.Notification){ if(Notification.permission==='granted'){ try{ new Notification('Pomodoro complete', { body: t.title || 'Task done' }) }catch(e){} } else { Notification.requestPermission() } } } } }, 1000) }
  // start default: first task
  pomStartBtn.addEventListener('click', ()=>{ const defaultTask = tasks[0]; if(!defaultTask){ todoMsg.textContent='No task to start'; return } startPomodoroFor(defaultTask.id) })
  pomPauseBtn.addEventListener('click', ()=>{ if(pomTimer){ clearInterval(pomTimer); pomTimer=null; todoMsg.textContent='Paused' } else if(pomTaskId){ startPomodoroFor(pomTaskId, pomRemaining) } })
  pomStopBtn.addEventListener('click', ()=>{ stopPomodoro(); todoMsg.textContent='Stopped' })

  // initial render
  renderList()
}

// initial
applyTranslations()
renderCategory('simple')

// wire preview link
const openTodoLink = document.getElementById('openTodo')
if(openTodoLink){ openTodoLink.addEventListener('click', (e)=>{ e.preventDefault(); const li = document.querySelector('#catList li[data-cat="todo"]'); if(li) li.click() }) }
