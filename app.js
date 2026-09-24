const KEY='fw';
let S;
try { S=JSON.parse(localStorage.getItem(KEY)||'null'); } catch(e) { S=null; }
S = S && S.assets && S.work ? S : {version:5,assets:{tractor:[],equipment:[],land:[]},work:[]};
S.assets.tractor ||= []; S.assets.equipment ||= []; S.assets.land ||= []; S.work ||= [];
let V=new Date(); V.setDate(1);
const $=x=>document.querySelector(x);
const save=()=>{S.version=5;localStorage.setItem(KEY,JSON.stringify(S));render()};
const day=d=>{const x=new Date(d);return new Date(x.getFullYear(),x.getMonth(),x.getDate()).toISOString().slice(0,10)};
const fmt=x=>x?new Date(x+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Whenever';
const esc=x=>(x??'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function render(){ calendar(); sections(); history(); }
function calendar(){
  const y=V.getFullYear(), m=V.getMonth();
  const first=new Date(y,m,1), n=new Date(y,m+1,0).getDate();
  $('#title').textContent=V.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  let h='';
  for(let i=0;i<first.getDay();i++) h+='<div class="day empty"></div>';
  for(let d=1;d<=n;d++){
    const k=day(new Date(y,m,d));
    const ws=S.work.filter(w=>!w.done && !w.startWhenever && w.start && w.start<=k && (w.endWhenever || !w.end || w.end>=k));
    h+=`<div class="day ${k===day(new Date())?'today':''}"><span class="dayNum">${d}</span>${ws.map(w=>`<button class="ev" onclick="detail('${w.id}')">${esc(w.description)}</button>`).join('')}</div>`;
  }
  $('#cal').innerHTML=h;
}
function sections(){
  let out='';
  for(const t of ['tractor','equipment','land']){
    const title=t[0].toUpperCase()+t.slice(1), a=S.assets[t]||[];
    out+=`<section class="sec"><div class="sh row"><h2>${title}</h2><button class="sp" onclick="asset('${t}')">＋</button></div>`;
    if(!a.length) out+='<div class="emptyAsset">No '+title.toLowerCase()+'s added yet. Tap ＋ to add one.</div>';
    for(const x of a){
      const w=S.work.filter(z=>!z.done&&z.assetType===t&&z.assetId===x.id);
      out+=`<div class="asset"><div class="row"><b>${esc(x.name)}</b><span><button class="smallbtn" onclick="editAsset('${t}','${x.id}')">Edit</button><button class="smallbtn" onclick="deleteAsset('${t}','${x.id}')">Delete</button></span></div>`;
      out+=w.length?w.map(q=>`<div class="work"><button onclick="complete('${q.id}')">☐</button><span class="workText" onclick="detail('${q.id}')">${esc(q.description)} <small>(${q.startWhenever?'Whenever':fmt(q.start)}${q.endWhenever?' – Whenever':(!q.startWhenever&&q.end&&q.end!==q.start?' – '+fmt(q.end):'')})</small></span></div>`).join(''):'<div class="muted noWork">No outstanding work.</div>';
      out+='</div>';
    }
    out+='</section>';
  }
  $('#sections').innerHTML=out;
}
function history(){
  const a=S.work.filter(w=>w.done).sort((x,y)=>(y.completedDate||'').localeCompare(x.completedDate||''));
  $('#history').innerHTML=a.length?a.map(w=>`<div class="historyItem"><div class="row"><b>${esc(w.description)}</b><span class="badge">Done ${fmt(w.completedDate)}</span></div><div class="muted">Scheduled: ${w.startWhenever?'Whenever':fmt(w.start)}${w.endWhenever?' – Whenever':(!w.startWhenever&&w.end&&w.end!==w.start?' – '+fmt(w.end):'')}</div>${w.completedNotes?`<div class="notes">${esc(w.completedNotes)}</div>`:''}<div><button class="smallbtn" onclick="detail('${w.id}')">View</button><button class="smallbtn" onclick="undoComplete('${w.id}')">Undo completion</button></div></div>`).join(''):'<div class="muted">No completed work yet.</div>';
}
function showHistory(){ $('#homePage').classList.add('hidden'); $('#historyPage').classList.remove('hidden'); $('#subtitle').textContent='History'; history(); window.scrollTo(0,0); }
function showHome(){ $('#historyPage').classList.add('hidden'); $('#homePage').classList.remove('hidden'); $('#subtitle').textContent='Work'; window.scrollTo(0,0); }
$('#historyBtn').onclick=showHistory;
function modal(t,b){$('#mt').textContent=t;$('#mb').innerHTML=b;$('#modal').classList.remove('hidden')}
function closeM(){$('#modal').classList.add('hidden')}
$('#prev').onclick=()=>{V.setMonth(V.getMonth()-1);calendar()};
$('#next').onclick=()=>{V.setMonth(V.getMonth()+1);calendar()};
$('#add').onclick=()=>{modal('Add Work',`<label>Type</label><select id="type" onchange="fields()"><option value="calendar">Calendar</option><option value="tractor">Tractor</option><option value="equipment">Equipment</option><option value="land">Land</option></select><div id="fields"></div>`);fields()};
function dateControls(w=null){return `<div class="grid"><div><label>Beginning date</label><input id="start" type="date" value="${w?.start||day(new Date())}"><label class="whenever"><input id="startW" type="checkbox" onchange="toggleDate('start')" ${w?.startWhenever?'checked':''}> Whenever</label></div><div><label>End date</label><input id="end" type="date" value="${w?.end||day(new Date())}"><label class="whenever"><input id="endW" type="checkbox" onchange="toggleDate('end')" ${w?.endWhenever?'checked':''}> Whenever</label></div></div>`}
function toggleDate(n){const c=$('#'+n+'W');const el=$('#'+n);if(c&&el)el.disabled=c.checked}
function fields(editId=null){let t=$('#type').value,a=S.assets[t]||[],w=editId?S.work.find(x=>x.id===editId):null;let sel=t!=='calendar'?`<label>${t[0].toUpperCase()+t.slice(1)}</label><select id="asset">${a.map(x=>`<option value="${x.id}" ${w?.assetId===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select>${a.length?'':'<div class="muted">No '+t+'s yet. Save the work after adding one from the main page.</div>'}`:'';$('#fields').innerHTML=sel+`<label>Description</label><input id="desc" value="${esc(w?.description||'')}" placeholder="What needs to be done?">${dateControls(w)}<label>Time (optional)</label><input id="time" type="time" value="${w?.time||''}"><label>Additional notes (optional)</label><textarea id="notes">${esc(w?.notes||'')}</textarea><label>Photos ${w?.photos?.length?'(existing photos will remain)':''}</label><input id="pics" type="file" accept="image/*" multiple capture="environment"><div class="actions"><button class="secondary" onclick="closeM()">Cancel</button><button class="primary" onclick="${editId?`updateWork('${editId}')`:'addWork()'}">Save Work</button></div>`;toggleDate('start');toggleDate('end')}
async function imgs(fs){let a=[];for(const f of fs){a.push(await new Promise(r=>{const q=new FileReader();q.onload=()=>r({name:f.name,data:q.result});q.readAsDataURL(f)}))}return a}
function getDates(){return{s:$('#start').value,e:$('#end').value,sw:$('#startW').checked,ew:$('#endW').checked}}
async function addWork(){let d=$('#desc').value.trim(),x=getDates();if(!d)return alert('Description is required.');if(!x.sw&&!x.s)return alert('Choose a beginning date or Whenever.');if(!x.ew&&!x.e)return alert('Choose an end date or Whenever.');if(!x.sw&&!x.ew&&x.e<x.s)return alert('End date cannot be before beginning date.');let t=$('#type').value;S.work.push({id:crypto.randomUUID(),description:d,start:x.s,end:x.e,startWhenever:x.sw,endWhenever:x.ew,time:$('#time').value,notes:$('#notes').value,assetType:t==='calendar'?null:t,assetId:t==='calendar'?null:$('#asset')?.value,photos:await imgs($('#pics').files),done:false});save();closeM()}
async function updateWork(id){let w=S.work.find(x=>x.id===id),d=$('#desc').value.trim(),x=getDates();if(!d)return alert('Description is required.');if(!x.sw&&!x.ew&&x.e<x.s)return alert('End date cannot be before beginning date.');Object.assign(w,{description:d,start:x.s,end:x.e,startWhenever:x.sw,endWhenever:x.ew,time:$('#time').value,notes:$('#notes').value,assetType:$('#type').value==='calendar'?null:$('#type').value,assetId:$('#type').value==='calendar'?null:$('#asset')?.value});w.photos=[...(w.photos||[]),...(await imgs($('#pics').files))];save();closeM()}
function asset(t,id=null){const a=id?S.assets[t].find(x=>x.id===id):null;modal((id?'Edit ':'Add ')+t,`<label>Name / description</label><input id="an" value="${esc(a?.name||'')}" placeholder="${t==='tractor'?'4020':t==='equipment'?'Planter':'80 acres north field'}"><div class="actions"><button class="secondary" onclick="closeM()">Cancel</button><button class="primary" onclick="${id?`saveAsset('${t}','${id}')`:`addAsset('${t}')`}">Save</button></div>`)}
function addAsset(t){const n=$('#an').value.trim();if(!n)return;S.assets[t].push({id:crypto.randomUUID(),name:n});save();closeM()}
function saveAsset(t,id){const n=$('#an').value.trim();if(!n)return;S.assets[t].find(x=>x.id===id).name=n;save();closeM()}
function deleteAsset(t,id){if(!confirm('Delete this item? Its linked work records will also be deleted.'))return;S.assets[t]=S.assets[t].filter(x=>x.id!==id);S.work=S.work.filter(w=>!(w.assetType===t&&w.assetId===id));save()}
function detail(id){const w=S.work.find(x=>x.id===id);if(!w)return;modal(w.description,`<p><b>Dates:</b> ${w.startWhenever?'Whenever':fmt(w.start)}${w.endWhenever?' – Whenever':(!w.startWhenever&&w.end&&w.end!==w.start?' – '+fmt(w.end):'')}</p>${w.time?`<p><b>Time:</b> ${w.time}</p>`:''}${w.notes?`<p><b>Notes:</b> ${esc(w.notes)}</p>`:''}${w.done?`<p><b>Completed:</b> ${fmt(w.completedDate)}${w.completedNotes?' — '+esc(w.completedNotes):''}</p>`:''}${w.photos?.length?'<div class="photos">'+w.photos.map(p=>`<img src="${p.data}" alt="Work photo">`).join('')+'</div>':''}<div class="actions">${!w.done?`<button class="primary" onclick="complete('${id}')">✓ Mark Complete</button>`:`<button class="secondary" onclick="undoComplete('${id}')">Undo completion</button>`}<button class="secondary" onclick="editWork('${id}')">Edit</button><button class="danger" onclick="deleteWork('${id}')">Delete</button></div>`)}
function editWork(id){const w=S.work.find(x=>x.id===id);modal('Edit Work',`<label>Type</label><select id="type" onchange="fields('${id}')"><option value="calendar" ${!w.assetType?'selected':''}>Calendar</option><option value="tractor" ${w.assetType==='tractor'?'selected':''}>Tractor</option><option value="equipment" ${w.assetType==='equipment'?'selected':''}>Equipment</option><option value="land" ${w.assetType==='land'?'selected':''}>Land</option></select><div id="fields"></div>`);fields(id)}
function deleteWork(id){if(!confirm('Delete this work item? This cannot be undone.'))return;S.work=S.work.filter(w=>w.id!==id);save();closeM()}
function complete(id){const w=S.work.find(x=>x.id===id);modal('Complete Work',`<label>When was it done?</label><input id="cd" type="date" value="${day(new Date())}"><label>Completion notes (optional)</label><textarea id="cn">${esc(w.completedNotes||'')}</textarea><label>Add completion photos (optional)</label><input id="cp" type="file" accept="image/*" multiple capture="environment"><div class="actions"><button class="secondary" onclick="closeM()">Cancel</button><button class="primary" onclick="finish('${id}')">Save Completion</button></div>`)}
async function finish(id){const w=S.work.find(x=>x.id===id);w.done=true;w.completedDate=$('#cd').value;w.completedNotes=$('#cn').value;w.photos=[...(w.photos||[]),...(await imgs($('#cp').files))];save();closeM()}
function undoComplete(id){const w=S.work.find(x=>x.id===id);w.done=false;w.completedDate=null;w.completedNotes='';save();closeM()}
function editAsset(t,id){asset(t,id)}
function exportBackup(){const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='FarmWork-backup-'+day(new Date())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function restoreBackup(){ $('#restoreFile').click(); }
$('#restoreFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.assets||!x.work)throw 0;if(confirm('Restore this backup? It will replace the current FarmWork data.')){S=x;save();alert('FarmWork restored.')}}catch{alert('That file is not a valid FarmWork backup.')}};r.readAsText(f);e.target.value=''};
render();
if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js?v=5').catch(()=>{});
