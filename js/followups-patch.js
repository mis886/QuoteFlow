// ── QuoteFlow Follow-up Tracker Patch ──────────────────────────────────────
// Overrides the original loadFollowupsModule stub and removes duplicate nav item

window._fuAllItems = [];

// Remove any "Follow-up Tracker" nav items immediately and on any DOM change
(function removeDuplicateNav() {
  function clean() {
    document.querySelectorAll('.nav-item').forEach(function(el) {
      var label = el.querySelector('.nav-item-label');
      if (label && label.textContent.trim() === 'Follow-up Tracker') el.remove();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clean);
  } else {
    clean();
  }
  var obs = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeType === 1 && node.classList && node.classList.contains('nav-item')) {
          var label = node.querySelector('.nav-item-label');
          if (label && label.textContent.trim() === 'Follow-up Tracker') node.remove();
        }
      });
    });
  });
  document.addEventListener('DOMContentLoaded', function() {
    clean(); // run again after DOM ready
    var sidebar = document.getElementById('main-sidebar');
    if (sidebar) obs.observe(sidebar, { childList: true, subtree: true });
  });
})();

// Override loadFollowupsModule with full implementation
async function loadFollowupsModule() {
  ['overdue','today','week','upcoming','done'].forEach(function(col) {
    var el = document.getElementById('fu-col-' + col);
    if (el) el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray400);font-size:12px;">Loading...</div>';
  });
  try {
    var results = await Promise.all([
      _sb.from('followups').select('*, leads(company_name, contact_name, stage)').order('created_at', { ascending: false }),
      _sb.from('samples').select('*').not('status', 'eq', 'returned'),
      _sb.from('quotes').select('*').in('status', ['Sent','Negotiating','Quoted','Draft']),
    ]);
    var fuRes = results[0], sampRes = results[1], qRes = results[2];
    var todayStr = new Date().toISOString().split('T')[0];
    var allItems = [];

    if (fuRes.data) fuRes.data.forEach(function(r) {
      var lead = r.leads || {};
      var nextDate = r.next_followup_date || null;
      allItems.push({ id:'FU-'+r.followup_id, source:'pipeline', sourceBadge:'Pipeline', sourceColor:'var(--purple)',
        company: lead.company_name || r.company_name || 'Unknown Lead',
        contact: lead.contact_name || '', stage: lead.stage || '', type: r.type || 'call',
        notes: r.notes || '', dueDate: nextDate || r.created_at.split('T')[0] || todayStr,
        outcome: r.outcome || null, done: !!(r.outcome && r.outcome !== 'neutral' && !nextDate),
        rawId: r.followup_id });
    });

    if (sampRes.data) sampRes.data.forEach(function(r) {
      var cust = DB.customers.find(function(c){return c.id===r.customer_id;});
      var dueDate = r.followup_due || (r.sent_date ? (function(){ var d=new Date(r.sent_date); d.setDate(d.getDate()+7); return d.toISOString().split('T')[0]; })() : todayStr);
      allItems.push({ id:'SAMP-'+r.sample_id, source:'samples', sourceBadge:'Sample', sourceColor:'var(--amber)',
        company: (cust && cust.company) || r.customer_id || 'Unknown',
        contact:'', stage:'sampling', type:'call',
        notes: r.notes || ('Sample: ' + (r.product_name || r.product_code || '')),
        dueDate: dueDate, outcome: r.outcome || null,
        done: !!(r.outcome && r.outcome !== 'pending'), rawId: r.sample_id });
    });

    if (qRes.data) qRes.data.forEach(function(r) {
      if (r.status === 'Won' || r.status === 'Lost') return;
      allItems.push({ id:'QUO-'+r.quote_id, source:'quotes', sourceBadge:'Quote', sourceColor:'var(--blue)',
        company: r.customer_name || 'Unknown', contact:'', stage: r.status || 'Quoted', type:'email',
        notes: 'Quote ' + r.quote_id + ' · ₹' + (parseFloat(r.grand_total)/100000).toFixed(2) + 'L',
        dueDate: r.valid_until || todayStr, outcome: null, done: false, rawId: r.quote_id });
    });

    window._fuAllItems = allItems;
    renderFollowupsKanban();
    if (typeof showToast === 'function') showToast('Follow-ups loaded — ' + allItems.length + ' items', 'success');
  } catch(err) {
    console.error('loadFollowupsModule:', err);
    if (typeof showToast === 'function') showToast('Could not load follow-ups: ' + err.message, 'error');
  }
}

function renderFollowupsKanban() {
  var sourceFilter = (document.getElementById('fu-source-filter') || {}).value || 'all';
  var typeFilter   = (document.getElementById('fu-type-filter')   || {}).value || 'all';
  var today = new Date(); today.setHours(0,0,0,0);
  var items = (window._fuAllItems || []).filter(function(item) {
    if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
    if (typeFilter   !== 'all' && item.type   !== typeFilter)   return false;
    return true;
  });
  var buckets = { overdue:[], today:[], week:[], upcoming:[], done:[] };
  items.forEach(function(item) {
    if (item.done) { buckets.done.push(item); return; }
    var due = new Date(item.dueDate); due.setHours(0,0,0,0);
    var diff = Math.round((due - today) / 86400000);
    if (diff < 0) buckets.overdue.push(item);
    else if (diff === 0) buckets.today.push(item);
    else if (diff <= 6) buckets.week.push(item);
    else buckets.upcoming.push(item);
  });
  function setEl(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  setEl('fu-stat-overdue', buckets.overdue.length);
  setEl('fu-stat-today',   buckets.today.length);
  setEl('fu-stat-week',    buckets.week.length);
  setEl('fu-stat-done',    buckets.done.filter(function(i){ var d=new Date(i.dueDate); return Math.round((today-d)/86400000)<=7; }).length);
  setEl('fu-badge-overdue',  buckets.overdue.length);
  setEl('fu-badge-today',    buckets.today.length);
  setEl('fu-badge-week',     buckets.week.length);
  setEl('fu-badge-upcoming', buckets.upcoming.length);
  setEl('fu-badge-done',     buckets.done.length);
  var ICONS = { call:'📞', email:'📧', whatsapp:'💬', meeting:'🤝', note:'📝' };
  function card(item, col) {
    var isOv = col==='overdue';
    var init = item.company.slice(0,2).toUpperCase();
    var due = new Date(item.dueDate); due.setHours(0,0,0,0);
    var diff = Math.round((due - today) / 86400000);
    var dueLabel = isOv ? '<span style="color:var(--red);font-weight:600;">'+Math.abs(diff)+'d overdue</span>'
      : diff===0 ? '<span style="color:var(--amber);font-weight:600;">Due today</span>'
      : '<span style="color:var(--gray500);">Due '+item.dueDate+'</span>';
    var safe = item.company.replace(/'/g,"\\'");
    return '<div style="background:'+(isOv?'rgba(220,38,38,.04)':'#fff')+';border:1px solid '+(isOv?'rgba(220,38,38,.2)':'var(--gray100)')+';border-radius:10px;padding:12px;margin-bottom:8px;">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
      +'<div style="width:28px;height:28px;border-radius:50%;background:'+item.sourceColor+';color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">'+init+'</div>'
      +'<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;color:var(--gray800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+item.company+'</div>'
      +(item.contact?'<div style="font-size:11px;color:var(--gray500);">'+item.contact+'</div>':'')+'</div></div>'
      +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">'
      +'<span style="font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;background:'+item.sourceColor+';color:#fff;">'+item.sourceBadge+'</span>'
      +'<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:var(--gray100);color:var(--gray600);">'+(ICONS[item.type]||'')+' '+item.type+'</span>'
      +(item.stage?'<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:var(--gray100);color:var(--gray600);">'+item.stage+'</span>':'')+'</div>'
      +(item.notes?'<div style="font-size:12px;color:var(--gray500);margin-bottom:8px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">'+item.notes+'</div>':'')
      +'<div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid var(--gray100);">'
      +dueLabel+'<button class="btn btn-sm btn-primary" style="font-size:11px;padding:3px 8px;" onclick="openFuAddModal(\''+item.source+'\',\''+item.rawId+'\',\''+safe+'\')">Log →</button>'
      +'</div></div>';
  }
  function doneCard(item) {
    var oc = item.outcome==='positive'?'var(--teal)':item.outcome==='negative'?'var(--red)':'var(--gray400)';
    return '<div style="background:#fff;border:1px solid var(--gray100);border-radius:10px;padding:10px;margin-bottom:8px;opacity:.75;">'
      +'<div style="display:flex;align-items:center;gap:6px;">'
      +'<div style="width:22px;height:22px;border-radius:50%;background:'+item.sourceColor+';color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;">'+item.company.slice(0,2).toUpperCase()+'</div>'
      +'<span style="font-size:12px;font-weight:600;color:var(--gray700);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+item.company+'</span>'
      +'<span style="font-size:11px;color:'+oc+';font-weight:600;">'+(item.outcome||'done')+'</span></div></div>';
  }
  var empty = '<div style="text-align:center;padding:24px 10px;color:var(--gray300);font-size:12px;">None here</div>';
  [
    {col:'overdue', items:buckets.overdue, fn:card},
    {col:'today',   items:buckets.today,   fn:card},
    {col:'week',    items:buckets.week,    fn:card},
    {col:'upcoming',items:buckets.upcoming,fn:card},
    {col:'done',    items:buckets.done,    fn:doneCard},
  ].forEach(function(c) {
    var el = document.getElementById('fu-col-'+c.col);
    if (!el) return;
    el.innerHTML = c.items.length === 0 ? empty : c.items.map(function(i){ return c.fn(i, c.col); }).join('');
  });
}

function openFuAddModal(sourceType, rawId, company) {
  var notesEl = document.getElementById('fu-modal-notes');
  var outcomeEl = document.getElementById('fu-modal-outcome');
  var typeEl = document.getElementById('fu-modal-type');
  var dateEl = document.getElementById('fu-modal-next-date');
  if (notesEl) notesEl.value = '';
  if (outcomeEl) outcomeEl.value = 'positive';
  if (typeEl) typeEl.value = 'call';
  var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  if (dateEl) dateEl.value = tomorrow.toISOString().split('T')[0];
  var titleEl = document.getElementById('fu-modal-title');
  var ctxEl   = document.getElementById('fu-modal-context');
  var stEl    = document.getElementById('fu-modal-source-type');
  if (sourceType && rawId) {
    if (titleEl) titleEl.textContent = 'Log Follow-up — ' + (company||'');
    if (ctxEl) ctxEl.innerHTML = '<strong>' + (company||'') + '</strong> &middot; <span style="color:var(--gray500);">' + sourceType + '</span>';
    if (stEl) stEl.value = sourceType;
    fuModalSourceChanged(rawId);
  } else {
    if (titleEl) titleEl.textContent = 'Log Follow-up';
    if (ctxEl) ctxEl.textContent = 'Select a source below.';
    if (stEl) stEl.value = '';
    fuModalSourceChanged();
  }
  if (typeof openModal === 'function') openModal('fu-add-modal');
}

function fuModalSourceChanged(preselectedId) {
  var sourceType = (document.getElementById('fu-modal-source-type')||{}).value;
  var refSel = document.getElementById('fu-modal-ref-id');
  var refLabel = document.getElementById('fu-modal-ref-label');
  if (!refSel) return;
  var options = '<option value="">— Select —</option>';
  if (sourceType === 'pipeline') {
    if (refLabel) refLabel.textContent = 'Lead / Inquiry';
    (DB.inquiries||[]).filter(function(i){return i.source!=='sample';}).forEach(function(l) {
      options += '<option value="'+l.id+'"'+(preselectedId&&String(l.id)===String(preselectedId)?' selected':'')+'>'+( l.company||l.id)+'</option>';
    });
  } else if (sourceType === 'sample') {
    if (refLabel) refLabel.textContent = 'Sample';
    (DB.samples||[]).forEach(function(s) {
      options += '<option value="'+s.id+'"'+(preselectedId&&String(s.id)===String(preselectedId)?' selected':'')+'>'+s.customer+' — '+s.product+'</option>';
    });
  } else if (sourceType === 'quote') {
    if (refLabel) refLabel.textContent = 'Quote';
    (DB.quotes||[]).filter(function(q){return q.status!=='Won'&&q.status!=='Lost';}).forEach(function(q) {
      options += '<option value="'+q.id+'"'+(preselectedId&&String(q.id)===String(preselectedId)?' selected':'')+'>'+q.id+' — '+q.customer+'</option>';
    });
  } else {
    options = '<option value="">— Select source first —</option>';
  }
  refSel.innerHTML = options;
}

async function saveFuFollowup() {
  var sourceType = (document.getElementById('fu-modal-source-type')||{}).value;
  var refId      = (document.getElementById('fu-modal-ref-id')||{}).value;
  var type       = (document.getElementById('fu-modal-type')||{}).value;
  var nextDate   = (document.getElementById('fu-modal-next-date')||{}).value;
  var notes      = ((document.getElementById('fu-modal-notes')||{}).value||'').trim();
  var outcome    = (document.getElementById('fu-modal-outcome')||{}).value;
  if (!sourceType || !refId) { showToast('Please select a source and item','error'); return; }
  if (!notes) { showToast('Notes are required','error'); return; }
  try {
    if (sourceType === 'pipeline') {
      var row = { lead_id:refId, type:type, notes:notes, outcome:outcome, next_followup_date:nextDate||null };
      var r1 = await _sb.from('followups').insert(row);
      if (r1.error) throw r1.error;
    } else if (sourceType === 'sample') {
      var upd = { followup_due:nextDate||null, notes:notes };
      if (outcome!=='neutral') upd.outcome = outcome==='positive'?'approved':outcome==='negative'?'rejected':'pending';
      var r2 = await _sb.from('samples').update(upd).eq('sample_id',refId);
      if (r2.error) throw r2.error;
    } else if (sourceType === 'quote') {
      var upd2 = {};
      if (nextDate) upd2.valid_until = nextDate;
      if (notes) upd2.notes = notes;
      if (outcome==='positive') upd2.status='Negotiating';
      if (outcome==='negative') upd2.status='Lost';
      if (Object.keys(upd2).length) { var r3 = await _sb.from('quotes').update(upd2).eq('quote_id',refId); if(r3.error) throw r3.error; }
    }
    showToast('Follow-up saved ✓','success');
    if (typeof closeModal === 'function') closeModal('fu-add-modal');
    await loadFollowupsModule();
  } catch(err) { showToast('Save failed: '+err.message,'error'); }
}

// ═══════════════════════════════════════════════════════════════════════════
// INQUIRY MODULE FIXES
// ═══════════════════════════════════════════════════════════════════════════

// Override renderInquiries with fixed filter logic + Edit button on each card
function renderInquiries(filter) {
  const list = document.getElementById('inquiry-list');
  if (!list) return;

  const setCount = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  // FIXED filter logic: Email→Gmail, Call/WhatsApp→Manual, Indiamart→Indiamart
  setCount('inq-count-all',       DB.inquiries.length);
  setCount('inq-count-gmail',     DB.inquiries.filter(i => i.captured_from === 'email'     || i.source === 'gmail').length);
  setCount('inq-count-indiamart', DB.inquiries.filter(i => i.captured_from === 'indiamart' || i.source === 'indiamart').length);
  setCount('inq-count-manual',    DB.inquiries.filter(i => ['call','whatsapp'].includes(i.captured_from) || i.source === 'manual').length);

  const filtered = filter === 'all' ? DB.inquiries : DB.inquiries.filter(i => {
    const cf = i.captured_from || i.source || '';
    if (filter === 'gmail')     return cf === 'email'     || cf === 'gmail';
    if (filter === 'indiamart') return cf === 'indiamart';
    if (filter === 'manual')    return cf === 'call' || cf === 'whatsapp' || cf === 'manual';
    return false;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg></div><div class="empty-title">No inquiries</div><div class="empty-desc">Add inquiries manually or sync from IndiaMART.</div></div>';
    return;
  }

  const palette = ['#7C3AED','#1A6FDB','#D97706','#0F8A6F','#D85A30'];
  const capturedLabel = {email:'Email',call:'Call',whatsapp:'WhatsApp',indiamart:'Indiamart',gmail:'Gmail',manual:'Manual'};

  list.innerHTML = filtered.map((inq, idx) => {
    const company  = inq.company || '—';
    const color    = palette[idx % palette.length];
    const srcKey   = inq.captured_from || inq.source || 'manual';
    const srcLabel = capturedLabel[srcKey] || srcKey;
    const srcPillClass = srcKey==='indiamart' ? 'source-indiamart' : (srcKey==='gmail'||srcKey==='email') ? 'source-gmail' : 'source-manual';
    const isNew    = !inq.customer_id;
    const custBadge = isNew
      ? '<span class="badge badge-gray" style="font-size:10px;">New Customer</span>'
      : '<span class="badge badge-teal" style="font-size:10px;">Existing</span>';
    const estVal = inq.estimated_value ? '<span style="font-size:12px;font-weight:600;color:var(--gray700);">₹'+( parseFloat(inq.estimated_value)/100000).toFixed(2)+'L</span>' : '';
    const isConverted = inq.status === 'converted';
    const ts = inq.enquiry_datetime ? '<span style="font-size:11px;color:var(--gray400);margin-left:6px;">'+new Date(inq.enquiry_datetime).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+'</span>' : '';

    return `
    <div class="inquiry-card${inq.unread?' unread':''}" style="${isConverted?'opacity:.7;':''}">
      <div class="inq-avatar" style="background:${color};">${company.slice(0,2).toUpperCase()}</div>
      <div class="inq-content">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="inq-name">${company}</span>
          ${custBadge}
          ${inq.unread ? '<span class="badge badge-blue" style="font-size:10px;padding:1px 6px;">New</span>' : ''}
          <span class="source-pill ${srcPillClass}" style="margin-left:auto;">${srcLabel}</span>
          ${ts}
        </div>
        <div class="inq-subject">${inq.product_interest || inq.subject || '—'}</div>
        <div style="font-size:12px;color:var(--gray500);margin-top:2px;">${inq.contact?'👤 '+inq.contact:''}${inq.phone?' &nbsp; 📞 '+inq.phone:''}${inq.email?' &nbsp; ✉ '+inq.email:''}</div>
        <div class="inq-meta" style="margin-top:8px;">
          ${inq.product_interest ? '<span class="tag">'+inq.product_interest+'</span>' : ''}
          ${inq.quantity ? '<span class="tag">'+inq.quantity+'</span>' : ''}
          ${estVal}
          <span class="inq-time">${inq.date || ''}</span>
          <span class="badge ${isConverted?'badge-teal':inq.status==='open'?'badge-blue':'badge-gray'}" style="font-size:10px;">${isConverted?'Converted':inq.status||'open'}</span>
          <div style="display:flex;gap:6px;margin-left:auto;">
            <button class="btn btn-secondary btn-sm" style="font-size:12px;" onclick="event.stopPropagation();editInquiry('${inq.id}')">✏️ Edit</button>
            <button class="btn btn-primary btn-sm" style="font-size:12px;" onclick="event.stopPropagation();openInquiryQuote('${inq.id}')">Create Quote →</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// Edit Inquiry — pre-fill modal and open
window._editingInquiryId = null;
function editInquiry(inqId) {
  const inq = DB.inquiries.find(i => String(i.id) === String(inqId));
  if(!inq) return;

  // Reset then populate form fields
  const fields = {
    'inq-company':       inq.company || '',
    'inq-contact':       inq.contact || '',
    'inq-email':         inq.email || '',
    'inq-phone':         inq.phone || '',
    'inq-quantity':      inq.quantity || '',
    'inq-notes':         inq.notes || '',
    'inq-captured-from': inq.captured_from || inq.source || '',
    'inq-est-value':     inq.estimated_value || '',
  };
  Object.entries(fields).forEach(([id,val]) => {
    const el = document.getElementById(id); if(el) el.value = val;
  });

  // Product dropdown
  const prodEl = document.getElementById('inq-product');
  if(prodEl) {
    prodEl.innerHTML = '<option value="">— Select product —</option>' +
      DB.products.map(p => {
        const name = p.name||p.product_name||p.code||'';
        return '<option value="'+name+'"'+(name===(inq.product_interest||'')?' selected':'')+'>'+name+'</option>';
      }).join('');
    prodEl.value = inq.product_interest || '';
  }

  // Datetime
  const dtEl = document.getElementById('inq-datetime');
  if(dtEl && inq.enquiry_datetime) dtEl.value = inq.enquiry_datetime.slice(0,16);

  // Store editing ID
  window._editingInquiryId = inqId;

  // Update modal title to show Edit mode
  const header = document.querySelector('#add-inquiry-modal .modal-header h3, #add-inquiry-modal h3');
  if(header) header.textContent = 'Edit Inquiry';

  if(typeof openModal === 'function') openModal('add-inquiry-modal');
}

// Patch saveInquiry to handle both new and edit
const _origSaveInquiry = window.saveInquiry;
window.saveInquiry = async function() {
  if(window._editingInquiryId) {
    // Update existing inquiry in Supabase
    const company  = (document.getElementById('inq-company')||{}).value || '';
    const contact  = (document.getElementById('inq-contact')||{}).value || '';
    const email    = (document.getElementById('inq-email')||{}).value || '';
    const phone    = (document.getElementById('inq-phone')||{}).value || '';
    const product  = (document.getElementById('inq-product')||{}).value || '';
    const qty      = (document.getElementById('inq-quantity')||{}).value || '';
    const estVal   = (document.getElementById('inq-est-value')||{}).value || '';
    const notes    = (document.getElementById('inq-notes')||{}).value || '';
    const cf       = (document.getElementById('inq-captured-from')||{}).value || '';
    const dt       = (document.getElementById('inq-datetime')||{}).value || '';

    try {
      const upd = { company_name: company, contact_person: contact, contact_email: email,
        contact_phone: phone, product_interest: product, quantity: qty,
        estimated_value: estVal ? parseFloat(estVal) : null, notes, captured_from: cf,
        enquiry_datetime: dt || null };
      const { error } = await _sb.from('inquiries').update(upd).eq('inquiry_id', window._editingInquiryId);
      if(error) throw error;

      // Update local DB
      const local = DB.inquiries.find(i => String(i.id) === String(window._editingInquiryId));
      if(local) {
        local.company = company; local.contact = contact; local.email = email;
        local.phone = phone; local.product_interest = product; local.quantity = qty;
        local.estimated_value = estVal; local.notes = notes;
        local.captured_from = cf; local.enquiry_datetime = dt;
      }

      if(typeof showToast === 'function') showToast('Inquiry updated ✓', 'success');
      if(typeof closeModal === 'function') closeModal('add-inquiry-modal');
      window._editingInquiryId = null;

      // Reset header
      const header = document.querySelector('#add-inquiry-modal .modal-header h3, #add-inquiry-modal h3');
      if(header) header.textContent = 'New Inquiry';

      if(typeof renderInquiries === 'function') renderInquiries('all');
    } catch(e) {
      if(typeof showToast === 'function') showToast('Update failed: '+e.message, 'error');
    }
  } else {
    if(typeof _origSaveInquiry === 'function') _origSaveInquiry();
  }
};

// Also patch openAddInquiryModal to reset edit mode
const _origOpenAddInquiry = window.openAddInquiryModal;
window.openAddInquiryModal = function() {
  window._editingInquiryId = null;
  const header = document.querySelector('#add-inquiry-modal .modal-header h3, #add-inquiry-modal h3');
  if(header) header.textContent = 'New Inquiry';
  // Set datetime default
  const dtEl = document.getElementById('inq-datetime');
  if(dtEl) {
    const n = new Date();
    dtEl.value = n.getFullYear()+'-'+(n.getMonth()+1).toString().padStart(2,'0')+'-'+n.getDate().toString().padStart(2,'0')+'T'+n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');
  }
  if(typeof _origOpenAddInquiry === 'function') _origOpenAddInquiry();
};


// ═══════════════════════════════════════════════════════════════════════════
// SAMPLING MODULE FIXES — Add Edit functionality
// ═══════════════════════════════════════════════════════════════════════════

window._editingSampleId = null;

function editSample(sampleId) {
  const s = DB.samples.find(x => String(x.id) === String(sampleId));
  if(!s) return;
  window._editingSampleId = sampleId;

  const fields = {
    'sample-customer':  s.customerId || '',
    'sample-product':   s.product || '',
    'sample-qty':       s.qty || '',
    'sample-date':      s.sentDate || '',
    'sample-followup':  s.followupDue || '',
    'sample-courier':   s.courier || '',
    'sample-cost':      s.cost != null ? s.cost : '',
    'sample-notes':     s.notes || '',
  };
  Object.entries(fields).forEach(([id,val]) => {
    const el = document.getElementById(id); if(el) el.value = val;
  });

  // Set outcome if it exists
  const outcomeEl = document.getElementById('sample-outcome');
  if(outcomeEl && s.outcome) outcomeEl.value = s.outcome;

  const header = document.querySelector('#log-sample-modal .modal-header h3, #log-sample-modal h3');
  if(header) header.textContent = 'Edit Sample';

  if(typeof openModal === 'function') openModal('log-sample-modal');
}

// Patch renderSampling to add Edit button
const _origRenderSampling = window.renderSampling;
window.renderSampling = function() {
  if(typeof _origRenderSampling === 'function') _origRenderSampling();
  // After render, add Edit buttons to each row
  setTimeout(() => {
    const tbody = document.getElementById('samples-table-body');
    if(!tbody) return;
    tbody.querySelectorAll('tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      if(cells.length === 0) return;
      const lastCell = cells[cells.length - 1];
      // Find sample id from row data
      const idCell = cells[0];
      if(!idCell) return;
      const sampleId = idCell.textContent.trim();
      // Check if Edit button already added
      if(lastCell.querySelector('.edit-sample-btn')) return;
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary btn-sm edit-sample-btn';
      editBtn.style.fontSize = '11px';
      editBtn.style.marginLeft = '4px';
      editBtn.textContent = '✏️ Edit';
      editBtn.onclick = (e) => { e.stopPropagation(); editSample(sampleId); };
      lastCell.appendChild(editBtn);
    });
  }, 100);
};

// Patch logSampleDispatch to handle edit mode  
const _origLogSample = window.logSampleDispatch || window.saveLogSample;
window.logSampleDispatch = async function() {
  if(window._editingSampleId) {
    const upd = {};
    const f = (id) => (document.getElementById(id)||{}).value || null;
    upd.product_name = f('sample-product');
    upd.quantity = f('sample-qty');
    upd.sent_date = f('sample-date');
    upd.followup_due = f('sample-followup');
    upd.courier_details = f('sample-courier');
    if(f('sample-cost')) upd.cost = parseFloat(f('sample-cost'));
    upd.notes = f('sample-notes');
    const outEl = document.getElementById('sample-outcome');
    if(outEl && outEl.value) upd.outcome = outEl.value;
    try {
      const { error } = await _sb.from('samples').update(upd).eq('sample_id', window._editingSampleId);
      if(error) throw error;
      if(typeof showToast === 'function') showToast('Sample updated ✓', 'success');
      if(typeof closeModal === 'function') closeModal('log-sample-modal');
      window._editingSampleId = null;
      const header = document.querySelector('#log-sample-modal .modal-header h3, #log-sample-modal h3');
      if(header) header.textContent = 'Log Sample Dispatch';
      if(typeof loadSamplesFromSupabase === 'function') await loadSamplesFromSupabase();
    } catch(e) {
      if(typeof showToast === 'function') showToast('Update failed: '+e.message, 'error');
    }
  } else {
    if(typeof _origLogSample === 'function') _origLogSample();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// INQUIRY FORM ENHANCEMENTS — Datetime, Unique Categories, Professional UI
// ═══════════════════════════════════════════════════════════════════════════

// 1. CSS: Professional modal styles + hide sync buttons
(function() {
  if (document.getElementById('_inq_sty')) return;
  var s = document.createElement('style'); s.id = '_inq_sty';
  s.textContent = [
    'button[onclick="syncGmail()"],button[onclick*="syncGmail"]{display:none!important}',
    '#add-inquiry-modal .modal{max-width:700px;width:96vw;border-radius:16px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.22)}',
    '#add-inquiry-modal .modal-header{background:linear-gradient(135deg,#1e3a8a,#1A6FDB);padding:20px 28px}',
    '#add-inquiry-modal .modal-title{color:#fff!important;font-size:16px;font-weight:700;letter-spacing:.01em}',
    '#add-inquiry-modal .modal-close{color:rgba(255,255,255,.7)!important;font-size:20px}',
    '#add-inquiry-modal .modal-body{padding:22px 28px!important;gap:14px!important}',
    '#add-inquiry-modal .form-label{font-size:11px!important;font-weight:700!important;color:#6b7280!important;text-transform:uppercase!important;letter-spacing:.07em!important;display:block;margin-bottom:5px}',
    '#add-inquiry-modal .form-input{border:1.5px solid #e5e7eb!important;border-radius:8px!important;padding:9px 13px!important;font-size:14px!important;background:#fafafa!important;outline:none!important;width:100%;box-sizing:border-box;transition:border-color .15s,box-shadow .15s}',
    '#add-inquiry-modal .form-input:focus{border-color:#1A6FDB!important;box-shadow:0 0 0 3px rgba(26,111,219,.1)!important;background:#fff!important}',
    '#add-inquiry-modal textarea.form-input{min-height:80px;resize:vertical}',
    '#add-inquiry-modal .modal-footer{padding:14px 28px 22px!important;border-top:1px solid #f3f4f6;background:#f9fafb;gap:10px;justify-content:flex-end}',
    '#add-inquiry-modal #inq-save-btn{background:linear-gradient(135deg,#1e3a8a,#1A6FDB)!important;border:none!important;padding:10px 26px!important;font-size:14px!important;font-weight:600!important;border-radius:8px!important;color:#fff!important;cursor:pointer}',
    '#add-inquiry-modal #inq-save-btn:disabled{opacity:.6;cursor:not-allowed}',
  ].join('\n');
  document.head.appendChild(s);
  document.querySelectorAll('button').forEach(function(b) {
    if ((b.getAttribute('onclick') || '').includes('syncGmail')) b.style.display = 'none';
  });
})();

// 2. Inject Datetime + Status fields into modal
function _ensureInqDatetime() {
  if (document.getElementById('inq-datetime')) return;
  var body = document.querySelector('#add-inquiry-modal .modal-body');
  if (!body) return;
  var row = document.createElement('div');
  row.id = '_inq_dt_row';
  row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;';
  row.innerHTML = '<div><label class="form-label">Inquiry Date & Time <span style="color:#dc2626">*</span></label><input type="datetime-local" id="inq-datetime" class="form-input"></div><div><label class="form-label">Status</label><select id="inq-status" class="form-input"><option value="new">New</option><option value="open">Open</option><option value="converted">Converted</option><option value="closed">Closed</option></select></div>';
  var notesDiv = Array.from(body.children).find(function(d) { return d.querySelector('textarea'); });
  if (notesDiv) body.insertBefore(row, notesDiv); else body.appendChild(row);
}

// 3. Remove Notes option from Enquiry Captured From
function _removeNotesOption() {
  var cf = document.getElementById('inq-captured-from');
  if (!cf) return;
  Array.from(cf.options).forEach(function(o) {
    if (o.value === 'notes' || o.text.trim().toLowerCase() === 'notes') o.remove();
  });
}

// 4. Override openAddInquiryModal with all enhancements
(function() {
  var _prev = window.openAddInquiryModal;
  window.openAddInquiryModal = function() {
    window._editingInquiryId = null;
    _ensureInqDatetime();
    if (typeof _prev === 'function') _prev();
    // Set datetime to now
    var dt = document.getElementById('inq-datetime');
    if (dt) {
      var n = new Date();
      dt.value = n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0') + 'T' + String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
    }
    var st = document.getElementById('inq-status'); if (st) st.value = 'new';
    // Remove Notes from source dropdown
    _removeNotesOption();
    // Populate product with UNIQUE CATEGORIES
    var prodEl = document.getElementById('inq-product');
    if (prodEl && DB.products && DB.products.length > 0) {
      var cats = DB.products.map(function(p) { return p.cat || p.category || p.name || p.product_name || ''; }).filter(Boolean);
      cats = [...new Set(cats)].sort();
      prodEl.innerHTML = '<option value="">— Select product —</option>' + cats.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
      prodEl.value = '';
    }
    // Update modal title
    var titleEl = document.querySelector('#add-inquiry-modal .modal-title');
    if (titleEl) titleEl.textContent = 'Add New Inquiry';
    var sb = document.getElementById('inq-save-btn');
    if (sb) { sb.textContent = 'Save Inquiry'; sb.disabled = false; }
  };
})();

// 5. Fix editInquiry to inject datetime + use unique categories
(function() {
  var _prevEdit = window.editInquiry;
  window.editInquiry = function(inqId) {
    _ensureInqDatetime();
    if (typeof _prevEdit === 'function') _prevEdit(inqId);
    // Re-populate product with unique categories
    var prodEl = document.getElementById('inq-product');
    var inq = (DB.inquiries || []).find(function(i) { return String(i.id) === String(inqId); });
    if (prodEl && DB.products && DB.products.length > 0) {
      var cats = DB.products.map(function(p) { return p.cat || p.category || p.name || p.product_name || ''; }).filter(Boolean);
      cats = [...new Set(cats)].sort();
      prodEl.innerHTML = '<option value="">— Select product —</option>' + cats.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
      if (inq) prodEl.value = inq.product_interest || '';
    }
    // Set status field
    var st = document.getElementById('inq-status');
    if (st && inq) st.value = inq.status || 'new';
    // Update modal title
    var titleEl = document.querySelector('#add-inquiry-modal .modal-title');
    if (titleEl) titleEl.textContent = 'Edit Inquiry — ' + ((inq && (inq.company || inq.company_name)) || inqId);
    // Remove Notes option
    _removeNotesOption();
  };
})();

// 6. Also patch saveInquiry to save enquiry_datetime + status for NEW inquiries
(function() {
  var _prevSave = window.saveInquiry;
  window.saveInquiry = async function() {
    if (window._editingInquiryId) {
      // Edit mode — handled by existing patch, just add datetime + status
      var dtRaw = (document.getElementById('inq-datetime') || {}).value || '';
      var status = (document.getElementById('inq-status') || {}).value || 'new';
      var upd = { status: status };
      if (dtRaw) upd.enquiry_datetime = new Date(dtRaw).toISOString();
      // Update in Supabase alongside existing fields
      if (Object.keys(upd).length) {
        await _sb.from('inquiries').update(upd).eq('inquiry_id', window._editingInquiryId);
      }
      if (typeof _prevSave === 'function') return _prevSave.apply(this, arguments);
    } else {
      // New inquiry — call original save first
      if (typeof _prevSave === 'function') await _prevSave.apply(this, arguments);
      // Then update with datetime + status
      var dtRaw2 = (document.getElementById('inq-datetime') || {}).value || '';
      var status2 = (document.getElementById('inq-status') || {}).value || 'new';
      if ((dtRaw2 || status2 !== 'new') && DB.inquiries && DB.inquiries[0]) {
        var latestId = DB.inquiries[0].id || DB.inquiries[0].inquiry_id;
        if (latestId) {
          var upd2 = { status: status2 };
          if (dtRaw2) upd2.enquiry_datetime = new Date(dtRaw2).toISOString();
          await _sb.from('inquiries').update(upd2).eq('inquiry_id', latestId);
          if (DB.inquiries[0]) DB.inquiries[0].enquiry_datetime = upd2.enquiry_datetime || DB.inquiries[0].enquiry_datetime;
        }
      }
    }
  };
})();

// Run CSS + sync hide on load
window.addEventListener('load', function() {
  setTimeout(function() {
    document.querySelectorAll('button').forEach(function(b) {
      if ((b.getAttribute('onclick') || '').includes('syncGmail')) b.style.display = 'none';
    });
  }, 500);
  setTimeout(function() {
    document.querySelectorAll('button').forEach(function(b) {
      if ((b.getAttribute('onclick') || '').includes('syncGmail')) b.style.display = 'none';
    });
  }, 1500);
});

// Product loader fix — ensure products fetched from Supabase
(function(){
  var _pOrig = window.openAddInquiryModal;
  window.openAddInquiryModal = function(){
    if(typeof _pOrig==='function')_pOrig();
    function loadAndFill(){
      var pe=document.getElementById('inq-product');
      if(!pe)return;
      if(DB.products&&DB.products.length>0){
        var cats=[...new Set(DB.products.map(function(p){return p.cat||p.category||p.name||p.product_name||'';}).filter(Boolean))].sort();
        pe.innerHTML='<option value="">— Select product —</option>'+cats.map(function(c){return'<option value="'+c+'">'+c+'</option>';}).join('');
        pe.value='';
      } else {
        pe.innerHTML='<option value="">Loading...</option>';
        _sb.from('products').select('product_id,product_name,category').order('category').then(function(res){
          if(res.error)return;
          DB.products=(res.data||[]).map(function(r){return{id:r.product_id,name:r.product_name,cat:r.category||'',category:r.category||''};});
          var cats2=[...new Set((res.data||[]).map(function(r){return r.category;}).filter(Boolean))].sort();
          pe.innerHTML='<option value="">— Select product —</option>'+cats2.map(function(c){return'<option value="'+c+'">'+c+'</option>';}).join('');
          pe.value='';
        });
      }
    }
    setTimeout(loadAndFill,50);
  };
})();


// ═══════════════════════════════════════════════════════════════════════════
// NEW QUOTATION MODULE PATCHES
// ═══════════════════════════════════════════════════════════════════════════

// 1. CSS: Hide Save Draft + Email Quotation, fix Save & PDF label via attribute
(function() {
  if (document.getElementById('_quote_patch_styles')) return;
  var s = document.createElement('style');
  s.id = '_quote_patch_styles';
  s.textContent = [
    // Hide Save Draft button
    'button[onclick="saveDraft()"]{display:none!important}',
    // Hide Email Quotation button
    'button[onclick="openEmailQuoteModal()"]{display:none!important}',
    // Style .li-product selects to match existing inputs
    '.li-product-select{width:100%;padding:6px 8px;border:1px solid var(--gray200,#e5e7eb);border-radius:6px;font-size:13px;color:var(--gray800,#1f2937);background:#fff;cursor:pointer;appearance:auto}',
    '.li-product-select:focus{outline:none;border-color:var(--blue,#1A6FDB);box-shadow:0 0 0 2px rgba(26,111,219,.1)}',
  ].join('\n');
  document.head.appendChild(s);
})();

// 2. Rename "Save & PDF" to "Save"
function _patchQuoteButtons() {
  document.querySelectorAll('button').forEach(function(btn) {
    var t = btn.textContent.trim();
    var oc = btn.getAttribute('onclick') || '';
    if (t === 'Save & PDF' || (oc.includes('saveAndSend') && t.includes('PDF'))) {
      btn.textContent = 'Save';
    }
  });
}

// 3. Convert .li-product text inputs to category SELECT dropdowns
function _convertLiProductToSelect() {
  document.querySelectorAll('input.li-product').forEach(function(input) {
    if (input.dataset.converted) return;
    input.dataset.converted = '1';
    var sel = document.createElement('select');
    sel.className = 'li-product li-product-select';
    // Copy data attributes
    Array.from(input.attributes).forEach(function(attr) {
      if (attr.name !== 'type' && attr.name !== 'class' && attr.name !== 'style') {
        try { sel.setAttribute(attr.name, attr.value); } catch(e) {}
      }
    });
    var currentVal = input.value || '';

    // Fill with unique categories
    function buildCatOptions(products, val) {
      var cats = [...new Set(products.map(function(p){ return p.cat||p.category||p.name||p.product_name||''; }).filter(Boolean))].sort();
      sel.innerHTML = '<option value="">— Select product —</option>' + cats.map(function(c){ return '<option value="'+c+'"'+(c===val?' selected':'')+'>'+c+'</option>'; }).join('');
      if (val) sel.value = val;
    }

    if (DB.products && DB.products.length > 0 && DB.products[0].hsn !== undefined) {
      buildCatOptions(DB.products, currentVal);
    } else {
      sel.innerHTML = '<option value="">Loading products...</option>';
      _sb.from('products').select('product_id,product_name,category,hsn_code,gst_percent,default_rate').order('category').then(function(res) {
        if (res.error || !res.data) { sel.innerHTML = '<option value="">— Select product —</option>'; return; }
        DB.products = res.data.map(function(r){ return {id:r.product_id,name:r.product_name,product_name:r.product_name,cat:r.category||'',category:r.category||'',hsn:r.hsn_code||'',gst:r.gst_percent||18,rate:r.default_rate||0}; });
        buildCatOptions(DB.products, currentVal);
      });
    }

    // On category selection: fill HSN + GST from first matching product, then recalc
    sel.addEventListener('change', function() {
      var selectedCat = sel.value;
      var row = sel.closest('tr');
      if (!row) { if (typeof recalcTotals === 'function') recalcTotals(); return; }

      function fillRow(products) {
        // Find first product in selected category
        var match = products.find(function(p){ return (p.cat||p.category||'') === selectedCat; });
        if (!match) match = products.find(function(p){ return (p.name||p.product_name||'') === selectedCat; });
        if (match) {
          var hsnEl = row.querySelector('.li-hsn'); if (hsnEl) hsnEl.value = match.hsn || '';
          var gstEl = row.querySelector('.li-gst'); if (gstEl) gstEl.value = match.gst || 18;
        }
        if (typeof recalcTotals === 'function') recalcTotals();
      }

      if (DB.products && DB.products.length > 0 && DB.products[0].hsn !== undefined) {
        fillRow(DB.products);
      } else {
        _sb.from('products').select('product_id,product_name,category,hsn_code,gst_percent,default_rate').order('category').then(function(res) {
          if (res.error || !res.data) { if (typeof recalcTotals==='function') recalcTotals(); return; }
          DB.products = res.data.map(function(r){ return {id:r.product_id,name:r.product_name,product_name:r.product_name,cat:r.category||'',category:r.category||'',hsn:r.hsn_code||'',gst:r.gst_percent||18,rate:r.default_rate||0}; });
          fillRow(DB.products);
        });
      }
    });

    input.parentNode.replaceChild(sel, input);
  });
}

// 4. MutationObserver to apply patches whenever quotation DOM changes
var _quoteObserver = new MutationObserver(function() {
  _convertLiProductToSelect();
  _patchQuoteButtons();
});

// Run on navigation to new-quote page
(function() {
  var _prevNav2 = window.nav;
  if (typeof _prevNav2 !== 'function') return;
  window.nav = function(page) {
    _prevNav2(page);
    if (page === 'new-quote' || page === 'quotations') {
      setTimeout(function() {
        _patchQuoteButtons();
        _convertLiProductToSelect();
        // Start observing line items table
        var lineTable = document.getElementById('line-items-table') || 
                        document.querySelector('.line-items-table, #quote-line-items, tbody');
        if (lineTable) _quoteObserver.observe(lineTable, {childList: true, subtree: true});
      }, 600);
    }
  };
})();

// Run immediately on load too
window.addEventListener('load', function() {
  setTimeout(function() {
    _patchQuoteButtons();
    _convertLiProductToSelect();
  }, 1000);
  setTimeout(function() {
    _patchQuoteButtons();
    _convertLiProductToSelect();
  }, 2500);
});


// ═══════════════════════════════════════════════════════════════════════════
// PIPELINE: Inject Inquiries in Lead stage + Samples in Sampling stage
// ═══════════════════════════════════════════════════════════════════════════

var _pipelineInqLoaded = false;
var _pipelineSampLoaded = false;

// Load inquiries into DB.inquiries from Supabase
async function _loadInquiriesForPipeline() {
  if (_pipelineInqLoaded && DB.inquiries && DB.inquiries.length > 0) return;
  try {
    var res = await _sb.from('inquiries')
      .select('inquiry_id,company_name,contact_name,product_interest,quantity,estimated_value,captured_from,source,status,enquiry_datetime,created_date')
      .not('status', 'eq', 'converted').not('status', 'eq', 'closed')
      .order('created_date', {ascending: false});
    if (res.error) return;
    DB.inquiries = (res.data || []).map(function(r) {
      return {
        id: r.inquiry_id, inquiry_id: r.inquiry_id,
        company: r.company_name, company_name: r.company_name,
        contact: r.contact_name, product_interest: r.product_interest,
        quantity: r.quantity, estimated_value: r.estimated_value,
        captured_from: r.captured_from || r.source || 'manual',
        source: r.captured_from || r.source || 'manual',
        status: r.status || 'new',
        enquiry_datetime: r.enquiry_datetime, created_date: r.created_date,
        stage: 'lead'
      };
    });
    _pipelineInqLoaded = true;
  } catch(e) { console.warn('_loadInquiriesForPipeline:', e.message); }
}

// Load samples into DB.samples from Supabase
async function _loadSamplesForPipeline() {
  if (_pipelineSampLoaded && DB.samples && DB.samples.length > 0) return;
  try {
    var res = await _sb.from('samples')
      .select('sample_id,customer_id,product_name,quantity,sent_date,followup_due,status,outcome,notes')
      .not('status', 'eq', 'returned')
      .order('sent_date', {ascending: false});
    if (res.error) return;
    DB.samples = (res.data || []).map(function(r) {
      var cust = (DB.customers || []).find(function(c){ return c.id === r.customer_id; });
      return {
        id: r.sample_id, sample_id: r.sample_id,
        customer: (cust && cust.company) || r.customer_id || 'Unknown',
        customerId: r.customer_id, product: r.product_name || '',
        qty: r.quantity, sentDate: r.sent_date, followupDue: r.followup_due,
        status: r.status || 'dispatched', outcome: r.outcome || 'pending',
        notes: r.notes, stage: 'sampling'
      };
    });
    _pipelineSampLoaded = true;
  } catch(e) { console.warn('_loadSamplesForPipeline:', e.message); }
}

// Render inquiry cards into pipeline Lead stage
function _renderInquiryPipelineCards() {
  var list = document.getElementById('pipeline-deals-list');
  if (!list) return;
  // Remove previously injected inquiry cards
  list.querySelectorAll('.inq-pipeline-card').forEach(function(c){ c.remove(); });

  var filter = (document.getElementById('pipeline-filter-stage') || {}).value || 'all';
  if (filter !== 'all' && filter !== 'lead') return;

  var inquiries = DB.inquiries || [];
  if (!inquiries.length) return;

  var palette = ['#7C3AED','#D97706','#0F8A6F','#D85A30','#0891B2','#16A34A'];

  inquiries.forEach(function(inq, i) {
    var company = inq.company || inq.company_name || '—';
    var initials = company.slice(0,2).toUpperCase();
    var color = palette[i % palette.length];
    var valStr = inq.estimated_value ? '₹' + (parseFloat(inq.estimated_value)/100000).toFixed(1) + 'L' : '—';
    var srcLabel = inq.captured_from || inq.source || 'manual';
    var srcClass = srcLabel === 'indiamart' ? 'badge-blue' : srcLabel === 'email' ? 'badge-teal' : 'badge-gray';
    var dtStr = inq.enquiry_datetime ? new Date(inq.enquiry_datetime).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : (inq.created_date || '');

    var card = document.createElement('div');
    card.className = 'lead-card on-track inq-pipeline-card';
    card.style.cssText = 'border-left:3px solid #D97706;cursor:pointer;';
    card.setAttribute('data-inq-id', inq.id);
    card.innerHTML =
      '<div class="lc-avatar" style="background:'+color+'">'+initials+'</div>'+
      '<div class="lc-body">'+
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">'+
          '<span class="lc-company">'+company+'</span>'+
          '<span class="badge badge-gray" style="font-size:10px;padding:1px 6px;">Inquiry</span>'+
          '<span class="badge '+srcClass+'" style="font-size:10px;padding:1px 6px;">'+srcLabel+'</span>'+
        '</div>'+
        '<div class="lc-product" style="font-size:12px;color:var(--gray500);">'+
          (inq.product_interest || '—')+(inq.quantity ? ' · '+inq.quantity : '')+
        '</div>'+
        '<div class="lc-meta" style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'+
          '<span class="badge badge-amber" style="font-size:10px;background:#fef3c7;color:#92400e;">Lead</span>'+
          '<span style="font-size:11px;font-weight:600;color:var(--gray700);">'+valStr+'</span>'+
          (dtStr ? '<span style="font-size:11px;color:var(--gray400);margin-left:auto;">'+dtStr+'</span>' : '')+
        '</div>'+
        '<div style="margin-top:8px;display:flex;gap:6px;">'+
          '<button class="btn btn-ghost btn-sm" style="font-size:11px;padding:3px 8px;" onclick="event.stopPropagation();editInquiry(''+inq.id+'')">✏ Edit</button>'+
          '<button class="btn btn-primary btn-sm" style="font-size:11px;padding:3px 8px;" onclick="event.stopPropagation();openInquiryQuote && openInquiryQuote(''+inq.id+'')">Quote →</button>'+
        '</div>'+
      '</div>';
    list.appendChild(card);
  });

  // Update Lead jp-stage badge
  var leadStages = Array.from(document.querySelectorAll('.jp-stage')).filter(function(s){
    return (s.getAttribute('onclick')||'').includes("'lead'");
  });
  leadStages.forEach(function(s) {
    var txt = s.textContent.trim();
    // Update count in text
    var countSpan = s.querySelector('.jp-stage-count, [class*="count"], span');
    if (countSpan) countSpan.textContent = inquiries.length;
  });
}

// Render sample cards into pipeline Sampling stage
function _renderSamplePipelineCards() {
  var list = document.getElementById('pipeline-deals-list');
  if (!list) return;
  list.querySelectorAll('.samp-pipeline-card').forEach(function(c){ c.remove(); });

  var filter = (document.getElementById('pipeline-filter-stage') || {}).value || 'all';
  if (filter !== 'all' && filter !== 'sampling') return;

  var samples = DB.samples || [];
  if (!samples.length) return;

  var statusColors = {dispatched:'#0891B2', delivered:'#16A34A', returned:'#DC2626'};
  var outcomeColors = {approved:'#16A34A', rejected:'#DC2626', pending:'#D97706'};

  samples.forEach(function(samp, i) {
    var company = samp.customer || '—';
    var initials = company.slice(0,2).toUpperCase();
    var color = statusColors[samp.status] || '#0891B2';
    var dueDate = samp.followupDue || samp.sentDate || '';
    var dueStr = dueDate ? new Date(dueDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '';

    var card = document.createElement('div');
    card.className = 'lead-card on-track samp-pipeline-card';
    card.style.cssText = 'border-left:3px solid #0891B2;cursor:pointer;';
    card.setAttribute('data-samp-id', samp.id);
    card.innerHTML =
      '<div class="lc-avatar" style="background:'+color+'">'+initials+'</div>'+
      '<div class="lc-body">'+
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">'+
          '<span class="lc-company">'+company+'</span>'+
          '<span class="badge badge-gray" style="font-size:10px;padding:1px 6px;">Sample</span>'+
        '</div>'+
        '<div class="lc-product" style="font-size:12px;color:var(--gray500);">'+
          (samp.product || '—')+(samp.qty ? ' · '+samp.qty : '')+
        '</div>'+
        '<div class="lc-meta" style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'+
          '<span class="badge" style="font-size:10px;background:#e0f2fe;color:#0369a1;">'+samp.status+'</span>'+
          '<span class="badge" style="font-size:10px;background:'+(samp.outcome==='approved'?'#dcfce7':samp.outcome==='rejected'?'#fee2e2':'#fef3c7')+';color:'+(samp.outcome==='approved'?'#166534':samp.outcome==='rejected'?'#991b1b':'#92400e')+';">'+samp.outcome+'</span>'+
          (dueStr ? '<span style="font-size:11px;color:var(--gray400);margin-left:auto;">Due: '+dueStr+'</span>' : '')+
        '</div>'+
      '</div>';
    list.appendChild(card);
  });
}

// Wrap renderPipeline to also inject inquiry + sample cards
(function() {
  var _origRP = window.renderPipeline;
  window.renderPipeline = async function() {
    if (typeof _origRP === 'function') _origRP.apply(this, arguments);
    await _loadInquiriesForPipeline();
    await _loadSamplesForPipeline();
    setTimeout(function() {
      _renderInquiryPipelineCards();
      _renderSamplePipelineCards();
    }, 150);
  };
})();

// Also wrap setStageFilter to re-inject after filter changes
(function() {
  var _origSSF = window.setStageFilter;
  window.setStageFilter = function(stage) {
    if (typeof _origSSF === 'function') _origSSF(stage);
    setTimeout(function() {
      _renderInquiryPipelineCards();
      _renderSamplePipelineCards();
    }, 200);
  };
})();

// Run on pipeline nav
(function() {
  var _prevNav3 = window.nav;
  if (typeof _prevNav3 !== 'function') return;
  window.nav = function(page) {
    _prevNav3(page);
    if (page === 'pipeline') {
      setTimeout(async function() {
        await _loadInquiriesForPipeline();
        await _loadSamplesForPipeline();
        _renderInquiryPipelineCards();
        _renderSamplePipelineCards();
      }, 1200);
    }
  };
})();


// ═══════════════════════════════════════════════════════════════════════
//

// ═══════════════════════════════════════════════════════════════════════

// PATCH v4b - Follow-up Tracker: next_followup_date mapping (2026-06-05)
// Uses setTimeout(0) so it runs after ALL inline scripts finish
(function schedulePatch(){
  function runPatch(){
    function todayStr(){return new Date().toISOString().split('T')[0];}
    function weekEndStr(){var d=new Date(),day=d.getDay(),sun=new Date(d);sun.setDate(d.getDate()+(day===0?0:7-day));return sun.toISOString().split('T')[0];}
    function classify(ds){if(!ds)return 'upcoming';var t=todayStr();if(ds<t)return 'overdue';if(ds===t)return 'today';if(ds<=weekEndStr())return 'week';return 'upcoming';}
    function applyDomFixes(){
      var ds=document.getElementById('fu-stat-done');
      if(ds&&!ds._v4b){ds.id='fu-stat-upcoming';ds._v4b=true;var lbl=ds.nextElementSibling;if(lbl)lbl.textContent='UPCOMING';var card=ds.closest?ds.closest('.stat-card'):ds.parentElement;if(card)card.style.borderLeft='3px solid #3b82f6';}
      var dc=document.getElementById('fu-col-done');
      if(dc){var w=dc.parentElement&&dc.parentElement.parentElement;if(w)w.style.display='none';}
    }
    function cardHtml(fu){
      var date=fu.next_followup_date||fu.date||'',type=(fu.type||'call').toLowerCase(),outcome=fu.outcome||'',notes=(fu.notes||'—'),ref=fu.lead_id||fu.inquiry_id||fu.followup_id||'';
      var icon={call:'📞',email:'✉️',whatsapp:'💬',meeting:'🤝'}[type]||'📋';
      var oc={positive:'#22c55e',neutral:'#f59e0b',negative:'#ef4444'}[outcome]||'#94a3b8';
      var dd=date?new Date(date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—';
      var n=notes.length>65?notes.substring(0,65)+'…':notes;
      return '<div class="lead-card" style="margin-bottom:8px;cursor:default;">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;"><span style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%;">'+ref+'</span><span style="font-size:11px;white-space:nowrap;">'+icon+' '+type+'</span></div>'
        +'<div style="font-size:11px;color:#64748b;margin-bottom:6px;line-height:1.4;">'+n+'</div>'
        +'<div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:#64748b;">📅 '+dd+'</span>'+(outcome?'<span style="font-size:10px;font-weight:700;color:'+oc+';text-transform:uppercase;">'+outcome+'</span>':'')+'</div></div>';
    }
    var _orig=window.loadFollowupsFromSupabase;
    window.loadFollowupsFromSupabase=async function(){
      applyDomFixes();
      var sb=window.supabase||window._supabase;
      if(!sb){return typeof _orig==='function'?_orig.apply(this,arguments):undefined;}
      try{
        var res=await sb.from('followups').select('*').order('next_followup_date',{ascending:true,nullsFirst:false});
        if(res.error)throw res.error;
        var bk={overdue:[],today:[],week:[],upcoming:[]};
        (res.data||[]).forEach(function(fu){bk[classify(fu.next_followup_date)].push(fu);});
        var empty='<div style="text-align:center;padding:28px 8px;color:#94a3b8;font-size:12px;">No follow-ups</div>';
        ['overdue','today','week','upcoming'].forEach(function(cat){
          var items=bk[cat];
          var colId=cat==='week'?'fu-col-week':'fu-col-'+cat;
          var badId=cat==='week'?'fu-badge-week':'fu-badge-'+cat;
          var stId=cat==='upcoming'?'fu-stat-upcoming':cat==='week'?'fu-stat-week':'fu-stat-'+cat;
          var col=document.getElementById(colId),badge=document.getElementById(badId),stat=document.getElementById(stId);
          if(col)col.innerHTML=items.length?items.map(cardHtml).join(''):empty;
          if(badge)badge.textContent=items.length;
          if(stat)stat.textContent=items.length;
        });
      }catch(err){console.warn('FU v4b error:',err.message);if(typeof _orig==='function')return _orig.apply(this,arguments);}
    };
    if(document.getElementById('page-followups')&&document.getElementById('page-followups').classList.contains('active')){window.loadFollowupsFromSupabase();}
    console.log('FU patch v4b active');
  }
  if(document.readyState==='complete'){runPatch();}
  else{window.addEventListener('load',runPatch);}
})();

// ═══════════════════════════════════════════════════════════════════════
// PATCH v5 — Done Button + Follow-up History (2026-06-05)
// ═══════════════════════════════════════════════════════════════════════
;(function patchDoneButton(){

  // ── Override cardHtml to include Done button ──────────────────────
  var _origCardHtml = window.cardHtml;
  window.cardHtml = function(fu) {
    var date    = fu.next_followup_date || fu.date || '';
    var type    = (fu.type || 'call').toLowerCase();
    var outcome = fu.outcome || '';
    var notes   = (fu.notes || '—');
    var ref     = fu.lead_id || fu.inquiry_id || fu.followup_id || '';
    var icons   = { call:'📞', email:'✉️', whatsapp:'💬', meeting:'🤝' };
    var icon    = icons[type] || '📋';
    var ocColor = { positive:'#22c55e', neutral:'#f59e0b', negative:'#ef4444' }[outcome] || '#94a3b8';
    var dispDate = date ? new Date(date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
    var shortNotes = notes.length > 65 ? notes.substring(0,65)+'…' : notes;
    var fuId = fu.followup_id || '';
    var fuJson = encodeURIComponent(JSON.stringify(fu));

    return '<div class="lead-card" style="margin-bottom:8px;cursor:default;position:relative;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
      +'<span style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%;">'+ref+'</span>'
      +'<span style="font-size:11px;white-space:nowrap;">'+icon+' '+type+'</span>'
      +'</div>'
      +'<div style="font-size:11px;color:#64748b;margin-bottom:6px;line-height:1.4;">'+shortNotes+'</div>'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      +'<span style="font-size:11px;color:#64748b;">📅 '+dispDate+'</span>'
      +(outcome?'<span style="font-size:10px;font-weight:700;color:'+ocColor+';text-transform:uppercase;">'+outcome+'</span>':'')
      +'</div>'
      +'<button onclick="openDoneModal(''+fuId+'',''+fuJson+'')" '
      +'style="width:100%;padding:5px 0;background:#22c55e;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.3px;">'
      +'✓ Done</button>'
      +'</div>';
  };

  // ── Done Modal HTML ───────────────────────────────────────────────
  var doneModal = document.createElement('div');
  doneModal.id = 'fu-done-modal';
  doneModal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:none;align-items:center;justify-content:center;';
  doneModal.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:28px;width:460px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;font-size:16px;font-weight:700;color:#1e293b;">Mark Follow-up as Done</h3>
        <span onclick="closeDoneModal()" style="cursor:pointer;font-size:20px;color:#94a3b8;">✕</span>
      </div>
      <div id="fu-done-context" style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px;color:#64748b;"></div>
      <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px;">
        Completion Notes <span style="color:#ef4444;">*</span>
      </label>
      <textarea id="fu-done-notes" placeholder="What was discussed? What was the outcome? Any next steps?" 
        style="width:100%;min-height:100px;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;resize:vertical;box-sizing:border-box;"></textarea>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button onclick="closeDoneModal()" style="flex:1;padding:10px;background:#f1f5f9;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;color:#64748b;">Cancel</button>
        <button onclick="saveDone()" style="flex:2;padding:10px;background:#22c55e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">✓ Save &amp; Mark Done</button>
      </div>
    </div>`;
  document.body.appendChild(doneModal);

  // ── Current followup being marked done ────────────────────────────
  window._currentDoneFu = null;

  window.openDoneModal = function(fuId, fuJson) {
    try {
      window._currentDoneFu = JSON.parse(decodeURIComponent(fuJson));
    } catch(e) { window._currentDoneFu = {followup_id: fuId}; }
    var fu = window._currentDoneFu;
    var ref = fu.lead_id || fu.inquiry_id || fu.followup_id || '';
    var type = (fu.type||'call');
    var date = fu.next_followup_date || fu.date || '';
    var dispDate = date ? new Date(date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
    document.getElementById('fu-done-context').innerHTML =
      '<strong>'+ref+'</strong> &nbsp;|&nbsp; '+type+' &nbsp;|&nbsp; 📅 '+dispDate
      +(fu.notes ? '<br><span style="margin-top:4px;display:block;">'+fu.notes.substring(0,80)+'</span>' : '');
    document.getElementById('fu-done-notes').value = '';
    doneModal.style.display = 'flex';
    setTimeout(function(){ document.getElementById('fu-done-notes').focus(); }, 100);
  };

  window.closeDoneModal = function() {
    doneModal.style.display = 'none';
    window._currentDoneFu = null;
  };

  window.saveDone = async function() {
    var notes = document.getElementById('fu-done-notes').value.trim();
    if (!notes) {
      document.getElementById('fu-done-notes').style.borderColor = '#ef4444';
      document.getElementById('fu-done-notes').placeholder = 'Notes are required!';
      return;
    }
    document.getElementById('fu-done-notes').style.borderColor = '#e2e8f0';

    var fu = window._currentDoneFu;
    var sb = window._sb;
    if (!sb || !fu) { closeDoneModal(); return; }

    try {
      var saveBtn = doneModal.querySelector('button[onclick="saveDone()"]');
      saveBtn.textContent = 'Saving…';
      saveBtn.disabled = true;

      // 1. Insert into followup_history
      var historyRecord = {
        followup_id:       fu.followup_id || null,
        lead_id:           fu.lead_id || null,
        inquiry_id:        fu.inquiry_id || null,
        original_date:     fu.date || null,
        type:              fu.type || null,
        outcome:           fu.outcome || null,
        original_notes:    fu.notes || null,
        completion_notes:  notes,
        next_followup_date: fu.next_followup_date || null,
        stage_update:      fu.stage_update || null
      };
      var r1 = await sb.from('followup_history').insert(historyRecord);
      if (r1.error) throw r1.error;

      // 2. Delete or mark followup as completed (delete from active followups)
      if (fu.followup_id) {
        var r2 = await sb.from('followups').delete().eq('followup_id', fu.followup_id);
        if (r2.error) console.warn('Could not remove followup:', r2.error.message);
      }

      closeDoneModal();
      if (typeof loadFollowupsFromSupabase === 'function') loadFollowupsFromSupabase();

      // Show success toast
      var toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#22c55e;color:#fff;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.2);';
      toast.textContent = '✓ Follow-up marked as done and saved to history';
      document.body.appendChild(toast);
      setTimeout(function(){ toast.remove(); }, 3500);

    } catch(err) {
      console.warn('saveDone error:', err.message);
      var saveBtn = doneModal.querySelector('button[onclick="saveDone()"]');
      saveBtn.textContent = '✓ Save & Mark Done';
      saveBtn.disabled = false;
      alert('Error: ' + err.message);
    }
  };

  // Close modal on backdrop click
  doneModal.addEventListener('click', function(e){
    if (e.target === doneModal) closeDoneModal();
  });

  console.log('FU patch v5 (Done button) loaded');
})();


// Nav override — intercept followup-history page
window.addEventListener('load', function(){
  var _origNav = window.nav;
  window.nav = function(page) {
    if (typeof _origNav === 'function') _origNav(page);
    if (page === 'followup-history') {
      setTimeout(function(){ if(typeof loadFhHistory==='function') loadFhHistory(); }, 50);
    }
  };
});