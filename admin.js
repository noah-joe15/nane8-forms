// =====================================================
// AUTOMATED PDF REPORT GENERATION - WADAU MALIGHAFI
// =====================================================

// Smart recommendation engine
function generateSmartRecommendations(data) {
  var recommendations = [];
  var insights = [];
  
  // Analyze raw material selling percentage
  var sellingRaw = data.filter(function(r) { 
    return r.asilimia_thamani && r.asilimia_thamani.includes('0%'); 
  }).length;
  
  var totalResponses = data.length;
  var sellingRawPercentage = totalResponses > 0 ? (sellingRaw / totalResponses * 100).toFixed(1) : 0;
  
  if (parseFloat(sellingRawPercentage) > 60) {
    insights.push({
      type: 'critical',
      category: 'Usafirishaji',
      text: sellingRawPercentage + '% ya wadau wanaouza bidhaa ghafi bila kuongeza thamani. Hii ni kiwango cha juu sana.',
      priority: 'High'
    });
    recommendations.push({
      category: 'Sera na Udhibiti',
      action: 'Weka sera za kulazimisha uchakataji wa ndani kabla ya usafirishaji',
      impact: 'High',
      timeline: 'Miezi 6-12'
    });
    recommendations.push({
      category: 'Viwanda',
      action: 'Tengeneza viwanda vya kuchakata bidhaa hizi katika mikoa inayozalisha',
      impact: 'High',
      timeline: 'Miaka 1-3'
    });
  } else if (parseFloat(sellingRawPercentage) > 30) {
    insights.push({
      type: 'warning',
      category: 'Uchakataji',
      text: sellingRawPercentage + '% ya bidhaa bado zinauzwa ghafi. Kuna nafasi ya kuboresha uchakataji.',
      priority: 'Medium'
    });
  } else {
    insights.push({
      type: 'success',
      category: 'Uchakataji',
      text: 'Asilimia ndogo (' + sellingRawPercentage + '%) ya bidhaa zinauzwa ghafi. Viwanda vinavyofanya kazi vizuri.',
      priority: 'Low'
    });
  }
  
  // Analyze processing capacity utilization
  var underutilized = data.filter(function(r) {
    return r.sababu_kutotumia_ukomo && r.sababu_kutotumia_ukomo.length > 0;
  }).length;
  
  if (underutilized > totalResponses * 0.4) {
    insights.push({
      type: 'critical',
      category: 'Uwezo wa Viwanda',
      text: 'Zaidi ya viwanda ' + underutilized + ' havitumii uwezo wao kamili wa uzalishaji.',
      priority: 'High'
    });
    recommendations.push({
      category: 'Uwekezaji',
      action: 'Boresha upatikanaji wa malighafi kwa viwanda vilivyopo',
      impact: 'High',
      timeline: 'Miezi 3-6'
    });
  }
  
  // Analyze infrastructure challenges
  var infraIssues = data.filter(function(r) {
    return r.hali_miundombinu && (r.hali_miundombinu === 'Mbaya' || r.hali_miundombinu === 'Mbaya sana');
  }).length;
  
  if (infraIssues > totalResponses * 0.3) {
    insights.push({
      type: 'warning',
      category: 'Miundombinu',
      text: infraIssues + ' wadau wanakumbana na changamoto za miundombinu.',
      priority: 'Medium'
    });
    recommendations.push({
      category: 'Miundombinu',
      action: 'Jenga barabara, umeme wa uhakika na maghala ya kisasa',
      impact: 'Medium',
      timeline: 'Miaka 2-5'
    });
  }
  
  // Analyze finance constraints
  var financeIssues = data.filter(function(r) {
    return r.vikwazo_fedha && r.vikwazo_fedha.includes('Riba kubwa');
  }).length;
  
  if (financeIssues > totalResponses * 0.5) {
    insights.push({
      type: 'critical',
      category: 'Fedha',
      text: 'Zaidi ya ' + financeIssues + ' wadau wanakumbana na riba kubwa za mikopo.',
      priority: 'High'
    });
    recommendations.push({
      category: 'Huduma za Kifedha',
      action: 'Unda mfuko wa mikopo ya riba nafuu kwa wachakataji',
      impact: 'High',
      timeline: 'Miezi 6-12'
    });
  }
  
  // Analyze regional distribution
  var regions = {};
  data.forEach(function(r) {
    if (r.mkoa) {
      regions[r.mkoa] = (regions[r.mkoa] || 0) + 1;
    }
  });
  
  var regionCount = Object.keys(regions).length;
  if (regionCount < 5) {
    insights.push({
      type: 'warning',
      category: 'Usambazaji wa Kijiografia',
      text: 'Majibu yamekusanywa kutoka mikoa ' + regionCount + ' tu. Upatikanaji wa data haujatosha.',
      priority: 'Medium'
    });
  } else {
    insights.push({
      type: 'success',
      category: 'Usambazaji wa Kijiografia',
      text: 'Data imekusanywa kutoka mikoa ' + regionCount + '. Usambazaji mzuri wa kijiografia.',
      priority: 'Low'
    });
  }
  
  // Analyze commodity concentration
  var commodities = {};
  data.forEach(function(r) {
    if (r['bidhaa[]']) {
      var bids = Array.isArray(r['bidhaa[]']) ? r['bidhaa[]'] : [r['bidhaa[]']];
      bids.forEach(function(b) {
        commodities[b] = (commodities[b] || 0) + 1;
      });
    }
  });
  
  var topCommodity = Object.keys(commodities).reduce(function(a, b) { 
    return commodities[a] > commodities[b] ? a : b; 
  }, '');
  
  if (topCommodity && commodities[topCommodity] > totalResponses * 0.4) {
    insights.push({
      type: 'info',
      category: 'Msongamano wa Bidhaa',
      text: topCommodity + ' ndiyo bidhaa inayoshughulikiwa zaidi (' + commodities[topCommodity] + ' majibu).',
      priority: 'Low'
    });
  }
  
  // Add standard recommendations
  recommendations.push({
    category: 'Utafiti na Maendeleo',
    action: 'Fanya utafiti wa kina wa mnyororo wa thamani wa kila bidhaa',
    impact: 'Medium',
    timeline: 'Miezi 12-18'
  });
  
  recommendations.push({
    category: 'Mafunzo',
    action: 'Toa mafunzo ya uchakataji, ubora na usimamizi wa biashara',
    impact: 'Medium',
    timeline: 'Miezi 3-6'
  });
  
  return {
    insights: insights,
    recommendations: recommendations,
    statistics: {
      totalResponses: totalResponses,
      sellingRawPercentage: sellingRawPercentage,
      topCommodity: topCommodity,
      regionCount: regionCount,
      underutilizedFactories: underutilized
    }
  };
}

// Auto-categorization engine
function categorizeResponses(data) {
  var categories = {
    byRegion: {},
    byCommodity: {},
    byStakeholderType: {},
    byBusinessScale: {},
    byExportInvolvement: {},
    byProcessingLevel: {}
  };
  
  data.forEach(function(r) {
    // By Region
    if (r.mkoa) {
      categories.byRegion[r.mkoa] = (categories.byRegion[r.mkoa] || 0) + 1;
    }
    
    // By Commodity
    if (r['bidhaa[]']) {
      var bids = Array.isArray(r['bidhaa[]']) ? r['bidhaa[]'] : [r['bidhaa[]']];
      bids.forEach(function(b) {
        categories.byCommodity[b] = (categories.byCommodity[b] || 0) + 1;
      });
    }
    
    // By Stakeholder Type
    if (r['aina_mdau[]']) {
      var types = Array.isArray(r['aina_mdau[]']) ? r['aina_mdau[]'] : [r['aina_mdau[]']];
      types.forEach(function(t) {
        categories.byStakeholderType[t] = (categories.byStakeholderType[t] || 0) + 1;
      });
    }
    
    // By Business Scale
    if (r.kiwango_shughuli) {
      categories.byBusinessScale[r.kiwango_shughuli] = (categories.byBusinessScale[r.kiwango_shughuli] || 0) + 1;
    }
    
    // By Export Involvement
    if (r.husika_mojakwamoja_nje) {
      categories.byExportInvolvement[r.husika_mojakwamoja_nje] = (categories.byExportInvolvement[r.husika_mojakwamoja_nje] || 0) + 1;
    }
    
    // By Processing Level
    if (r.asilimia_thamani) {
      categories.byProcessingLevel[r.asilimia_thamani] = (categories.byProcessingLevel[r.asilimia_thamani] || 0) + 1;
    }
  });
  
  return categories;
}

// Generate comprehensive PDF report
async function generateWadauMalighafiReport() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('Maktaba ya PDF haijapakia. Tafadhali jaribu tena.');
    return;
  }
  
  if (allSubmissions.length === 0) {
    alert('Hakuna majibu ya kutoa ripoti.');
    return;
  }
  
  var { jsPDF } = window.jspdf;
  var doc = new jsPDF('p', 'mm', 'a4');
  var pageWidth = doc.internal.pageSize.getWidth();
  var pageHeight = doc.internal.pageSize.getHeight();
  var margin = 15;
  
  // Generate analysis
  var analysis = generateSmartRecommendations(allSubmissions);
  var categories = categorizeResponses(allSubmissions);
  
  // ===== COVER PAGE =====
  // Header strip with logos
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  // Add TANTRADE logo (placeholder)
  doc.setTextColor(0, 60, 113);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('TANTRADE', margin, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(92, 107, 122);
  doc.text('Tanzania Trade Development Authority', margin, 24);
  
  // National emblem placeholder
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 60, 113);
  doc.text('JAMHURI YA MUUNGANO WA TANZANIA', pageWidth - margin, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Ofisi ya Biashara na Viwanda', pageWidth - margin, 24, { align: 'right' });
  
  // Blue title band
  doc.setFillColor(0, 60, 113);
  doc.rect(0, 30, pageWidth, 20, 'F');
  
  // Green accent line
  doc.setFillColor(0, 133, 74);
  doc.rect(0, 50, pageWidth, 2, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RIPOTI YA TATHMINI YA HALI YA SOKO', margin, 43);
  doc.setFontSize(12);
  doc.text('Kwa Bidhaa 10 Bora zinazouzwa nje kama Malighafi', margin, 49);
  
  // Subtitle
  doc.setTextColor(0, 60, 113);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DODOSO KWA WADAU - 2026', pageWidth / 2, 65, { align: 'center' });
  
  // Meta information
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(92, 107, 122);
  var yPos = 75;
  doc.text('Tarehe ya Kutoa Ripoti: ' + new Date().toLocaleDateString('sw-TZ', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }), margin, yPos);
  
  doc.text('Jumla ya Majibu: ' + analysis.statistics.totalResponses, pageWidth / 2, yPos, { align: 'center' });
  
  doc.text('Mikoa iliyofikiwa: ' + analysis.statistics.regionCount, pageWidth - margin, yPos, { align: 'right' });
  
  // Key statistics boxes
  yPos = 90;
  var boxWidth = (pageWidth - 2 * margin - 20) / 3;
  var boxHeight = 25;
  
  // Box 1: Total Responses
  doc.setFillColor(0, 60, 113);
  doc.roundedRect(margin, yPos, boxWidth, boxHeight, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(analysis.statistics.totalResponses.toString(), margin + boxWidth / 2, yPos + 12, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Jumla ya Majibu', margin + boxWidth / 2, yPos + 20, { align: 'center' });
  
  // Box 2: Selling Raw Percentage
  doc.setFillColor(214, 69, 69);
  doc.roundedRect(margin + boxWidth + 10, yPos, boxWidth, boxHeight, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(analysis.statistics.sellingRawPercentage + '%', margin + boxWidth + 10 + boxWidth / 2, yPos + 12, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Wanaouza Ghafi', margin + boxWidth + 10 + boxWidth / 2, yPos + 20, { align: 'center' });
  
  // Box 3: Top Commodity
  doc.setFillColor(0, 133, 74);
  doc.roundedRect(margin + 2 * (boxWidth + 10), yPos, boxWidth, boxHeight, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  var topCom = analysis.statistics.topCommodity || 'N/A';
  doc.text(topCom.length > 15 ? topCom.substring(0, 15) + '...' : topCom, 
    margin + 2 * (boxWidth + 10) + boxWidth / 2, yPos + 12, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Bidhaa Kuu', margin + 2 * (boxWidth + 10) + boxWidth / 2, yPos + 20, { align: 'center' });
  
  // ===== TABLE OF CONTENTS =====
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 60, 113);
  doc.text('YALIYOMO', margin, 20);
  
  var tocItems = [
    { page: 2, title: 'Muhtasari Mtendaji' },
    { page: 3, title: 'Takwimu Kuu na Uchambuzi' },
    { page: 4, title: 'Uchambuzi wa Kijiografia' },
    { page: 5, title: 'Uchambuzi wa Bidhaa' },
    { page: 6, title: 'Uchambuzi wa Wadau' },
    { page: 7, title: 'Changamoto za Viwanda' },
    { page: 8, title: 'Masoko na Bei' },
    { page: 9, title: 'Miundombinu na Fedha' },
    { page: 10, title: 'Mapendekezo Yaliyotolewa na Mfumo' },
    { page: 11, title: 'Hitimisho na Mapendekezo' }
  ];
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(16, 24, 38);
  
  tocItems.forEach(function(item, idx) {
    var y = 35 + (idx * 12);
    doc.text((idx + 1) + '. ' + item.title, margin, y);
    doc.text('.................... ' + item.page, pageWidth - margin, y, { align: 'right' });
  });
  
  // ===== EXECUTIVE SUMMARY =====
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 60, 113);
  doc.text('1. MUHTASARI MTENDAJI', margin, 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(16, 24, 38);
  
  var summaryText = 'Ripoti hii inatoa uchambuzi wa kina wa tathmini ya hali ya soko kwa bidhaa 10 bora za kilimo na madini zinazouzwa nje ya nchi kama malighafi. ';
  summaryText += 'Tathmini ilikusanya majibu ' + analysis.statistics.totalResponses + ' kutoka kwa wadau mbalimbali katika mikoa ' + analysis.statistics.regionCount + ' ya Tanzania. ';
  summaryText += 'Lengo kuu lilikuwa kubaini sababu zinazochangia bidhaa kuuzwa nje bila kuongezwa thamani na kupendekeza hatua za kuboresha mnyororo wa thamani.';
  
  var summaryLines = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
  doc.text(summaryLines, margin, 30);
  
  // Key findings
  var yPos = 30 + (summaryLines.length * 5) + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 60, 113);
  doc.text('Matokeo Muhimu:', margin, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(16, 24, 38);
  
  analysis.insights.forEach(function(insight) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    var icon = insight.type === 'critical' ? '[!]' : insight.type === 'warning' ? '[~]' : '[+]';
    var color = insight.type === 'critical' ? [214, 69, 69] : insight.type === 'warning' ? [202, 138, 4] : [0, 133, 74];
    
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(icon + ' ' + insight.category, margin, yPos);
    
    doc.setTextColor(16, 24, 38);
    doc.setFont('helvetica', 'normal');
    var lines = doc.splitTextToSize(insight.text, pageWidth - 2 * margin - 10);
    doc.text(lines, margin + 10, yPos);
    yPos += (lines.length * 5) + 5;
  });
  
  // ===== DETAILED ANALYSIS PAGES =====
  // Page 3: Key Statistics
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 60, 113);
  doc.text('2. TAKWIMU KUU NA UCHAMBUZI', margin, 20);
  
  // Regional distribution table
  var regionData = Object.keys(categories.byRegion).map(function(r) {
    return [r, categories.byRegion[r], ((categories.byRegion[r] / analysis.statistics.totalResponses) * 100).toFixed(1) + '%'];
  }).sort(function(a, b) { return parseInt(b[1]) - parseInt(a[1]); });
  
  doc.autoTable({
    startY: 28,
    margin: { left: margin, right: margin },
    head: [['Mkoa', 'Idadi ya Majibu', 'Asilimia']],
    body: regionData.slice(0, 10),
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [0, 60, 113], textColor: 255 },
    columnStyles: { 
      0: { cellWidth: 70 },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 50, halign: 'right' }
    }
  });
  
  // Commodity analysis
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 60, 113);
  doc.text('3. UCHAMBUZI WA BIDHAA', margin, 20);
  
  var commodityData = Object.keys(categories.byCommodity).map(function(c) {
    return [c, categories.byCommodity[c], ((categories.byCommodity[c] / analysis.statistics.totalResponses) * 100).toFixed(1) + '%'];
  }).sort(function(a, b) { return parseInt(b[1]) - parseInt(a[1]); });
  
  doc.autoTable({
    startY: 28,
    margin: { left: margin, right: margin },
    head: [['Bidhaa', 'Idadi ya Wadau', 'Asilimia']],
    body: commodityData,
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [0, 60, 113], textColor: 255 }
  });
  
  // Stakeholder analysis
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 60, 113);
  doc.text('4. UCHAMBUZI WA WADAU', margin, 20);
  
  var stakeholderData = Object.keys(categories.byStakeholderType).map(function(s) {
    return [s, categories.byStakeholderType[s], ((categories.byStakeholderType[s] / analysis.statistics.totalResponses) * 100).toFixed(1) + '%'];
  }).sort(function(a, b) { return parseInt(b[1]) - parseInt(a[1]); });
  
  doc.autoTable({
    startY: 28,
    margin: { left: margin, right: margin },
    head: [['Aina ya Mdau', 'Idadi', 'Asilimia']],
    body: stakeholderData,
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [0, 60, 113], textColor: 255 }
  });
  
  // Processing levels
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 60, 113);
  doc.text('5. UCHAMBUZI WA UCHAKATAJI', margin, 20);
  
  var processingData = Object.keys(categories.byProcessingLevel).map(function(p) {
    return [p, categories.byProcessingLevel[p], ((categories.byProcessingLevel[p] / analysis.statistics.totalResponses) * 100).toFixed(1) + '%'];
  });
  
  doc.autoTable({
    startY: 28,
    margin: { left: margin, right: margin },
    head: [['Kiwango cha Uchakataji', 'Idadi', 'Asilimia']],
    body: processingData,
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [0, 60, 113], textColor: 255 }
  });
  
  // ===== SMART RECOMMENDATIONS =====
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 60, 113);
  doc.text('6. MAPENDEKEZO YALIYOTOLEWA NA MFUMO', margin, 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(16, 24, 38);
  
  var recY = 30;
  analysis.recommendations.forEach(function(rec, idx) {
    if (recY > pageHeight - 40) {
      doc.addPage();
      recY = 20;
    }
    
    doc.setFillColor(0, 60, 113);
    doc.rect(margin, recY - 5, pageWidth - 2 * margin, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(rec.category, margin + 3, recY);
    
    doc.setTextColor(16, 24, 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    var actionLines = doc.splitTextToSize(rec.action, pageWidth - 2 * margin - 10);
    doc.text(actionLines, margin + 3, recY + 8);
    
    doc.setFontSize(8);
    doc.setTextColor(92, 107, 122);
    doc.text('Athari: ' + rec.impact + ' | Muda: ' + rec.timeline, margin + 3, recY + 20);
    
    recY += 30;
  });
  
  // ===== CONCLUSION =====
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 60, 113);
  doc.text('7. HITIMISHO NA MAPENDEKEZO', margin, 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(16, 24, 38);
  
  var conclusionText = 'Kulingana na uchambuzi wa data, tathmini hii imebaini changamoto kuu zinazochangia bidhaa kuuzwa nje kama malighafi. ';
  conclusionText += 'Mapendekezo yaliyotolewa na mfumo yanalenga kushughulikia changamoto hizi kwa njia ya kimfumo na endelevu. ';
  conclusionText += 'Inashauriwa kuwa TanTrade na wadau wengine watekeleze mapendekezo haya kwa umakini na ufuatiliaji wa karibu.';
  
  var conclusionLines = doc.splitTextToSize(conclusionText, pageWidth - 2 * margin);
  doc.text(conclusionLines, margin, 30);
  
  // Final recommendations
  var yPos = 30 + (conclusionLines.length * 5) + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 60, 113);
  doc.text('Hatua za Haraka zinazopendekezwa:', margin, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(16, 24, 38);
  
  var quickActions = [
    'Kuweka sera za kulazimisha uchakataji wa ndani',
    'Kuboresha miundombinu ya usafirishaji na uhifadhi',
    'Kutoa mikopo ya riba nafuu kwa wachakataji',
    'Kufanya mafunzo ya ubora na uchakataji',
    'Kuimarisha ushirikiano kati ya wazalishaji na viwanda'
  ];
  
  quickActions.forEach(function(action, idx) {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
    doc.text((idx + 1) + '. ' + action, margin + 5, yPos);
    yPos += 8;
  });
  
  // ===== FOOTER =====
  var pageCount = doc.getNumberOfPages();
  for (var i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(0, 133, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(92, 107, 122);
    doc.text('Ripoti ya Tathmini ya Hali ya Soko - TanTrade 2026', margin, pageHeight - 6);
    doc.text('Ukurasa ' + i + ' wa ' + pageCount, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }
  
  // Save PDF
  doc.save('Ripoti-Wadau-Malighafi-' + new Date().toISOString().slice(0, 10) + '.pdf');
}

// Add button to admin.html
// Add this button in the toolbar section after the existing buttons:
/*
<button class="btn btn-primary btn-sm" onclick="generateWadauMalighafiReport()" id="generateReportBtn" style="display:none;">
  <span class="lang-sw">Tengeneza Ripoti (PDF)</span>
  <span class="lang-en">Generate Report (PDF)</span>
</button>
*/

// Show/hide report button based on form selection
window.switchForm = function(formType) {
  activeForm = formType;
  var dynLabel = document.getElementById("statDynamicLabel");
  var kpiDynLabel = document.getElementById("kpiDynamicLabel");
  var reportBtn = document.getElementById("generateReportBtn");
  
  if (activeForm === 'nanenane') {
    if(dynLabel) dynLabel.innerHTML = '<span class="lang-sw">Hawajasajiliwa (MIT)</span><span class="lang-en">Unregistered (MIT)</span>';
    if(kpiDynLabel) kpiDynLabel.innerHTML = '<span class="lang-sw">Hawajasajiliwa</span><span class="lang-en">Unregistered</span>';
    if(reportBtn) reportBtn.style.display = 'none';
  } else {
    if(dynLabel) dynLabel.innerHTML = '<span class="lang-sw">Wanaouza Ghafi (0%)</span><span class="lang-en">Selling Raw (0%)</span>';
    if(kpiDynLabel) kpiDynLabel.innerHTML = '<span class="lang-sw">Wanaouza Ghafi</span><span class="lang-en">Selling Raw</span>';
    if(reportBtn) reportBtn.style.display = 'inline-flex';
  }
  loadSubmissions();
  loadQuestions();
};
