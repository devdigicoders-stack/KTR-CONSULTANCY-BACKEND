const Admin = require('../models/Admin');
const ClientProfile = require('../models/ClientProfile');
const OnlineApplication = require('../models/OnlineApplication');
const Enquiry = require('../models/Enquiry');
const CibilCase = require('../models/CibilCase');
const CAQuote = require('../models/CAQuote');
const ChainDeed = require('../models/ChainDeed');
const PropertyAssessment = require('../models/PropertyAssessment');

// Helper to get start of current and previous month
const getMonthRanges = () => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { currentMonthStart, previousMonthStart };
};

// Calculate trend
const calculateTrend = (current, previous) => {
  if (previous === 0) return current > 0 ? { text: '↑ 100% this month', isPositive: true } : { text: '→ No change', isPositive: null };
  const diff = current - previous;
  const percent = Math.round((diff / previous) * 100);
  if (percent > 0) return { text: `↑ ${percent}% this month`, isPositive: true };
  if (percent < 0) return { text: `↓ ${Math.abs(percent)}% this month`, isPositive: false };
  return { text: '→ No change', isPositive: null };
};

exports.getAdminDashboardData = async (req, res) => {
  try {
    const { currentMonthStart, previousMonthStart } = getMonthRanges();

    // 1. STATS
    const [
      totalUsers, totalClients, cibilChecks, websiteEnquiries, activeServices,
      prevClients, prevCibilChecks, prevEnquiries, prevActiveServices
    ] = await Promise.all([
      Admin.countDocuments(),
      ClientProfile.countDocuments(),
      CibilCase.countDocuments(),
      Enquiry.countDocuments(),
      OnlineApplication.countDocuments({ status: 'In Progress' }),
      
      ClientProfile.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
      CibilCase.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
      Enquiry.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
      OnlineApplication.countDocuments({ status: 'In Progress', createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } })
    ]);

    // For total documents, we sum the existence of panCardUrl, idProofUrl, addressProofUrl, and otherDocs array length
    const allClients = await ClientProfile.find({}, 'panCardUrl idProofUrl addressProofUrl otherDocs status');
    let totalDocs = 0;
    
    // Document Status calculation
    let panStats = { tot: 0, ver: 0, pen: 0, rej: 0 };
    let idStats = { tot: 0, ver: 0, pen: 0, rej: 0 };
    let addressStats = { tot: 0, ver: 0, pen: 0, rej: 0 };
    let othersStats = { tot: 0, ver: 0, pen: 0, rej: 0 };

    let activeClientCount = 0;
    let inactiveClientCount = 0;
    let pendingClientCount = 0;

    allClients.forEach(c => {
      // Client status grouping
      if (c.status === 'Approved') activeClientCount++;
      else if (c.status === 'Rejected') inactiveClientCount++;
      else pendingClientCount++;

      // Document tracking
      const isVerified = c.status === 'Approved';
      const isRejected = c.status === 'Rejected';
      const isPending = c.status === 'Pending';

      if (c.panCardUrl) {
        totalDocs++; panStats.tot++;
        if (isVerified) panStats.ver++; else if (isRejected) panStats.rej++; else panStats.pen++;
      }
      if (c.idProofUrl) {
        totalDocs++; idStats.tot++;
        if (isVerified) idStats.ver++; else if (isRejected) idStats.rej++; else idStats.pen++;
      }
      if (c.addressProofUrl) {
        totalDocs++; addressStats.tot++;
        if (isVerified) addressStats.ver++; else if (isRejected) addressStats.rej++; else addressStats.pen++;
      }
      if (c.otherDocs && c.otherDocs.length > 0) {
        totalDocs += c.otherDocs.length;
        othersStats.tot += c.otherDocs.length;
        if (isVerified) othersStats.ver += c.otherDocs.length; 
        else if (isRejected) othersStats.rej += c.otherDocs.length; 
        else othersStats.pen += c.otherDocs.length;
      }
    });

    const currClients = await ClientProfile.countDocuments({ createdAt: { $gte: currentMonthStart } });
    const currCibil = await CibilCase.countDocuments({ createdAt: { $gte: currentMonthStart } });
    const currEnquiries = await Enquiry.countDocuments({ createdAt: { $gte: currentMonthStart } });
    const currActive = await OnlineApplication.countDocuments({ status: 'In Progress', createdAt: { $gte: currentMonthStart } });

    const stats = {
      totalUsers: { value: totalUsers, trend: calculateTrend(totalUsers, totalUsers) },
      totalClients: { value: totalClients, trend: calculateTrend(currClients, prevClients) },
      totalDocuments: { value: totalDocs, trend: { text: 'Dynamic calculation', isPositive: true } },
      cibilChecks: { value: cibilChecks, trend: calculateTrend(currCibil, prevCibilChecks) },
      websiteEnquiries: { value: websiteEnquiries, trend: calculateTrend(currEnquiries, prevEnquiries) },
      activeServices: { value: activeServices, trend: calculateTrend(currActive, prevActiveServices) },
    };

    // 2. Client Status (Donut Chart)
    const clientStatus = [
      { name: 'Active', value: activeClientCount },
      { name: 'Inactive', value: inactiveClientCount },
      { name: 'Pending', value: pendingClientCount }
    ];

    // 3. Document Status Table
    const calcProg = (stat) => stat.tot > 0 ? Math.round((stat.ver / stat.tot) * 100) : 0;
    const documentStatus = [
      { name: 'PAN Cards', tot: panStats.tot, ver: panStats.ver, pen: panStats.pen, rej: panStats.rej, prog: calcProg(panStats) },
      { name: 'ID Proofs', tot: idStats.tot, ver: idStats.ver, pen: idStats.pen, rej: idStats.rej, prog: calcProg(idStats) },
      { name: 'Address Proofs', tot: addressStats.tot, ver: addressStats.ver, pen: addressStats.pen, rej: addressStats.rej, prog: calcProg(addressStats) },
      { name: 'Others', tot: othersStats.tot, ver: othersStats.ver, pen: othersStats.pen, rej: othersStats.rej, prog: calcProg(othersStats) },
    ];

    // 4. Latest Clients
    const latestClientsRaw = await ClientProfile.find().sort({ createdAt: -1 }).limit(5);
    const latestClients = latestClientsRaw.map(c => ({
      id: c._id,
      name: c.fullName,
      email: c.email || 'N/A',
      mob: c.mobile || 'N/A',
      status: c.status === 'Approved' ? 'Active' : (c.status === 'Rejected' ? 'Inactive' : 'Pending'),
      date: new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    }));

    // 5. Top Services
    const applications = await OnlineApplication.find({}, 'serviceType');
    const serviceCounts = {};
    applications.forEach(app => {
      serviceCounts[app.serviceType] = (serviceCounts[app.serviceType] || 0) + 1;
    });
    const totalApps = applications.length || 1;
    const topServices = Object.keys(serviceCounts)
      .map(key => ({
        name: key,
        count: serviceCounts[key],
        percent: Math.round((serviceCounts[key] / totalApps) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    // 6. Recent Activities
    const recentClients = await ClientProfile.find().sort({ createdAt: -1 }).limit(3);
    const recentEnquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(3);
    const recentCibil = await CibilCase.find().sort({ createdAt: -1 }).limit(3);
    const recentApps = await OnlineApplication.find().sort({ createdAt: -1 }).limit(3);

    let allActivities = [
      ...recentClients.map(c => ({ text: `New client <b>"${c.fullName}"</b> added`, date: c.createdAt, type: 'Client' })),
      ...recentEnquiries.map(e => ({ text: `New enquiry from <b>"${e.fullName || e.name || 'User'}"</b>`, date: e.createdAt, type: 'Enquiry' })),
      ...recentCibil.map(c => ({ text: `CIBIL Score checked for <b>"${c.fullName || c.name || 'User'}"</b>`, date: c.createdAt, type: 'CIBIL' })),
      ...recentApps.map(a => ({ text: `Service <b>"${a.serviceType}"</b> added`, date: a.createdAt, type: 'Service' }))
    ];

    allActivities.sort((a, b) => b.date - a.date);
    const recentActivities = allActivities.slice(0, 8); // top 8 activities

    // 7. Overall Growth Chart (Dummy monthly data for last 6 months based on basic logic)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const overallGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 1);
      
      const cCount = await ClientProfile.countDocuments({ createdAt: { $gte: d, $lt: nextMonth } });
      const eCount = await Enquiry.countDocuments({ createdAt: { $gte: d, $lt: nextMonth } });

      overallGrowth.push({
        name: monthNames[d.getMonth()],
        clients: cCount,
        enquiries: eCount
      });
    }

    // 8. Client Locations Distribution
    const allClientsData = await ClientProfile.find({}, 'city');
    const cityCounts = {};
    allClientsData.forEach(c => {
      const city = c.city || 'Unknown';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    const sortedCities = Object.keys(cityCounts)
      .map(key => ({ name: key, count: cityCounts[key] }))
      .sort((a, b) => b.count - a.count);

    let topCities = sortedCities.slice(0, 5);
    let othersCount = sortedCities.slice(5).reduce((acc, curr) => acc + curr.count, 0);
    
    if (othersCount > 0) {
      topCities.push({ name: 'Others', count: othersCount });
    }

    const clientLocations = {
      data: topCities,
      total: allClientsData.length
    };

    res.status(200).json({
      success: true,
      data: {
        stats,
        clientStatus,
        documentStatus,
        latestClients,
        topServices,
        recentActivities,
        overallGrowth,
        clientLocations
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
