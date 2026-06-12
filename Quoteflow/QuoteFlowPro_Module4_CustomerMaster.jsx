// ═══════════════════════════════════════════════════════════════════════════
// QuoteFlow Pro - MODULE 4: Customer Master
// ═══════════════════════════════════════════════════════════════════════════
// Complete customer management with CRUD operations, multi-contact handling,
// rating system, quote history, chat logs, and detailed drawer view
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from './QuoteFlowPro_Module2_Backend.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER MASTER PAGE
// ═══════════════════════════════════════════════════════════════════════════

const CustomerMasterPage = ({ onNavigate }) => {
  const { customers, saveCustomer, updateCustomer, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(c => {
      const matchesSearch = c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.gstin?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = filterTier === 'all' || c.tier === filterTier;
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && matchesTier && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.companyName.localeCompare(b.companyName);
        case 'turnover':
          return parseFloat(b.turnoverFY || 0) - parseFloat(a.turnoverFY || 0);
        case 'rating':
          return parseFloat(b.overallRating || 0) - parseFloat(a.overallRating || 0);
        case 'recent':
          return new Date(b.modifiedDate) - new Date(a.modifiedDate);
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, searchQuery, filterTier, filterStatus, sortBy]);

  const handleNewCustomer = () => {
    setEditingCustomer(null);
    setShowNewCustomerModal(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowNewCustomerModal(true);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleCloseDrawer = () => {
    setSelectedCustomer(null);
  };

  return (
    <div style={{ padding: '28px 32px', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B', fontFamily: "'Playfair Display', serif" }}>
            Customer Master
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>
        <button
          onClick={handleNewCustomer}
          style={{
            padding: '10px 20px',
            background: '#1A6FDB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', stroke: 'currentColor', fill: 'none' }}>
            <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Customer
        </button>
      </div>

      {/* Filters & Search */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 24 24" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', stroke: '#94A3B8', fill: 'none' }}>
              <circle cx="11" cy="11" r="8" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search customers, city, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 40px',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            style={{
              padding: '9px 14px',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Tiers</option>
            <option value="gold">Gold (>₹1Cr)</option>
            <option value="silver">Silver (₹10L-1Cr)</option>
            <option value="bronze">Bronze (<₹10L)</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '9px 14px',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '9px 14px',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="turnover">Sort by Turnover</option>
            <option value="rating">Sort by Rating</option>
            <option value="recent">Recently Modified</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ color: '#94A3B8', fontSize: '14px' }}>Loading customers...</div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <div style={{ color: '#64748B', fontSize: '14px', marginBottom: '8px' }}>No customers found</div>
          <div style={{ color: '#94A3B8', fontSize: '13px' }}>Try adjusting your filters or search query</div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tier</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Turnover</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rating</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, idx) => (
                <tr
                  key={customer.customerId}
                  style={{
                    borderBottom: idx < filteredCustomers.length - 1 ? '1px solid #F1F5F9' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => handleViewCustomer(customer)}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{customer.companyName}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontFamily: 'monospace' }}>{customer.gstin || '—'}</div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>
                    {customer.city}, {customer.state}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: '13px', color: '#334155' }}>{customer.primaryContact}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{customer.primaryEmail}</div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <TierBadge tier={customer.tier} />
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>
                    ₹{(parseFloat(customer.turnoverFY || 0) / 100000).toFixed(1)}L
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <RatingDisplay rating={parseFloat(customer.overallRating || 0)} />
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <StatusBadge status={customer.status} />
                  </td>
                  <td style={{ padding: '14px 20px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      style={{
                        padding: '6px 12px',
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#64748B'
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New/Edit Customer Modal */}
      {showNewCustomerModal && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setShowNewCustomerModal(false)}
          onSave={async (customerData) => {
            if (editingCustomer) {
              await updateCustomer(editingCustomer.customerId, customerData);
            } else {
              await saveCustomer(customerData);
            }
            setShowNewCustomerModal(false);
          }}
        />
      )}

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <CustomerDetailDrawer
          customer={selectedCustomer}
          onClose={handleCloseDrawer}
          onEdit={() => {
            handleEditCustomer(selectedCustomer);
            setSelectedCustomer(null);
          }}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER FORM MODAL
// ═══════════════════════════════════════════════════════════════════════════

const CustomerFormModal = ({ customer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    companyName: customer?.companyName || '',
    legalName: customer?.legalName || '',
    gstin: customer?.gstin || '',
    pan: customer?.pan || '',
    city: customer?.city || '',
    state: customer?.state || '',
    country: customer?.country || 'India',
    address: customer?.address || '',
    pincode: customer?.pincode || '',
    primaryContact: customer?.primaryContact || '',
    primaryEmail: customer?.primaryEmail || '',
    primaryPhone: customer?.primaryPhone || '',
    industry: customer?.industry || '',
    segment: customer?.segment || 'Mid-Market',
    incoterms: customer?.incoterms || 'CIF',
    paymentTerms: customer?.paymentTerms || '30 Days',
    creditLimit: customer?.creditLimit || '',
    turnoverFY: customer?.turnoverFY || '',
    status: customer?.status || 'active',
    notes: customer?.notes || ''
  });

  const [activeTab, setActiveTab] = useState('basic');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Calculate tier based on turnover
    const turnover = parseFloat(formData.turnoverFY || 0);
    const tier = turnover >= 10000000 ? 'gold' : turnover >= 1000000 ? 'silver' : 'bronze';
    
    const dataToSave = {
      ...formData,
      tier,
      modifiedDate: new Date().toISOString().split('T')[0],
      createdDate: customer?.createdDate || new Date().toISOString().split('T')[0]
    };
    
    onSave(dataToSave);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B' }}>
              {customer ? 'Edit Customer' : 'New Customer'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Fill in customer details and contact information
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: '#F1F5F9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', stroke: '#64748B' }}>
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 28px' }}>
          {['basic', 'contact', 'business'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                fontSize: '13px',
                fontWeight: '500',
                color: activeTab === tab ? '#1A6FDB' : '#64748B',
                borderBottom: activeTab === tab ? '2px solid #1A6FDB' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'basic' ? 'Basic Info' : tab === 'contact' ? 'Contact' : 'Business Terms'}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'basic' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Company Name *" value={formData.companyName} onChange={(v) => handleChange('companyName', v)} />
              <FormField label="Legal Name" value={formData.legalName} onChange={(v) => handleChange('legalName', v)} />
              <FormField label="GSTIN" value={formData.gstin} onChange={(v) => handleChange('gstin', v)} placeholder="27AAACR5055K1Z7" />
              <FormField label="PAN" value={formData.pan} onChange={(v) => handleChange('pan', v)} placeholder="AAACR5055K" />
              <FormField label="City *" value={formData.city} onChange={(v) => handleChange('city', v)} />
              <FormField label="State *" value={formData.state} onChange={(v) => handleChange('state', v)} />
              <FormField label="Country" value={formData.country} onChange={(v) => handleChange('country', v)} />
              <FormField label="Pincode" value={formData.pincode} onChange={(v) => handleChange('pincode', v)} />
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Address" value={formData.address} onChange={(v) => handleChange('address', v)} multiline />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Primary Contact *" value={formData.primaryContact} onChange={(v) => handleChange('primaryContact', v)} />
              <FormField label="Primary Email *" value={formData.primaryEmail} onChange={(v) => handleChange('primaryEmail', v)} type="email" />
              <FormField label="Primary Phone *" value={formData.primaryPhone} onChange={(v) => handleChange('primaryPhone', v)} placeholder="+91-XXXXXXXXXX" />
              <FormField label="Industry" value={formData.industry} onChange={(v) => handleChange('industry', v)} placeholder="e.g., Petrochemicals" />
            </div>
          )}

          {activeTab === 'business' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormSelect label="Segment" value={formData.segment} onChange={(v) => handleChange('segment', v)}>
                <option value="Large Enterprise">Large Enterprise</option>
                <option value="Mid-Market">Mid-Market</option>
                <option value="Small Business">Small Business</option>
              </FormSelect>
              <FormSelect label="Incoterms" value={formData.incoterms} onChange={(v) => handleChange('incoterms', v)}>
                <option value="CIF">CIF</option>
                <option value="FOB">FOB</option>
                <option value="CFR">CFR</option>
                <option value="EXW">EXW</option>
              </FormSelect>
              <FormField label="Payment Terms" value={formData.paymentTerms} onChange={(v) => handleChange('paymentTerms', v)} placeholder="30 Days" />
              <FormField label="Credit Limit (₹)" value={formData.creditLimit} onChange={(v) => handleChange('creditLimit', v)} type="number" />
              <FormField label="FY Turnover (₹)" value={formData.turnoverFY} onChange={(v) => handleChange('turnoverFY', v)} type="number" />
              <FormSelect label="Status" value={formData.status} onChange={(v) => handleChange('status', v)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </FormSelect>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Notes" value={formData.notes} onChange={(v) => handleChange('notes', v)} multiline />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              color: '#64748B'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.companyName || !formData.city || !formData.state || !formData.primaryContact}
            style={{
              padding: '9px 18px',
              background: formData.companyName && formData.city ? '#1A6FDB' : '#94A3B8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: formData.companyName && formData.city ? 'pointer' : 'not-allowed'
            }}
          >
            {customer ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER DETAIL DRAWER
// ═══════════════════════════════════════════════════════════════════════════

const CustomerDetailDrawer = ({ customer, onClose, onEdit, onNavigate }) => {
  const { quotations, chatHistory, getCustomerQuotes, getCustomerChats, addChatMessage } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [chatMessage, setChatMessage] = useState('');
  const [chatType, setChatType] = useState('whatsapp');

  const customerQuotes = getCustomerQuotes(customer.customerId);
  const customerChats = getCustomerChats(customer.customerId);

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    
    const chatData = {
      customerId: customer.customerId,
      messageType: 'note',
      channel: chatType,
      message: chatMessage,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      loggedBy: 'Current User'
    };
    
    await addChatMessage(chatData);
    setChatMessage('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '600px',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s ease'
      }}
    >
      {/* Header */}
      <div style={{ padding: '24px 28px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1E293B', marginBottom: '6px' }}>
              {customer.companyName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <TierBadge tier={customer.tier} />
              <StatusBadge status={customer.status} />
              <span style={{ fontSize: '12px', color: '#64748B' }}>•</span>
              <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>{customer.gstin || 'No GSTIN'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: '#F1F5F9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', stroke: '#64748B' }}>
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <QuickStat label="Turnover" value={`₹${(parseFloat(customer.turnoverFY || 0) / 100000).toFixed(1)}L`} />
          <QuickStat label="Rating" value={`⭐ ${parseFloat(customer.overallRating || 0).toFixed(1)}`} />
          <QuickStat label="Quotes" value={customerQuotes.length} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 28px' }}>
        {['overview', 'quotes', 'activity'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              fontSize: '13px',
              fontWeight: '500',
              color: activeTab === tab ? '#1A6FDB' : '#64748B',
              borderBottom: activeTab === tab ? '2px solid #1A6FDB' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Contact Info */}
            <Section title="Primary Contact">
              <InfoRow label="Name" value={customer.primaryContact} />
              <InfoRow label="Email" value={customer.primaryEmail} />
              <InfoRow label="Phone" value={customer.primaryPhone} />
            </Section>

            {/* Business Info */}
            <Section title="Business Information">
              <InfoRow label="Industry" value={customer.industry || '—'} />
              <InfoRow label="Segment" value={customer.segment} />
              <InfoRow label="Incoterms" value={customer.incoterms} />
              <InfoRow label="Payment Terms" value={customer.paymentTerms} />
              <InfoRow label="Credit Limit" value={customer.creditLimit ? `₹${(parseFloat(customer.creditLimit) / 100000).toFixed(1)}L` : '—'} />
            </Section>

            {/* Location */}
            <Section title="Location">
              <InfoRow label="Address" value={customer.address} />
              <InfoRow label="City" value={`${customer.city}, ${customer.state} ${customer.pincode}`} />
              <InfoRow label="Country" value={customer.country} />
            </Section>

            {/* Rating Breakdown */}
            <Section title="Customer Rating">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <RatingBar label="Payment" value={parseFloat(customer.paymentRating || 0)} />
                <RatingBar label="Orders" value={parseFloat(customer.ordersRating || 0)} />
                <RatingBar label="Trend" value={parseFloat(customer.trendRating || 0)} />
              </div>
            </Section>

            {customer.notes && (
              <Section title="Notes">
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>{customer.notes}</p>
              </Section>
            )}
          </div>
        )}

        {activeTab === 'quotes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {customerQuotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📄</div>
                <div style={{ fontSize: '13px' }}>No quotes for this customer</div>
              </div>
            ) : (
              customerQuotes.map(quote => (
                <div
                  key={quote.quoteId}
                  style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{quote.quoteNumber}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{quote.date}</div>
                    </div>
                    <StatusBadge status={quote.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', fontFamily: "'Playfair Display', serif" }}>
                      ₹{(parseFloat(quote.grandTotal) / 100000).toFixed(2)}L
                    </div>
                    <button
                      onClick={() => onNavigate('quotations', { quoteId: quote.quoteId })}
                      style={{
                        padding: '6px 12px',
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: '#1A6FDB'
                      }}
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            {/* Chat History */}
            <div style={{ marginBottom: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              {customerChats.map((chat, idx) => (
                <div key={idx} style={{ marginBottom: '12px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #1A6FDB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>{chat.channel}</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{chat.date} {chat.time}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>{chat.message}</p>
                </div>
              ))}
            </div>

            {/* New Chat Input */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <select
                  value={chatType}
                  onChange={(e) => setChatType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '8px'
                  }}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="call">Call Note</option>
                </select>
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Log a message or call note..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <button
                onClick={handleSendChat}
                disabled={!chatMessage.trim()}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: chatMessage.trim() ? '#1A6FDB' : '#94A3B8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: chatMessage.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Log Message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{ padding: '16px 28px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '12px' }}>
        <button
          onClick={onEdit}
          style={{
            flex: 1,
            padding: '10px',
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            color: '#64748B'
          }}
        >
          Edit Customer
        </button>
        <button
          onClick={() => onNavigate('quotations', { customerId: customer.customerId })}
          style={{
            flex: 1,
            padding: '10px',
            background: '#1A6FDB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          New Quote
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const FormField = ({ label, value, onChange, type = 'text', placeholder = '', multiline = false }) => {
  const InputTag = multiline ? 'textarea' : 'input';
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>
        {label}
      </label>
      <InputTag
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '9px 12px',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          fontSize: '13px',
          outline: 'none',
          fontFamily: 'inherit',
          ...(multiline && { minHeight: '80px', resize: 'vertical' })
        }}
      />
    </div>
  );
};

const FormSelect = ({ label, value, onChange, children }) => {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '9px 12px',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          fontSize: '13px',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        {children}
      </select>
    </div>
  );
};

const TierBadge = ({ tier }) => {
  const styles = {
    gold: { bg: '#FEF3C7', color: '#D97706', icon: '👑', text: 'Gold' },
    silver: { bg: '#F1F5F9', color: '#475569', icon: '⭐', text: 'Silver' },
    bronze: { bg: '#FEE2E2', color: '#DC2626', icon: '🥉', text: 'Bronze' }
  };
  const style = styles[tier] || styles.bronze;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: '16px',
      fontSize: '11px',
      fontWeight: '600',
      background: style.bg,
      color: style.color
    }}>
      <span>{style.icon}</span>
      {style.text}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: { bg: '#DCFCE7', color: '#16A34A', text: 'Active' },
    inactive: { bg: '#FEE2E2', color: '#DC2626', text: 'Inactive' },
    sent: { bg: '#E8F1FB', color: '#1558B0', text: 'Sent' },
    draft: { bg: '#F1F5F9', color: '#64748B', text: 'Draft' },
    won: { bg: '#DCFCE7', color: '#16A34A', text: 'Won' }
  };
  const style = styles[status] || styles.draft;

  return (
    <span style={{
      display: 'inline-flex',
      padding: '3px 9px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500',
      background: style.bg,
      color: style.color
    }}>
      {style.text}
    </span>
  );
};

const RatingDisplay = ({ rating }) => {
  const stars = Math.round(rating / 2);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} style={{ fontSize: '14px', color: i <= stars ? '#D97706' : '#E2E8F0' }}>★</span>
        ))}
      </div>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>{rating.toFixed(1)}</span>
    </div>
  );
};

const QuickStat = ({ label, value }) => (
  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center' }}>
    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {title}
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {children}
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>{label}</span>
    <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
  </div>
);

const RatingBar = ({ label, value }) => {
  const percent = (value / 10) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#64748B' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#1E293B' }}>{value}/10</span>
      </div>
      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: '#1A6FDB', borderRadius: '3px', transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default CustomerMasterPage;
export { CustomerFormModal, CustomerDetailDrawer, TierBadge, StatusBadge, RatingDisplay };
