// ═══════════════════════════════════════════════════════════════════════════
// QuoteFlow Pro - MODULE 5: Quotation Builder
// ═══════════════════════════════════════════════════════════════════════════
// Complete quotation system with line item management, HSN/GST calculations,
// automatic numbering, PDF generation, and email functionality
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from './QuoteFlowPro_Module2_Backend.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// QUOTATION LIST PAGE
// ═══════════════════════════════════════════════════════════════════════════

const QuotationListPage = ({ onNavigate, filterParams = {} }) => {
  const { quotations, customers, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(filterParams.status || 'all');
  const [sortBy, setSortBy] = useState('recent');

  const filteredQuotations = useMemo(() => {
    let filtered = quotations.filter(q => {
      const matchesSearch = q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.date) - new Date(a.date);
        case 'value':
          return parseFloat(b.grandTotal) - parseFloat(a.grandTotal);
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [quotations, searchQuery, filterStatus, sortBy]);

  const handleNewQuote = () => {
    onNavigate('quotation-builder', { mode: 'new' });
  };

  const handleEditQuote = (quote) => {
    onNavigate('quotation-builder', { mode: 'edit', quoteId: quote.quoteId });
  };

  const handleViewQuote = (quote) => {
    onNavigate('quotation-builder', { mode: 'view', quoteId: quote.quoteId });
  };

  return (
    <div style={{ padding: '28px 32px', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B', fontFamily: "'Playfair Display', serif" }}>
            Quotations
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            {filteredQuotations.length} of {quotations.length} quotations
          </p>
        </div>
        <button
          onClick={handleNewQuote}
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
          New Quotation
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 24 24" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', stroke: '#94A3B8', fill: 'none' }}>
              <circle cx="11" cy="11" r="8" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search quotations, customers..."
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
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="negotiating">Negotiating</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
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
            <option value="recent">Recently Created</option>
            <option value="value">Highest Value</option>
            <option value="customer">By Customer</option>
          </select>
        </div>
      </div>

      {/* Quotations Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '14px' }}>
          <div style={{ color: '#94A3B8', fontSize: '14px' }}>Loading quotations...</div>
        </div>
      ) : filteredQuotations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '14px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
          <div style={{ color: '#64748B', fontSize: '14px', marginBottom: '8px' }}>No quotations found</div>
          <div style={{ color: '#94A3B8', fontSize: '13px' }}>Create your first quotation to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredQuotations.map(quote => (
            <QuotationCard
              key={quote.quoteId}
              quote={quote}
              onView={() => handleViewQuote(quote)}
              onEdit={() => handleEditQuote(quote)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// QUOTATION BUILDER PAGE
// ═══════════════════════════════════════════════════════════════════════════

const QuotationBuilderPage = ({ mode = 'new', quoteId = null, onNavigate }) => {
  const { customers, products, quotations, lineItems, getQuoteLineItems, saveQuotation, getConfigValue } = useData();
  
  const existingQuote = quoteId ? quotations.find(q => q.quoteId === quoteId) : null;
  const existingLineItems = quoteId ? getQuoteLineItems(quoteId) : [];

  const [quoteData, setQuoteData] = useState({
    customerId: existingQuote?.customerId || '',
    customerName: existingQuote?.customerName || '',
    contactPerson: existingQuote?.contactPerson || '',
    contactEmail: existingQuote?.contactEmail || '',
    date: existingQuote?.date || new Date().toISOString().split('T')[0],
    validUntil: existingQuote?.validUntil || getDefaultValidUntil(),
    incoterms: existingQuote?.incoterms || 'CIF',
    paymentTerms: existingQuote?.paymentTerms || '30 Days',
    currency: existingQuote?.currency || 'INR',
    source: existingQuote?.source || 'email',
    notes: existingQuote?.notes || '',
    termsConditions: existingQuote?.termsConditions || 'Standard T&C apply',
    status: existingQuote?.status || 'draft'
  });

  const [items, setItems] = useState(
    existingLineItems.length > 0
      ? existingLineItems.map(item => ({
          lineNumber: item.lineNumber,
          productCode: item.productCode,
          productName: item.productName,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unit: item.unit,
          priceBasis: item.priceBasis,
          rate: item.rate,
          gstPercent: item.gstPercent,
          amount: item.amount
        }))
      : [createEmptyLineItem(1)]
  );

  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Auto-fill customer details when selected
  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.customerId === customerId);
    if (customer) {
      setQuoteData(prev => ({
        ...prev,
        customerId,
        customerName: customer.companyName,
        contactPerson: customer.primaryContact,
        contactEmail: customer.primaryEmail,
        incoterms: customer.incoterms || prev.incoterms,
        paymentTerms: customer.paymentTerms || prev.paymentTerms
      }));
    }
  };

  // Add new line item
  const handleAddItem = () => {
    setItems(prev => [...prev, createEmptyLineItem(prev.length + 1)]);
  };

  // Remove line item
  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, lineNumber: String(i + 1) })));
    }
  };

  // Update line item
  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-fill product details
      if (field === 'productCode') {
        const product = products.find(p => p.productId === value || p.productName === value);
        if (product) {
          newItems[index].productName = product.productName;
          newItems[index].hsnCode = product.hsnCode;
          newItems[index].gstPercent = product.gstPercent;
          newItems[index].rate = product.defaultRate;
          newItems[index].unit = product.unit;
          newItems[index].priceBasis = `Per ${product.unit}`;
        }
      }

      // Recalculate amount
      if (field === 'quantity' || field === 'rate') {
        const qty = parseFloat(newItems[index].quantity || 0);
        const rate = parseFloat(newItems[index].rate || 0);
        newItems[index].amount = String(qty * rate);
      }

      return newItems;
    });
  };

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const gstAmount = items.reduce((sum, item) => {
      const amount = parseFloat(item.amount || 0);
      const gstPercent = parseFloat(item.gstPercent || 0);
      return sum + (amount * gstPercent / 100);
    }, 0);
    const insuranceRate = parseFloat(getConfigValue('insurance_rate') || 0.0015);
    const insurance = subtotal * insuranceRate;
    const freight = 0; // Can be added as input field
    const discount = 0; // Can be added as input field
    const grandTotal = subtotal + gstAmount + freight + insurance - discount;

    return { subtotal, gstAmount, freight, insurance, discount, grandTotal };
  }, [items, getConfigValue]);

  // Save quotation
  const handleSave = async (status = 'draft') => {
    const quotePrefix = getConfigValue('quote_prefix') || 'QF';
    const dateStr = quoteData.date.replace(/-/g, '').substring(2, 6); // YYMM
    const quoteNumber = `${quotePrefix}-${dateStr}-${String(quotations.length + 1).padStart(3, '0')}`;

    const finalQuoteData = {
      ...quoteData,
      quoteNumber,
      version: '1',
      subtotal: String(calculations.subtotal),
      gstAmount: String(calculations.gstAmount),
      freight: String(calculations.freight),
      insurance: String(calculations.insurance),
      discount: String(calculations.discount),
      grandTotal: String(calculations.grandTotal),
      status,
      createdBy: 'Current User',
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString()
    };

    await saveQuotation(finalQuoteData, items);
    onNavigate('quotations');
  };

  const isReadOnly = mode === 'view';

  return (
    <div style={{ padding: '28px 32px', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate('quotations')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', stroke: '#64748B', fill: 'none' }}>
              <line x1="19" y1="12" x2="5" y2="12" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="12 19 5 12 12 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B', fontFamily: "'Playfair Display', serif" }}>
              {mode === 'new' ? 'New Quotation' : mode === 'edit' ? 'Edit Quotation' : 'View Quotation'}
            </h1>
            {existingQuote && (
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                {existingQuote.quoteNumber} • {existingQuote.customerName}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isReadOnly && (
            <>
              <button
                onClick={() => handleSave('draft')}
                style={{
                  padding: '10px 18px',
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSave('sent')}
                disabled={!quoteData.customerId}
                style={{
                  padding: '10px 18px',
                  background: quoteData.customerId ? '#1A6FDB' : '#94A3B8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: quoteData.customerId ? 'pointer' : 'not-allowed'
                }}
              >
                Save & Send
              </button>
            </>
          )}
          {mode === 'view' && (
            <button
              onClick={() => setShowPDFPreview(true)}
              style={{
                padding: '10px 18px',
                background: '#1A6FDB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Download PDF
            </button>
          )}
        </div>
      </div>

      {/* Main Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column - Quote Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer & Basic Info */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px 24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>
              Customer & Quote Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>
                  Customer *
                </label>
                <select
                  value={quoteData.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  disabled={isReadOnly}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: isReadOnly ? 'default' : 'pointer',
                    background: isReadOnly ? '#F8FAFC' : 'white'
                  }}
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.customerId} value={c.customerId}>{c.companyName}</option>
                  ))}
                </select>
              </div>
              <QuoteField label="Contact Person" value={quoteData.contactPerson} onChange={(v) => setQuoteData(p => ({ ...p, contactPerson: v }))} readOnly={isReadOnly} />
              <QuoteField label="Contact Email" value={quoteData.contactEmail} onChange={(v) => setQuoteData(p => ({ ...p, contactEmail: v }))} readOnly={isReadOnly} />
              <QuoteField label="Quote Date" value={quoteData.date} onChange={(v) => setQuoteData(p => ({ ...p, date: v }))} type="date" readOnly={isReadOnly} />
              <QuoteField label="Valid Until" value={quoteData.validUntil} onChange={(v) => setQuoteData(p => ({ ...p, validUntil: v }))} type="date" readOnly={isReadOnly} />
              <QuoteField label="Incoterms" value={quoteData.incoterms} onChange={(v) => setQuoteData(p => ({ ...p, incoterms: v }))} readOnly={isReadOnly} />
              <QuoteField label="Payment Terms" value={quoteData.paymentTerms} onChange={(v) => setQuoteData(p => ({ ...p, paymentTerms: v }))} readOnly={isReadOnly} />
            </div>
          </div>

          {/* Line Items */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Line Items</h3>
              {!isReadOnly && (
                <button
                  onClick={handleAddItem}
                  style={{
                    padding: '6px 12px',
                    background: '#E8F1FB',
                    color: '#1A6FDB',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  + Add Item
                </button>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>#</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', minWidth: '180px' }}>Product</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>HSN</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Unit</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Rate</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>GST%</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Amount</th>
                    {!isReadOnly && <th style={{ padding: '10px 12px', width: '40px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px', color: '#64748B' }}>{item.lineNumber}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {isReadOnly ? (
                          <div>
                            <div style={{ fontWeight: '500' }}>{item.productName}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{item.productCode}</div>
                          </div>
                        ) : (
                          <select
                            value={item.productCode}
                            onChange={(e) => handleItemChange(idx, 'productCode', e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}
                          >
                            <option value="">Select Product</option>
                            {products.map(p => (
                              <option key={p.productId} value={p.productId}>{p.productName}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '12px' }}>{item.hsnCode}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        {isReadOnly ? item.quantity : (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            style={{ width: '80px', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', textAlign: 'right' }}
                          />
                        )}
                      </td>
                      <td style={{ padding: '8px 12px' }}>{item.unit}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        {isReadOnly ? item.rate : (
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                            style={{ width: '100px', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', textAlign: 'right' }}
                          />
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.gstPercent}%</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>₹{parseFloat(item.amount || 0).toFixed(2)}</td>
                      {!isReadOnly && (
                        <td style={{ padding: '8px 12px' }}>
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length === 1}
                            style={{
                              padding: '4px',
                              background: 'none',
                              border: 'none',
                              cursor: items.length > 1 ? 'pointer' : 'not-allowed',
                              opacity: items.length > 1 ? 1 : 0.3
                            }}
                          >
                            <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', stroke: '#DC2626', fill: 'none' }}>
                              <polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & T&C */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px 24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>
              Additional Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Notes</label>
                <textarea
                  value={quoteData.notes}
                  onChange={(e) => setQuoteData(p => ({ ...p, notes: e.target.value }))}
                  readOnly={isReadOnly}
                  placeholder="Special instructions, delivery notes, etc."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    background: isReadOnly ? '#F8FAFC' : 'white'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>Terms & Conditions</label>
                <textarea
                  value={quoteData.termsConditions}
                  onChange={(e) => setQuoteData(p => ({ ...p, termsConditions: e.target.value }))}
                  readOnly={isReadOnly}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    background: isReadOnly ? '#F8FAFC' : 'white'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div>
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px 24px', position: 'sticky', top: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>
              Quote Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <SummaryRow label="Subtotal" value={calculations.subtotal} />
              <SummaryRow label="GST" value={calculations.gstAmount} />
              <SummaryRow label="Freight" value={calculations.freight} />
              <SummaryRow label="Insurance (0.15%)" value={calculations.insurance} />
              {calculations.discount > 0 && <SummaryRow label="Discount" value={-calculations.discount} />}
              <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B' }}>Grand Total</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#1A6FDB', fontFamily: "'Playfair Display', serif" }}>
                    ₹{calculations.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', textAlign: 'right' }}>
                  {quoteData.currency}
                </div>
              </div>
            </div>

            {mode === 'view' && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <InfoItem label="Status" value={<StatusBadge status={existingQuote.status} />} />
                  <InfoItem label="Source" value={existingQuote.source} />
                  <InfoItem label="Created" value={existingQuote.createdDate} />
                  <InfoItem label="Modified" value={existingQuote.modifiedDate} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const QuotationCard = ({ quote, onView, onEdit }) => {
  const statusColors = {
    draft: '#94A3B8',
    sent: '#1A6FDB',
    negotiating: '#D97706',
    won: '#16A34A',
    lost: '#DC2626'
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onClick={onView}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: statusColors[quote.status] || '#94A3B8' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B', marginBottom: '4px' }}>
            {quote.quoteNumber}
          </div>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            {quote.customerName}
          </div>
        </div>
        <StatusBadge status={quote.status} />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', fontFamily: "'Playfair Display', serif" }}>
          ₹{(parseFloat(quote.grandTotal) / 100000).toFixed(2)}L
        </span>
        <span style={{ fontSize: '12px', color: '#64748B' }}>{quote.currency}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
          {quote.date} • Valid until {quote.validUntil}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            padding: '4px 10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            fontSize: '11px',
            cursor: 'pointer',
            color: '#64748B',
            fontWeight: '500'
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

const QuoteField = ({ label, value, onChange, type = 'text', readOnly = false }) => (
  <div>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      style={{
        width: '100%',
        padding: '9px 12px',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        fontSize: '13px',
        outline: 'none',
        background: readOnly ? '#F8FAFC' : 'white'
      }}
    />
  </div>
);

const SummaryRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '13px', color: '#64748B' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>
      ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color: '#334155', fontWeight: '500' }}>{value}</span>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    draft: { bg: '#F1F5F9', color: '#64748B', text: 'Draft' },
    sent: { bg: '#E8F1FB', color: '#1558B0', text: 'Sent' },
    negotiating: { bg: '#FEF3C7', color: '#D97706', text: 'Negotiating' },
    won: { bg: '#DCFCE7', color: '#16A34A', text: 'Won' },
    lost: { bg: '#FEE2E2', color: '#DC2626', text: 'Lost' }
  };
  const style = styles[status] || styles.draft;

  return (
    <span style={{
      display: 'inline-flex',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      background: style.bg,
      color: style.color,
      textTransform: 'uppercase',
      letterSpacing: '0.03em'
    }}>
      {style.text}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function createEmptyLineItem(lineNumber) {
  return {
    lineNumber: String(lineNumber),
    productCode: '',
    productName: '',
    hsnCode: '',
    quantity: '',
    unit: 'Kg',
    priceBasis: 'Per Kg',
    rate: '',
    gstPercent: '18',
    amount: '0'
  };
}

function getDefaultValidUntil() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default QuotationBuilderPage;
export { QuotationListPage, QuotationCard, StatusBadge };
