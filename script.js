const i18n = {
  en: {
    title: 'Calculator', history: 'History', clear: 'C', back: 'Back', equals: '=', rad: 'RAD', deg: 'DEG', historyEmpty: 'No history',
    'btn.clear':'C','btn.back':'Back','btn.paren':'( )','btn.div':'÷','btn.mem_clear':'MC','btn.mem_recall':'MR','btn.mem_plus':'M+','btn.mul':'×',
    'btn.sub':'−','btn.add':'+','btn.pow':'^','btn.ans':'ANS','btn.equals':'=','btn.sqrt':'√','btn.pow2':'x²','btn.inv':'1/x','btn.percent':'%','btn.sin':'sin','btn.cos':'cos','btn.tan':'tan','btn.log':'log','btn.ln':'ln','btn.abs':'|x|','btn.history':'History','btn.clear_history':'Clear Hist','btn.rad':'RAD','credits':'Simple GUI calculator — English / Русский'
  },
  ru: {
    title: 'Калькулятор', history: 'История', clear: 'С', back: 'Назад', equals: '=', rad: 'РАД', deg: 'ГР', historyEmpty: 'История пуста',
    'btn.clear':'С','btn.back':'Назад','btn.paren':'( )','btn.div':'÷','btn.mem_clear':'МС','btn.mem_recall':'ВП','btn.mem_plus':'M+','btn.mul':'×',
    'btn.sub':'−','btn.add':'+','btn.pow':'^','btn.ans':'ANS','btn.equals':'=','btn.sqrt':'√','btn.pow2':'x²','btn.inv':'1/x','btn.percent':'%','btn.sin':'sin','btn.cos':'cos','btn.tan':'tan','btn.log':'log','btn.ln':'ln','btn.abs':'|x|','btn.history':'История','btn.clear_history':'Очистить','btn.rad':'РАД','credits':'Простой GUI калькулятор — English / Русский'
  }
}

const langSelect = document.getElementById('langSelect')
const titleEl = document.getElementById('title')
const historyTitle = document.getElementById('historyTitle')
const exprEl = document.getElementById('expr')
const resultEl = document.getElementById('result')
const keys = document.getElementById('keys')
const historyList = document.getElementById('historyList')
const degBtn = document.getElementById('degBtn')

let LANG = localStorage.getItem('calc_lang') || 'en'
let useDeg = false
let memory = parseFloat(localStorage.getItem('calc_mem')||'0')||0
let lastAns = 0
let history = JSON.parse(localStorage.getItem('calc_history')||'[]')

// read deg flag
useDeg = localStorage.getItem('calc_deg') === '1'

function applyTranslations(){
  // static text
  titleEl.textContent = i18n[LANG].title
  historyTitle.textContent = i18n[LANG].history
  document.getElementById('credits').textContent = i18n[LANG].credits || ''
  // buttons and labelled elements
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n')
    if(i18n[LANG][key]) el.textContent = i18n[LANG][key]
    // set aria-label if not present
    if(!el.getAttribute('aria-label')) el.setAttribute('aria-label', i18n[LANG][key] || '')
  })
  // deg button label
  degBtn.textContent = useDeg ? i18n[LANG].deg : i18n[LANG].rad
}

function setLang(l){LANG=l;localStorage.setItem('calc_lang',l);applyTranslations();renderHistory()}
langSelect.addEventListener('change',e=>setLang(e.target.value))
degBtn.addEventListener('click',()=>{useDeg=!useDeg;localStorage.setItem('calc_deg', useDeg ? '1' : '0');degBtn.textContent=useDeg?i18n[LANG].deg:i18n[LANG].rad})

function pushHistory(expr, out){history.unshift({expr,out,time:Date.now()});localStorage.setItem('calc_history',JSON.stringify(history));renderHistory()}
function renderHistory(){historyList.innerHTML='';if(history.length===0){const li=document.createElement('li');li.textContent=i18n[LANG].historyEmpty;historyList.appendChild(li);return}history.slice(0,200).forEach(h=>{const li=document.createElement('li');li.textContent=`${h.expr} = ${h.out}`;historyList.appendChild(li)})}

// accessibility: ensure buttons are focusable and have roles/aria
function enhanceAccessibility(){
  document.querySelectorAll('button').forEach(b=>{
    if(!b.hasAttribute('tabindex')) b.setAttribute('tabindex','0')
    if(!b.hasAttribute('role')) b.setAttribute('role','button')
    if(!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.textContent.trim())
  })
  // result live region
  resultEl.setAttribute('aria-live','polite')
  resultEl.setAttribute('role','status')
}

function showToast(text){
  const t = document.createElement('div'); t.className='toast'; t.textContent = text; document.body.appendChild(t);
  // force reflow
  void t.offsetWidth; t.classList.add('show');
  setTimeout(()=>{t.classList.remove('show'); setTimeout(()=>t.remove(),220)},1500)
}

// make history items clickable to recall expression
function renderHistory(){
  historyList.innerHTML=''
  if(history.length===0){const li=document.createElement('li');li.textContent=i18n[LANG].historyEmpty;historyList.appendChild(li);return}
  history.slice(0,200).forEach(h=>{
    const li=document.createElement('li'); li.textContent = `${h.expr} = ${h.out}`;
    li.tabIndex = 0
    li.dataset.expr = h.expr
    li.addEventListener('click', ()=>{ exprEl.value = h.expr; resultEl.textContent = h.out })
    li.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ exprEl.value = h.expr; resultEl.textContent = h.out } })
    historyList.appendChild(li)
  })
}

function safeEval(input){
  try{
    // Replace common symbols and functions -> JavaScript Math
    let s = input.replace(/×/g,'*').replace(/÷/g,'/').replace(/\^/g,'**')
    s = s.replace(/ANS/g, String(lastAns))
    // map functions
    const maps = {sqrt:'Math.sqrt',sin:'Math.sin',cos:'Math.cos',tan:'Math.tan',log:'Math.log10',ln:'Math.log',abs:'Math.abs'}
    Object.keys(maps).forEach(k=>{
      s = s.replace(new RegExp(k+'\\(','g'), maps[k]+'(')
    })
    // degrees support
    if(useDeg){s = s.replace(/Math\.sin\(/g,'(x=>Math.sin(x*Math.PI/180))(');
    s = s.replace(/Math\.cos\(/g,'(x=>Math.cos(x*Math.PI/180))(');
    s = s.replace(/Math\.tan\(/g,'(x=>Math.tan(x*Math.PI/180))(');
    }
    // security: allow only numbers, operators, Math, parentheses and letters used above
    if(!/^[0-9+\-*/%.()eEMathabsintrgcloANSPx,=>\s\*\*]+$/.test(s)){
      // fallthrough to safer parsing: reject
      throw new Error('Invalid characters')
    }
    // evaluate
    const fn = new Function('return ' + s)
    const v = fn()
    if(Number.isFinite(v)) return v
    throw new Error('NaN')
  }catch(e){throw e}
}

keys.addEventListener('click', (e)=>{
  const btn = e.target.closest('button')
  if(!btn) return
  const val = btn.dataset.value
  const action = btn.dataset.action
  if(val) {exprEl.value += val; return}
  if(action){
    switch(action){
      case 'clear': exprEl.value=''; resultEl.textContent='0'; break
      case 'back': exprEl.value = exprEl.value.slice(0,-1); break
      case 'paren': exprEl.value += '('; break
      case 'pow': exprEl.value += '^'; break
      case 'ans': exprEl.value += 'ANS'; break
      case 'mem-clear': memory=0; localStorage.setItem('calc_mem',memory); break
      case 'mem-recall': exprEl.value += String(memory); break
      case 'mem-plus': try{const r=safeEval(exprEl.value); memory = (memory||0)+Number(r); localStorage.setItem('calc_mem',memory);}catch(e){}; break
      case 'equals': try{const out = safeEval(exprEl.value); resultEl.textContent = out; lastAns = out; pushHistory(exprEl.value, out); }catch(e){resultEl.textContent='Error'}; break
      case 'history': renderHistory(); break
      case 'clear-history': history=[]; localStorage.setItem('calc_history',JSON.stringify(history)); renderHistory(); break
      case 'func': handleFunc(btn.dataset.fn); break
      default: break
    }
  }
})

function handleFunc(fn){try{
  let v = exprEl.value
  let res
  switch(fn){
    case 'sqrt': res = Math.sqrt(safeEval(v)); break
    case 'pow2': res = Math.pow(safeEval(v),2); break
    case 'inv': res = 1 / safeEval(v); break
    case 'percent': res = safeEval(v) / 100; break
    case 'sin': res = Math.sin(useDeg?safeEval(v)*Math.PI/180:safeEval(v)); break
    case 'cos': res = Math.cos(useDeg?safeEval(v)*Math.PI/180:safeEval(v)); break
    case 'tan': res = Math.tan(useDeg?safeEval(v)*Math.PI/180:safeEval(v)); break
    case 'log': res = Math.log10(safeEval(v)); break
    case 'ln': res = Math.log(safeEval(v)); break
    case 'abs': res = Math.abs(safeEval(v)); break
  }
  resultEl.textContent = res; lastAns = res; pushHistory(fn+'('+v+')',res)
}catch(e){resultEl.textContent='Error'}}

// init
// keyboard support: numbers, operators, Enter, Backspace, Escape
document.addEventListener('keydown', (e) => {
  const k = e.key
  if (/^[0-9]$/.test(k) || ['+','-','*','/','.','(',')','%'].includes(k)){
    exprEl.value += k
    e.preventDefault()
    return
  }
  if (k === '^') { exprEl.value += '^'; e.preventDefault(); return }
  if (k === 'Enter'){
    try{ const out = safeEval(exprEl.value); resultEl.textContent = out; lastAns = out; pushHistory(exprEl.value, out) }catch(err){ resultEl.textContent='Error' }
    e.preventDefault(); return
  }
  if (k === 'Backspace') { exprEl.value = exprEl.value.slice(0,-1); e.preventDefault(); return }
  if (k === 'Escape') { exprEl.value=''; resultEl.textContent='0'; e.preventDefault(); return }
})

// initialize language and translations
langSelect.value = LANG
applyTranslations()
enhanceAccessibility()
// copy result on click
resultEl.addEventListener('click', async ()=>{
  const text = String(resultEl.textContent||'')
  try{
    await navigator.clipboard.writeText(text)
    showToast(i18n[LANG].credits ? 'Copied' : 'Copied')
  }catch(e){
    showToast('Copy failed')
  }
})
renderHistory()
