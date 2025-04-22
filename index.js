const express = require('express');
const { googleSearchHandler, createSpreadsheetHandler, exportToExcelHandler } = require('./handlers');
require('dotenv').config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add proper error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Simple health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Lead Generation API Server',
    version: '1.0.0',
    endpoints: [
      '/api/search', 
      '/api/search-to-spreadsheet',
      '/api/search-to-excel'
    ],
  });
});

// API endpoint for searching job listings
app.post('/api/search', async (req, res, next) => {
  try {
    return await googleSearchHandler(req, res);
  } catch (error) {
    next(error);
  }
});

// Search and create spreadsheet in one go
app.post('/api/search-to-spreadsheet', async (req, res, next) => {
  try {
    const { jobTitle, location, maxResults = 50, spreadsheetTitle } = req.body;
    
    if (!jobTitle) {
      return res.status(400).json({ 
        error: 'Missing required parameter: jobTitle is required' 
      });
    }
    
    // Create a search request to pass to the handler
    const searchReq = { body: { jobTitle, location, maxResults } };
    
    // Create a response object to capture the search results
    const searchRes = {
      json: (data) => {
        // Once we have the search results, create the spreadsheet
        const spreadsheetReq = {
          body: {
            title: spreadsheetTitle || `${jobTitle} Jobs${location ? ` in ${location}` : ''} - ${new Date().toLocaleDateString()}`,
            data: data.results
          }
        };
        
        // Create a response object that will handle the spreadsheet result
        const spreadsheetRes = {
          json: (spreadsheetData) => {
            res.json({
              message: 'Search and spreadsheet creation successful',
              jobTitle,
              location: location || 'Any location',
              totalResults: data.results.length,
              spreadsheetId: spreadsheetData.spreadsheetId,
              spreadsheetUrl: spreadsheetData.spreadsheetUrl
            });
          },
          status: (code) => ({
            json: (error) => res.status(code).json(error)
          })
        };
        
        // Call the spreadsheet handler
        createSpreadsheetHandler(spreadsheetReq, spreadsheetRes).catch(next);
      },
      status: (code) => ({
        json: (error) => res.status(code).json(error)
      })
    };
    
    // Call the search handler to start the process
    await googleSearchHandler(searchReq, searchRes);
    
  } catch (error) {
    next(error);
  }
});

// Search and export to Excel in one go
app.post('/api/search-to-excel', async (req, res, next) => {
  try {
    const { jobTitle, location, maxResults = 50, filename } = req.body;
    
    if (!jobTitle) {
      return res.status(400).json({ 
        error: 'Missing required parameter: jobTitle is required' 
      });
    }
    
    // Generate default filename if not provided
    const defaultFilename = `${jobTitle.replace(/\s+/g, '_')}${location ? `_${location.replace(/\s+/g, '_')}` : ''}_jobs.xlsx`;
    const excelFilename = filename || defaultFilename;
    
    // Create a search request to pass to the handler
    const searchReq = { body: { jobTitle, location, maxResults } };
    
    // Create a response object to capture the search results
    const searchRes = {
      json: (data) => {
        // Once we have the search results, export to Excel
        const excelReq = {
          body: {
            data: data.results,
            filename: excelFilename
          }
        };
        
        // Call the Excel export handler and pass through the response
        exportToExcelHandler(excelReq, res).catch(next);
      },
      status: (code) => ({
        json: (error) => res.status(code).json(error)
      })
    };
    
    // Call the search handler to start the process
    await googleSearchHandler(searchReq, searchRes);
    
  } catch (error) {
    next(error);
  }
});

// For backward compatibility
app.post('/google_search', (req, res, next) => {
  try {
    return googleSearchHandler(req, res);
  } catch (error) {
    next(error);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lead Generation API Server running on port ${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET  / - API information');
  console.log('  POST /api/search - Search for job listings');
  console.log('  POST /api/search-to-spreadsheet - Search and create spreadsheet');
  console.log('  POST /api/search-to-excel - Search and export to Excel');
}); 