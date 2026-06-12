// ═══════════════════════════════════════════════════════════════════════════
// QuoteFlow Pro - MODULE 6: Pipeline, Leads, Followups & Sampling
// ═══════════════════════════════════════════════════════════════════════════
// Complete sales pipeline with drag-drop stages, lead management, followup
// tracking with 7-followup/7-day gap rules, and sampling tracker
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from './QuoteFlowPro_Module2_Backend.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// PIPELINE PAGE - Kanban Board View
// ═══════════════════════════════════════════════════════════════════════════

const PipelinePage = ({ filterParams = {} }) => {
  const { leads, updateLeadStage, getConfigValue } = useData();
  const [selectedLead, setSelectedLead] = useState(null);
  const [draggedLead, setDraggedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('all');

  const stages = ['lead', 'quoted', 'sampling', 'negotiating', 'won', 'lost'];
  const stageConfig = {
    lead: { label: 'Lead', color: '#1A6FDB', icon: '👤' },
    quoted: { label: 'Quoted', color: '#0F8A6F', icon: '📄' },
    sampling: { label: 'Sampling', color: '#D97706', icon: '🧪' },
    negotiating: { label: 'Negotiating', color: '#7C3AED', icon: '🤝' },
    won: { label: 'Won', color: '#16A34A', icon: '✅' },
    lost: { label: 'Lost', color: '#DC2626', icon: '❌' }
  };

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.contactName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAssigned = filterAssigned === 'all' || lead.assignedTo === filterAssigned;
      const matchesStage = !filterParams.stage || lead.stage === filterParams.stage;
      return matchesSearch && matchesAssigned && matchesStage;
    });
  }, [leads, searchQuery, filterAssigned, filterParams]);

  // Group by stage
  const leadsByStage = useMemo(() => {
    const grouped = {};
    stages.forEach(stage => {
      grouped[stage] = filteredLeads.filter(lead => lead.stage === stage);
    });
    return grouped;
  }, [filteredLeads, stages]);

  const handleDragStart = (lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (stage) => {
    if (draggedLead && draggedLead.stage !== stage) {
      await updateLeadStage(draggedLead.leadId, stage);
      setDraggedLead(null);
    }
  };

  return (
    <div style={{ padding: '28px 32px', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B', fontFamily: "'Playfair Display', serif", marginBottom: '8px' }}>
          Sales Pipeline
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B' }}>
          {filteredLeads.length} active opportunities • Drag cards to move stages
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 24 24" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', stroke: '#94A3B8', fill: 'none' }}>
              <circle cx="11" cy="11" r="8" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search leads..."
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
            value={filterAssigned}
            onChange={(e) => setFilterAssigned(e.target.value)}
            style={{
              padding: '9px 14px',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Assignees</option>
            <option value="U003">Sales Executive 1</option>
            <option value="U004">Sales Executive 2</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', overflowX: 'auto', paddingBottom: '20px' }}>
        {stages.map(stage => (
          <div
            key={stage}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage)}
            style={{
              minWidth: '260px',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 280px)'
            }}
          >
            {/* Stage Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '2px solid ' + stageConfig[stage].color,
              background: stageConfig[stage].color + '10'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{stageConfig[stage].icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>
                    {stageConfig[stage].label}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'white',
                  background: stageConfig[stage].color,
                  padding: '3px 8px',
                  borderRadius: '10px'
                }}>
                  {leadsByStage[stage].length}
                </span>
              </div>
            </div>

            {/* Stage Cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {leadsByStage[stage].map(lead => (
                  <LeadCard
                    key={lead.leadId}
                    lead={lead}
                    stageColor={stageConfig[stage].color}
                    onDragStart={() => handleDragStart(lead)}
                    onClick={() => setSelectedLead(lead)}
                  />
                ))}
                {leadsByStage[stage].length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// LEAD MANAGEMENT PAGE
// ═══════════════════════════════════════════════════════════════════════════

const LeadManagementPage = () => {
  const { leads, inquiries, saveCustomer, updateLeadStage } = useData();
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const unreadInquiries = inquiries.filter(i => i.status === 'new');

  const handleConvertToLead = async (inquiry) => {
    // Convert inquiry to lead
    const leadData = {
      companyName: inquiry.companyName,
      contactName: inquiry.contactName,
      email: inquiry.email,
      phone: inquiry.phone,
      source: inquiry.source,
      product: inquiry.productInterest,
      quantity: inquiry.quantity,
      stage: 'lead',
      assignedTo: 'U003',
      firstContactDate: new Date().toISOString().split('T')[0],
      followupCount: '0',
      existingCustomer: 'no'
    };
    
    // In production, this would call a proper API
    console.log('Convert to lead:', leadData);
  };

  return (
    <div style={{ padding: '28px 32px', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B', fontFamily: "'Playfair Display', serif" }}>
            Lead Management
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            {unreadInquiries.length} new inquiries waiting
          </p>
        </div>
        <button
          onClick={() => setShowNewLeadModal(true)}
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
          New Lead
        </button>
      </div>

      {/* Inquiry Hub */}
      {unreadInquiries.length > 0 && (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px 24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>
            📬 Unread Inquiries
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {unreadInquiries.map(inquiry => (
              <div
                key={inquiry.inquiryId}
                style={{
                  padding: '14px 16px',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>
                    {inquiry.companyName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    {inquiry.contactName} • {inquiry.productInterest} • {inquiry.source}
                  </div>
                </div>
                <button
                  onClick={() => handleConvertToLead(inquiry)}
                  style={{
                    padding: '8px 14px',
                    background: '#1A6FDB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Convert to Lead
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Leads" value={leads.length} color="#1A6FDB" />
        <StatCard label="Active" value={leads.filter(l => !['won', 'lost'].includes(l.stage)).length} color="#0F8A6F" />
        <StatCard label="Won This Month" value={leads.filter(l => l.stage === 'won').length} color="#16A34A" />
        <StatCard label="Conversion Rate" value={`${((leads.filter(l => l.stage === 'won').length / Math.max(leads.length, 1)) * 100).toFixed(1)}%`} color="#7C3AED" />
      </div>

      {/* Recent Leads Table */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Recent Leads</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Company</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Contact</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Product</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Stage</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Source</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Followups</th>
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 10).map((lead, idx) => (
              <tr key={lead.leadId} style={{ borderBottom: idx < 9 ? '1px solid #F1F5F9' : 'none' }}>
                <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{lead.companyName}</td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>{lead.contactName}</td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>{lead.product}</td>
                <td style={{ padding: '14px 20px' }}><StageBadge stage={lead.stage} /></td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748B' }}>{lead.source}</td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>{lead.followupCount || 0} / 7</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// FOLLOWUP TRACKER PAGE
// ═══════════════════════════════════════════════════════════════════════════

const FollowupTrackerPage = () => {
  const { leads, followups, getLeadFollowups, addFollowup, getConfigValue } = useData();
  const [selectedLead, setSelectedLead] = useState(null);
  const [showFollowupModal, setShowFollowupModal] = useState(false);

  const maxFollowups = parseInt(getConfigValue('max_followups') || 7);
  const followupGapDays = parseInt(getConfigValue('followup_gap_days') || 7);

  // Get leads needing followup
  const leadsNeedingFollowup = useMemo(() => {
    return leads.filter(lead => {
      if (['won', 'lost'].includes(lead.stage)) return false;
      
      const followupCount = parseInt(lead.followupCount || 0);
      if (followupCount >= maxFollowups) return false;

      const lastFollowup = lead.lastFollowupDate;
      if (!lastFollowup) return true;

      const daysSinceLastFollowup = Math.floor(
        (new Date() - new Date(lastFollowup)) / (1000 * 60 * 60 * 24)
      );
      
      return daysSinceLastFollowup >= followupGapDays;
    }).sort((a, b) => {
      const aDate = a.lastFollowupDate ? new Date(a.lastFollowupDate) : new Date(0);
      const bDate = b.lastFollowupDate ? new Date(b.lastFollowupDate) : new Date(0);
      return aDate - bDate;
    });
  }, [leads, maxFollowups, followupGapDays]);

  const overdueLeads = leadsNeedingFollowup.filter(lead => {
    if (!lead.nextFollowupDate) return false;
    return new Date(lead.nextFollowupDate) < new Date();
  });

  return (
    <div style={{ padding: '28px 32px', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B', fontFamily: "'Playfair Display', serif", marginBottom: '8px' }}>
          Followup Tracker
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B' }}>
          {leadsNeedingFollowup.length} leads need followup • {overdueLeads.length} overdue
        </p>
      </div>

      {/* Alert Banner for Overdue */}
      {overdueLeads.length > 0 && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #FDE68A',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', stroke: '#D97706', fill: 'none', flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#92400E' }}>
              {overdueLeads.length} overdue followup{overdueLeads.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
              These leads haven't been contacted within the required timeframe
            </div>
          </div>
        </div>
      )}

      {/* Followup Queue */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Followup Queue</h3>
        </div>
        {leadsNeedingFollowup.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '6px' }}>All caught up!</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>No leads need followup right now</div>
          </div>
        ) : (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {leadsNeedingFollowup.map(lead => (
                <FollowupCard
                  key={lead.leadId}
                  lead={lead}
                  maxFollowups={maxFollowups}
                  onLogFollowup={() => {
                    setSelectedLead(lead);
                    setShowFollowupModal(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Followups */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>Recent Followups</h3>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {followups.slice(0, 10).map((followup, idx) => {
              const lead = leads.find(l => l.leadId === followup.leadId);
              return (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    borderLeft: '3px solid #1A6FDB'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>
                      {lead?.companyName || 'Unknown Lead'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {followup.date} {followup.time}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#1A6FDB', textTransform: 'uppercase', background: '#E8F1FB', padding: '2px 8px', borderRadius: '4px' }}>
                      {followup.type}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>•</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      Outcome: {followup.outcome}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.5' }}>
                    {followup.notes}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Followup Modal */}
      {showFollowupModal && selectedLead && (
        <FollowupModal
          lead={selectedLead}
          onClose={() => {
            setShowFollowupModal(false);
            setSelectedLead(null);
          }}
          onSave={async (followupData) => {
            await addFollowup(followupData);
            setShowFollowupModal(false);
            setSelectedLead(null);
          }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLING TRACKER PAGE
// ═══════════════════════════════════════════════════════════════════════════

const SamplingTrackerPage = () => {
  const { samples, leads, customers } = useData();
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredSamples = useMemo(() => {
    return samples.filter(s => filterStatus === 'all' || s.status === filterStatus);
  }, [samples, filterStatus]);

  const pendingFeedback = samples.filter(s => s.status === 'delivered' && s.feedbackReceived === 'no');

  return (
    <div style={{ padding: '28px 32px', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B', fontFamily: "'Playfair Display', serif", marginBottom: '8px' }}>
          Sampling Tracker
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B' }}>
          {samples.length} total samples • {pendingFeedback.length} awaiting feedback
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Samples" value={samples.length} color="#1A6FDB" />
        <StatCard label="In Transit" value={samples.filter(s => s.status === 'dispatched').length} color="#D97706" />
        <StatCard label="Delivered" value={samples.filter(s => s.status === 'delivered').length} color="#0F8A6F" />
        <StatCard label="Approved" value={samples.filter(s => s.outcome === 'approved').length} color="#16A34A" />
      </div>

      {/* Filter */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px', marginBottom: '20px' }}>
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
          <option value="all">All Samples</option>
          <option value="dispatched">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      {/* Samples Table */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Customer/Lead</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Product</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Quantity</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Sent Date</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Courier</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {filteredSamples.map((sample, idx) => {
              const entity = sample.customerId 
                ? customers.find(c => c.customerId === sample.customerId)
                : leads.find(l => l.leadId === sample.leadId);
              
              return (
                <tr key={sample.sampleId} style={{ borderBottom: idx < filteredSamples.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>
                    {entity?.companyName || 'Unknown'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: '13px', color: '#334155' }}>{sample.productName}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{sample.productCode}</div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>
                    {sample.quantity} {sample.unit}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748B' }}>
                    {sample.sentDate}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>
                    {sample.courierDetails}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <SampleStatusBadge status={sample.status} />
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {sample.outcome ? <OutcomeBadge outcome={sample.outcome} /> : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const LeadCard = ({ lead, stageColor, onDragStart, onClick }) => {
  const isOverdue = lead.nextFollowupDate && new Date(lead.nextFollowupDate) < new Date();

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        padding: '12px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        cursor: 'grab',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = stageColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#E2E8F0';
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: stageColor, borderRadius: '8px 0 0 8px' }} />
      
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '6px' }}>
        {lead.companyName}
      </div>
      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
        {lead.contactName} • {lead.product}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#94A3B8' }}>
          {lead.followupCount || 0} / 7 followups
        </span>
        {isOverdue && (
          <span style={{
            fontSize: '10px',
            fontWeight: '600',
            color: '#DC2626',
            background: '#FEE2E2',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            OVERDUE
          </span>
        )}
      </div>
    </div>
  );
};

const LeadDetailDrawer = ({ lead, onClose }) => {
  const { getLeadFollowups } = useData();
  const leadFollowups = getLeadFollowups(lead.leadId);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '500px',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B' }}>{lead.companyName}</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{lead.contactName}</p>
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
        <StageBadge stage={lead.stage} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Lead Info */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lead Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <InfoRow label="Email" value={lead.email} />
              <InfoRow label="Phone" value={lead.phone} />
              <InfoRow label="Product Interest" value={lead.product} />
              <InfoRow label="Quantity" value={lead.quantity} />
              <InfoRow label="Source" value={lead.source} />
              <InfoRow label="Assigned To" value={lead.assignedTo} />
            </div>
          </div>

          {/* Followup History */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Followup History ({leadFollowups.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {leadFollowups.map((f, idx) => (
                <div key={idx} style={{ padding: '10px', background: '#F8FAFC', borderRadius: '6px', borderLeft: '3px solid #1A6FDB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#1A6FDB', textTransform: 'uppercase' }}>{f.type}</span>
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>{f.date}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155' }}>{f.notes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FollowupCard = ({ lead, maxFollowups, onLogFollowup }) => {
  const followupCount = parseInt(lead.followupCount || 0);
  const progress = (followupCount / maxFollowups) * 100;
  const isOverdue = lead.nextFollowupDate && new Date(lead.nextFollowupDate) < new Date();

  return (
    <div style={{
      padding: '16px',
      background: isOverdue ? '#FEF3C7' : '#F8FAFC',
      borderRadius: '10px',
      border: isOverdue ? '1px solid #FDE68A' : '1px solid #E2E8F0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{lead.companyName}</div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            {lead.contactName} • {lead.product}
          </div>
        </div>
        <button
          onClick={onLogFollowup}
          style={{
            padding: '8px 14px',
            background: '#1A6FDB',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Log Followup
        </button>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: '#64748B' }}>Followup Progress</span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#1E293B' }}>{followupCount} / {maxFollowups}</span>
        </div>
        <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${progress}%`, 
            background: progress >= 85 ? '#DC2626' : progress >= 60 ? '#D97706' : '#1A6FDB',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      <div style={{ fontSize: '11px', color: '#64748B' }}>
        Last followup: {lead.lastFollowupDate || 'Never'} • Next: {lead.nextFollowupDate || 'Not scheduled'}
      </div>
    </div>
  );
};

const FollowupModal = ({ lead, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'call',
    notes: '',
    outcome: 'positive',
    stageUpdate: lead.stage
  });

  const handleSubmit = () => {
    const followupData = {
      leadId: lead.leadId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      type: formData.type,
      notes: formData.notes,
      outcome: formData.outcome,
      stageUpdate: formData.stageUpdate,
      loggedBy: 'Current User',
      timestamp: new Date().toISOString()
    };
    
    onSave(followupData);
  };

  return (
    <div
      style={{
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
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B' }}>
            Log Followup: {lead.companyName}
          </h2>
        </div>

        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              >
                <option value="call">Phone Call</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="What was discussed?"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>
                Outcome
              </label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData(p => ({ ...p, outcome: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#334155', marginBottom: '6px' }}>
                Update Stage
              </label>
              <select
                value={formData.stageUpdate}
                onChange={(e) => setFormData(p => ({ ...p, stageUpdate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              >
                <option value="lead">Lead</option>
                <option value="quoted">Quoted</option>
                <option value="sampling">Sampling</option>
                <option value="negotiating">Negotiating</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        </div>

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
            disabled={!formData.notes.trim()}
            style={{
              padding: '9px 18px',
              background: formData.notes.trim() ? '#1A6FDB' : '#94A3B8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: formData.notes.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Log Followup
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px' }}>
    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
      {label}
    </div>
    <div style={{ fontSize: '24px', fontWeight: '700', color, fontFamily: "'Playfair Display', serif" }}>
      {value}
    </div>
  </div>
);

const StageBadge = ({ stage }) => {
  const styles = {
    lead: { bg: '#E8F1FB', color: '#1558B0', text: 'Lead' },
    quoted: { bg: '#E3F5F0', color: '#0F8A6F', text: 'Quoted' },
    sampling: { bg: '#FEF3C7', color: '#D97706', text: 'Sampling' },
    negotiating: { bg: '#EDE9FE', color: '#7C3AED', text: 'Negotiating' },
    won: { bg: '#DCFCE7', color: '#16A34A', text: 'Won' },
    lost: { bg: '#FEE2E2', color: '#DC2626', text: 'Lost' }
  };
  const style = styles[stage] || styles.lead;

  return (
    <span style={{
      display: 'inline-flex',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      background: style.bg,
      color: style.color
    }}>
      {style.text}
    </span>
  );
};

const SampleStatusBadge = ({ status }) => {
  const styles = {
    dispatched: { bg: '#FEF3C7', color: '#D97706', text: 'In Transit' },
    delivered: { bg: '#E3F5F0', color: '#0F8A6F', text: 'Delivered' },
    returned: { bg: '#F1F5F9', color: '#64748B', text: 'Returned' }
  };
  const style = styles[status] || styles.dispatched;

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

const OutcomeBadge = ({ outcome }) => {
  const styles = {
    approved: { bg: '#DCFCE7', color: '#16A34A', text: 'Approved' },
    rejected: { bg: '#FEE2E2', color: '#DC2626', text: 'Rejected' },
    pending: { bg: '#F1F5F9', color: '#64748B', text: 'Pending' }
  };
  const style = styles[outcome] || styles.pending;

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

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
    <span style={{ fontSize: '12px', color: '#64748B' }}>{label}</span>
    <span style={{ fontSize: '12px', color: '#1E293B', fontWeight: '500' }}>{value || '—'}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default PipelinePage;
export { LeadManagementPage, FollowupTrackerPage, SamplingTrackerPage };
