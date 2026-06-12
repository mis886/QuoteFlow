// ═══════════════════════════════════════════════════════════════════════════
// QuoteFlow Pro - MODULE 2: Google Sheets Backend Layer
// ═══════════════════════════════════════════════════════════════════════════
// Complete backend service with Google Sheets API integration, data models,
// CRUD operations, caching, error handling, and mock service for development
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// DATA MODELS & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

// Sheet configuration matching Module 1 template
const SHEET_CONFIG = {
  spreadsheetId: '', // To be set by user during setup
  sheetNames: {
    users: 'Users',
    customers: 'Customers',
    quotations: 'Quotations',
    lineItems: 'LineItems',
    leads: 'Leads',
    followups: 'Followups',
    samples: 'Samples',
    inquiries: 'Inquiries',
    chatHistory: 'ChatHistory',
    config: 'Config',
    auditLog: 'AuditLog',
    products: 'Products'
  },
  ranges: {
    users: 'Users!A2:L',
    customers: 'Customers!A2:AN',
    quotations: 'Quotations!A2:X',
    lineItems: 'LineItems!A2:L',
    leads: 'Leads!A2:S',
    followups: 'Followups!A2:I',
    samples: 'Samples!A2:M',
    inquiries: 'Inquiries!A2:L',
    chatHistory: 'ChatHistory!A2:H',
    config: 'Config!A2:C',
    auditLog: 'AuditLog!A2:H',
    products: 'Products!A2:H'
  }
};

// Column mappings for each sheet
const COLUMN_MAPS = {
  users: ['userId', 'username', 'password', 'name', 'role', 'initials', 'tier', 'email', 'phone', 'status', 'lastLogin', 'createdDate'],
  customers: ['customerId', 'companyName', 'legalName', 'gstin', 'pan', 'city', 'state', 'country', 'address', 'pincode', 
    'primaryContact', 'primaryEmail', 'primaryPhone', 'contact2Name', 'contact2Email', 'contact2Phone', 'contact2Designation',
    'contact3Name', 'contact3Email', 'contact3Phone', 'contact3Designation', 'contact4Name', 'contact4Email', 'contact4Phone', 'contact4Designation',
    'industry', 'segment', 'incoterms', 'paymentTerms', 'creditLimit', 'turnoverFY', 'tier', 'status',
    'paymentRating', 'ordersRating', 'trendRating', 'overallRating', 'nextOrderProduct1', 'nextOrderQty1', 'nextOrderDate1',
    'nextOrderProduct2', 'nextOrderQty2', 'nextOrderDate2', 'crossSellOpportunities', 'notes', 'createdDate', 'modifiedDate'],
  quotations: ['quoteId', 'quoteNumber', 'version', 'date', 'validUntil', 'customerId', 'customerName', 'contactPerson', 'contactEmail',
    'subtotal', 'gstAmount', 'freight', 'insurance', 'discount', 'grandTotal', 'currency', 'status', 'source', 'incoterms',
    'paymentTerms', 'notes', 'termsConditions', 'createdBy', 'createdDate', 'modifiedDate'],
  lineItems: ['lineId', 'quoteId', 'lineNumber', 'productCode', 'productName', 'hsnCode', 'quantity', 'unit', 'priceBasis', 'rate', 'gstPercent', 'amount'],
  leads: ['leadId', 'companyName', 'contactName', 'email', 'phone', 'source', 'product', 'quantity', 'stage', 'assignedTo',
    'firstContactDate', 'lastFollowupDate', 'nextFollowupDate', 'followupCount', 'notes', 'conversionDate', 'convertedToCustomerId',
    'existingCustomer', 'colorCode'],
  followups: ['followupId', 'leadId', 'date', 'type', 'notes', 'outcome', 'stageUpdate', 'loggedBy', 'timestamp'],
  samples: ['sampleId', 'customerId', 'leadId', 'productCode', 'productName', 'quantity', 'unit', 'sentDate', 'courierDetails',
    'cost', 'status', 'feedbackReceived', 'outcome', 'notes'],
  inquiries: ['inquiryId', 'companyName', 'contactName', 'email', 'phone', 'subject', 'source', 'date', 'productInterest',
    'quantity', 'status', 'convertedToLeadId'],
  chatHistory: ['chatId', 'customerId', 'messageType', 'channel', 'message', 'date', 'time', 'loggedBy'],
  config: ['setting', 'value', 'description'],
  auditLog: ['logId', 'timestamp', 'userId', 'action', 'entityType', 'entityId', 'details', 'ipAddress'],
  products: ['productId', 'productName', 'hsnCode', 'gstPercent', 'category', 'unit', 'defaultRate', 'status']
};

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS API SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class GoogleSheetsService {
  constructor() {
    this.spreadsheetId = null;
    this.accessToken = null;
    this.isInitialized = false;
  }

  // Initialize with spreadsheet ID and access token
  initialize(spreadsheetId, accessToken) {
    this.spreadsheetId = spreadsheetId;
    this.accessToken = accessToken;
    this.isInitialized = true;
  }

  // Generic method to fetch data from a sheet
  async fetchSheet(sheetName) {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const range = SHEET_CONFIG.ranges[sheetName];
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseSheetData(sheetName, data.values || []);
    } catch (error) {
      console.error(`Error fetching ${sheetName}:`, error);
      throw error;
    }
  }

  // Parse raw sheet data into objects
  parseSheetData(sheetName, rows) {
    const columnMap = COLUMN_MAPS[sheetName];
    return rows.map(row => {
      const obj = {};
      columnMap.forEach((col, idx) => {
        obj[col] = row[idx] !== undefined ? row[idx] : null;
      });
      return obj;
    });
  }

  // Append new row to sheet
  async appendRow(sheetName, data) {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    const columnMap = COLUMN_MAPS[sheetName];
    const values = [columnMap.map(col => data[col] !== undefined ? data[col] : '')];
    const range = `${SHEET_CONFIG.sheetNames[sheetName]}!A:Z`;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error appending to ${sheetName}:`, error);
      throw error;
    }
  }

  // Update specific row
  async updateRow(sheetName, rowIndex, data) {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    const columnMap = COLUMN_MAPS[sheetName];
    const values = [columnMap.map(col => data[col] !== undefined ? data[col] : '')];
    const range = `${SHEET_CONFIG.sheetNames[sheetName]}!A${rowIndex + 2}:Z${rowIndex + 2}`; // +2 for header row

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating ${sheetName}:`, error);
      throw error;
    }
  }

  // Batch update multiple ranges
  async batchUpdate(updates) {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values:batchUpdate`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: updates
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK SERVICE (for development without Google Sheets)
// ═══════════════════════════════════════════════════════════════════════════

class MockDataService {
  constructor() {
    this.data = this.initializeMockData();
  }

  initializeMockData() {
    return {
      users: [
        { userId: 'U001', username: 'shishir', password: 'htpl@2025', name: 'Shishir', role: 'admin', initials: 'SV', tier: 'management', email: 'shishir@himalayaterpenes.com', phone: '+91-9876543210', status: 'active', lastLogin: '2026-05-05', createdDate: '2024-01-01' },
        { userId: 'U002', username: 'vpsales', password: 'vp@2025', name: 'VP Sales', role: 'manager', initials: 'VP', tier: 'management', email: 'vp@himalayaterpenes.com', phone: '+91-9876543211', status: 'active', lastLogin: '2026-05-04', createdDate: '2024-02-01' },
        { userId: 'U003', username: 'sales1', password: 'sales@2025', name: 'Sales Executive 1', role: 'sales', initials: 'SE', tier: 'field', email: 'sales1@himalayaterpenes.com', phone: '+91-9876543212', status: 'active', lastLogin: '2026-05-03', createdDate: '2024-03-01' },
        { userId: 'U004', username: 'sales2', password: 'sales@2025', name: 'Sales Executive 2', role: 'sales', initials: 'AS', tier: 'field', email: 'sales2@himalayaterpenes.com', phone: '+91-9876543213', status: 'active', lastLogin: '2026-05-02', createdDate: '2024-03-15' },
        { userId: 'U005', username: 'coordinator', password: 'coord@2025', name: 'Sales Coordinator', role: 'coordinator', initials: 'SC', tier: 'support', email: 'coordinator@himalayaterpenes.com', phone: '+91-9876543214', status: 'active', lastLogin: '2026-05-01', createdDate: '2024-04-01' }
      ],
      customers: [
        { customerId: 'C001', companyName: 'Reliance Industries', legalName: 'Reliance Industries Limited', gstin: '27AAACR5055K1Z7', pan: 'AAACR5055K', city: 'Mumbai', state: 'Maharashtra', country: 'India', address: 'Maker Chambers IV, 222 Nariman Point', pincode: '400021',
          primaryContact: 'Rajesh Kumar', primaryEmail: 'rajesh.k@ril.com', primaryPhone: '+91-22-30001234', contact2Name: 'Priya Sharma', contact2Email: 'priya.s@ril.com', contact2Phone: '+91-22-30001235', contact2Designation: 'Procurement Head',
          contact3Name: '', contact3Email: '', contact3Phone: '', contact3Designation: '', contact4Name: '', contact4Email: '', contact4Phone: '', contact4Designation: '',
          industry: 'Petrochemicals', segment: 'Large Enterprise', incoterms: 'CIF', paymentTerms: '60 Days', creditLimit: '50000000', turnoverFY: '125000000', tier: 'gold', status: 'active',
          paymentRating: '9', ordersRating: '8', trendRating: '9', overallRating: '8.7', nextOrderProduct1: 'IPA', nextOrderQty1: '5000', nextOrderDate1: '2026-06-15',
          nextOrderProduct2: 'Camphor', nextOrderQty2: '2000', nextOrderDate2: '2026-07-10', crossSellOpportunities: 'Pine Oil for cleaning division', notes: 'Key account, quarterly reviews needed', createdDate: '2023-01-15', modifiedDate: '2026-04-20' },
        { customerId: 'C002', companyName: 'Tata Chemicals', legalName: 'Tata Chemicals Limited', gstin: '27AAACT2727Q1ZV', pan: 'AAACT2727Q', city: 'Mumbai', state: 'Maharashtra', country: 'India', address: 'Bombay House, 24 Homi Mody Street', pincode: '400001',
          primaryContact: 'Anjali Desai', primaryEmail: 'anjali.desai@tatachemicals.com', primaryPhone: '+91-22-66658282', contact2Name: 'Vikram Singh', contact2Email: 'vikram.s@tatachemicals.com', contact2Phone: '+91-22-66658283', contact2Designation: 'R&D Manager',
          contact3Name: 'Meera Iyer', contact3Email: 'meera.i@tatachemicals.com', contact3Phone: '+91-22-66658284', contact3Designation: 'Quality Head', contact4Name: '', contact4Email: '', contact4Phone: '', contact4Designation: '',
          industry: 'Specialty Chemicals', segment: 'Large Enterprise', incoterms: 'FOB', paymentTerms: '45 Days', creditLimit: '35000000', turnoverFY: '82000000', tier: 'gold', status: 'active',
          paymentRating: '10', ordersRating: '9', trendRating: '8', overallRating: '9.0', nextOrderProduct1: 'Rosin', nextOrderQty1: '3000', nextOrderDate1: '2026-05-25',
          nextOrderProduct2: '', nextOrderQty2: '', nextOrderDate2: '', crossSellOpportunities: 'Terpene derivatives for pharma division', notes: 'Excellent payment track record', createdDate: '2022-06-10', modifiedDate: '2026-04-15' },
        { customerId: 'C003', companyName: 'UPL Limited', legalName: 'UPL Limited', gstin: '24AAACF3555F1ZR', pan: 'AAACF3555F', city: 'Vadodara', state: 'Gujarat', country: 'India', address: 'Unison House, 2 Dinshaw Vachha Road', pincode: '390007',
          primaryContact: 'Suresh Patel', primaryEmail: 'suresh.patel@upl-ltd.com', primaryPhone: '+91-265-6662000', contact2Name: '', contact2Email: '', contact2Phone: '', contact2Designation: '',
          contact3Name: '', contact3Email: '', contact3Phone: '', contact3Designation: '', contact4Name: '', contact4Email: '', contact4Phone: '', contact4Designation: '',
          industry: 'Agrochemicals', segment: 'Mid-Market', incoterms: 'CFR', paymentTerms: '30 Days LC', creditLimit: '15000000', turnoverFY: '48000000', tier: 'silver', status: 'active',
          paymentRating: '7', ordersRating: '7', trendRating: '8', overallRating: '7.3', nextOrderProduct1: 'Dipentene', nextOrderQty1: '1500', nextOrderDate1: '2026-06-01',
          nextOrderProduct2: '', nextOrderQty2: '', nextOrderDate2: '', crossSellOpportunities: 'Turpentine oil for formulation base', notes: 'Growing account, potential for tier upgrade', createdDate: '2023-09-20', modifiedDate: '2026-03-10' }
      ],
      quotations: [
        { quoteId: 'Q001', quoteNumber: 'QF-2605-001', version: '1', date: '2026-05-01', validUntil: '2026-05-31', customerId: 'C001', customerName: 'Reliance Industries', contactPerson: 'Rajesh Kumar', contactEmail: 'rajesh.k@ril.com',
          subtotal: '1250000', gstAmount: '225000', freight: '25000', insurance: '1875', discount: '0', grandTotal: '1501875', currency: 'INR', status: 'sent', source: 'email', incoterms: 'CIF Mumbai', paymentTerms: '60 Days from BL date',
          notes: 'Bulk order discount applicable above 10 MT', termsConditions: 'Standard T&C apply', createdBy: 'U003', createdDate: '2026-05-01 09:30', modifiedDate: '2026-05-01 14:45' },
        { quoteId: 'Q002', quoteNumber: 'QF-2605-002', version: '2', date: '2026-05-03', validUntil: '2026-06-02', customerId: 'C002', customerName: 'Tata Chemicals', contactPerson: 'Anjali Desai', contactEmail: 'anjali.desai@tatachemicals.com',
          subtotal: '980000', gstAmount: '176400', freight: '15000', insurance: '1470', discount: '25000', grandTotal: '1147870', currency: 'INR', status: 'negotiating', source: 'indiamart', incoterms: 'FOB Kandla', paymentTerms: '45 Days',
          notes: 'Revised pricing as per negotiation', termsConditions: 'Standard T&C apply', createdBy: 'U002', createdDate: '2026-05-03 11:00', modifiedDate: '2026-05-04 16:20' },
        { quoteId: 'Q003', quoteNumber: 'QF-2605-003', version: '1', date: '2026-05-04', validUntil: '2026-06-03', customerId: 'C003', customerName: 'UPL Limited', contactPerson: 'Suresh Patel', contactEmail: 'suresh.patel@upl-ltd.com',
          subtotal: '625000', gstAmount: '112500', freight: '12000', insurance: '937.5', discount: '0', grandTotal: '750437.5', currency: 'INR', status: 'draft', source: 'direct', incoterms: 'CFR Mundra', paymentTerms: '30 Days LC',
          notes: 'Sample batch pricing', termsConditions: 'Standard T&C apply', createdBy: 'U004', createdDate: '2026-05-04 10:15', modifiedDate: '2026-05-04 10:15' }
      ],
      lineItems: [
        { lineId: 'L001', quoteId: 'Q001', lineNumber: '1', productCode: 'IPA-99', productName: 'Isopropyl Alcohol 99%', hsnCode: '29051200', quantity: '5000', unit: 'Kg', priceBasis: 'Per Kg', rate: '95', gstPercent: '18', amount: '475000' },
        { lineId: 'L002', quoteId: 'Q001', lineNumber: '2', productCode: 'CAM-NAT', productName: 'Natural Camphor BP', hsnCode: '29142100', quantity: '2500', unit: 'Kg', priceBasis: 'Per Kg', rate: '310', gstPercent: '18', amount: '775000' },
        { lineId: 'L003', quoteId: 'Q002', lineNumber: '1', productCode: 'ROS-WG', productName: 'Rosin WG Grade', hsnCode: '38061000', quantity: '3000', unit: 'Kg', priceBasis: 'Per Kg', rate: '180', gstPercent: '18', amount: '540000' },
        { lineId: 'L004', quoteId: 'Q002', lineNumber: '2', productCode: 'TUR-OIL', productName: 'Turpentine Oil', hsnCode: '38051000', quantity: '2000', unit: 'Kg', priceBasis: 'Per Kg', rate: '220', gstPercent: '18', amount: '440000' },
        { lineId: 'L005', quoteId: 'Q003', lineNumber: '1', productCode: 'DIP-85', productName: 'Dipentene 85%', hsnCode: '38051000', quantity: '2500', unit: 'Kg', priceBasis: 'Per Kg', rate: '250', gstPercent: '18', amount: '625000' }
      ],
      leads: [
        { leadId: 'L001', companyName: 'ABC Pharma Pvt Ltd', contactName: 'Dr. Ramesh Rao', email: 'ramesh@abcpharma.com', phone: '+91-80-12345678', source: 'website', product: 'Camphor USP', quantity: '500 Kg', stage: 'lead',
          assignedTo: 'U003', firstContactDate: '2026-05-02', lastFollowupDate: '2026-05-03', nextFollowupDate: '2026-05-10', followupCount: '2', notes: 'Interested in pharma grade camphor', conversionDate: '', convertedToCustomerId: '', existingCustomer: 'no', colorCode: '#1A6FDB' },
        { leadId: 'L002', companyName: 'XYZ Fragrances Ltd', contactName: 'Ms. Kavita Menon', email: 'kavita@xyzfragrances.in', phone: '+91-22-87654321', source: 'indiamart', product: 'Pine Oil', quantity: '1000 Kg', stage: 'quoted',
          assignedTo: 'U004', firstContactDate: '2026-04-28', lastFollowupDate: '2026-05-01', nextFollowupDate: '2026-05-08', followupCount: '3', notes: 'Quote sent, awaiting decision', conversionDate: '', convertedToCustomerId: '', existingCustomer: 'no', colorCode: '#0F8A6F' },
        { leadId: 'L003', companyName: 'PQR Cleaning Solutions', contactName: 'Mr. Anil Verma', email: 'anil.v@pqrcleaning.com', phone: '+91-11-23456789', source: 'referral', product: 'Pine Oil for floor cleaner', quantity: '2000 L', stage: 'sampling',
          assignedTo: 'U003', firstContactDate: '2026-04-25', lastFollowupDate: '2026-05-04', nextFollowupDate: '2026-05-11', followupCount: '5', notes: 'Sample sent on 30-Apr, feedback expected by 10-May', conversionDate: '', convertedToCustomerId: '', existingCustomer: 'no', colorCode: '#D97706' }
      ],
      followups: [
        { followupId: 'F001', leadId: 'L001', date: '2026-05-02', type: 'call', notes: 'Initial call, discussed requirements', outcome: 'positive', stageUpdate: 'lead', loggedBy: 'U003', timestamp: '2026-05-02 14:30' },
        { followupId: 'F002', leadId: 'L001', date: '2026-05-03', type: 'email', notes: 'Sent product catalog and CoA', outcome: 'neutral', stageUpdate: 'lead', loggedBy: 'U003', timestamp: '2026-05-03 10:15' },
        { followupId: 'F003', leadId: 'L002', date: '2026-04-29', type: 'whatsapp', notes: 'Sent pricing details', outcome: 'positive', stageUpdate: 'quoted', loggedBy: 'U004', timestamp: '2026-04-29 16:45' },
        { followupId: 'F004', leadId: 'L003', date: '2026-04-30', type: 'email', notes: 'Sample dispatched via Blue Dart', outcome: 'positive', stageUpdate: 'sampling', loggedBy: 'U003', timestamp: '2026-04-30 11:00' },
        { followupId: 'F005', leadId: 'L003', date: '2026-05-04', type: 'call', notes: 'Follow-up on sample feedback', outcome: 'neutral', stageUpdate: 'sampling', loggedBy: 'U003', timestamp: '2026-05-04 15:30' }
      ],
      samples: [
        { sampleId: 'S001', customerId: '', leadId: 'L003', productCode: 'PINE-85', productName: 'Pine Oil 85%', quantity: '500', unit: 'ml', sentDate: '2026-04-30', courierDetails: 'Blue Dart - AWB123456789',
          cost: '450', status: 'delivered', feedbackReceived: 'no', outcome: 'pending', notes: 'Sample for floor cleaner formulation trial' },
        { sampleId: 'S002', customerId: 'C002', leadId: '', productCode: 'ROS-WW', productName: 'Rosin WW Grade', quantity: '1', unit: 'Kg', sentDate: '2026-04-15', courierDetails: 'DHL - 1234567890',
          cost: '850', status: 'delivered', feedbackReceived: 'yes', outcome: 'approved', notes: 'Trial successful, placed order' }
      ],
      inquiries: [
        { inquiryId: 'I001', companyName: 'New Corp Ltd', contactName: 'John Doe', email: 'john@newcorp.com', phone: '+91-44-12345678', subject: 'Bulk IPA requirement', source: 'gmail',
          date: '2026-05-05', productInterest: 'IPA 99%', quantity: '10000 Kg', status: 'new', convertedToLeadId: '' },
        { inquiryId: 'I002', companyName: 'Fresh Industries', contactName: 'Sarah Khan', email: 'sarah@freshindustries.in', phone: '+91-79-87654321', subject: 'Camphor pricing', source: 'indiamart',
          date: '2026-05-04', productInterest: 'Camphor', quantity: '500 Kg', status: 'converted', convertedToLeadId: 'L001' }
      ],
      chatHistory: [
        { chatId: 'CH001', customerId: 'C001', messageType: 'note', channel: 'email', message: 'Discussed Q2 requirements, expecting 20% volume increase', date: '2026-04-20', time: '14:30', loggedBy: 'U003' },
        { chatId: 'CH002', customerId: 'C002', messageType: 'note', channel: 'call', message: 'Quality concern on last shipment, sent replacement CoA', date: '2026-04-18', time: '11:15', loggedBy: 'U002' },
        { chatId: 'CH003', customerId: 'C001', messageType: 'whatsapp', channel: 'whatsapp', message: 'Need urgent quote for 5 MT IPA', date: '2026-05-01', time: '09:00', loggedBy: 'U003' }
      ],
      config: [
        { setting: 'company_name', value: 'Himalaya Terpenes Pvt. Ltd.', description: 'Legal company name' },
        { setting: 'quote_prefix', value: 'QF', description: 'Quote number prefix' },
        { setting: 'gst_number', value: '27XXXXX1234X1ZX', description: 'Company GSTIN' },
        { setting: 'insurance_rate', value: '0.0015', description: 'Insurance rate (0.15%)' },
        { setting: 'max_followups', value: '7', description: 'Maximum followups per lead' },
        { setting: 'followup_gap_days', value: '7', description: 'Minimum days between followups' },
        { setting: 'cc_email_1', value: 'shishir@himalayaterpenes.com', description: 'Default CC 1' },
        { setting: 'cc_email_2', value: 'vp@himalayaterpenes.com', description: 'Default CC 2' },
        { setting: 'cc_email_3', value: 'accounts@himalayaterpenes.com', description: 'Default CC 3' },
        { setting: 'cc_email_4', value: 'operations@himalayaterpenes.com', description: 'Default CC 4' },
        { setting: 'last_quote_sync', value: '2026-05-05T08:30:00Z', description: 'Last quotation sync timestamp' },
        { setting: 'last_customer_sync', value: '2026-05-05T08:30:00Z', description: 'Last customer sync timestamp' }
      ],
      auditLog: [],
      products: [
        { productId: 'P001', productName: 'Isopropyl Alcohol 99%', hsnCode: '29051200', gstPercent: '18', category: 'Solvents', unit: 'Kg', defaultRate: '95', status: 'active' },
        { productId: 'P002', productName: 'Natural Camphor BP', hsnCode: '29142100', gstPercent: '18', category: 'Camphor', unit: 'Kg', defaultRate: '310', status: 'active' },
        { productId: 'P003', productName: 'Synthetic Camphor IP', hsnCode: '29142100', gstPercent: '18', category: 'Camphor', unit: 'Kg', defaultRate: '285', status: 'active' },
        { productId: 'P004', productName: 'Isoborneol 95%', hsnCode: '29062900', gstPercent: '18', category: 'Terpenes', unit: 'Kg', defaultRate: '450', status: 'active' },
        { productId: 'P005', productName: 'Pine Oil 85%', hsnCode: '38051000', gstPercent: '18', category: 'Pine Products', unit: 'Kg', defaultRate: '175', status: 'active' },
        { productId: 'P006', productName: 'Dipentene 85%', hsnCode: '38051000', gstPercent: '18', category: 'Pine Products', unit: 'Kg', defaultRate: '250', status: 'active' },
        { productId: 'P007', productName: 'Rosin WG Grade', hsnCode: '38061000', gstPercent: '18', category: 'Rosin', unit: 'Kg', defaultRate: '180', status: 'active' },
        { productId: 'P008', productName: 'Rosin WW Grade', hsnCode: '38061000', gstPercent: '18', category: 'Rosin', unit: 'Kg', defaultRate: '195', status: 'active' },
        { productId: 'P009', productName: 'Turpentine Oil', hsnCode: '38051000', gstPercent: '18', category: 'Pine Products', unit: 'Kg', defaultRate: '220', status: 'active' },
        { productId: 'P010', productName: 'Alpha Pinene 95%', hsnCode: '29021100', gstPercent: '18', category: 'Terpenes', unit: 'Kg', defaultRate: '520', status: 'active' }
      ]
    };
  }

  // Simulate async operations with delay
  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchSheet(sheetName) {
    await this.delay();
    return this.data[sheetName] || [];
  }

  async appendRow(sheetName, data) {
    await this.delay();
    const newId = this.generateId(sheetName);
    const newRow = { ...data, [this.getIdField(sheetName)]: newId };
    this.data[sheetName].push(newRow);
    return { success: true, id: newId };
  }

  async updateRow(sheetName, rowIndex, data) {
    await this.delay();
    if (this.data[sheetName][rowIndex]) {
      this.data[sheetName][rowIndex] = { ...this.data[sheetName][rowIndex], ...data };
      return { success: true };
    }
    throw new Error('Row not found');
  }

  async batchUpdate(updates) {
    await this.delay();
    // Simplified batch update for mock
    return { success: true };
  }

  generateId(sheetName) {
    const prefix = sheetName.charAt(0).toUpperCase();
    const existing = this.data[sheetName];
    const maxNum = existing.reduce((max, item) => {
      const id = item[this.getIdField(sheetName)];
      if (!id) return max;
      const num = parseInt(id.substring(1));
      return num > max ? num : max;
    }, 0);
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  }

  getIdField(sheetName) {
    const map = {
      users: 'userId',
      customers: 'customerId',
      quotations: 'quoteId',
      lineItems: 'lineId',
      leads: 'leadId',
      followups: 'followupId',
      samples: 'sampleId',
      inquiries: 'inquiryId',
      chatHistory: 'chatId',
      auditLog: 'logId',
      products: 'productId'
    };
    return map[sheetName] || 'id';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA CONTEXT & PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children, useMockData = true }) => {
  const [service] = useState(() => useMockData ? new MockDataService() : new GoogleSheetsService());
  const [data, setData] = useState({
    customers: [],
    quotations: [],
    lineItems: [],
    leads: [],
    followups: [],
    samples: [],
    inquiries: [],
    chatHistory: [],
    config: [],
    products: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customers, quotations, lineItems, leads, followups, samples, inquiries, chatHistory, config, products] = await Promise.all([
        service.fetchSheet('customers'),
        service.fetchSheet('quotations'),
        service.fetchSheet('lineItems'),
        service.fetchSheet('leads'),
        service.fetchSheet('followups'),
        service.fetchSheet('samples'),
        service.fetchSheet('inquiries'),
        service.fetchSheet('chatHistory'),
        service.fetchSheet('config'),
        service.fetchSheet('products')
      ]);

      setData({ customers, quotations, lineItems, leads, followups, samples, inquiries, chatHistory, config, products });
      setLastSync(new Date().toISOString());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Fetch specific sheet
  const fetchSheet = useCallback(async (sheetName) => {
    try {
      const sheetData = await service.fetchSheet(sheetName);
      setData(prev => ({ ...prev, [sheetName]: sheetData }));
      return sheetData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [service]);

  // Save new customer
  const saveCustomer = useCallback(async (customerData) => {
    try {
      const result = await service.appendRow('customers', customerData);
      await fetchSheet('customers');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [service, fetchSheet]);

  // Update customer
  const updateCustomer = useCallback(async (customerId, updates) => {
    try {
      const index = data.customers.findIndex(c => c.customerId === customerId);
      if (index === -1) throw new Error('Customer not found');
      
      const result = await service.updateRow('customers', index, updates);
      await fetchSheet('customers');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [service, data.customers, fetchSheet]);

  // Save quotation
  const saveQuotation = useCallback(async (quoteData, lineItemsData) => {
    try {
      // Save quote
      const quoteResult = await service.appendRow('quotations', quoteData);
      
      // Save line items
      for (const item of lineItemsData) {
        await service.appendRow('lineItems', { ...item, quoteId: quoteResult.id });
      }
      
      await Promise.all([fetchSheet('quotations'), fetchSheet('lineItems')]);
      return quoteResult;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [service, fetchSheet]);

  // Update lead stage
  const updateLeadStage = useCallback(async (leadId, newStage) => {
    try {
      const index = data.leads.findIndex(l => l.leadId === leadId);
      if (index === -1) throw new Error('Lead not found');
      
      const result = await service.updateRow('leads', index, { stage: newStage });
      await fetchSheet('leads');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [service, data.leads, fetchSheet]);

  // Add followup
  const addFollowup = useCallback(async (followupData) => {
    try {
      const result = await service.appendRow('followups', followupData);
      
      // Update lead followup count and dates
      const leadIndex = data.leads.findIndex(l => l.leadId === followupData.leadId);
      if (leadIndex !== -1) {
        const lead = data.leads[leadIndex];
        await service.updateRow('leads', leadIndex, {
          lastFollowupDate: followupData.date,
          followupCount: String(parseInt(lead.followupCount || 0) + 1)
        });
      }
      
      await Promise.all([fetchSheet('followups'), fetchSheet('leads')]);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [service, data.leads, fetchSheet]);

  // Add chat message
  const addChatMessage = useCallback(async (chatData) => {
    try {
      const result = await service.appendRow('chatHistory', chatData);
      await fetchSheet('chatHistory');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [service, fetchSheet]);

  // Get customer quotes
  const getCustomerQuotes = useCallback((customerId) => {
    return data.quotations.filter(q => q.customerId === customerId);
  }, [data.quotations]);

  // Get quote line items
  const getQuoteLineItems = useCallback((quoteId) => {
    return data.lineItems.filter(li => li.quoteId === quoteId);
  }, [data.lineItems]);

  // Get customer chat history
  const getCustomerChats = useCallback((customerId) => {
    return data.chatHistory.filter(ch => ch.customerId === customerId);
  }, [data.chatHistory]);

  // Get lead followups
  const getLeadFollowups = useCallback((leadId) => {
    return data.followups.filter(f => f.leadId === leadId);
  }, [data.followups]);

  // Get config value
  const getConfigValue = useCallback((setting) => {
    const config = data.config.find(c => c.setting === setting);
    return config ? config.value : null;
  }, [data.config]);

  // Initialize on mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const value = {
    // Data
    customers: data.customers,
    quotations: data.quotations,
    lineItems: data.lineItems,
    leads: data.leads,
    followups: data.followups,
    samples: data.samples,
    inquiries: data.inquiries,
    chatHistory: data.chatHistory,
    config: data.config,
    products: data.products,
    
    // State
    loading,
    error,
    lastSync,
    
    // Methods
    fetchAllData,
    fetchSheet,
    saveCustomer,
    updateCustomer,
    saveQuotation,
    updateLeadStage,
    addFollowup,
    addChatMessage,
    getCustomerQuotes,
    getQuoteLineItems,
    getCustomerChats,
    getLeadFollowups,
    getConfigValue
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export { GoogleSheetsService, MockDataService, SHEET_CONFIG, COLUMN_MAPS };
