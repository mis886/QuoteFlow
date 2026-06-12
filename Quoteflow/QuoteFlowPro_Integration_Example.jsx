// ═══════════════════════════════════════════════════════════════════════════
// QuoteFlow Pro - INTEGRATION EXAMPLE: Module 1 + Module 2
// ═══════════════════════════════════════════════════════════════════════════
// This file demonstrates how to integrate the authentication/UI shell (Module 1)
// with the Google Sheets backend layer (Module 2)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './QuoteFlowPro_Module2_Backend.jsx';

// Import Module 1 components (abbreviated for demonstration)
// In production, these would be in separate files

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED DASHBOARD WITH REAL DATA
// ═══════════════════════════════════════════════════════════════════════════

const DashboardPageWithData = () => {
  const { quotations, customers, leads, loading, lastSync, fetchAllData } = useData();
  
  // Calculate KPIs from real data
  const kpis = {
    quotesSent: quotations.filter(q => q.status === 'sent').length,
    quotesValue: quotations.reduce((sum, q) => sum + parseFloat(q.grandTotal || 0), 0),
    winRate: quotations.length > 0 
      ? (quotations.filter(q => q.status === 'won').length / quotations.length * 100).toFixed(1)
      : 0,
    totalCustomers: customers.filter(c => c.status === 'active').length
  };

  // Pipeline stages count
  const pipelineData = {
    lead: leads.filter(l => l.stage === 'lead').length,
    quoted: leads.filter(l => l.stage === 'quoted').length,
    sampling: leads.filter(l => l.stage === 'sampling').length,
    negotiating: leads.filter(l => l.stage === 'negotiating').length,
    won: leads.filter(l => l.stage === 'won').length,
    lost: leads.filter(l => l.stage === 'lost').length
  };

  const handleSync = async () => {
    await fetchAllData();
  };

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Sync status bar */}
      <div style={{ 
        background: '#E8F1FB', 
        padding: '12px 20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', stroke: '#1A6FDB' }}>
            <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2"/>
            <polyline points="12 6 12 12 16 14" fill="none" strokeWidth="2"/>
          </svg>
          <span style={{ fontSize: '13px', color: '#1558B0' }}>
            {loading ? 'Syncing...' : `Last synced: ${lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never'}`}
          </span>
        </div>
        <button 
          onClick={handleSync}
          disabled={loading}
          style={{
            padding: '6px 12px',
            background: '#1A6FDB',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* KPI Cards with real data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="Quotes Sent (MTD)" 
          value={kpis.quotesSent}
          change="+12%" 
          changeType="up" 
          color="blue"
          icon="file-text"
        />
        <StatCard 
          label="Quote Value (MTD)" 
          value={`₹${(kpis.quotesValue / 100000).toFixed(1)}L`}
          change="+8%" 
          changeType="up" 
          color="teal"
          icon="trending-up"
        />
        <StatCard 
          label="Win Rate" 
          value={`${kpis.winRate}%`}
          change="+2.3%" 
          changeType="up" 
          color="purple"
          icon="target"
        />
        <StatCard 
          label="Active Customers" 
          value={kpis.totalCustomers}
          change="+3" 
          changeType="up" 
          color="amber"
          icon="users"
        />
      </div>

      {/* Pipeline Funnel */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Sales Pipeline</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { stage: 'Lead', count: pipelineData.lead, color: '#1A6FDB' },
            { stage: 'Quoted', count: pipelineData.quoted, color: '#0F8A6F' },
            { stage: 'Sampling', count: pipelineData.sampling, color: '#D97706' },
            { stage: 'Negotiating', count: pipelineData.negotiating, color: '#7C3AED' },
            { stage: 'Won', count: pipelineData.won, color: '#16A34A' },
            { stage: 'Lost', count: pipelineData.lost, color: '#DC2626' }
          ].map(({ stage, count, color }) => (
            <div key={stage} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ 
                height: `${Math.max(40, count * 20)}px`, 
                background: color, 
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                {count}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stage}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Quotations Table */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Recent Quotations</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Quote #</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Customer</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Value</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {quotations.slice(0, 5).map((q, idx) => (
              <tr key={q.quoteId} style={{ borderBottom: idx < 4 ? '1px solid #F1F5F9' : 'none' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600' }}>{q.quoteNumber}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{q.customerName}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748B' }}>{q.date}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600' }}>₹{(parseFloat(q.grandTotal) / 100000).toFixed(2)}L</td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusBadge status={q.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER MASTER WITH BACKEND INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

const CustomerMasterPageWithData = () => {
  const { customers, loading, saveCustomer, updateCustomer } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || c.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const handleSaveCustomer = async (customerData) => {
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.customerId, customerData);
      } else {
        await saveCustomer(customerData);
      }
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Customer Master</h2>
        <button 
          onClick={() => setSelectedCustomer({})}
          style={{
            padding: '8px 16px',
            background: '#1A6FDB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          + New Customer
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input 
          type="text"
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 14px',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '13px'
          }}
        />
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          style={{
            padding: '8px 14px',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '13px',
            minWidth: '150px'
          }}
        >
          <option value="all">All Tiers</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
        </select>
      </div>

      {/* Customer Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
          Loading customers...
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Company</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>City</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Tier</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Turnover</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Rating</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c, idx) => (
                <tr 
                  key={c.customerId} 
                  onClick={() => setSelectedCustomer(c)}
                  style={{ 
                    borderBottom: idx < filteredCustomers.length - 1 ? '1px solid #F1F5F9' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600' }}>{c.companyName}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748B' }}>{c.city}</td>
                  <td style={{ padding: '12px 16px' }}><TierBadge tier={c.tier} /></td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600' }}>₹{(parseFloat(c.turnoverFY || 0) / 100000).toFixed(1)}L</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>⭐ {parseFloat(c.overallRating || 0).toFixed(1)}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const StatCard = ({ label, value, change, changeType, color, icon }) => {
  const colorStyles = {
    blue: { bg: '#E8F1FB', stroke: '#1A6FDB', border: '#1A6FDB' },
    teal: { bg: '#E3F5F0', stroke: '#0F8A6F', border: '#0F8A6F' },
    amber: { bg: '#FEF3C7', stroke: '#D97706', border: '#D97706' },
    purple: { bg: '#EDE9FE', stroke: '#7C3AED', border: '#7C3AED' }
  };

  return (
    <div style={{ 
      background: 'white', 
      border: '1px solid #E2E8F0', 
      borderRadius: '14px', 
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: colorStyles[color].border }} />
      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ fontSize: '26px', fontWeight: '600', color: '#1E293B', margin: '6px 0 2px', fontFamily: "'Playfair Display', serif" }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: changeType === 'up' ? '#16A34A' : '#DC2626' }}>
        {change} vs last month
      </div>
    </div>
  );
};

const TierBadge = ({ tier }) => {
  const styles = {
    gold: { bg: '#FEF3C7', color: '#D97706', text: '👑 Gold' },
    silver: { bg: '#F1F5F9', color: '#475569', text: '⭐ Silver' },
    bronze: { bg: '#FEE2E2', color: '#DC2626', text: '🥉 Bronze' },
    new: { bg: '#E8F1FB', color: '#1A6FDB', text: '✨ New' }
  };
  const style = styles[tier] || styles.new;

  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      padding: '3px 9px', 
      borderRadius: '20px', 
      fontSize: '11px', 
      fontWeight: '500',
      background: style.bg,
      color: style.color
    }}>
      {style.text}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    sent: { bg: '#E8F1FB', color: '#1558B0', text: 'Sent' },
    draft: { bg: '#F1F5F9', color: '#475569', text: 'Draft' },
    negotiating: { bg: '#FEF3C7', color: '#D97706', text: 'Negotiating' },
    won: { bg: '#DCFCE7', color: '#16A34A', text: 'Won' },
    lost: { bg: '#FEE2E2', color: '#DC2626', text: 'Lost' },
    active: { bg: '#DCFCE7', color: '#16A34A', text: 'Active' }
  };
  const style = styles[status] || styles.draft;

  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      padding: '3px 9px', 
      borderRadius: '20px', 
      fontSize: '11px', 
      fontWeight: '500',
      background: style.bg,
      color: style.color
    }}>
      {style.text}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

const QuoteFlowProIntegrated = () => {
  return (
    <DataProvider useMockData={true}>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar from Module 1 would go here */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Topbar from Module 1 would go here */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Route to appropriate page */}
            <DashboardPageWithData />
            {/* or <CustomerMasterPageWithData /> */}
          </div>
        </div>
      </div>
    </DataProvider>
  );
};

export default QuoteFlowProIntegrated;

// ═══════════════════════════════════════════════════════════════════════════
// USAGE NOTES
// ═══════════════════════════════════════════════════════════════════════════

/*
INTEGRATION STEPS:

1. Wrap your main App component with DataProvider:
   
   <DataProvider useMockData={true}>
     <YourAppFromModule1 />
   </DataProvider>

2. In any component that needs data, use the useData hook:
   
   const { customers, quotations, saveCustomer, loading } = useData();

3. To switch from mock to real Google Sheets:
   
   - Set useMockData={false} in DataProvider
   - Initialize the service with your spreadsheet ID and access token
   - Implement Google OAuth flow for access token

4. Available data & methods from useData():
   
   DATA:
   - customers, quotations, lineItems, leads, followups, samples
   - inquiries, chatHistory, config, products
   - loading, error, lastSync
   
   METHODS:
   - fetchAllData() - refresh all sheets
   - fetchSheet(sheetName) - refresh specific sheet
   - saveCustomer(data), updateCustomer(id, data)
   - saveQuotation(quoteData, lineItemsData)
   - updateLeadStage(leadId, stage)
   - addFollowup(data), addChatMessage(data)
   - getCustomerQuotes(customerId)
   - getQuoteLineItems(quoteId)
   - getCustomerChats(customerId)
   - getLeadFollowups(leadId)
   - getConfigValue(setting)

5. Google Sheets API Setup (for production):
   
   - Enable Google Sheets API in Google Cloud Console
   - Create OAuth 2.0 credentials
   - Implement OAuth flow to get access token
   - Pass token to service.initialize(spreadsheetId, accessToken)

6. Error Handling:
   
   const { error } = useData();
   if (error) {
     // Display error toast or notification
   }
*/
