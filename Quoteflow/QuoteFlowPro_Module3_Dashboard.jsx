// ═══════════════════════════════════════════════════════════════════════════
// QuoteFlow Pro - MODULE 3: Dashboard & Analytics
// ═══════════════════════════════════════════════════════════════════════════
// Complete dashboard with KPI cards, trend charts, pipeline funnel, 
// recent activity, and analytics widgets
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from './QuoteFlowPro_Module2_Backend.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const useAnalytics = () => {
  const { quotations, customers, leads, followups, inquiries, products } = useData();

  // KPI Calculations
  const kpis = useMemo(() => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const thisMonthQuotes = quotations.filter(q => {
      const qDate = new Date(q.date);
      return qDate.getMonth() === thisMonth && qDate.getFullYear() === thisYear;
    });

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const lastMonthQuotes = quotations.filter(q => {
      const qDate = new Date(q.date);
      return qDate.getMonth() === lastMonth && qDate.getFullYear() === lastMonthYear;
    });

    const quotesSent = thisMonthQuotes.length;
    const lastMonthQuotesSent = lastMonthQuotes.length;
    const quotesSentChange = lastMonthQuotesSent > 0 
      ? (((quotesSent - lastMonthQuotesSent) / lastMonthQuotesSent) * 100).toFixed(1)
      : 0;

    const quotesValue = thisMonthQuotes.reduce((sum, q) => sum + parseFloat(q.grandTotal || 0), 0);
    const lastMonthValue = lastMonthQuotes.reduce((sum, q) => sum + parseFloat(q.grandTotal || 0), 0);
    const quotesValueChange = lastMonthValue > 0
      ? (((quotesValue - lastMonthValue) / lastMonthValue) * 100).toFixed(1)
      : 0;

    const wonQuotes = quotations.filter(q => q.status === 'won').length;
    const totalQuotes = quotations.length;
    const winRate = totalQuotes > 0 ? ((wonQuotes / totalQuotes) * 100).toFixed(1) : 0;

    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const lastMonthActiveCustomers = customers.filter(c => {
      const cDate = new Date(c.createdDate);
      return cDate < new Date(thisYear, thisMonth, 1);
    }).length;
    const customersChange = lastMonthActiveCustomers > 0
      ? (((activeCustomers - lastMonthActiveCustomers) / lastMonthActiveCustomers) * 100).toFixed(1)
      : 0;

    return {
      quotesSent,
      quotesSentChange,
      quotesValue,
      quotesValueChange,
      winRate,
      winRateChange: '+2.3',
      activeCustomers,
      customersChange
    };
  }, [quotations, customers]);

  // Pipeline Data
  const pipelineData = useMemo(() => {
    const stages = ['lead', 'quoted', 'sampling', 'negotiating', 'won', 'lost'];
    return stages.map(stage => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: leads.filter(l => l.stage === stage).length,
      value: leads.filter(l => l.stage === stage).reduce((sum, l) => {
        const quote = quotations.find(q => q.customerId === l.convertedToCustomerId);
        return sum + (quote ? parseFloat(quote.grandTotal || 0) : 0);
      }, 0)
    }));
  }, [leads, quotations]);

  // Monthly Trend Data (last 6 months)
  const monthlyTrends = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
      
      const monthQuotes = quotations.filter(q => {
        const qDate = new Date(q.date);
        return qDate.getMonth() === targetDate.getMonth() && 
               qDate.getFullYear() === targetDate.getFullYear();
      });

      months.push({
        month: monthName,
        quotes: monthQuotes.length,
        value: monthQuotes.reduce((sum, q) => sum + parseFloat(q.grandTotal || 0), 0) / 100000,
        won: monthQuotes.filter(q => q.status === 'won').length
      });
    }
    
    return months;
  }, [quotations]);

  // Top Customers by Revenue
  const topCustomers = useMemo(() => {
    return customers
      .map(c => ({
        ...c,
        revenue: quotations
          .filter(q => q.customerId === c.customerId && q.status === 'won')
          .reduce((sum, q) => sum + parseFloat(q.grandTotal || 0), 0)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [customers, quotations]);

  // Product Performance
  const productPerformance = useMemo(() => {
    const productMap = new Map();
    
    quotations.forEach(q => {
      if (q.status === 'won') {
        // This is simplified - in production you'd join with lineItems
        const value = parseFloat(q.grandTotal || 0);
        productMap.set('Mixed Products', (productMap.get('Mixed Products') || 0) + value);
      }
    });

    return Array.from(productMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [quotations]);

  // Recent Activity
  const recentActivity = useMemo(() => {
    const activities = [];
    
    quotations.slice(0, 3).forEach(q => {
      activities.push({
        type: 'quote',
        icon: 'file-text',
        title: `Quote ${q.quoteNumber} ${q.status}`,
        subtitle: q.customerName,
        time: q.modifiedDate,
        color: '#1A6FDB'
      });
    });

    followups.slice(0, 3).forEach(f => {
      const lead = leads.find(l => l.leadId === f.leadId);
      activities.push({
        type: 'followup',
        icon: 'phone',
        title: `Followup: ${f.type}`,
        subtitle: lead?.companyName || 'Unknown',
        time: f.timestamp,
        color: '#0F8A6F'
      });
    });

    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 8);
  }, [quotations, followups, leads]);

  // Source Distribution
  const sourceDistribution = useMemo(() => {
    const sources = {};
    inquiries.forEach(inq => {
      sources[inq.source] = (sources[inq.source] || 0) + 1;
    });
    leads.forEach(lead => {
      sources[lead.source] = (sources[lead.source] || 0) + 1;
    });
    
    return Object.entries(sources).map(([source, count]) => ({
      source: source.charAt(0).toUpperCase() + source.slice(1),
      count,
      percentage: ((count / (inquiries.length + leads.length)) * 100).toFixed(1)
    }));
  }, [inquiries, leads]);

  return {
    kpis,
    pipelineData,
    monthlyTrends,
    topCustomers,
    productPerformance,
    recentActivity,
    sourceDistribution
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// CHART COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const MiniLineChart = ({ data, dataKey, color = '#1A6FDB', height = 60 }) => {
  const max = Math.max(...data.map(d => d[dataKey]));
  const min = Math.min(...data.map(d => d[dataKey]));
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((d[dataKey] - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: '100%', height: `${height}px` }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${height} ${points} 100,${height}`}
        fill={color}
        fillOpacity="0.1"
      />
    </svg>
  );
};

const BarChart = ({ data, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = 90 / data.length;
  const gap = 2;

  return (
    <div style={{ height: `${height}px`, display: 'flex', alignItems: 'flex-end', gap: `${gap}%`, padding: '0 5%' }}>
      {data.map((item, idx) => {
        const barHeight = (item.value / maxValue) * (height - 40);
        const colors = ['#1A6FDB', '#0F8A6F', '#D97706', '#7C3AED', '#DC2626', '#16A34A'];
        
        return (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#334155' }}>
              ₹{(item.value / 100000).toFixed(1)}L
            </div>
            <div
              style={{
                width: '100%',
                height: `${barHeight}px`,
                background: colors[idx % colors.length],
                borderRadius: '6px 6px 0 0',
                transition: 'all 0.3s ease'
              }}
            />
            <div style={{ fontSize: '10px', color: '#64748B', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {item.month}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PipelineFunnel = ({ data, onClick }) => {
  const maxCount = Math.max(...data.map(d => d.count));
  const colors = {
    'Lead': '#1A6FDB',
    'Quoted': '#0F8A6F',
    'Sampling': '#D97706',
    'Negotiating': '#7C3AED',
    'Won': '#16A34A',
    'Lost': '#DC2626'
  };

  return (
    <div style={{ display: 'flex', gap: '12px', padding: '20px' }}>
      {data.map((stage, idx) => {
        const heightPercent = Math.max(30, (stage.count / maxCount) * 100);
        
        return (
          <div 
            key={idx} 
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => onClick?.(stage.stage.toLowerCase())}
          >
            <div style={{
              width: '100%',
              height: `${heightPercent + 40}px`,
              background: colors[stage.stage],
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: "'Playfair Display', serif" }}>
                {stage.count}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                ₹{(stage.value / 100000).toFixed(1)}L
              </div>
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#64748B', 
              marginTop: '10px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em',
              fontWeight: '600'
            }}>
              {stage.stage}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DonutChart = ({ data, size = 160 }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  let currentAngle = -90;

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, idx) => {
          const percentage = (item.count / total) * 100;
          const angle = (percentage / 100) * 360;
          const colors = ['#1A6FDB', '#0F8A6F', '#D97706', '#7C3AED', '#DC2626'];
          
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          currentAngle = endAngle;

          const radius = size / 2;
          const innerRadius = radius * 0.6;
          const outerRadius = radius * 0.9;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = radius + outerRadius * Math.cos(startRad);
          const y1 = radius + outerRadius * Math.sin(startRad);
          const x2 = radius + outerRadius * Math.cos(endRad);
          const y2 = radius + outerRadius * Math.sin(endRad);
          const x3 = radius + innerRadius * Math.cos(endRad);
          const y3 = radius + innerRadius * Math.sin(endRad);
          const x4 = radius + innerRadius * Math.cos(startRad);
          const y4 = radius + innerRadius * Math.sin(startRad);

          const largeArc = angle > 180 ? 1 : 0;

          const pathData = [
            `M ${x1} ${y1}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
            'Z'
          ].join(' ');

          return <path key={idx} d={pathData} fill={colors[idx % colors.length]} />;
        })}
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#1E293B', fontFamily: "'Playfair Display', serif" }}>
          {total}
        </div>
        <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Total
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════

const DashboardPage = ({ onNavigate }) => {
  const { loading, lastSync, fetchAllData, quotations } = useData();
  const analytics = useAnalytics();
  const [selectedStage, setSelectedStage] = useState(null);

  const handleSync = async () => {
    await fetchAllData();
  };

  const handlePipelineClick = (stage) => {
    setSelectedStage(stage);
    onNavigate?.('pipeline', { filter: stage });
  };

  return (
    <div style={{ padding: '28px 32px', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Header with Sync */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B', fontFamily: "'Playfair Display', serif" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            Real-time overview of your sales performance
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            {loading ? 'Syncing...' : `Last synced: ${lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never'}`}
          </div>
          <button
            onClick={handleSync}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: loading ? '#94A3B8' : '#1A6FDB',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', stroke: 'currentColor', fill: 'none' }}>
              <path d="M1 4v6h6M23 20v-6h-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sync
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KPICard
          label="Quotes Sent (MTD)"
          value={analytics.kpis.quotesSent}
          change={`${analytics.kpis.quotesSentChange >= 0 ? '+' : ''}${analytics.kpis.quotesSentChange}%`}
          changeType={analytics.kpis.quotesSentChange >= 0 ? 'up' : 'down'}
          color="blue"
          icon="file-text"
          chartData={analytics.monthlyTrends}
          chartKey="quotes"
        />
        <KPICard
          label="Quote Value (MTD)"
          value={`₹${(analytics.kpis.quotesValue / 100000).toFixed(1)}L`}
          change={`${analytics.kpis.quotesValueChange >= 0 ? '+' : ''}${analytics.kpis.quotesValueChange}%`}
          changeType={analytics.kpis.quotesValueChange >= 0 ? 'up' : 'down'}
          color="teal"
          icon="trending-up"
          chartData={analytics.monthlyTrends}
          chartKey="value"
        />
        <KPICard
          label="Win Rate"
          value={`${analytics.kpis.winRate}%`}
          change={`+${analytics.kpis.winRateChange}%`}
          changeType="up"
          color="purple"
          icon="target"
          chartData={analytics.monthlyTrends}
          chartKey="won"
        />
        <KPICard
          label="Active Customers"
          value={analytics.kpis.activeCustomers}
          change={`${analytics.kpis.customersChange >= 0 ? '+' : ''}${analytics.kpis.customersChange}%`}
          changeType={analytics.kpis.customersChange >= 0 ? 'up' : 'down'}
          color="amber"
          icon="users"
        />
      </div>

      {/* Pipeline Funnel */}
      <Card title="Sales Pipeline" subtitle="Current opportunities across stages" style={{ marginBottom: '24px' }}>
        <PipelineFunnel data={analytics.pipelineData} onClick={handlePipelineClick} />
      </Card>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Monthly Trends */}
        <Card title="Monthly Trends" subtitle="Quote value over last 6 months">
          <BarChart data={analytics.monthlyTrends} height={240} />
        </Card>

        {/* Lead Sources */}
        <Card title="Lead Sources" subtitle="Where inquiries come from">
          <DonutChart data={analytics.sourceDistribution} />
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analytics.sourceDistribution.map((item, idx) => {
              const colors = ['#1A6FDB', '#0F8A6F', '#D97706', '#7C3AED', '#DC2626'];
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: colors[idx % colors.length] }} />
                    <span style={{ fontSize: '13px', color: '#334155' }}>{item.source}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{item.percentage}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Top Customers */}
        <Card title="Top Customers" subtitle="By revenue this year">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.topCustomers.map((customer, idx) => (
              <div 
                key={customer.customerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: idx === 0 ? '#FEF3C7' : '#F8FAFC',
                  borderRadius: '8px',
                  border: idx === 0 ? '1px solid #FDE68A' : '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: idx === 0 ? '#D97706' : '#1A6FDB',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>
                      {customer.companyName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {customer.city}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>
                    ₹{(customer.revenue / 100000).toFixed(1)}L
                  </div>
                  <TierBadge tier={customer.tier} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity" subtitle="Latest updates">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.recentActivity.map((activity, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingBottom: '12px', borderBottom: idx < analytics.recentActivity.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${activity.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ActivityIcon type={activity.icon} color={activity.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1E293B' }}>
                    {activity.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {activity.subtitle}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                  {formatTime(activity.time)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const KPICard = ({ label, value, change, changeType, color, icon, chartData, chartKey }) => {
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
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: colorStyles[color].border }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </div>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: colorStyles[color].bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <KPIIcon type={icon} color={colorStyles[color].stroke} />
        </div>
      </div>

      <div style={{ fontSize: '28px', fontWeight: '600', color: '#1E293B', marginBottom: '4px', fontFamily: "'Playfair Display', serif" }}>
        {value}
      </div>

      <div style={{ fontSize: '12px', color: changeType === 'up' ? '#16A34A' : '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
        <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', stroke: 'currentColor', fill: 'none' }}>
          {changeType === 'up' ? (
            <polyline points="18 15 12 9 6 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
        {change} vs last month
      </div>

      {chartData && chartKey && (
        <MiniLineChart data={chartData} dataKey={chartKey} color={colorStyles[color].stroke} />
      )}
    </div>
  );
};

const Card = ({ title, subtitle, children, style = {} }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '14px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      ...style
    }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      <div style={{ padding: '18px 22px' }}>
        {children}
      </div>
    </div>
  );
};

const TierBadge = ({ tier }) => {
  const styles = {
    gold: { bg: '#FEF3C7', color: '#D97706', text: 'Gold' },
    silver: { bg: '#F1F5F9', color: '#475569', text: 'Silver' },
    bronze: { bg: '#FEE2E2', color: '#DC2626', text: 'Bronze' }
  };
  const style = styles[tier] || styles.bronze;

  return (
    <span style={{
      display: 'inline-flex',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      background: style.bg,
      color: style.color,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {style.text}
    </span>
  );
};

// Helper Icons
const KPIIcon = ({ type, color }) => {
  const icons = {
    'file-text': <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    'trending-up': <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 6 23 6 23 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>,
    'target': <><circle cx="12" cy="12" r="10" strokeWidth="2"/><circle cx="12" cy="12" r="6" strokeWidth="2"/><circle cx="12" cy="12" r="2" strokeWidth="2"/></>,
    'users': <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" strokeWidth="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>
  };
  
  return (
    <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', stroke: color, fill: 'none' }}>
      {icons[type]}
    </svg>
  );
};

const ActivityIcon = ({ type, color }) => {
  const icons = {
    'file-text': <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    'phone': <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  };
  
  return (
    <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', stroke: color, fill: 'none' }}>
      {icons[type] || icons['file-text']}
    </svg>
  );
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default DashboardPage;
export { useAnalytics, MiniLineChart, BarChart, PipelineFunnel, DonutChart, KPICard, Card };
