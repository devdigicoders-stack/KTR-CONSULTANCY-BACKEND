require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const cibilRoutes = require('./routes/cibilRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clientRoutes = require('./routes/clientRoutes');
const cibilReportRoutes = require('./routes/cibilReportRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const financialYearRoutes = require('./routes/financialYearRoutes');
const schoolGlobalDetailRoutes = require('./routes/schoolGlobalDetailRoutes');
const schoolBoardRoutes = require('./routes/schoolBoardRoutes');
const schoolGlobalFeeTypeRoutes = require('./routes/schoolGlobalFeeTypeRoutes');
const wingRoutes = require('./routes/wingRoutes');
const schoolClassRoutes = require('./routes/schoolClassRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const classSectionRoutes = require('./routes/classSectionRoutes');
const religionRoutes = require('./routes/religionRoutes');
const committeeRoutes = require('./routes/committeeRoutes');
const cibilCaseRoutes = require('./routes/cibilCaseRoutes');
const caQuoteRoutes = require('./routes/caQuoteRoutes');
const chainDeedRoutes = require('./routes/chainDeedRoutes');
const propertyAssessmentRoutes = require('./routes/propertyAssessmentRoutes');
const propertyValuationTDSRoutes = require('./routes/propertyValuationTDSRoutes');
const insuranceRoutes = require('./routes/insuranceRoutes');
const eligibilityCheckRoutes = require('./routes/eligibilityCheckRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Use Routes
app.use('/api/cibil', cibilRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cibil-reports', cibilReportRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/financial-years', financialYearRoutes);
app.use('/api/school-global-details', schoolGlobalDetailRoutes);
app.use('/api/school-boards', schoolBoardRoutes);
app.use('/api/school-global-fee-types', schoolGlobalFeeTypeRoutes);
app.use('/api/wings', wingRoutes);
app.use('/api/school-classes', schoolClassRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/class-sections', classSectionRoutes);
app.use('/api/religions', religionRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/cibil-cases', cibilCaseRoutes);
app.use('/api/ca-quotes', caQuoteRoutes);
app.use('/api/chain-deeds', chainDeedRoutes);
app.use('/api/property-assessments', propertyAssessmentRoutes);
app.use('/api/property-valuation-tds', propertyValuationTDSRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/eligibility-checks', eligibilityCheckRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route for testing
app.get('/', (req, res) => {
  res.send('KTR Consultants Backend API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});










