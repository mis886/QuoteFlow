https://erp.pineoilmanufacturer.com/js/app.js
→ https://erp.pineoilmanufacturer.com/js/app.js
Content-Type: text/javascript

// ── QUOTEFLOW LOGIN SYSTEM ─────────────────────────────────────────────────
// Credentials match Supabase users schema
// IMPORTANT: Change these passwords before going live!
// Use bcryptjs CDN + supabase-js to validate against real DB in production

(function() {
  'use strict';

  // Team credentials - update these to match your actual passwords
  const QF_USERS = {
    'shishir':     { h:'3e39e39542ccdb4321472edaa121c88014018843d89899c62edf3fa927be88a2', name:'Shishir',           role:'Admin',       initials:'SV' },
    'vpsales':     { h:'6501e0f4e96b5a02bc205fc1e34e3ce45ff77fb1a21701176fe0ed64e06370af', name:'VP Sales',          role:'Manager',     initials:'VP' },
    'sales1':      { h:'e47f598eeb1bfb2f6d49719c1cc67f620a60a46e8055187297c2be372efd241b', name:'Sales Executive 1', role:'Sales',       initials:'SE' },
    'sales2':      { h:'e47f598eeb1bfb2f6d49719c1cc67f620a60a46e8055187297c2be372efd241b', name:'Sales Executive 2', role:'Sales',       initials:'AS' },
    'coordinator': { h:'ca57b8e681034a3459854a7bdf232ef8bb62ed9094bda8232c35653994c83477', name:'Sales Coordinator', role:'Coordinator', initials:'SC' },
  };

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  const SESSION_KEY = 'qf_session';
  const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

  // Check existing valid session
  function checkSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (Date.now() - s.ts > SESSION_TTL) { sessionStorage.removeItem(SESSION_KEY); return false; }
      applyUser(s);
      return true;
    } catch(e) { return false; }
  }

  function applyUser(s) {
    // Update the sidebar user chip with actual logged-in user info
    const nameEl   = document.getElementById('sidebar-user-name');
    const avatarEl = document.getElementById('sidebar-avatar');
    if (nameEl)   nameEl.textContent   = s.name;
    if (avatarEl) avatarEl.textContent = s.initials;
    // Load all Supabase data after login
    setTimeout(() => {
      if (typeof loadCustomersFromSupabase === 'function') loadCustomersFromSupabase();
      if (typeof loadProductsFromSupabase  === 'function') loadProductsFromSupabase();
      if (typeof loadQuotesFromSupabase    === 'function') loadQuotesFromSupabase();
      if (typeof loadInquiriesFromSupabase === 'function') loadInquiriesFromSupabase();
    }, 300);
  }

  window.qfLogin = function() {
    const username = (document.getElementById('qf-username')?.value || '').trim().toLowerCase();
    const password = (document.getElementById('qf-password')?.value || '').trim();
    const errorEl = document.getElementById('qf-login-error');
    const btn = document.getElementById('qf-login-btn');

    if (!username || !password) {
      showError('Please enter your username and password.');
      return;
    }

    // Show loading state
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:qf-spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Signing in…';
    btn.disabled = true;

    setTimeout(async () => {
      const user = QF_USERS[username];
      if (user && await sha256(password) === user.h) {
        const session = { username, name: user.name, role: user.role, initials: user.initials, ts: Date.now() };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        const screen = document.getElementById('qf-login-screen');
        if (screen) { screen.style.opacity = '0'; screen.style.transition = 'opacity .3s'; setTimeout(() => screen.remove(), 300); }
        applyUser(session);
      } else {
        btn.innerHTML = 'Sign In';
        btn.disabled = false;
        showError('Invalid username or password. Please try again.');
        document.getElementById('qf-password').value = '';
        document.getElementById('qf-password').focus();
      }
    }, 600);

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      btn.innerHTML = 'Sign In';
      btn.disabled = false;
    }
  };

  window.qfTogglePass = function() {
    const inp = document.getElementById('qf-password');
    const icon = document.getElementById('qf-eye-icon');
    if (inp.type === 'password') {
      inp.type = 'text';
      icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
    } else {
      inp.type = 'password';
      icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
  };

  // Add spin animation
  const style = document.createElement('style');
  style.textContent = '@keyframes qf-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
  document.head.appendChild(style);

  // Add logout button to sidebar footer
  document.addEventListener('DOMContentLoaded', function() {
    if (!checkSession()) {
      // Show login screen - it's already in the DOM
    }
    // Add logout to user chip
    const chip = document.querySelector('.user-chip');
    if (chip) {
      chip.title = 'Click to sign out';
      chip.onclick = function() {
        if (confirm('Sign out of QuoteFlow Pro?')) {
          sessionStorage.removeItem(SESSION_KEY);
          // Revoke Google session if signed in via Google
          if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.disableAutoSelect();
          }
          location.reload();
        }
      };
    }
  });

  // ── GOOGLE SSO ───────────────────────────────────────────────────────────────
  // Only Client ID used here — Client Secret is for server-side flows only
  const GOOGLE_CLIENT_ID = '22768714350-as9h7n5dbvt76ki71rpaj8k8315ri07u.apps.googleusercontent.com';

  // Domains whose users are allowed to access the ERP
  const ALLOWED_DOMAINS = ['himalayaterpene.com', 'pineoilmanufacturer.com', 'greenpine.in'];

  // Map team Google email addresses → ERP roles
  // Add your team's actual Google emails here to assign specific roles
  const GOOGLE_EMAIL_ROLES = {
    // 'shishir@himalayaterpene.com':      { name: 'Shishir',           role: 'Admin',       initials: 'SV' },
    // 'vpsales@himalayaterpene.com':      { name: 'VP Sales',          role: 'Manager',     initials: 'VP' },
    // 'sales1@himalayaterpene.com':       { name: 'Sales Executive 1', role: 'Sales',       initials: 'SE' },
    // 'sales2@himalayaterpene.com':       { name: 'Sales Executive 2', role: 'Sales',       initials: 'AS' },
    // 'coordinator@himalayaterpene.com':  { name: 'Sales Coordinator', role: 'Coordinator', initials: 'SC' },
  };

  // Called by Google after user approves sign-in
  window._googleCredentialCallback = function(response) {
    try {
      // Decode the Google JWT ID token (safe client-side — no secret needed)
      const b64 = response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(b64));
      const email   = payload.email || '';
      const gname   = payload.name  || email.split('@')[0];
      const domain  = email.split('@')[1] || '';

      if (!payload.email_verified) {
        _showGoogleError('Your Google account email is not verified. Please verify it first.');
        return;
      }
      if (!ALLOWED_DOMAINS.includes(domain)) {
        _showGoogleError('Access denied: ' + email + ' is not from an authorised domain.');
        return;
      }

      const mapped   = GOOGLE_EMAIL_ROLES[email];
      const initials = mapped?.initials
        || gname.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2)
        || 'U';

      const session = {
        username:    email,
        name:        mapped?.name || gname,
        role:        mapped?.role || 'Sales',
        initials,
        email,
        googleLogin: true,
        ts:          Date.now(),
      };

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      window._currentUser = session;
      const screen = document.getElementById('qf-login-screen');
      if (screen) {
        screen.style.opacity    = '0';
        screen.style.transition = 'opacity .3s';
        setTimeout(() => screen.remove(), 300);
      }
      applyUser(session);
    } catch(e) {
      console.error('Google sign-in error:', e);
      _showGoogleError('Google sign-in failed. Please use username / password instead.');
    }
  };

  function _showGoogleError(msg) {
    const errEl = document.getElementById('qf-login-error');
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  }

  // Called by the GIS script's onload attribute
  window.initGoogleSignIn = function() {
    if (typeof google === 'undefined' || !google.accounts) return;
    google.accounts.id.initialize({
      client_id:             GOOGLE_CLIENT_ID,
      callback:              window._googleCredentialCallback,
      auto_select:           false,
      cancel_on_tap_outside: true,
    });
    const btn = document.getElementById('google-signin-btn');
    if (btn) {
      google.accounts.id.renderButton(btn, {
        theme:          'outline',
        size:           'large',
        width:          320,
        text:           'signin_with',
        shape:          'rectangular',
        logo_alignment: 'left',
      });
    }
  };

  // Run session check immediately
  if (!checkSession()) {
    // Login screen is visible by default, nothing to do
  }
})();

'use strict';

// ── GLOBAL ERROR HANDLER (shows errors in a toast instead of silent fail)
window.addEventListener('error', function(e) {
  console.error('QuoteFlow Error:', e.message, 'at', e.filename, 'line', e.lineno);
  if (typeof showToast === 'function') {
    showToast('JS Error: ' + e.message.slice(0, 80), 'error');
  }
});

// ── DATA STORE ──────────────────────────────────────────────────────────────
const DB = {
  customers:   [],  // loaded from Supabase on startup
  inquiries:   [],  // loaded from Supabase inquiries table
  quotes:      [],  // loaded from Supabase quotes table
  lineItems:   [],
  leads:       [],  // quote-derived + manual leads from leads table
  samples:     [],  // loaded from Supabase samples table
  followups:   {},  // loaded from Supabase followups table
  chatHistory: {},  // loaded from Supabase chat_history table
  products:    [],  // loaded from Supabase products table
};

// ── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const SUPA_URL  = 'https://tlrbjhmxokrfedsiwvof.supabase.co';
const SUPA_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmJqaG14b2tyZmVkc2l3dm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzI0MDgsImV4cCI6MjA5MzU0ODQwOH0.L2iniw0YldKoJ8zS01KgWA_Frv_HG5pdJj9eiRcOdu0';
const _sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);

// Map a Supabase customers row → internal JS customer object
function supabaseRowToCustomer(r) {
  const contacts = [];
  if (r.primary_contact_name) contacts.push({ name: r.primary_contact_name, designation: r.primary_contact_designation||'', email: r.primary_contact_email||'', phone: r.primary_contact_phone||'', primary: true });
  if (r.contact2_name)        contacts.push({ name: r.contact2_name,        designation: r.contact2_designation||'',        email: r.contact2_email||'',        phone: r.contact2_phone||'',        primary: false });
  if (r.contact3_name)        contacts.push({ name: r.contact3_name,        designation: r.contact3_designation||'',        email: r.contact3_email||'',        phone: r.contact3_phone||'',        primary: false });

  const nextOrders = [];
  if (r.next_order_product1) nextOrders.push({ product: r.next_order_product1, qty: r.next_order_qty1 != null ? String(r.next_order_qty1) : '', date: r.next_order_date1||'' });
  if (r.next_order_product2) nextOrders.push({ product: r.next_order_product2, qty: r.next_order_qty2 != null ? String(r.next_order_qty2) : '', date: r.next_order_date2||'' });

  const primary  = contacts[0] || {};
  const tierMap  = { Bronze:'bronze', Silver:'silver', Gold:'gold', Platinum:'platinum' };
  const pay100   = r.payment_rating  != null ? parseFloat(r.payment_rating)  * 100 : 0;
  const ord100   = r.orders_rating   != null ? parseFloat(r.orders_rating)   * 100 : 0;
  const trd100   = r.trend_rating    != null ? parseFloat(r.trend_rating)    * 100 : 0;

  return {
    id:            r.customer_id,
    company:       r.company_name || '',
    contact:       primary.name   || '',
    email:         primary.email  || '',
    phone:         primary.phone  || '',
    gstin:         r.gstin        || '',
    city:          r.city         || '',
    address:       r.billing_address || '',
    incoterms:     r.incoterms    || 'EXW',
    payment:       r.payment_terms || '30 Days Net',
    segment:       r.industry_segment || '',
    industry:      r.industry_segment || '',
    tier:          tierMap[r.tier] || 'new',
    turnover:      parseFloat(r.last_fy_turnover) || 0,
    revenue:       parseFloat(r.revenue_ytd)      || 0,
    quotes:        parseInt(r.total_quotes)        || 0,
    crossSell:     r.cross_sell_opportunities ? r.cross_sell_opportunities.split(',').map(s=>s.trim()).filter(Boolean) : [],
    contacts,
    nextOrders,
    nextOrderDate: nextOrders[0]?.date || null,
    customerRating: { paymentOnTime: pay100, regularOrders: ord100, increasingTrend: trd100 },
    rating:        (pay100+ord100+trd100)/3 >= 80 ? 'A — Key Account' : 'B — Regular',
    _fromSupabase: true,
  };
}

// Map JS customer object → Supabase upsert payload
function customerToSupabaseRow(c) {
  const co = c.contacts || [];
  const p  = co.find(x=>x.primary) || co[0] || {};
  const c2 = co[1] || {};
  const c3 = co[2] || {};
  const no = c.nextOrders || [];
  const tierMap = { bronze:'Bronze', silver:'Silver', gold:'Gold', platinum:'Platinum', new:'Bronze' };
  return {
    customer_id:               c.id,
    company_name:              c.company,
    industry_segment:          c.industry || c.segment || null,
    gstin:                     c.gstin    || null,
    city:                      c.city     || null,
    billing_address:           c.address  || null,
    state:                     c.state    || null,
    tier:                      tierMap[c.tier] || 'Bronze',
    last_fy_turnover:          c.turnover || null,
    incoterms:                 c.incoterms || null,
    payment_terms:             c.payment   || null,
    currency:                  'INR',
    payment_rating:            c.customerRating?.paymentOnTime  ? c.customerRating.paymentOnTime  / 100 : null,
    orders_rating:             c.customerRating?.regularOrders  ? c.customerRating.regularOrders  / 100 : null,
    trend_rating:              c.customerRating?.increasingTrend? c.customerRating.increasingTrend/ 100 : null,
    primary_contact_name:      p.name        || null,
    primary_contact_designation: p.designation || null,
    primary_contact_email:     p.email       || null,
    primary_contact_phone:     p.phone       || null,
    contact2_name:             c2.name       || null,
    contact2_designation:      c2.designation|| null,
    contact2_email:            c2.email      || null,
    contact2_phone:            c2.phone      || null,
    contact3_name:             c3.name       || null,
    contact3_designation:      c3.designation|| null,
    contact3_email:            c3.email      || null,
    contact3_phone:            c3.phone      || null,
    next_order_product1:       no[0]?.product|| null,
    next_order_qty1:           no[0]?.qty    ? parseFloat(no[0].qty) : null,
    next_order_date1:          no[0]?.date   || null,
    next_order_product2:       no[1]?.product|| null,
    next_order_qty2:           no[1]?.qty    ? parseFloat(no[1].qty) : null,
    next_order_date2:          no[1]?.date   || null,
    cross_sell_opportunities:  (c.crossSell||[]).join(', ') || null,
    revenue_ytd:               c.revenue     || null,
    total_quotes:              c.quotes      || null,
    created_by:                'ERP',
  };
}

// Fetch all customers from Supabase, replace DB.customers, re-render
let _customersLoading = false;
async function loadCustomersFromSupabase() {
  if (_customersLoading) return;
  _customersLoading = true;
  // Show loading state in table if it's open
  const tbody = document.getElementById('customers-table-body');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--gray400);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:qf-spin 1s linear infinite;vertical-align:middle;margin-right:8px"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Loading customers from database…</td></tr>';
  try {
    let allRows = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await _sb.from('customers').select('*').range(from, from + PAGE - 1).order('customer_id');
      if (error) throw error;
      if (!data || data.length === 0) break;
      allRows = allRows.concat(data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    // Replace DB.customers — keep the 5 sample records as fallback structure, load live data
    DB.customers = allRows.map(supabaseRowToCustomer);
    if (typeof renderCustomers === 'function') renderCustomers();
    if (typeof refreshCustomerDropdown === 'function') refreshCustomerDropdown();
    showToast('Customer Master loaded — ' + DB.customers.length + ' accounts', 'success');
  } catch(err) {
    console.error('Supabase load error:', err);
    showToast('Could not load customers from DB — showing cached data', 'error');
    if (typeof renderCustomers === 'function') renderCustomers();
  } finally {
    _customersLoading = false;
  }
}

// ── LINE ITEMS STATE ─────────────────────────────────────────────────────────
let currentLines = [];
let lineCounter = 0;

// ── NAVIGATION ───────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:'Dashboard',inquiries:'Inquiry Hub',quotations:'Quotations',
  'new-quote':'New Quotation',customers:'Customer Master',reports:'Analytics',settings:'Integrations',
  pipeline:'Sales Pipeline',sampling:'Sampling Tracker',followups:'Follow-up Tracker'
};

function nav(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('page-'+page);
  if (el) el.classList.add('active');
  const navEls = document.querySelectorAll('.nav-item');
  navEls.forEach(n => {
    if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'"+page+"'")) n.classList.add('active');
  });
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;
  if (page === 'new-quote') initNewQuote();
  if (page === 'customers') { renderCustomers(); loadCustomersFromSupabase(); }
  if (page === 'reports') renderReports();
  if (page === 'inquiries') { renderInquiries('all'); loadInquiriesFromSupabase(); }
  if (page === 'pipeline') { renderPipeline(); loadPipelineFromSupabase(); loadFollowupsFromSupabase(); loadInquiriesFromSupabase().then(() => renderPipeline()); }
  if (page === 'sampling') { renderSampling(); loadSamplesFromSupabase(); }
  if (page === 'followups') { loadFollowupsModule(); }
  window.scrollTo(0,0);
}

// ── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, type='') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' '+type : '');
  t.textContent = (type === 'success' ? '✓  ' : type === 'error' ? '✗  ' : 'ℹ  ') + msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── MODALS ───────────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function toggleSidebar() {
  const sb = document.getElementById('main-sidebar');
  if (sb) sb.classList.toggle('collapsed');
}

// Update a sidebar nav badge — shows count if > 0, hides if zero
function updateNavBadge(badgeId, count) {
  const el = document.getElementById(badgeId);
  if (!el) return;
  if (count > 0) { el.textContent = count; el.style.display = ''; }
  else { el.style.display = 'none'; }
}
// openNewCustomerModal() — replaced by V3 version below

// ── SAVE CUSTOMER ─────────────────────────────────────────────────────────────
// saveCustomer() — replaced by V3 version below

// ── RENDER CUSTOMERS ──────────────────────────────────────────────────────────

// renderCustomers() — V3 version defined in V3 NEW FUNCTIONS section

function startQuoteFor(customerId) {
  nav('new-quote');
  setTimeout(() => {
    const c = DB.customers.find(x => x.id === customerId);
    if (c) {
      const inputEl  = document.getElementById('q-customer-input');
      const hiddenEl = document.getElementById('q-customer');
      if (inputEl)  inputEl.value  = c.company;
      if (hiddenEl) hiddenEl.value = customerId;
      fillCustomerDefaults(customerId);
    }
  }, 50);
}

// ── RENDER INQUIRIES ──────────────────────────────────────────────────────────
function renderInquiries(filter) {
  const list = document.getElementById('inquiry-list');
  if (!list) return;

  // Update tab badge counts from real data
  const setCount = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setCount('inq-count-all',      DB.inquiries.length);
  setCount('inq-count-gmail',    DB.inquiries.filter(i => i.captured_from === 'email'     || i.source === 'gmail').length);
  setCount('inq-count-indiamart',DB.inquiries.filter(i => i.captured_from === 'indiamart' || i.source === 'indiamart').length);
  setCount('inq-count-manual',   DB.inquiries.filter(i => i.captured_from === 'call' || i.captured_from === 'whatsapp' || i.source === 'manual').length);

  const filtered = filter === 'all' ? DB.inquiries : DB.inquiries.filter(i => {
    if (filter === 'gmail')     return i.captured_from === 'email'     || i.source === 'gmail';
    if (filter === 'indiamart') return i.captured_from === 'indiamart' || i.source === 'indiamart';
    if (filter === 'manual')    return i.captured_from === 'call' || i.captured_from === 'whatsapp' || i.source === 'manual';
    return false;
  });
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg></div><div class="empty-title">No inquiries</div><div class="empty-desc">Add inquiries manually or sync from IndiaMART.</div></div>`;
    return;
  }
  const palette = ['#7C3AED','#1A6FDB','#D97706','#0F8A6F','#D85A30'];
  const capturedLabel = {email:'Email',call:'Call',whatsapp:'WhatsApp',indiamart:'Indiamart',notes:'Notes',gmail:'Gmail',manual:'Manual'};
  list.innerHTML = filtered.map((inq, idx) => {
    const company = inq.company || '—';
    const color = palette[idx % palette.length];
    const sourceKey = inq.captured_from || inq.source || 'manual';
    const srcLabel = capturedLabel[sourceKey] || sourceKey;
    const srcPillClass = sourceKey === 'indiamart' ? 'source-indiamart' : sourceKey === 'gmail' || sourceKey === 'email' ? 'source-gmail' : 'source-manual';
    const isNewCust = !inq.customer_id;
    const custTypeBadge = !isNewCust
      ? `<span class="badge badge-teal" style="font-size:10px;">Existing</span>`
      : `<span class="badge badge-gray" style="font-size:10px;">New Customer</span>`;
    const estVal = inq.estimated_value ? `<span style="font-size:12px;font-weight:600;color:var(--gray700);">₹${(inq.estimated_value/100000).toFixed(2)}L</span>` : '';
    const isConverted = inq.status === 'converted';
    return `
    <div class="inquiry-card${inq.unread?' unread':''}" style="${isConverted?'opacity:.7;':''}">
      <div class="inq-avatar" style="background:${color};">${company.slice(0,2).toUpperCase()}</div>
      <div class="inq-content">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="inq-name">${company}</span>
          ${custTypeBadge}
          ${inq.unread ? '<span class="badge badge-blue" style="font-size:10px;padding:1px 6px;">New</span>' : ''}
          <span class="source-pill ${srcPillClass}" style="margin-left:auto;">${srcLabel}</span>
        </div>
        <div class="inq-subject">${inq.product_interest || inq.subject || '—'}</div>
        <div style="font-size:12px;color:var(--gray500);margin-top:2px;">${inq.contact ? '👤 '+inq.contact : ''}${inq.phone ? '&nbsp; 📞 '+inq.phone : ''}${inq.email ? '&nbsp; ✉ '+inq.email : ''}</div>
        <div class="inq-meta" style="margin-top:8px;">
          ${inq.product_interest ? `<span class="tag">${inq.product_interest}</span>` : ''}
          ${inq.quantity ? `<span class="tag">${inq.quantity}</span>` : ''}
          ${estVal}
          <span class="inq-time">${inq.date || ''}</span>
          <span class="badge ${isConverted?'badge-teal':inq.status==='open'?'badge-blue':'badge-gray'}" style="font-size:10px;">${isConverted?'Converted':inq.status||'open'}</span>
          <button class="btn btn-ghost btn-sm" style="font-size:12px;margin-left:auto;" onclick="event.stopPropagation();openEditInquiryModal('${inq.id}')">✏ Edit</button>
          <button class="btn btn-primary btn-sm" style="font-size:12px;" onclick="event.stopPropagation();openInquiryQuote('${inq.id}')">Create Quote →</button>
        </div>
        ${isNewCust ? `<div style="display:flex;align-items:center;gap:6px;margin-top:8px;padding:6px 10px;background:var(--amber-light);border:1px solid rgba(217,119,6,.25);border-radius:6px;font-size:11px;color:var(--amber);font-weight:500;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Add details in Customer DB &nbsp;<button class="btn btn-sm" style="font-size:10px;padding:2px 8px;background:var(--amber);color:#fff;border:none;border-radius:4px;" onclick="event.stopPropagation();nav('customers');showToast('Add ${inq.company} to the customer database','info')">Go to Customers →</button></div>` : ''}
        ${inq.notes ? `<div style="font-size:11px;color:var(--gray500);margin-top:6px;padding-top:6px;border-top:1px solid var(--gray100);">📝 ${inq.notes}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function filterInquiries(filter, el) {
  document.querySelectorAll('#page-inquiries .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderInquiries(filter);
}

function openInquiryQuote(inqId) {
  const inq = DB.inquiries.find(i => i.id === inqId);
  if (!inq) return;
  nav('new-quote');
  setTimeout(() => {
    // Pre-fill customer typeahead if company known
    const custInput = document.getElementById('q-customer-input');
    const custId    = document.getElementById('q-customer-id');
    if (custInput) custInput.value = inq.company || '';
    if (custId && inq.customer_id) custId.value = inq.customer_id;

    // Source
    const sel = document.getElementById('q-source');
    if (sel) {
      const src = inq.captured_from || inq.source;
      if (src === 'indiamart') sel.value = 'indiamart';
      else if (src === 'email' || src === 'gmail') sel.value = 'email';
      else sel.value = 'manual';
    }

    // Notes prefill
    const notesEl = document.getElementById('q-notes');
    if (notesEl) {
      let n = '';
      if (inq.contact) n += `Contact: ${inq.contact}\n`;
      if (inq.email)   n += `Email: ${inq.email}\n`;
      if (inq.phone)   n += `Phone: ${inq.phone}\n`;
      if (inq.product_interest) n += `Product: ${inq.product_interest}\n`;
      if (inq.quantity)         n += `Qty: ${inq.quantity}\n`;
      if (inq.notes)            n += `Notes: ${inq.notes}`;
      notesEl.value = n.trim();
    }

    showToast('Inquiry loaded into quote form', 'success');
    inq.unread = false;

    // Mark inquiry as converted in Supabase
    _sb.from('inquiries').update({ status: 'converted' }).eq('inquiry_id', inqId).then(() => {});
    inq.status = 'converted';
  }, 120);
}

// ── INQUIRY MODAL: STYLES + DATETIME FIELD HELPERS ───────────────────────────
(function _injectInquiryStyles() {
  if (document.getElementById('_inq_styles')) return;
  const s = document.createElement('style');
  s.id = '_inq_styles';
  s.textContent = [
    'button[onclick="syncGmail()"],button[onclick*="syncGmail"]{display:none!important}',
    '#add-inquiry-modal .modal{max-width:700px;width:96vw;border-radius:16px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.22)}',
    '#add-inquiry-modal .modal-header{background:linear-gradient(135deg,#1e3a8a 0%,#1A6FDB 100%);padding:20px 28px}',
    '#add-inquiry-modal .modal-title{color:#fff!important;font-size:16px;font-weight:700}',
    '#add-inquiry-modal .modal-close{color:rgba(255,255,255,.75)!important;font-size:20px}',
    '#add-inquiry-modal .modal-close:hover{color:#fff!important}',
    '#add-inquiry-modal .modal-body{padding:22px 28px!important;gap:14px!important}',
    '#add-inquiry-modal .form-label{font-size:11px!important;font-weight:700!important;color:#6b7280!important;text-transform:uppercase!important;letter-spacing:.07em!important;display:block;margin-bottom:5px}',
    '#add-inquiry-modal .form-input{border:1.5px solid #e5e7eb!important;border-radius:8px!important;padding:9px 13px!important;font-size:14px!important;background:#fafafa!important;transition:border-color .15s,box-shadow .15s;outline:none!important;width:100%;box-sizing:border-box}',
    '#add-inquiry-modal .form-input:focus{border-color:#1A6FDB!important;box-shadow:0 0 0 3px rgba(26,111,219,.1)!important;background:#fff!important}',
    '#add-inquiry-modal textarea.form-input{min-height:88px;resize:vertical}',
    '#add-inquiry-modal .modal-footer{padding:14px 28px 22px!important;border-top:1px solid #f3f4f6;background:#f9fafb;gap:10px;justify-content:flex-end}',
    '#add-inquiry-modal #inq-save-btn{background:linear-gradient(135deg,#1e3a8a,#1A6FDB)!important;border:none!important;padding:10px 26px!important;font-size:14px!important;font-weight:600!important;border-radius:8px!important;color:#fff!important;cursor:pointer}',
    '#add-inquiry-modal #inq-save-btn:disabled{opacity:.6;cursor:not-allowed}',
  ].join('\n');
  document.head.appendChild(s);
})();

function _ensureInquiryDatetimeField() {
  if (document.getElementById('inq-datetime')) return;
  const body = document.querySelector('#add-inquiry-modal .modal-body');
  if (!body) return;
  const row = document.createElement('div');
  row.id = '_inq_dt_row';
  row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;';
  row.innerHTML =
    '<div><label class="form-label">Inquiry Date &amp; Time <span style="color:#dc2626;">*</span></label>' +
    '<input type="datetime-local" id="inq-datetime" class="form-input"></div>' +
    '<div><label class="form-label">Status</label>' +
    '<select id="inq-status" class="form-input">' +
    '<option value="new">New</option><option value="open">Open</option>' +
    '<option value="converted">Converted</option><option value="closed">Closed</option>' +
    '</select></div>';
  const notesDiv = Array.from(body.children).find(d => d.querySelector('textarea'));
  if (notesDiv) body.insertBefore(row, notesDiv); else body.appendChild(row);
}

// ── ADD INQUIRY MODAL ─────────────────────────────────────────────────────────
function openAddInquiryModal() {
  _ensureInquiryDatetimeField();
  // Reset modal to Add mode
  const _eSB = document.getElementById('inq-save-btn');
  if (_eSB) { _eSB.textContent = 'Save Inquiry'; _eSB.setAttribute('onclick', 'saveInquiry()'); _eSB.disabled = false; }
  const titleEl = document.querySelector('#add-inquiry-modal .modal-title');
  if (titleEl) titleEl.textContent = 'Add New Inquiry';
  // Reset form
  ['inq-company','inq-contact','inq-email','inq-phone','inq-quantity','inq-notes'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const estEl = document.getElementById('inq-est-value'); if (estEl) estEl.value = '';
  const cfEl  = document.getElementById('inq-captured-from'); if (cfEl) cfEl.value = '';
  const stEl  = document.getElementById('inq-status'); if (stEl) stEl.value = 'new';
  // Set datetime to now
  const dtEl = document.getElementById('inq-datetime');
  if (dtEl) {
    const _n = new Date();
    dtEl.value = _n.getFullYear()+'-'+(_n.getMonth()+1).toString().padStart(2,'0')+'-'+_n.getDate().toString().padStart(2,'0')+'T'+_n.getHours().toString().padStart(2,'0')+':'+_n.getMinutes().toString().padStart(2,'0');
  }
  // Populate product dropdown with unique categories
  const prodEl = document.getElementById('inq-product');
  if (prodEl) {
    const cats = [...new Set((DB.products||[]).map(p => p.cat||p.category||p.name||p.product_name||p.code).filter(Boolean))].sort();
    prodEl.innerHTML = '<option value="">— Select product —</option>' +
      cats.map(c => `<option value="${c}">${c}</option>`).join('');
    prodEl.value = '';
  }
  setInquiryCustomerType('new', '');
  document.getElementById('add-inquiry-modal').style.display = 'flex';
}

function closeAddInquiryModal() {
  document.getElementById('add-inquiry-modal').style.display = 'none';
}

// ── EDIT INQUIRY MODAL ────────────────────────────────────────────────────────
function openEditInquiryModal(inqId) {
  _ensureInquiryDatetimeField();
  const inq = DB.inquiries.find(i => i.id === inqId);
  if (!inq) return;
  const titleEl = document.querySelector('#add-inquiry-modal .modal-title');
  if (titleEl) titleEl.textContent = 'Edit Inquiry — ' + (inq.company || inqId);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = (val != null) ? val : ''; };
  set('inq-company',       inq.company);
  set('inq-contact',       inq.contact);
  set('inq-email',         inq.email);
  set('inq-phone',         inq.phone);
  set('inq-quantity',      inq.quantity);
  set('inq-notes',         inq.notes);
  set('inq-est-value',     inq.estimated_value != null ? inq.estimated_value : '');
  set('inq-captured-from', inq.captured_from || inq.source || '');
  const prodEl = document.getElementById('inq-product');
  if (prodEl) {
    const cats = [...new Set((DB.products||[]).map(p => p.cat||p.category||p.name||p.product_name||p.code).filter(Boolean))].sort();
    prodEl.innerHTML = '<option value="">— Select product —</option>' + cats.map(c => '<option value="'+c+'">' + c + '</option>').join('');
    prodEl.value = inq.product_interest || '';
  }
  const dtEl = document.getElementById('inq-datetime');
  if (dtEl) {
    if (inq.enquiry_datetime) dtEl.value = inq.enquiry_datetime.slice(0,16);
    else if (inq.date) dtEl.value = inq.date + 'T00:00';
  }
  set('inq-status', inq.status || 'new');
  setInquiryCustomerType(inq.customer_type || (inq.customer_id ? 'existing' : 'new'), inq.customer_id || '');
  const saveBtn = document.getElementById('inq-save-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Save Changes';
    saveBtn.setAttribute('onclick', "saveEditedInquiry('" + inqId + "')");
    saveBtn.disabled = false;
  }
  document.getElementById('add-inquiry-modal').style.display = 'flex';
}

async function saveEditedInquiry(inqId) {
  const company      = (document.getElementById('inq-company')?.value || '').trim();
  const capturedFrom = document.getElementById('inq-captured-from')?.value || '';
  const product      = document.getElementById('inq-product')?.value || '';
  const inqOrig      = DB.inquiries.find(i => i.id === inqId) || {};
  if (!company) { showToast('Company name is required', 'error'); return; }
  const btn = document.getElementById('inq-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  const custType  = document.getElementById('inq-customer-type')?.value || inqOrig.customer_type || 'new';
  const custId    = document.getElementById('inq-customer-id')?.value   || inqOrig.customer_id  || null;
  const contact   = (document.getElementById('inq-contact')?.value  || '').trim();
  const email     = (document.getElementById('inq-email')?.value    || '').trim();
  const phone     = (document.getElementById('inq-phone')?.value    || '').trim();
  const quantity  = (document.getElementById('inq-quantity')?.value || '').trim();
  const estValue  = parseFloat(document.getElementById('inq-est-value')?.value) || null;
  const notes     = (document.getElementById('inq-notes')?.value    || '').trim();
  const status    = document.getElementById('inq-status')?.value    || inqOrig.status || 'new';
  const dtRaw     = document.getElementById('inq-datetime')?.value  || '';
  const updates = {
    company_name:     company,
    contact_name:     contact      || null,
    email:            email        || null,
    phone:            phone        || null,
    source:           capturedFrom || inqOrig.source || null,
    captured_from:    capturedFrom || inqOrig.captured_from || null,
    product_interest: product      || inqOrig.product_interest || null,
    quantity:         quantity     || null,
    estimated_value:  estValue,
    notes:            notes        || null,
    customer_type:    custType,
    customer_id:      custId       || null,
    status:           status,
  };
  if (dtRaw) updates.enquiry_datetime = new Date(dtRaw).toISOString();
  try {
    const { error } = await _sb.from('inquiries').update(updates).eq('inquiry_id', inqId);
    if (error) throw error;
    const idx = DB.inquiries.findIndex(i => i.id === inqId);
    if (idx >= 0) {
      Object.assign(DB.inquiries[idx], {
        company:          updates.company_name,
        contact:          updates.contact_name,
        email:            updates.email,
        phone:            updates.phone,
        source:           updates.source,
        captured_from:    updates.captured_from,
        product_interest: updates.product_interest,
        quantity:         updates.quantity,
        estimated_value:  updates.estimated_value,
        notes:            updates.notes,
        customer_type:    updates.customer_type,
        customer_id:      updates.customer_id,
        status:           updates.status,
        enquiry_datetime: updates.enquiry_datetime || DB.inquiries[idx].enquiry_datetime,
      });
    }
    showToast('Inquiry updated successfully', 'success');
    closeAddInquiryModal();
    renderInquiries('all');
  } catch(e) {
    console.error('saveEditedInquiry error:', e);
    showToast('Save failed: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Save Changes'; }
  }
}

function setInquiryCustomerType(type, custId) {
  document.getElementById('inq-customer-type').value = type;
  document.getElementById('inq-customer-id').value   = custId || '';
  const badge = document.getElementById('inq-customer-type-badge');
  if (badge) {
    badge.textContent  = type === 'existing' ? 'Existing Customer' : 'New Customer';
    badge.className    = 'badge ' + (type === 'existing' ? 'badge-teal' : 'badge-gray');
  }
}

function filterInquiryCompany(val) {
  const suggest = document.getElementById('inq-company-suggest');
  if (!suggest) return;
  const q = val.trim().toLowerCase();
  if (!q) { suggest.style.display = 'none'; return; }
  const matches = DB.customers.filter(c =>
    (c.company||'').toLowerCase().includes(q)
  ).slice(0, 8);
  if (!matches.length) {
    suggest.innerHTML = `<div style="padding:10px 14px;font-size:12px;color:var(--gray400);">No existing customer — will be added as New</div>`;
    setInquiryCustomerType('new', '');
  } else {
    suggest.innerHTML = matches.map(c => `
      <div onclick="selectInquiryCompany('${c.id}')"
        style="padding:9px 14px;font-size:13px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--gray100);"
        onmouseover="this.style.background='var(--gray50)'" onmouseout="this.style.background=''">
        <div style="width:28px;height:28px;border-radius:7px;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0;">${(c.company||'?').slice(0,2).toUpperCase()}</div>
        <div>
          <div style="font-weight:600;">${c.company}</div>
          <div style="font-size:11px;color:var(--gray400);">${c.city||''} ${c.country||''} · ${c.contact_name||c.email||''}</div>
        </div>
      </div>`).join('');
  }
  suggest.style.display = 'block';
}

function selectInquiryCompany(custId) {
  const cust = DB.customers.find(c => c.id === custId);
  if (!cust) return;
  document.getElementById('inq-company').value  = cust.company || '';
  document.getElementById('inq-contact').value  = cust.contact_name || cust.contact || '';
  document.getElementById('inq-email').value    = cust.email   || '';
  document.getElementById('inq-phone').value    = cust.phone   || cust.mobile || '';
  document.getElementById('inq-company-suggest').style.display = 'none';
  setInquiryCustomerType('existing', custId);
}

function hideInquiryCompanySuggest() {
  const el = document.getElementById('inq-company-suggest');
  if (el) el.style.display = 'none';
  // If typed name doesn't match any customer, it's new
  const val = (document.getElementById('inq-company')?.value || '').trim().toLowerCase();
  const match = DB.customers.find(c => (c.company||'').toLowerCase() === val);
  if (!match) setInquiryCustomerType('new', '');
}

async function saveInquiry() {
  const company      = document.getElementById('inq-company')?.value.trim();
  const capturedFrom = document.getElementById('inq-captured-from')?.value;
  const product      = document.getElementById('inq-product')?.value;

  if (!company)      { showToast('Company name is required', 'error'); return; }
  if (!capturedFrom) { showToast('Please select enquiry source', 'error'); return; }
  if (!product)      { showToast('Please select a product', 'error'); return; }

  const btn = document.getElementById('inq-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  const custType  = document.getElementById('inq-customer-type')?.value || 'new';
  const custId    = document.getElementById('inq-customer-id')?.value   || null;
  const contact   = document.getElementById('inq-contact')?.value.trim() || '';
  const email     = document.getElementById('inq-email')?.value.trim()   || '';
  const phone     = document.getElementById('inq-phone')?.value.trim()   || '';
  const quantity  = document.getElementById('inq-quantity')?.value.trim()|| '';
  const estValue  = parseFloat(document.getElementById('inq-est-value')?.value) || null;
  const notes     = document.getElementById('inq-notes')?.value.trim()   || '';
  const inqDtRaw  = document.getElementById('inq-datetime')?.value || '';
  const inqDt     = inqDtRaw ? new Date(inqDtRaw).toISOString() : new Date().toISOString();
  const today     = inqDtRaw ? inqDtRaw.split('T')[0] : new Date().toISOString().split('T')[0];
  const inqId     = 'INQ-' + Date.now();

  const row = {
    inquiry_id:      inqId,
    company_name:    company,
    contact_name:    contact,
    email:           email,
    phone:           phone,
    source:          capturedFrom,
    captured_from:   capturedFrom,
    date:            today,
    product_interest: product,
    quantity:        quantity,
    status:          document.getElementById('inq-status')?.value || 'new',
    customer_type:   custType,
    customer_id:     custId || null,
    estimated_value: estValue,
    notes:           notes,
    created_date:    new Date().toISOString(),
    enquiry_datetime: inqDt,
  };

  try {
    const { error } = await _sb.from('inquiries').insert(row);
    if (error) throw error;

    // Add to local DB
    DB.inquiries.unshift({
      id:              inqId,
      company:         company,
      contact:         contact,
      email:           email,
      phone:           phone,
      source:          capturedFrom,
      captured_from:   capturedFrom,
      date:            today,
      product_interest: product,
      quantity:        quantity,
      status:          row.status,
      unread:          true,
      customer_type:   custType,
      customer_id:     custId || null,
      estimated_value: estValue,
      notes:           notes,
      enquiry_datetime: inqDt,
    });

    updateNavBadge('nav-badge-inquiries', DB.inquiries.filter(i => i.unread).length);
    renderInquiries('all');
    // Reset active tab to All
    document.querySelectorAll('#page-inquiries .tab').forEach((t,i) => t.classList.toggle('active', i===0));
    closeAddInquiryModal();
    showToast('Inquiry saved successfully', 'success');
  } catch(e) {
    console.error('saveInquiry error:', e.message);
    showToast('Failed to save inquiry: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Save Inquiry'; }
  }
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  // ── Month helpers ─────────────────────────────────────────────
  const now      = new Date();
  const pad      = n => String(n).padStart(2,'0');
  const thisM    = now.getFullYear() + '-' + pad(now.getMonth() + 1);
  const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastM    = lastDate.getFullYear() + '-' + pad(lastDate.getMonth() + 1);

  const thisQ = (DB.quotes || []).filter(q => (q.date || '').startsWith(thisM));
  const lastQ = (DB.quotes || []).filter(q => (q.date || '').startsWith(lastM));

  // ── Total Quotes Sent ─────────────────────────────────────────
  const qCount     = thisQ.length;
  const qCountLast = lastQ.length;
  const qCountPct  = qCountLast > 0 ? Math.round((qCount - qCountLast) / qCountLast * 100) : null;

  // ── Quote Value (Crores) ──────────────────────────────────────
  const valThis = thisQ.reduce((s, q) => s + (parseFloat(q.value) || 0), 0);
  const valLast = lastQ.reduce((s, q) => s + (parseFloat(q.value) || 0), 0);
  const valPct  = valLast > 0 ? Math.round((valThis - valLast) / valLast * 100) : null;
  const toCr    = v => v >= 1e7
    ? (v / 1e7).toFixed(2) + ' Cr'
    : v >= 1e5 ? (v / 1e5).toFixed(1) + 'L'
    : '₹' + v.toLocaleString('en-IN');

  // ── Win Rate ──────────────────────────────────────────────────
  const wonThis  = thisQ.filter(q => (q.status || '').toLowerCase() === 'won').length;
  const wonLast  = lastQ.filter(q => (q.status || '').toLowerCase() === 'won').length;
  const winThis  = qCount > 0 ? Math.round(wonThis / qCount * 100) : 0;
  const winLast  = qCountLast > 0 ? Math.round(wonLast / qCountLast * 100) : 0;
  const winPct   = qCountLast > 0 ? (winThis - winLast) : null;

  // ── Active Customers ──────────────────────────────────────────
  const activeCustIds = new Set(thisQ.map(q => q.customerId).filter(Boolean));
  const activeCount   = activeCustIds.size || (DB.customers || []).filter(c => c.tier && c.tier !== 'new').length;

  // ── KPI badge helper ──────────────────────────────────────────
  const badge = (el, pct, suffix) => {
    if (!el) return;
    if (pct === null) {
      el.className = 'stat-change';
      el.textContent = 'No data last month';
      return;
    }
    const up = pct >= 0;
    el.className = 'stat-change ' + (up ? 'up' : 'down');
    el.textContent = (up ? '↑ ' : '↓ ') + Math.abs(pct) + (suffix || '% vs last month');
  };

  // ── Set values ────────────────────────────────────────────────
  const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setTxt('kpi-quotes-count',  qCount);
  setTxt('kpi-value-amount',  toCr(valThis));
  setTxt('kpi-win-rate',      winThis + '%');
  setTxt('kpi-active-count',  activeCount);
  badge(document.getElementById('kpi-quotes-badge'), qCountPct);
  badge(document.getElementById('kpi-value-badge'),  valPct);
  badge(document.getElementById('kpi-win-badge'),    winPct, 'pp vs last month');

  // ── Pipeline funnel ───────────────────────────────────────────
  const funnel = document.getElementById('dash-pipeline-funnel');
  if (funnel) {
    const stages = ['lead','quoted','sampling','negotiating','won','lost'];
    const savedInqStages = JSON.parse(localStorage.getItem('htErp_inq_stages') || '{}');
    funnel.innerHTML = stages.map(s => {
      const qItems  = (DB.leads || []).filter(l => l.stage === s);
      const inqItems= (DB.inquiries || []).filter(i => (i._pipeline_stage || savedInqStages[i.id] || 'lead') === s);
      const count   = qItems.length + inqItems.length;
      const val     = [...qItems,...inqItems].reduce((a,b) => a+(b.value||0),0);
      const label   = s.charAt(0).toUpperCase()+s.slice(1);
      return `<div class="jp-stage" onclick="setStageFilter && setStageFilter('${s}')">
        <div class="jp-label">${label}</div>
        <div class="jp-count">${count}</div>
        <div class="jp-val">${val>0?'₹'+(val/1e5).toFixed(1)+'L':'—'}</div>
      </div>`;
    }).join('');
  }

  // ── Recent Quotes ─────────────────────────────────────────────
  const tbody = document.getElementById('recent-quotes-body');
  if (tbody) {
    const recent = (DB.quotes || []).slice(0, 5);
    tbody.innerHTML = recent.length
      ? recent.map(q => `<tr>
          <td style="font-family:var(--font-mono);font-size:12px;">${q.id}</td>
          <td>${q.customer}</td>
          <td style="font-family:var(--font-mono);">₹${(q.value/1e5).toFixed(2)}L</td>
          <td><span class="status-badge">${q.status||'—'}</span></td>
          <td>${q.date||'—'}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--gray400);">No quotes yet</td></tr>';
  }
}

// ── QUOTATIONS TABLE ──────────────────────────────────────────────────────────
function renderQuotations() {
  const tbody = document.getElementById('quotes-table-body');
  if (!tbody) return;
  tbody.innerHTML = DB.quotes.map(q => `
    <tr>
      <td class="td-mono td-bold">${q.id}</td>
      <td>${q.customer}</td>
      <td style="text-align:center;">${q.items}</td>
      <td class="td-mono" style="font-weight:600;">₹${q.value.toLocaleString('en-IN')}</td>
      <td><span class="badge badge-blue">${q.incoterms || '—'}</span></td>
      <td style="color:var(--gray500);font-size:12px;">${q.date}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="previewQuote('${q.id}')">Preview</button>
          <button class="btn btn-secondary btn-sm" onclick="downloadQuotePdf('${q.id}')">PDF</button>
          <button class="btn btn-primary btn-sm" onclick="emailQuotation('${q.id}')">Email Quotation</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function statusBadge(s) {
  const m = {Draft:'badge-gray',Sent:'badge-blue',Negotiating:'badge-amber',Won:'badge-teal',Lost:'badge-red'};
  return `<span class="badge ${m[s]||'badge-gray'}">${s}</span>`;
}

async function previewQuote(id) {
  const q = DB.quotes.find(x => x.id === id);
  if (!q) return;
  const body = document.getElementById('preview-body');

  // Show loading state while fetching line items
  body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--gray500);">Loading quote details…</div>`;
  openModal('preview-modal');

  // Fetch real line items from Supabase
  let lineItems = [];
  try {
    const { data, error } = await _sb.from('quote_line_items').select('*').eq('quote_id', id);
    if (!error && data) lineItems = data;
  } catch(e) { console.warn('previewQuote line items:', e.message); }

  // Fetch customer address details
  const cust = DB.customers.find(c => c.id === q.customerId) || {};
  const custAddress = [cust.city, cust.state, cust.country].filter(Boolean).join(', ');

  const lineRowsHtml = lineItems.length > 0
    ? lineItems.map(li => {
        const amt = parseFloat(li.amount) || (parseFloat(li.qty) * parseFloat(li.rate)) || 0;
        const rate = parseFloat(li.rate) || 0;
        const qty  = parseFloat(li.qty)  || 0;
        const cur  = q.currency === 'USD' ? '$' : '₹';
        return `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid var(--gray100);">${li.product_name || '—'}${li.hsn_code ? `<br><span style="font-size:11px;color:var(--gray400);">HSN: ${li.hsn_code}</span>` : ''}</td>
          <td style="padding:10px 12px;text-align:right;border-bottom:1px solid var(--gray100);">${qty} ${li.unit || ''}</td>
          <td style="padding:10px 12px;text-align:right;border-bottom:1px solid var(--gray100);">${cur}${rate.toLocaleString('en-IN')}</td>
          <td style="padding:10px 12px;text-align:right;font-weight:600;border-bottom:1px solid var(--gray100);">${cur}${amt.toLocaleString('en-IN')}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="4" style="padding:16px 12px;color:var(--gray400);text-align:center;">No line items found</td></tr>`;

  const currency = q.currency === 'USD' ? '$' : '₹';
  const grandTotalFmt = `${currency}${(q.value || 0).toLocaleString('en-IN')}`;

  body.innerHTML = `
    <div style="background:#fff;font-family:'DM Sans',sans-serif;padding:0;">
      <div style="background:var(--navy);color:#fff;padding:28px 32px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:600;">QUOTATION</div>
          <div style="font-size:13px;opacity:.6;margin-top:4px;">Quote No: ${q.id}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:600;font-size:15px;">Himalaya Terpene Pvt. Ltd.</div>
          <div style="font-size:12px;opacity:.7;margin-top:4px;">Pine Oil Manufacturer, India<br>sales@himalayaterpene.com</div>
        </div>
      </div>
      <div style="padding:24px 32px;background:var(--gray50);display:flex;gap:40px;flex-wrap:wrap;border-bottom:1px solid var(--gray200);">
        <div>
          <div style="font-size:11px;color:var(--gray500);font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Bill To</div>
          <div style="font-weight:600;margin-top:4px;">${q.customer || '—'}</div>
          ${cust.gst ? `<div style="font-size:12px;color:var(--gray500);">GST: ${cust.gst}</div>` : ''}
          ${custAddress ? `<div style="font-size:12px;color:var(--gray500);">${custAddress}</div>` : ''}
          <div style="font-size:12px;color:var(--gray500);">Incoterms: ${q.incoterms || '—'}</div>
        </div>
        <div><div style="font-size:11px;color:var(--gray500);font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Date</div><div style="margin-top:4px;">${q.date || '—'}</div></div>
        <div><div style="font-size:11px;color:var(--gray500);font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Valid Until</div><div style="margin-top:4px;">${q.validUntil || '—'}</div></div>
        <div><div style="font-size:11px;color:var(--gray500);font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Payment</div><div style="margin-top:4px;font-size:13px;">${q.payment || '—'}</div></div>
      </div>
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:var(--gray50);">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--gray500);text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--gray200);">Product</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:var(--gray500);text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--gray200);">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:var(--gray500);text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--gray200);">Unit Rate</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:var(--gray500);text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--gray200);">Amount</th>
          </tr></thead>
          <tbody>${lineRowsHtml}</tbody>
          <tfoot>
            ${q.subtotal ? `<tr><td colspan="3" style="padding:6px 12px;text-align:right;font-size:12px;color:var(--gray500);">Subtotal</td><td style="padding:6px 12px;text-align:right;font-size:12px;">${currency}${parseFloat(q.subtotal).toLocaleString('en-IN')}</td></tr>` : ''}
            ${q.gst ? `<tr><td colspan="3" style="padding:6px 12px;text-align:right;font-size:12px;color:var(--gray500);">GST</td><td style="padding:6px 12px;text-align:right;font-size:12px;">${currency}${parseFloat(q.gst).toLocaleString('en-IN')}</td></tr>` : ''}
            ${q.freight ? `<tr><td colspan="3" style="padding:6px 12px;text-align:right;font-size:12px;color:var(--gray500);">Freight</td><td style="padding:6px 12px;text-align:right;font-size:12px;">${currency}${parseFloat(q.freight).toLocaleString('en-IN')}</td></tr>` : ''}
            <tr><td colspan="3" style="padding:10px 12px;text-align:right;font-weight:600;background:var(--navy);color:#fff;">Grand Total</td><td style="padding:10px 12px;text-align:right;font-weight:700;font-size:16px;background:var(--navy);color:#fff;">${grandTotalFmt}</td></tr>
          </tfoot>
        </table>
        <div style="margin-top:16px;padding:12px;background:var(--gray50);border-radius:6px;font-size:12px;color:var(--gray500);">
          <strong style="color:var(--gray700);">Terms & Conditions:</strong> ${q.notes || 'Goods once sold will not be taken back. Prices subject to change without notice. All disputes subject to Mumbai jurisdiction.'}
        </div>
      </div>
    </div>
  `;
}

async function downloadQuotePdf(id) {
  showToast('Preparing PDF…');
  if (!window.html2pdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('html2pdf load failed'));
      document.head.appendChild(s);
    });
  }
  await previewQuote(id);
  await new Promise(r => setTimeout(r, 400));
  const body = document.getElementById('preview-body');
  if (!body) { showToast('Preview element not found', 'error'); return; }
  const filename = 'Quotation_' + id + '.pdf';
  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  try {
    await window.html2pdf().set(opt).from(body).save();
    try {
      await _sb.from('pdf_logs').insert({
        quote_id: id,
        quote_number: id,
        generated_by: (window._currentUser && window._currentUser.name) ? window._currentUser.name : 'system'
      });
    } catch(le) { console.warn('pdf_logs insert:', le.message || le); }
    showToast('PDF downloaded ✓');
  } catch(e) {
    console.error('downloadQuotePdf error:', e);
    showToast('PDF generation failed', 'error');
  }
}



// ── EMAIL QUOTATION (MAILTO) ───────────────────────────────────────────────
async function emailQuotation(id) {
  const q = DB.quotes.find(x => x.id == id || x.quote_id == id);
  if (!q) { showToast('Quotation not found', 'error'); return; }
  showToast('Generating PDF…');
  await downloadQuotePdf(id);
  const validUntil   = q.validUntil || '—';
  const paymentTerms = q.payment    || '—';
  const quoteNo      = q.id || q.quote_id || id;
  const subject = 'Quotation ' + quoteNo + ' | Himalaya Terpene & Chemicals';
  const ln = '\n';
  const body =
    "Dear Ma'am," + ln + ln +
    "Hope this email finds you well." + ln + ln +
    "Thank you for your inquiry for the product(s) mentioned. We are pleased to submit our quotation for your kind consideration. Please find the attached quotation PDF for detailed pricing and product specifications." + ln + ln +
    "Terms & Conditions:" + ln + ln +
    "* GST: Extra as applicable" + ln +
    "* Validity: " + validUntil + ln +
    "* Payment Terms: " + paymentTerms + ln +
    "* TDS/TCS: As applicable" + ln +
    "* Insurance: Additional @ 0.25%. Alternatively, if your insurance policy covers incoming material, kindly share your insurance policy number." + ln +
    "* Incoterms: Ex-warehouse. Transportation and freight charges extra." + ln + ln +
    "We hope you will find our offer competitive and look forward to receiving your valued order. Should you require any further clarification, please feel free to contact us." + ln + ln +
    "We look forward to your further inquiries and assure you of our best services at all times." + ln;
  const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&su=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  window.open(gmailUrl, '_blank');
  showToast('Email client opened — please attach the downloaded PDF', 'success');
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
function renderReports() {
  // Customer chart
  const custData = [
    {label:'Reliance Industries',val:4405000,pct:78},
    {label:'SRF Limited',val:3760000,pct:67},
    {label:'UPL Limited',val:3610000,pct:64},
    {label:'Tata Chemicals',val:2280000,pct:40},
    {label:'Aarti Industries',val:880000,pct:16},
  ];
  const custEl = document.getElementById('report-cust-chart');
  if (custEl) custEl.innerHTML = custData.map(d => `
    <div class="chart-bar-row">
      <div class="chart-bar-label">${d.label}</div>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${d.pct}%;background:var(--blue)"></div></div>
      <div class="chart-bar-val">₹${(d.val/100000).toFixed(1)}L</div>
    </div>
  `).join('');

  const statusData = [
    {label:'Won',val:3,pct:60,color:'var(--teal)'},
    {label:'Sent',val:2,pct:40,color:'var(--blue)'},
    {label:'Draft',val:1,pct:20,color:'var(--gray400)'},
    {label:'Negotiating',val:1,pct:20,color:'var(--amber)'},
    {label:'Lost',val:1,pct:20,color:'var(--red)'},
  ];
  const stEl = document.getElementById('report-status-chart');
  if (stEl) stEl.innerHTML = statusData.map(d => `
    <div class="chart-bar-row">
      <div class="chart-bar-label">${d.label}</div>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${d.pct}%;background:${d.color}"></div></div>
      <div class="chart-bar-val">${d.val} quotes</div>
    </div>
  `).join('');

  const rtbody = document.getElementById('reports-table-body');
  if (rtbody) {
    rtbody.innerHTML = DB.quotes.map(q => `
      <tr>
        <td class="td-mono">${q.id}</td>
        <td>${q.customer}</td>
        <td class="td-mono" style="font-weight:600;">₹${q.value.toLocaleString('en-IN')}</td>
        <td><span class="source-pill source-${q.source}">${q.source}</span></td>
        <td>${statusBadge(q.status)}</td>
        <td style="color:var(--gray400);font-size:12px;">${q.date}</td>
        <td>${q.status==='Won'?'<span class="badge badge-teal">Won</span>':q.status==='Lost'?'<span class="badge badge-red">Lost</span>':'<span class="badge badge-gray">Pending</span>'}</td>
      </tr>
    `).join('');
  }
}

// ── LINE ITEMS ────────────────────────────────────────────────────────────────
function addLineItem() {
  lineCounter++;
  const id = 'line_' + lineCounter;
  currentLines.push({id});
  const tbody = document.getElementById('line-items-body');
  if (!tbody) return;
  const row = document.createElement('tr');
  row.id = id;
  row.innerHTML = `
    <td style="text-align:center;color:var(--gray400);font-size:12px;">${currentLines.length}</td>
    <td style="position:relative;">
      <input type="text" class="li-product" placeholder="Product name / description" style="min-width:200px;"
        oninput="filterProductSuggest(this,'${id}')" onblur="setTimeout(()=>hideProductSuggest('${id}'),180)" autocomplete="off"/>
      <div id="ps_${id}" style="display:none;position:absolute;top:100%;left:0;z-index:999;background:#fff;border:1px solid var(--gray200);border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.1);min-width:280px;max-height:200px;overflow-y:auto;"></div>
    </td>
    <td><input type="text" class="li-hsn" placeholder="e.g. 38051000" style="font-family:var(--font-mono);font-size:12px;" oninput="recalcTotals()"/></td>
    <td><input type="number" class="li-qty" placeholder="0" min="0" step="0.01" oninput="recalcTotals()"/></td>
    <td>
      <select class="li-basis" oninput="recalcTotals()">
        <option>Per kg</option><option>Per MT</option><option>Per Ltr</option><option>Per KL</option><option>Per Unit</option><option>Per Drum</option><option>Per Can</option>
      </select>
    </td>
    <td><input type="number" class="li-rate" placeholder="0.00" min="0" step="0.01" oninput="recalcTotals()"/></td>
    <td>
      <select class="li-gst" oninput="recalcTotals()">
        <option value="18">18%</option><option value="12">12%</option><option value="5">5%</option><option value="28">28%</option><option value="0">0%</option>
      </select>
    </td>
    <td id="amt_${id}" style="font-family:var(--font-mono);font-weight:600;font-size:12px;color:var(--gray700);">₹0.00</td>
    <td>
      <div class="btn-icon" onclick="removeLineItem('${id}')">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
      </div>
    </td>
  `;
  tbody.appendChild(row);
  recalcTotals();
}

function filterProductSuggest(input, rowId) {
  recalcTotals();
  const q = input.value.trim().toLowerCase();
  const dd = document.getElementById('ps_' + rowId);
  if (!dd) return;
  if (!DB.products?.length) { dd.style.display = 'none'; return; }
  const allCats = [...new Set(DB.products.map(p => p.cat).filter(Boolean))].sort();
  const matches = q ? allCats.filter(c => c.toLowerCase().includes(q)) : allCats;
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = matches.slice(0, 12).map(cat => `
    <div style="padding:8px 12px;font-size:13px;border-bottom:1px solid var(--gray100);cursor:pointer;"
      onmousedown="selectCategory('${rowId}','${cat.replace(/'/g,"\\'")}')">
      <div style="font-weight:600;color:var(--gray900);">${cat}</div>
    </div>`).join('');
}

function selectCategory(rowId, cat) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const productInput = row.querySelector('.li-product');
  if (productInput) productInput.value = cat;
  hideProductSuggest(rowId);
}


// ── SAMPLE MODAL — CUSTOMER AUTOCOMPLETE ─────────────────────────────────
function filterSampleCustomer(input) {
  const q = input.value.trim().toLowerCase();
  const dd = document.getElementById('sample-customer-dd');
  if (!dd) return;
  document.getElementById('sample-customer-id').value = '';
  if (!DB.customers?.length) { dd.style.display = 'none'; return; }
  const matches = q
    ? DB.customers.filter(c => c.company.toLowerCase().includes(q)).slice(0, 10)
    : DB.customers.slice(0, 10);
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = matches.map(c => `
    <div style="padding:8px 12px;font-size:13px;border-bottom:1px solid var(--gray100);cursor:pointer;"
      onmousedown="selectSampleCustomer('${c.id}','${(c.company||'').replace(/'/g,"\\'")}')">
      <div style="font-weight:600;color:var(--gray900);">${c.company}</div>
      <div style="color:var(--gray400);font-size:11px;">${c.tier ? c.tier.charAt(0).toUpperCase()+c.tier.slice(1) : ''}${c.industry ? ' · '+c.industry : ''}</div>
    </div>`).join('');
}
function selectSampleCustomer(id, name) {
  const inp = document.getElementById('sample-customer');
  const hid = document.getElementById('sample-customer-id');
  if (inp) inp.value = name;
  if (hid) hid.value = id;
  hideSampleCustomerDD();
}
function hideSampleCustomerDD() {
  const dd = document.getElementById('sample-customer-dd');
  if (dd) dd.style.display = 'none';
}

// ── SAMPLE MODAL — PRODUCT CATEGORY AUTOCOMPLETE ─────────────────────────
function filterSampleProduct(input) {
  const q = input.value.trim().toLowerCase();
  const dd = document.getElementById('sample-product-dd');
  if (!dd) return;
  if (!DB.products?.length) { dd.style.display = 'none'; return; }
  const allCats = [...new Set(DB.products.map(p => p.cat).filter(Boolean))].sort();
  const matches = q ? allCats.filter(c => c.toLowerCase().includes(q)) : allCats;
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = matches.slice(0, 12).map(cat => `
    <div style="padding:8px 12px;font-size:13px;border-bottom:1px solid var(--gray100);cursor:pointer;"
      onmousedown="selectSampleProduct('${cat.replace(/'/g,"\\'")}')">
      <div style="font-weight:600;color:var(--gray900);">${cat}</div>
    </div>`).join('');
}
function selectSampleProduct(cat) {
  const inp = document.getElementById('sample-product');
  if (inp) inp.value = cat;
  hideSampleProductDD();
}
function hideSampleProductDD() {
  const dd = document.getElementById('sample-product-dd');
  if (dd) dd.style.display = 'none';
}

function hideProductSuggest(rowId) {
  const dd = document.getElementById('ps_' + rowId);
  if (dd) dd.style.display = 'none';
}

function selectProduct(rowId, name, hsn, rate, unit, gst) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const productInput = row.querySelector('.li-product');
  const hsnInput     = row.querySelector('.li-hsn');
  const rateInput    = row.querySelector('.li-rate');
  const basisSel     = row.querySelector('.li-basis');
  const gstSel       = row.querySelector('.li-gst');
  if (productInput) productInput.value = name;
  if (hsnInput)     hsnInput.value     = hsn;
  if (rateInput)    rateInput.value    = rate;
  if (basisSel)     { for (const o of basisSel.options) { if (o.text.toLowerCase().includes(unit.toLowerCase())) { basisSel.value = o.value; break; } } }
  if (gstSel)       gstSel.value       = String(gst);
  hideProductSuggest(rowId);
  recalcTotals();
}

function removeLineItem(id) {
  const row = document.getElementById(id);
  if (row) row.remove();
  currentLines = currentLines.filter(l => l.id !== id);
  // Renumber
  document.querySelectorAll('#line-items-body tr').forEach((r,i) => {
    const firstTd = r.querySelector('td');
    if (firstTd) firstTd.textContent = i+1;
  });
  recalcTotals();
}

function recalcTotals() {
  let subtotal = 0, gstTotal = 0, weightedGSTNumerator = 0;
  document.querySelectorAll('#line-items-body tr').forEach(row => {
    const qtyEl  = row.querySelector('.li-qty');
    const rateEl = row.querySelector('.li-rate');
    const gstEl  = row.querySelector('select:last-of-type');
    const qty     = parseFloat(qtyEl?.value)  || 0;
    const rate    = parseFloat(rateEl?.value) || 0;
    const gstPct  = parseFloat(gstEl?.value)  || 0;
    const amt     = qty * rate;
    const gst     = amt * gstPct / 100;
    subtotal += amt;
    gstTotal += gst;
    weightedGSTNumerator += amt * gstPct; // for blended rate on insurance
    const amtCell = row.querySelector('[id^="amt_"]');
    if (amtCell) amtCell.textContent = '₹' + amt.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2});
  });

  const freight   = parseFloat(document.getElementById('q-freight')?.value)   || 0;
  const insurance = parseFloat(document.getElementById('q-insurance')?.value) || 0;
  const discPct   = parseFloat(document.getElementById('q-discount')?.value)  || 0;
  const discAmt   = subtotal * discPct / 100;

  // FIX: GST base = subtotal + insurance (per requirement)
  // Use blended/weighted-average GST rate across all line items
  // applied to the insurance amount so each HS-code's rate is proportionally respected
  const blendedGSTRate  = subtotal > 0 ? weightedGSTNumerator / subtotal / 100 : 0;
  const gstOnInsurance  = insurance * blendedGSTRate;
  const totalGST        = gstTotal + gstOnInsurance;   // GST on (subtotal + insurance)

  const grand = subtotal + insurance + totalGST + freight - discAmt;

  const fmt   = v => '₹' + v.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2});
  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };

  setEl('subtotal-cell',    fmt(subtotal));
  setEl('gst-cell',         fmt(totalGST));         // now includes GST on insurance
  setEl('grand-total-cell', fmt(grand));
  setEl('sum-subtotal',     fmt(subtotal));
  setEl('sum-gst',          fmt(totalGST));
  setEl('sum-charges',      fmt(freight + insurance - discAmt));
  setEl('sum-grand',        fmt(grand));
}

// ── CUSTOMER TYPEAHEAD ────────────────────────────────────────────────────────
function refreshCustomerDropdown() {
  // Typeahead version — just reset the field when initialising a new quote
  const inputEl  = document.getElementById('q-customer-input');
  const hiddenEl = document.getElementById('q-customer');
  if (inputEl)  inputEl.value  = '';
  if (hiddenEl) hiddenEl.value = '';
  const prev = document.getElementById('customer-preview');
  if (prev) prev.style.display = 'none';
}

function filterCustomerTypeahead() {
  const hiddenEl = document.getElementById('q-customer');
  if (hiddenEl) hiddenEl.value = ''; // clear confirmed selection while typing
  const prev = document.getElementById('customer-preview');
  if (prev) prev.style.display = 'none';
  showCustomerDropdown();
}

function showCustomerDropdown() {
  const dd      = document.getElementById('q-customer-dropdown');
  const inputEl = document.getElementById('q-customer-input');
  if (!dd || !inputEl) return;
  const q = (inputEl.value || '').toLowerCase().trim();
  const matches = q
    ? DB.customers.filter(c =>
        c.company.toLowerCase().includes(q) ||
        (c.contact||'').toLowerCase().includes(q) ||
        (c.city||'').toLowerCase().includes(q)
      ).slice(0,20)
    : DB.customers.slice(0,20);
  if (matches.length === 0) {
    dd.innerHTML = `<div style="padding:10px 14px;font-size:13px;color:var(--gray400);">No customers found</div>`;
  } else {
    dd.innerHTML = matches.map(c => {
      const hl = s => q ? s.replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<mark style="background:var(--amber-light,#fef3c7);border-radius:2px;padding:0 1px;">$1</mark>') : s;
      return `<div
        onmousedown="selectCustomerFromTypeahead('${c.id}','${c.company.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')"
        style="padding:9px 14px;border-bottom:1px solid var(--gray100);transition:background .1s;"
        onmouseover="this.style.background='var(--gray50,#f9fafb)'"
        onmouseout="this.style.background=''">
        <div style="font-size:13px;font-weight:500;color:var(--gray800);">${hl(c.company)}</div>
        <div style="font-size:11px;color:var(--gray400);margin-top:2px;">${c.city||''}${c.city&&c.contact?' · ':''}${hl(c.contact||'')}</div>
      </div>`;
    }).join('');
  }
  dd.style.display = 'block';
}

function hideCustomerDropdown() {
  const dd = document.getElementById('q-customer-dropdown');
  if (dd) dd.style.display = 'none';
}

function selectCustomerFromTypeahead(id, name) {
  const inputEl  = document.getElementById('q-customer-input');
  const hiddenEl = document.getElementById('q-customer');
  if (inputEl)  inputEl.value  = name;
  if (hiddenEl) hiddenEl.value = id;
  hideCustomerDropdown();
  fillCustomerDefaults(id);
}

function fillCustomerDefaults(id) {
  const prev = document.getElementById('customer-preview');
  if (!id) { if(prev) prev.style.display='none'; return; }
  const c = DB.customers.find(x => x.id === id);
  if (!c || !prev) return;
  prev.style.display = 'block';
  document.getElementById('cp-contact').textContent = c.contact;
  document.getElementById('cp-gstin').textContent = c.gstin || '—';
  document.getElementById('cp-inco').textContent = c.incoterms;
  document.getElementById('cp-pay').textContent = c.payment;
  document.getElementById('cp-addr').textContent = c.city;
  // Auto-set incoterms
  const iSel = document.getElementById('q-incoterms');
  if (iSel) iSel.value = '';
}

// ── INIT NEW QUOTE ─────────────────────────────────────────────────────────────
function initNewQuote() {
  refreshCustomerDropdown();
  currentLines = [];
  lineCounter = 0;
  const tbody = document.getElementById('line-items-body');
  if (tbody) tbody.innerHTML = '';
  recalcTotals();
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  const dateEl = document.getElementById('q-date');
  if (dateEl) dateEl.value = today;
  const validEl = document.getElementById('q-valid');
  if (validEl) {
    const d = new Date(); d.setDate(d.getDate()+30);
    validEl.value = d.toISOString().split('T')[0];
  }
  // Auto-generate next quote number from existing quotes
  const yr = new Date().getFullYear();
  const prefix = `QF-${yr}-`;
  let maxNum = 0;
  DB.quotes.forEach(q => {
    if (q.id && q.id.startsWith(prefix)) {
      const n = parseInt(q.id.replace(prefix, ''), 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  });
  const nextNum = String(maxNum + 1).padStart(3, '0');
  const qnoEl = document.getElementById('q-number');
  if (qnoEl) qnoEl.value = `${prefix}${nextNum}`;
  // Start with 2 blank lines
  addLineItem();
  addLineItem();
}

// ── LOAD QUOTES FROM SUPABASE ─────────────────────────────────────────────────
async function loadProductsFromSupabase() {
  try {
    const { data, error } = await _sb.from('products').select('*').order('category').order('product_name');
    if (error) throw error;
    DB.products = (data || []).map(r => ({
      id:   r.product_id,
      name: r.product_name,
      hsn:  r.hsn_code    || '',
      gst:  parseFloat(r.gst_percent) || 18,
      unit: r.unit        || 'Kg',
      rate: parseFloat(r.default_rate) || 0,
      cat:  r.category    || '',
    }));
  } catch(e) {
    console.warn('loadProductsFromSupabase:', e.message);
  }
}

async function loadInquiriesFromSupabase() {
  try {
    const { data, error } = await _sb.from('inquiries').select('*').order('created_date', { ascending: false });
    if (error) throw error;
    DB.inquiries = (data || []).map(r => ({
      id:               r.inquiry_id,
      company:          r.company_name || '—',
      contact:          r.contact_name || '',
      email:            r.email        || '',
      phone:            r.phone        || '',
      subject:          r.subject      || '',
      source:           r.source       || 'manual',
      captured_from:    r.captured_from || r.source || 'manual',
      date:             r.date         || '',
      product_interest: r.product_interest || '',
      quantity:         r.quantity     || '',
      status:           r.status       || 'open',
      stage:            r.stage          || 'lead',
      unread:           r.status === 'open',
      customer_type:    r.customer_type || 'new',
      customer_id:      r.customer_id  || null,
      estimated_value:  r.estimated_value ? parseFloat(r.estimated_value) : null,
      notes:            r.notes        || '',
      enquiry_datetime: r.enquiry_datetime || null,
    }));
    // Update tab counts immediately if page is open
    const setCount = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    setCount('inq-count-all',      DB.inquiries.length);
    setCount('inq-count-gmail',    DB.inquiries.filter(i => i.source === 'gmail').length);
    setCount('inq-count-indiamart',DB.inquiries.filter(i => i.source === 'indiamart').length);
    setCount('inq-count-manual',   DB.inquiries.filter(i => i.source === 'manual').length);
    updateNavBadge('nav-badge-inquiries', DB.inquiries.filter(i => i.unread).length);
    if (document.getElementById('inquiry-list')) renderInquiries('all');
  } catch(e) {
    console.warn('loadInquiriesFromSupabase:', e.message);
  }
}

async function loadSamplesFromSupabase() {
  try {
    const { data, error } = await _sb.from('samples').select('*').order('sent_date', { ascending: false });
    if (error) throw error;
    DB.samples = (data || []).map(r => ({
      id:          r.sample_id,
      customer:    DB.customers.find(c => c.id === r.customer_id)?.company || r.customer_id || '—',
      customerId:  r.customer_id,
      leadId:      r.lead_id,
      product:     r.product_name || r.product_code || '—',
      qty:         r.quantity ? `${r.quantity} ${r.unit || ''}`.trim() : '—',
      sentDate:    r.sent_date || '',
      status:      r.status || 'dispatched',
      outcome:     r.outcome || null,
      followupDue: r.sent_date ? (() => { const d = new Date(r.sent_date); d.setDate(d.getDate()+7); return d.toISOString().split('T')[0]; })() : '',
      notes:       r.notes || '',
      courier:     r.courier_details || '',
      cost:        r.cost != null ? parseFloat(r.cost) : null,
      requestedAt: r.requested_at || '',
      refId:       r.ref_id || '',
      followupDue: r.followup_due || (r.sent_date ? (() => { const d = new Date(r.sent_date); d.setDate(d.getDate()+7); return d.toISOString().split('T')[0]; })() : ''),
    }));
    const pending = DB.samples.filter(s => s.status === 'dispatched' || s.status === 'awaiting').length;
    updateNavBadge('nav-badge-sampling', pending);
    if (document.getElementById('samples-table-body')) renderSampling();
  } catch(e) {
    console.warn('loadSamplesFromSupabase:', e.message);
  }
}

async function loadQuotesFromSupabase() {
  try {
    const { data, error } = await _sb.from('quotes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    DB.quotes = (data || []).map(r => ({
      id:         r.quote_id,
      customer:   r.customer_name,
      customerId: r.customer_id,
      items:      r.line_items_count || 0,
      value:      parseFloat(r.grand_total) || 0,
      status:     r.status,
      incoterms:  r.incoterms,
      date:       r.quote_date,
      source:     r.source,
      validUntil: r.valid_until,
      payment:    r.payment_terms,
      subtotal:   parseFloat(r.subtotal) || 0,
      gst:        parseFloat(r.gst_amount) || 0,
      freight:    parseFloat(r.freight) || 0,
      insurance:  parseFloat(r.insurance) || 0,
      discountPct:parseFloat(r.discount_pct) || 0,
      notes:      r.notes,
      createdBy:  r.created_by,
    }));
    renderQuotations();
    renderDashboard();
    loadPipelineFromSupabase();   // rebuild pipeline cards from live quotes
  } catch(e) {
    console.warn('loadQuotesFromSupabase:', e.message);
  }
}

// ── PIPELINE FROM SUPABASE QUOTES ────────────────────────────────────────────
// Maps each quote into a pipeline "lead" card so the pipeline reflects real data.
// Stage mapping:  Draft → lead  |  Sent → quoted  |  Accepted → won  |  Rejected → lost
function loadPipelineFromSupabase() {
  const statusToStage = {
    'Draft':'lead', 'Sent':'quoted', 'Sampling':'sampling',
    'Negotiating':'negotiating', 'Accepted':'won', 'Rejected':'lost'
  };
  const palette = ['#7C3AED','#1A6FDB','#D97706','#0F8A6F','#D85A30','#16A34A','#DC2626','#0891B2','#B45309','#6D28D9'];
  DB.leads = DB.quotes.map((q, i) => {
    const cust = DB.customers.find(c => c.id === q.customerId) || {};
    return {
      id:           q.id,
      company:      q.customer || '—',
      contact:      cust.contact || '',
      email:        cust.email   || '',
      phone:        cust.phone   || '',
      product:      '',   // line items require separate fetch; shown via quote detail
      qty:          '',
      value:        q.value || 0,
      source:       q.source || 'manual',
      industry:     cust.segment || cust.industry || '',
      isExisting:   true,
      stage:        statusToStage[q.status] || 'lead',
      created:      q.date,
      lastFollowup: q.date,
      nextFollowup: q.validUntil || null,
      followupCount:0,
      color:        palette[i % palette.length],
      notes:        q.notes || '',
      quoteId:      q.id,   // link back to quotation
    };
  });
  // Re-render only if pipeline page is active
  if (document.getElementById('pipeline-deals-list')) {
    renderPipeline();
    loadFollowupsFromSupabase(); // overlay real follow-up history from Supabase
  }
}

// ── COLLECT QUOTE FORM DATA ───────────────────────────────────────────────────
function collectQuoteForm(status) {
  const custId   = document.getElementById('q-customer')?.value || '';
  const custName = DB.customers.find(c => c.id === custId)?.company || '';
  const qno      = document.getElementById('q-number')?.value || '';
  const qdate    = document.getElementById('q-date')?.value || '';
  const valid    = document.getElementById('q-valid')?.value || '';
  const inco     = document.getElementById('q-incoterms')?.value || '';
  const pay      = document.getElementById('q-payment')?.value || '';
  const src      = document.getElementById('q-source')?.value || '';
  const notes    = document.getElementById('q-notes')?.value || '';
  const freight  = parseFloat(document.getElementById('q-freight')?.value) || 0;
  const insur    = parseFloat(document.getElementById('q-insurance')?.value) || 0;
  const discPct  = parseFloat(document.getElementById('q-discount')?.value) || 0;

  // Collect line items from DOM
  const lineItems = [];
  document.querySelectorAll('#line-items-body tr').forEach(row => {
    const productEl = row.querySelector('.li-product');
    const hsnEl     = row.querySelector('.li-hsn');
    const qtyEl     = row.querySelector('.li-qty');
    const rateEl    = row.querySelector('.li-rate');
    const unitEl    = row.querySelector('.li-basis');
    const gstEl     = row.querySelector('.li-gst');
    const product = productEl?.value?.trim() || '';
    if (!product) return;
    const qty    = parseFloat(qtyEl?.value) || 0;
    const rate   = parseFloat(rateEl?.value) || 0;
    lineItems.push({
      product_name: product,
      hsn_code:     hsnEl?.value?.trim() || '',
      qty,
      unit:         unitEl?.value || 'MT',
      rate,
      gst_pct:      parseFloat(gstEl?.value) || 0,
      amount:       qty * rate,
    });
  });

  // Recalculate totals server-side consistently
  const subtotal   = lineItems.reduce((s, l) => s + l.amount, 0);
  const gstAmt     = lineItems.reduce((s, l) => s + l.amount * l.gst_pct / 100, 0)
                     + insur * (subtotal > 0 ? lineItems.reduce((s,l)=>s+l.amount*l.gst_pct,0)/subtotal/100 :                                   

// ============================================================
// RESTORE PATCH — Merged from restore.js (2026-06-03)
// Lead, Sample, Pipeline, Autocomplete functions
// ============================================================
// ============================================================
// RESTORE.JS — Restores missing/removed logic without touching app.js
// Uses MutationObserver instead of overriding renderPipeline/renderCustomers
// to avoid infinite recursion with pipeline-patch (Supabase Edge Function).
// ============================================================

// ── UNIQUE PRODUCT CATEGORY HELPER ──────────────────────────────────────────
function getUniqueProductCategories() {
  return [...new Set(
    (DB.products || [])
      .map(function(p) { return p.cat || p.category || p.name || p.product_name || p.code; })
      .filter(Boolean)
  )].sort();
}

function populateProductSelect(elId, currentVal) {
  var el = document.getElementById(elId);
  if (!el) return;
  var cats = getUniqueProductCategories();
  el.innerHTML = '<option value="">— Select product —</option>' +
    cats.map(function(c) {
      return '<option value="' + c + '"' + (currentVal === c ? ' selected' : '') + '>' + c + '</option>';
    }).join('');
  if (currentVal) el.value = currentVal;
}

// ── OPEN ADD LEAD MODAL ──────────────────────────────────────────────────────
function openAddLeadModal() {
  ['lead-company','lead-contact','lead-email','lead-phone','lead-qty','lead-value','lead-notes'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  var srcEl = document.getElementById('lead-source');   if (srcEl) srcEl.value = 'manual';
  var indEl = document.getElementById('lead-industry'); if (indEl) indEl.value = '';
  var exEl  = document.getElementById('lead-existing'); if (exEl)  exEl.value  = 'no';
  populateProductSelect('lead-product', '');
  var saveBtn = document.querySelector('#lead-modal .btn-primary, #lead-modal button[onclick*="saveLead"]');
  if (saveBtn) { saveBtn.textContent = 'Save Lead'; saveBtn.setAttribute('onclick', 'saveLead()'); }
  openModal('lead-modal');
}

// ── SAVE NEW LEAD ────────────────────────────────────────────────────────────
async function saveLead() {
  var g = function(id) { return (document.getElementById(id)?.value || '').trim(); };
  var company  = g('lead-company');
  var contact  = g('lead-contact');
  var email    = g('lead-email');
  var phone    = g('lead-phone');
  var product  = g('lead-product');
  var qty      = g('lead-qty');
  var source   = g('lead-source') || 'manual';
  var industry = g('lead-industry');
  var existing = g('lead-existing') === 'yes';
  var value    = parseFloat(g('lead-value')) || 0;
  var notes    = g('lead-notes');

  if (!company) { showToast('Company name is required', 'error'); return; }

  var saveBtn = document.querySelector('#lead-modal .btn-primary, #lead-modal button[onclick*="saveLead"]');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

  var leadId = 'LD-' + Date.now();
  var row = {
    lead_id:              leadId,
    company_name:         company,
    contact_name:         contact   || null,
    email:                email     || null,
    phone:                phone     || null,
    product_interest:     product   || null,
    estimated_qty:        qty       || null,
    source:               source,
    industry:             industry  || null,
    is_existing_customer: existing,
    estimated_value:      value     || null,
    notes:                notes     || null,
    stage:                'lead',
    created_at:           new Date().toISOString(),
  };

  try {
    var res = await _sb.from('leads').insert(row);
    if (res.error) throw res.error;
    var palette = ['#7C3AED','#1A6FDB','#D97706','#0F8A6F','#D85A30','#16A34A','#DC2626','#0891B2'];
    DB.leads.unshift({
      id: leadId, company: company, contact: contact, email: email, phone: phone,
      product: product, qty: qty, source: source, industry: industry,
      isExisting: existing, value: value, notes: notes, stage: 'lead',
      created: new Date().toISOString().split('T')[0],
      followupCount: 0, color: palette[DB.leads.length % palette.length],
    });
    closeModal('lead-modal');
    if (typeof renderPipeline === 'function') renderPipeline();
    showToast('Lead saved successfully', 'success');
  } catch(e) {
    console.error('saveLead:', e);
    showToast('Failed to save lead: ' + (e.message || e), 'error');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Lead'; }
  }
}

// ── OPEN EDIT LEAD MODAL ─────────────────────────────────────────────────────
function openEditLeadModal(id) {
  var lead = (DB.leads || []).find(function(l) { return l.id === id; });
  if (!lead) { showToast('Lead not found', 'error'); return; }
  var set = function(elId, val) { var el = document.getElementById(elId); if (el) el.value = (val != null) ? val : ''; };
  set('lead-company',  lead.company);
  set('lead-contact',  lead.contact);
  set('lead-email',    lead.email);
  set('lead-phone',    lead.phone);
  set('lead-qty',      lead.qty);
  set('lead-value',    lead.value || '');
  set('lead-notes',    lead.notes);
  set('lead-source',   lead.source);
  set('lead-industry', lead.industry);
  set('lead-existing', lead.isExisting ? 'yes' : 'no');
  populateProductSelect('lead-product', lead.product || '');
  var saveBtn = document.querySelector('#lead-modal .btn-primary, #lead-modal button[onclick*="saveLead"], #lead-modal button[onclick*="saveEditedLead"]');
  if (saveBtn) { saveBtn.textContent = 'Save Changes'; saveBtn.setAttribute('onclick', "saveEditedLead('" + id + "')"); }
  openModal('lead-modal');
}

// ── SAVE EDITED LEAD ─────────────────────────────────────────────────────────
async function saveEditedLead(id) {
  var g = function(elId) { return (document.getElementById(elId)?.value || '').trim(); };
  var company  = g('lead-company');
  var contact  = g('lead-contact');
  var email    = g('lead-email');
  var phone    = g('lead-phone');
  var product  = g('lead-product');
  var qty      = g('lead-qty');
  var source   = g('lead-source');
  var industry = g('lead-industry');
  var existing = g('lead-existing') === 'yes';
  var value    = parseFloat(g('lead-value')) || 0;
  var notes    = g('lead-notes');

  if (!company) { showToast('Company name is required', 'error'); return; }

  var saveBtn = document.querySelector("#lead-modal button[onclick*='saveEditedLead']");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

  try {
    var res = await _sb.from('leads').update({
      company_name: company, contact_name: contact||null, email: email||null,
      phone: phone||null, product_interest: product||null, estimated_qty: qty||null,
      source: source, industry: industry||null, is_existing_customer: existing,
      estimated_value: value||null, notes: notes||null,
    }).eq('lead_id', id);
    if (res.error) throw res.error;
    var idx = (DB.leads || []).findIndex(function(l) { return l.id === id; });
    if (idx >= 0) Object.assign(DB.leads[idx], { company: company, contact: contact, email: email, phone: phone, product: product, qty: qty, source: source, industry: industry, isExisting: existing, value: value, notes: notes });
    closeModal('lead-modal');
    if (typeof renderPipeline === 'function') renderPipeline();
    showToast('Lead updated successfully', 'success');
  } catch(e) {
    console.error('saveEditedLead:', e);
    showToast('Failed to update lead: ' + (e.message || e), 'error');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; }
  }
}

// ── OPEN ADD FOLLOWUP MODAL ──────────────────────────────────────────────────
function openAddFollowupModal(leadId) {
  if (typeof openFollowupModal === 'function') {
    openFollowupModal(leadId);
    return;
  }
  var typeEl = document.getElementById('fu-type');   if (typeEl) typeEl.value = 'call';
  var outEl  = document.getElementById('fu-outcome'); if (outEl)  outEl.value  = '';
  var stgEl  = document.getElementById('fu-stage');   if (stgEl)  stgEl.value  = '';
  var notEl  = document.getElementById('fu-notes');   if (notEl)  notEl.value  = '';
  var dateEl = document.getElementById('fu-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
  var modal = document.getElementById('followup-modal');
  if (modal) modal.dataset.leadId = leadId || '';
  openModal('followup-modal');
}

// ── OPEN LOG SAMPLE MODAL ─────────────────────────────────────────────────────
function openLogSampleModal() {
  ['sample-ref','sample-qty','sample-courier','sample-cost','sample-notes'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  var today  = new Date().toISOString().split('T')[0];
  var fuDate = new Date(); fuDate.setDate(fuDate.getDate() + 7);
  var dateEl = document.getElementById('sample-date');    if (dateEl) dateEl.value = today;
  var fuEl   = document.getElementById('sample-followup'); if (fuEl)  fuEl.value   = fuDate.toISOString().split('T')[0];
  var custEl = document.getElementById('sample-customer');
  if (custEl) {
    custEl.value = '';
    if (custEl.tagName === 'SELECT') {
      custEl.innerHTML = '<option value="">— Select customer / lead —</option>' +
        (DB.customers || []).map(function(c) { return '<option value="' + c.id + '">' + c.company + '</option>'; }).join('');
    }
  }
  populateProductSelect('sample-product', '');
  var saveBtn = document.querySelector('#sample-modal button[onclick*="saveSample"], #sample-modal button[onclick*="saveEditedSample"]');
  if (saveBtn) { saveBtn.textContent = 'Log Sample Dispatch'; saveBtn.setAttribute('onclick', 'saveSample()'); }
  openModal('sample-modal');
}

// ── OPEN EDIT SAMPLE MODAL (OVERRIDE) ────────────────────────────────────────
function openEditSampleModal(id) {
  var s = (DB.samples || []).find(function(x) { return x.id === id; });
  if (!s) { showToast('Sample record not found', 'error'); return; }
  var set = function(elId, val) { var el = document.getElementById(elId); if (el) el.value = (val != null) ? val : ''; };
  set('sample-ref',      s.leadId || s.refId || '');
  set('sample-qty',      s.qty    || '');
  set('sample-date',     s.sentDate || '');
  set('sample-followup', s.followupDue || '');
  set('sample-courier',  s.courier || '');
  set('sample-cost',     s.cost != null ? s.cost : '');
  set('sample-notes',    s.notes || '');
  var custEl = document.getElementById('sample-customer');
  if (custEl) {
    if (custEl.tagName === 'SELECT') {
      custEl.innerHTML = '<option value="">— Select —</option>' +
        (DB.customers || []).map(function(c) { return '<option value="' + c.id + '">' + c.company + '</option>'; }).join('');
      custEl.value = s.customerId || '';
    } else {
      custEl.value = s.customer || '';
    }
  }
  populateProductSelect('sample-product', s.product || '');
  var saveBtn = document.querySelector('#sample-modal button[onclick*="saveSample"], #sample-modal button[onclick*="saveEditedSample"], #sample-modal button[onclick*="saveEditedSampleById"]');
  if (saveBtn) { saveBtn.textContent = 'Save Changes'; saveBtn.setAttribute('onclick', "saveEditedSampleById('" + id + "')"); }
  openModal('sample-modal');
}

// ── SAVE EDITED SAMPLE ────────────────────────────────────────────────────────
async function saveEditedSampleById(id) {
  var g = function(elId) { return (document.getElementById(elId)?.value || '').trim(); };
  var custEl = document.getElementById('sample-customer');
  var custVal = custEl ? custEl.value : '';
  var updates = {
    product_name:    g('sample-product') || null,
    quantity:        g('sample-qty')     || null,
    sent_date:       g('sample-date')    || null,
    followup_due:    g('sample-followup')|| null,
    courier_details: g('sample-courier') || null,
    cost:            parseFloat(g('sample-cost')) || null,
    notes:           g('sample-notes')  || null,
  };
  if (custVal) updates.customer_id = custVal;
  try {
    var res = await _sb.from('samples').update(updates).eq('sample_id', id);
    if (res.error) throw res.error;
    await loadSamplesFromSupabase();
    closeModal('sample-modal');
    showToast('Sample updated successfully', 'success');
  } catch(e) {
    console.error('saveEditedSampleById:', e);
    showToast('Failed to update sample: ' + (e.message || e), 'error');
  }
}

// ── PIPELINE HELPERS (Inquiry cards + edit buttons) ──────────────────────────
function _renderInquiryPipelineCards() {
  var list = document.getElementById('pipeline-deals-list');
  if (!list) return;
  list.querySelectorAll('.inq-lead-card').forEach(function(c) { c.remove(); });

  var stageFilter = document.getElementById('pipeline-filter-stage')?.value || 'all';
  if (stageFilter !== 'all' && stageFilter !== 'lead') return;

  var inquiries = (DB.inquiries || []).filter(function(inq) {
    return inq.status !== 'converted' && inq.status !== 'closed';
  });
  if (!inquiries.length) return;

  inquiries.forEach(function(inq) {
    var initials = (inq.company || '?').slice(0, 2).toUpperCase();
    var valStr   = inq.estimated_value ? '₹' + (inq.estimated_value / 1e5).toFixed(2) + 'L' : '—';
    var srcClass = inq.source || inq.captured_from || 'manual';
    var card = document.createElement('div');
    card.className = 'lead-card on-track inq-lead-card';
    card.style.borderLeft = '3px solid var(--amber,#D97706)';
    card.innerHTML =
      '<div class="lc-avatar" style="background:var(--amber,#D97706);">' + initials + '</div>' +
      '<div class="lc-body">' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          '<span class="lc-company">' + (inq.company || '—') + '</span>' +
          '<span class="badge badge-gray" style="font-size:10px;padding:2px 6px;">Inquiry</span>' +
          '<span class="source-pill source-' + srcClass + '" style="font-size:10px;">' + srcClass + '</span>' +
        '</div>' +
        '<div class="lc-product">' + (inq.product_interest || '—') + (inq.quantity ? ' · ' + inq.quantity : '') + '</div>' +
        '<div class="lc-meta">' +
          '<span class="badge badge-gray">Lead</span>' +
          '<span style="font-size:11px;color:var(--gray500);">' + valStr + '</span>' +
        '</div>' +
        '<div class="stage-changer-wrap" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button class="btn btn-ghost btn-sm" style="font-size:11px;" onclick="event.stopPropagation();openEditInquiryModal(\'' + inq.id + '\')">✏ Edit</button>' +
          '<button class="btn btn-primary btn-sm" style="font-size:11px;" onclick="event.stopPropagation();openInquiryQuote(\'' + inq.id + '\')">Create Quote →</button>' +
        '</div>' +
      '</div>';
    list.insertBefore(card, list.firstChild);
  });
}

function _injectLeadEditButtons() {
  var list = document.getElementById('pipeline-deals-list');
  if (!list) return;
  list.querySelectorAll('.lead-card:not(.inq-lead-card)').forEach(function(card) {
    if (card.querySelector('.edit-lead-btn')) return;
    var sdropBtn = card.querySelector('button[onclick*="toggleStageDropdown"]');
    if (!sdropBtn) return;
    var m = sdropBtn.getAttribute('onclick').match(/toggleStageDropdown\('([^']+)'\)/);
    if (!m) return;
    var leadId = m[1].replace('sdrop_', '');
    var editBtn = document.createElement('button');
    editBtn.className = 'btn btn-ghost btn-sm edit-lead-btn';
    editBtn.style.cssText = 'font-size:11px;padding:3px 8px;';
    editBtn.textContent = '✏ Edit';
    editBtn.setAttribute('onclick', "event.stopPropagation();openEditLeadModal('" + leadId + "')");
    var wrap = card.querySelector('.stage-changer-wrap') || card.querySelector('.lc-body') || card;
    wrap.insertBefore(editBtn, wrap.firstChild);
  });
}

function _injectCustomerEditBtns() {
  var tbody = document.getElementById('customers-table-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach(function(row) {
    var lastCell = row.querySelector('td:last-child');
    if (!lastCell || lastCell.querySelector('.edit-cust-btn')) return;
    var custId = row.dataset.cid || row.getAttribute('data-cid');
    if (!custId) {
      var anyBtn = lastCell.querySelector('button[onclick*="startQuoteFor"]');
      if (anyBtn) {
        var m = anyBtn.getAttribute('onclick').match(/startQuoteFor\('([^']+)'\)/);
        if (m) custId = m[1];
      }
    }
    if (!custId) return;
    var editBtn = document.createElement('button');
    editBtn.className = 'btn btn-ghost btn-sm edit-cust-btn';
    editBtn.textContent = '✏ Edit';
    editBtn.setAttribute('onclick', "openEditCustomerModal('" + custId + "')");
    lastCell.insertBefore(editBtn, lastCell.firstChild);
  });
}

// ── MUTATIONOBSERVER: inject extras after any DOM render ─────────────────────
var _pipelineLock = false;
var _pipelineObserver = new MutationObserver(function(mutations) {
  if (_pipelineLock) return;
  var hasNewCards = mutations.some(function(m) {
    return Array.from(m.addedNodes).some(function(n) {
      return n.nodeType === 1 && n.classList &&
             n.classList.contains('lead-card') &&
             !n.classList.contains('inq-lead-card');
    });
  });
  if (!hasNewCards) return;
  _pipelineLock = true;
  requestAnimationFrame(function() {
    _injectLeadEditButtons();
    _renderInquiryPipelineCards();
    _pipelineLock = false;
  });
});

var _custObserver = new MutationObserver(function(mutations) {
  var hasNew = mutations.some(function(m) { return m.addedNodes.length > 0; });
  if (!hasNew) return;
  requestAnimationFrame(_injectCustomerEditBtns);
});

function _setupObservers() {
  var list = document.getElementById('pipeline-deals-list');
  if (list) _pipelineObserver.observe(list, { childList: true });

  var tbody = document.getElementById('customers-table-body');
  if (tbody) _custObserver.observe(tbody, { childList: true });

  _injectLeadEditButtons();
  _renderInquiryPipelineCards();
  _injectCustomerEditBtns();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _setupObservers);
} else {
  _setupObservers();
}

window.addEventListener('load', function() {
  setTimeout(function() {
    _injectLeadEditButtons();
    _renderInquiryPipelineCards();
    _injectCustomerEditBtns();
    _fixSamplingEditButtons();
    _fixInquiryEditButtons();
  }, 800);
});

var _samplesObserver = new MutationObserver(function() {
  requestAnimationFrame(_fixSamplingEditButtons);
});
(function() {
  var sampTbody = document.getElementById('samples-table-body');
  if (sampTbody) _samplesObserver.observe(sampTbody, { childList: true });
})();

document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'pipeline-filter-stage') {
    setTimeout(function() {
      _renderInquiryPipelineCards();
      _injectLeadEditButtons();
    }, 60);
  }
});

(function() {
  var _origNav = window.nav;
  if (typeof _origNav !== 'function') return;
  window.nav = function(page) {
    _origNav(page);
    if (page === 'pipeline') {
      setTimeout(function() {
        _injectLeadEditButtons();
        _renderInquiryPipelineCards();
      }, 900);
    }
    if (page === 'customers') {
      setTimeout(_injectCustomerEditBtns, 900);
    }
    if (page === 'inquiries') {
      setTimeout(function() {
        _fixInquiryEditButtons();
        _removeInquirySyncButtons();
      }, 800);
    }
    if (page === 'sampling') {
      setTimeout(_fixSamplingEditButtons, 800);
    }
  };
})();

// ── FIX INQUIRY EDIT BUTTONS ─────────────────────────────────────────────────
function _fixInquiryEditButtons() {
  var list = document.getElementById('inquiry-list');
  if (!list) return;
  list.querySelectorAll('button[onclick*="editInquiry"]').forEach(function(btn) {
    var m = btn.getAttribute('onclick').match(/editInquiry\('([^']+)'\)/);
    if (!m) return;
    var inqId = m[1];
    btn.setAttribute('onclick', "event.stopPropagation();openEditInquiryModal('" + inqId + "')");
  });
}

var _inqObserver = new MutationObserver(function() {
  requestAnimationFrame(_fixInquiryEditButtons);
});
(function() {
  var inqList = document.getElementById('inquiry-list');
  if (inqList) _inqObserver.observe(inqList, { childList: true });
})();

// ── SAMPLE EDIT BUTTON FIX ────────────────────────────────────────────────────
function _fixSamplingEditButtons() {
  document.querySelectorAll('.edit-sample-btn').forEach(function(btn) {
    if (btn.getAttribute('onclick')) return;
    var row = btn.closest('tr');
    var sampId = row ? (row.getAttribute('data-sid') || row.getAttribute('data-id') ||
      (row.querySelector('td:first-child')?.textContent.trim())) : null;
    if (sampId) {
      btn.setAttribute('onclick', "event.stopPropagation();openEditSampleModal('" + sampId + "')");
    }
  });
}

// ── PRODUCT LOADER (bypasses broken status='active' filter) ──────────────────
var _productsLoading = false;
var _productsLoaded  = false;
async function _ensureProductsLoaded() {
  if (_productsLoaded && (DB.products || []).length > 0) return;
  if (_productsLoading) {
    await new Promise(function(res) { setTimeout(res, 600); });
    return;
  }
  _productsLoading = true;
  try {
    var res = await _sb.from('products').select('product_id,product_name,category,hsn_code,gst_percent,unit,default_rate').order('category');
    if (res.error) throw res.error;
    var rows = res.data || [];
    if (rows.length > 0) {
      DB.products = rows.map(function(r) {
        return {
          id:           r.product_id,
          name:         r.product_name,
          product_name: r.product_name,
          code:         r.product_id,
          cat:          r.category || '',
          category:     r.category || '',
          hsn:          r.hsn_code || '',
          gst:          r.gst_percent || 18,
          unit:         r.unit || 'kg',
          rate:         r.default_rate || 0,
        };
      });
      _productsLoaded = true;
    } else {
      await loadProductsFromSupabase();
      if ((DB.products||[]).length > 0) _productsLoaded = true;
    }
  } catch(e) {
    console.warn('_ensureProductsLoaded error:', e.message);
  } finally {
    _productsLoading = false;
  }
}

// ── PRODUCT AUTOCOMPLETE DROPDOWN ─────────────────────────────────────────────
function _showProductAutocomplete(inputEl, onSelect) {
  if (!inputEl) return;
  var containerId = inputEl.id + '_prod_dd';
  var existing = document.getElementById(containerId);
  if (existing) existing.remove();

  var cats = getUniqueProductCategories();
  var val = inputEl.value.toLowerCase();
  var filtered = val ? cats.filter(function(c) { return c.toLowerCase().includes(val); }) : cats;
  if (!filtered.length) return;

  var dd = document.createElement('div');
  dd.id = containerId;
  dd.style.cssText = 'position:fixed;z-index:9999;background:#fff;border:1px solid var(--gray200,#e5e7eb);border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.1);max-height:200px;overflow-y:auto;min-width:260px;';
  filtered.forEach(function(cat) {
    var item = document.createElement('div');
    item.style.cssText = 'padding:8px 14px;cursor:pointer;font-size:13px;';
    item.textContent = cat;
    item.addEventListener('mousedown', function(e) {
      e.preventDefault();
      inputEl.value = cat;
      dd.remove();
      if (typeof onSelect === 'function') onSelect(cat);
    });
    item.addEventListener('mouseover', function() { item.style.background = 'var(--gray50,#f9fafb)'; });
    item.addEventListener('mouseout',  function() { item.style.background = ''; });
    dd.appendChild(item);
  });

  var rect = inputEl.getBoundingClientRect();
  dd.style.top  = (rect.bottom + 2) + 'px';
  dd.style.left = rect.left + 'px';
  dd.style.width = Math.max(rect.width, 260) + 'px';
  document.body.appendChild(dd);

  setTimeout(function() {
    document.addEventListener('click', function closeDd(ev) {
      if (!dd.contains(ev.target) && ev.target !== inputEl) {
        dd.remove();
        document.removeEventListener('click', closeDd);
      }
    });
  }, 50);
}

document.addEventListener('focus', function(e) {
  if (e.target && e.target.id === 'sample-product' && e.target.tagName === 'INPUT') {
    _ensureProductsLoaded().then(function() {
      _showProductAutocomplete(e.target);
    });
  }
}, true);
document.addEventListener('input', function(e) {
  if (e.target && e.target.id === 'sample-product' && e.target.tagName === 'INPUT') {
    _ensureProductsLoaded().then(function() {
      _showProductAutocomplete(e.target);
    });
  }
});

// ── NEW QUOTATION: product autocomplete on li-product inputs ──────────────────
document.addEventListener('focus', function(e) {
  if (e.target && e.target.classList && e.target.classList.contains('li-product')) {
    _ensureProductsLoaded().then(function() {
      _showProductAutocomplete(e.target, function(cat) {
        if (typeof filterProductSuggest === 'function') {
          var row = e.target.closest('tr');
          if (row) filterProductSuggest(e.target, row.id);
        }
      });
    });
  }
}, true);
document.addEventListener('input', function(e) {
  if (e.target && e.target.classList && e.target.classList.contains('li-product')) {
    var existingDd = document.getElementById(e.target.id + '_prod_dd');
    if (existingDd) existingDd.remove();
    _ensureProductsLoaded().then(function() {
      _showProductAutocomplete(e.target);
    });
  }
});

window.addEventListener('load', function() {
  setTimeout(function() {
    _fixInquiryEditButtons();
    var inqList = document.getElementById('inquiry-list');
    if (inqList && !inqList._obsAttached) {
      _inqObserver.observe(inqList, { childList: true });
      inqList._obsAttached = true;
    }
  }, 1000);
});


