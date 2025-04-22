const { google } = require('googleapis');
const axios = require('axios');
const XLSX = require('xlsx');
require('dotenv').config();

/**
 * Handler for google_search MCP tool
 * Uses Google Custom Search API to find job listings based on job title and location
 */
async function googleSearchHandler(req, res) {
  try {
    const { jobTitle, location, maxResults = 50 } = req.body;
    
    // Retrieve API key and Search Engine ID from environment variables
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX; // Search Engine ID
    
    if (!apiKey || !cx) {
      return res.status(500).json({
        error: 'Missing Google API credentials. Set GOOGLE_API_KEY and GOOGLE_CX environment variables.'
      });
    }
    
    // Collect all results by making multiple requests if needed
    // Google Custom Search only allows up to 10 results per request
    const allResults = [];
    const maxRequestsNeeded = Math.ceil(maxResults / 10);
    
    for (let i = 0; i < maxRequestsNeeded; i++) {
      // Calculate the start index for this request
      const startIndex = i * 10 + 1;
      
      // Construct search query focusing on "Looking for [job title]" pattern
      const query = `site:linkedin.com OR site:indeed.com OR site:glassdoor.com OR site:monster.com OR site:ziprecruiter.com "Looking for ${jobTitle}" ${location ? `"${location}"` : ''}`;
      
      // Make request to Google Custom Search API
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: cx,
          q: query,
          num: 10, // Max allowed per request
          start: startIndex
        }
      });
      
      // Format and add these results
      if (response.data.items && response.data.items.length > 0) {
        const formattedResults = response.data.items.map(item => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          source: new URL(item.link).hostname
        }));
        
        allResults.push(...formattedResults);
        
        // Break if we have enough results
        if (allResults.length >= maxResults) {
          break;
        }
      } else {
        // No more results to fetch
        break;
      }
    }
    
    // Limit to the requested number of results
    const results = allResults.slice(0, maxResults);
    
    return res.json({ results });
  } catch (error) {
    console.error('Google Search API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handler for create_spreadsheet MCP tool
 * Creates a Google Sheet and populates it with job listing data
 */
async function createSpreadsheetHandler(req, res) {
  try {
    const { title, data } = req.body;
    
    // Load credentials from environment variable
    // Credentials should be a stringified JSON object
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
    
    if (!credentials) {
      return res.status(500).json({
        error: 'Missing Google Sheets credentials. Set GOOGLE_SHEETS_CREDENTIALS environment variable.'
      });
    }
    
    // Create JWT client
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    );
    
    // Initialize Sheets API
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: title
        },
        sheets: [
          {
            properties: {
              title: 'Job Listings',
              gridProperties: {
                rowCount: data.length + 1, // +1 for header row
                columnCount: 4
              }
            }
          }
        ]
      }
    });
    
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    
    // Prepare header row and data rows
    const values = [
      ['Title', 'Link', 'Description', 'Source'], // Header row
      ...data.map(item => [
        item.title,
        item.link,
        item.snippet,
        item.source
      ])
    ];
    
    // Write data to the spreadsheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Job Listings!A1',
      valueInputOption: 'RAW',
      resource: {
        values
      }
    });
    
    // Set permissions to anyone with the link can edit (not just view)
    const drive = google.drive({ version: 'v3', auth });
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',  // Change from 'reader' to 'writer' to allow editing
        type: 'anyone'
      }
    });
    
    return res.json({
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`,
      totalResults: data.length
    });
  } catch (error) {
    console.error('Google Sheets API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handler for export_to_excel MCP tool
 * Exports job listing data to Excel file and returns it as downloadable content
 */
async function exportToExcelHandler(req, res) {
  try {
    const { data, filename = 'job_listings.xlsx' } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: 'Invalid data format. Please provide an array of job listings.'
      });
    }
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Define headers
    const headers = ['Title', 'Link', 'Description', 'Source'];
    
    // Create worksheet data with headers and data rows
    const worksheetData = [
      headers,
      ...data.map(item => [
        item.title || '',
        item.link || '',
        item.snippet || '',
        item.source || ''
      ])
    ];
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Listings');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    return res.send(excelBuffer);
  } catch (error) {
    console.error('Excel Export Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  googleSearchHandler,
  createSpreadsheetHandler,
  exportToExcelHandler
}; 