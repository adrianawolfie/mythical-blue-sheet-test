
// Mythical Blue · SRD spell picker and card/list spellbook views.
(function () {
  const SCHOOL_ICONS = {
    Abjuration: 'abjuration', Conjuration: 'conjuration', Divination: 'divination',
    Enchantment: 'enchantment', Evocation: 'evocation', Illusion: 'illusion',
    Necromancy: 'necromancy', Transmutation: 'transmutation', Homebrew: 'homebrew'
  };
  let srdLibrary = [];
  let srdLoaded = false;
  const originalAddSR = window.addSR;
  const originalResetSpellRows = window.resetSpellRows;

  function esc(value='') { return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function text(value='') { return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function icon(school='Homebrew') { const key=SCHOOL_ICONS[school]||'homebrew'; return `assets/spell-icons/${key}.svg`; }
  function summary(details='') { const v=String(details).replace(/\s+/g,' ').trim(); return v.length>145 ? `${v.slice(0,142)}…` : v; }
  function rowMetadata(row) { return {
    sourceId: row.dataset.sourceId || '', source: row.dataset.source || '', school: row.dataset.school || 'Homebrew',
    duration: row.dataset.duration || '', componentsText: row.dataset.componentsText || '', classes: row.dataset.classes || ''
  }; }
  function findRow(index) { return document.querySelectorAll('#sbody .spell-main-row')[index]; }
  function getDetailsRow(row){ return row?.nextElementSibling?.classList.contains('spell-details-row') ? row.nextElementSibling : null; }

  function enhanceRow(row, data={}) {
    if (!row) return;
    const detailsRow=getDetailsRow(row); const panel=detailsRow?.querySelector('.spell-details-panel');
    const name=row.querySelector('.spell-name')?.value||data.name||'';
    const match=srdLibrary.find(s=>s.name.toLowerCase()===name.toLowerCase());
    const meta={ sourceId:data.sourceId||row.dataset.sourceId||match?.id||'', source:data.source||row.dataset.source||match?.source||'', school:data.school||row.dataset.school||match?.school||'Homebrew', duration:data.duration||row.dataset.duration||match?.duration||'', componentsText:data.componentsText||row.dataset.componentsText||match?.componentsText||'', classes:Array.isArray(data.classes)?data.classes.join(', '):(data.classes||row.dataset.classes||(match?.classes||[]).join(', ')) };
    Object.entries(meta).forEach(([k,v])=>{row.dataset[k]=v||'';});
    const nameCell=row.querySelector('.spell-name')?.closest('td');
    if(nameCell&&!nameCell.querySelector('.spell-list-school-icon')) nameCell.insertAdjacentHTML('afterbegin',`<img class="spell-list-school-icon" src="${icon(meta.school)}" alt="">`);
    else { const img=nameCell?.querySelector('.spell-list-school-icon'); if(img) img.src=icon(meta.school); }
    if(panel&&!panel.querySelector('.spell-structured-grid')){
      panel.insertAdjacentHTML('afterbegin',`<span class="spell-source-badge">${esc(meta.source||'Homebrew / Custom')}</span><div class="spell-structured-grid"><label><span>School</span><input class="spell-school" value="${esc(meta.school==='Homebrew'?'':meta.school)}" placeholder="Evocation, Abjuration…"></label><label><span>Duration</span><input class="spell-duration" value="${esc(meta.duration)}" placeholder="Instantaneous, 1 minute…"></label><label><span>Components</span><input class="spell-components-text" value="${esc(meta.componentsText)}" placeholder="V, S, M…"></label><label><span>Classes</span><input class="spell-classes" value="${esc(meta.classes)}" placeholder="Wizard, Cleric…"></label></div>`);
      panel.querySelectorAll('.spell-structured-grid input').forEach(inp=>inp.addEventListener('input',()=>{ row.dataset.school=panel.querySelector('.spell-school')?.value||'Homebrew'; row.dataset.duration=panel.querySelector('.spell-duration')?.value||''; row.dataset.componentsText=panel.querySelector('.spell-components-text')?.value||''; row.dataset.classes=panel.querySelector('.spell-classes')?.value||''; const img=nameCell?.querySelector('.spell-list-school-icon'); if(img)img.src=icon(row.dataset.school); refreshSpellCards(); }));
    }
  }
  function enhanceAll(){ document.querySelectorAll('#sbody .spell-main-row').forEach(row=>enhanceRow(row)); }

  window.addSR=function(data={}){ const enriched={...data,effect:data.effect||summary(data.details||'')}; originalAddSR(enriched); const rows=document.querySelectorAll('#sbody .spell-main-row'); enhanceRow(rows[rows.length-1],data); refreshSpellCards(); applySpellFilters(); };
  window.resetSpellRows=function(rows){ if(rows===undefined){ originalResetSpellRows(); enhanceAll(); refreshSpellCards(); return; } const tb=document.getElementById('sbody'); if(!tb)return; tb.innerHTML=''; (rows||[]).forEach(r=>window.addSR(r)); refreshSpellCards(); };
  window.collectSpellRows=function(){ return Array.from(document.querySelectorAll('#sbody .spell-main-row')).map(row=>{ const d=getDetailsRow(row); const meta=rowMetadata(row); return { level:row.querySelector('.spell-level')?.value||'', name:row.querySelector('.spell-name')?.value||'', castTime:row.querySelector('.spell-cast-time')?.value||'', range:row.querySelector('.spell-range')?.value||'', concentration:row.querySelector('.spell-concentration')?.checked||false, ritual:row.querySelector('.spell-ritual')?.checked||false, material:row.querySelector('.spell-material')?.checked||false, effect:row.querySelector('.spell-effect')?.value||'', details:d?.querySelector('.spell-details')?.value||'', open:d?.style.display!=='none', ...meta }; }); };

  async function loadLibrary(){ if(srdLoaded)return; try{ const r=await fetch('data/srd-spells.json',{cache:'no-store'}); const j=await r.json(); srdLibrary=j.spells||[]; srdLoaded=true; enhanceAll(); refreshSpellCards(); }catch(err){console.warn('SRD spell library unavailable',err);} }
  window.openSpellPicker=async function(){ await loadLibrary(); const m=document.getElementById('spellPickerModal'); if(!m)return; m.hidden=false; document.getElementById('spellPickerSearch')?.focus(); renderPicker(); };
  window.closeSpellPicker=function(){ const m=document.getElementById('spellPickerModal'); if(m)m.hidden=true; };
  window.addCustomSpell=function(){ window.addSR({source:'Homebrew / Custom',school:'Homebrew'}); setSpellView('list'); const rows=document.querySelectorAll('#sbody .spell-main-row'); rows[rows.length-1]?.querySelector('.spell-name')?.focus(); };
  window.addSpellFromLibrary=function(id){ const s=srdLibrary.find(x=>x.id===id); if(!s)return; window.addSR({sourceId:s.id,source:s.source,name:s.name,level:s.level,school:s.school,classes:s.classes,castTime:s.castTime,range:s.range,duration:s.duration,componentsText:s.componentsText,concentration:s.concentration,ritual:s.ritual,material:s.material,effect:summary(s.details),details:s.details}); closeSpellPicker(); };

  function renderPicker(){ const q=(document.getElementById('spellPickerSearch')?.value||'').toLowerCase(); const lvl=document.getElementById('spellPickerLevel')?.value||'all'; const school=document.getElementById('spellPickerSchool')?.value||'all'; const cls=document.getElementById('spellPickerClass')?.value||'all'; const results=srdLibrary.filter(s=>(!q||[s.name,s.school,(s.classes||[]).join(' ')].join(' ').toLowerCase().includes(q))&&(lvl==='all'||s.level===lvl)&&(school==='all'||s.school===school)&&(cls==='all'||(s.classes||[]).includes(cls))).slice(0,180); const box=document.getElementById('spellPickerResults'); if(box)box.innerHTML=results.map(s=>`<button type="button" class="spell-picker-result" onclick="addSpellFromLibrary('${esc(s.id)}')"><img src="${icon(s.school)}" alt=""><span><strong>${esc(s.name)}</strong><em>${s.level==='C'?'Cantrip':`Level ${esc(s.level)}`} · ${esc(s.school)} · ${esc((s.classes||[]).join(', '))}</em></span><span class="spell-picker-add">Add</span></button>`).join('')||'<p class="spell-picker-empty">No matching SRD spells found.</p>'; const c=document.getElementById('spellPickerCount'); if(c)c.textContent=`Showing ${results.length} of ${srdLibrary.length} SRD spells`; }

  function currentFilters(){ return { q:(document.getElementById('spellSearchInput')?.value||'').toLowerCase(), level:document.getElementById('spellLevelFilter')?.value||'all', school:document.getElementById('spellSchoolFilter')?.value||'all' }; }
  function matches(sp,f){ const school=sp.school||'Homebrew'; return (!f.q||[sp.name,sp.effect,sp.details,school].join(' ').toLowerCase().includes(f.q))&&(f.level==='all'||sp.level===f.level)&&(f.school==='all'||school===f.school); }
  window.applySpellFilters=function(){ const f=currentFilters(); const spells=window.collectSpellRows(); document.querySelectorAll('#sbody .spell-main-row').forEach((row,i)=>{ const show=matches(spells[i]||{},f); row.hidden=!show; const d=getDetailsRow(row); if(d)d.hidden=!show; }); refreshSpellCards(); };
  function props(sp){ return [['V',/\bV\b/.test(sp.componentsText||'')],['S',/\bS\b/.test(sp.componentsText||'')],['M',sp.material],['C',sp.concentration],['R',sp.ritual]].map(([x,a])=>`<span class="spell-property-chip ${a?'active':''}">${x}</span>`).join(''); }
  window.refreshSpellCards=function(){ const box=document.getElementById('spellCardView'); if(!box)return; const f=currentFilters(); const spells=window.collectSpellRows().map((s,i)=>({...s,index:i})).filter(s=>s.name&&matches(s,f)); box.innerHTML=spells.map(sp=>`<article class="spell-card"><div class="spell-card-top"><img class="spell-school-icon" src="${icon(sp.school||'Homebrew')}" alt=""><div class="spell-card-title-wrap"><div class="spell-card-title">${esc(sp.name)}</div><div class="spell-card-school">${esc(sp.school||'Homebrew')}</div></div><span class="spell-level-badge"><span>${esc(sp.level||'—')}</span></span></div><div class="spell-card-body"><div class="spell-card-meta"><span><strong>Cast</strong><br>${esc(sp.castTime||'—')}</span><span><strong>Range</strong><br>${esc(sp.range||'—')}</span><span><strong>Duration</strong><br>${esc(sp.duration||'—')}</span><span><strong>Source</strong><br>${esc(sp.source||'Custom')}</span></div><div class="spell-card-properties">${props(sp)}</div><div class="spell-card-effect">${text(sp.effect||summary(sp.details)||'No short effect entered yet.')}</div><div class="spell-card-actions"><button class="spell-card-btn" type="button" onclick="toggleSpellCardDetails(this)">Details ▾</button><button class="spell-card-btn" type="button" onclick="editSpellFromCard(${sp.index})">Edit</button></div><div class="spell-card-details" hidden>${text(sp.details||'No full description entered yet.')}</div></div></article>`).join('')||'<p class="spell-picker-empty">No spells match the current filters.</p>'; };
  window.toggleSpellCardDetails=function(btn){ const d=btn.closest('.spell-card')?.querySelector('.spell-card-details'); if(!d)return; d.hidden=!d.hidden; btn.textContent=d.hidden?'Details ▾':'Details ▴'; };
  window.editSpellFromCard=function(index){ setSpellView('list'); const row=findRow(index); row?.scrollIntoView({behavior:'smooth',block:'center'}); row?.querySelector('.spell-name')?.focus(); };
  window.setSpellView=function(view='cards'){ const cards=document.getElementById('spellCardView'); const list=document.getElementById('spellListView'); const v=view==='list'?'list':'cards'; if(cards)cards.hidden=v!=='cards'; if(list)list.hidden=v!=='list'; document.querySelectorAll('.spell-view-btn').forEach(b=>{ const a=b.dataset.spellView===v;b.classList.toggle('active',a);b.setAttribute('aria-selected',a?'true':'false'); }); document.querySelectorAll('.spell-list-only-action').forEach(b=>b.hidden=v!=='list'); localStorage.setItem('mythical-blue-spell-view',v); refreshSpellCards(); };

  function bind(){ document.querySelectorAll('.spell-view-btn').forEach(b=>b.addEventListener('click',()=>setSpellView(b.dataset.spellView))); ['spellLevelFilter','spellSchoolFilter','spellSearchInput'].forEach(id=>document.getElementById(id)?.addEventListener('input',applySpellFilters)); ['spellPickerSearch','spellPickerLevel','spellPickerSchool','spellPickerClass'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderPicker)); document.getElementById('spellPickerModal')?.addEventListener('click',e=>{if(e.target.id==='spellPickerModal')closeSpellPicker();}); document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSpellPicker();}); document.getElementById('sbody')?.addEventListener('input',()=>{refreshSpellCards();}); document.getElementById('sbody')?.addEventListener('change',()=>{refreshSpellCards();}); enhanceAll(); setSpellView(localStorage.getItem('mythical-blue-spell-view')||'cards'); loadLibrary(); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind); else bind();
})();
