# Lead Generation API Server

A powerful API server for searching job listings, creating Google Sheets, and exporting to Excel - all with single API calls.

## Features

- 🔍 Search for job listings across major job sites (LinkedIn, Indeed, Glassdoor, etc.)
- 📊 Export job listings directly to Google Sheets
- 📑 Download job listings as Excel files
- ⚡ All-in-one endpoints for one-step automation

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google API credentials (for search and spreadsheet functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Zaidusyy/lead-generation-api.git
cd lead-generation-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following credentials:
```
PORT=3000
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_google_custom_search_engine_id
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"..."}
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Project Structure

The project follows a clean and organized structure to make navigation and development easier:

```
lead-generation-api/
├── index.js           # Main application entry point with API routes
├── handlers.js        # Core business logic for handling API requests
├── package.json       # Project dependencies and scripts
├── .env               # Environment variables (not checked into git)
├── node_modules/      # Installed dependencies
└── README.md          # Project documentation
```

Each file has a specific purpose:
- **index.js**: This is where we set up the Express server and define all our API endpoints
- **handlers.js**: Contains the implementation of our core features - search, spreadsheet creation, and Excel export
- **.env**: Stores all sensitive configuration like API keys (make sure not to commit this file!)

## API Endpoints

### 1. Search for Job Listings

**Endpoint:** `POST /api/search`

**Request Body:**
```json
{
  "jobTitle": "Software Engineer",
  "location": "New York",
  "maxResults": 20
}
```

**Parameters:**
- `jobTitle` (required): The job title to search for
- `location` (optional): The location for the job search
- `maxResults` (optional): Maximum number of results to return (default: 50)

**Response:**
```json
{
  "results": [
    {
      "title": "Looking for Software Engineer",
      "link": "https://example.com/job1",
      "snippet": "We are looking for a Software Engineer...",
      "source": "linkedin.com"
    },
    ...
  ]
}
```

### 2. Search and Create Google Spreadsheet

**Endpoint:** `POST /api/search-to-spreadsheet`

**Request Body:**
```json
{
  "jobTitle": "Software Engineer",
  "location": "New York",
  "maxResults": 20,
  "spreadsheetTitle": "Software Engineer Jobs Report"
}
```

**Parameters:**
- `jobTitle` (required): The job title to search for
- `location` (optional): The location for the job search
- `maxResults` (optional): Maximum number of results to return (default: 50)
- `spreadsheetTitle` (optional): Custom title for the Google Sheet

**Response:**
```json
{
  "message": "Search and spreadsheet creation successful",
  "jobTitle": "Software Engineer",
  "location": "New York",
  "totalResults": 20,
  "spreadsheetId": "1abc123...",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1abc123.../edit?usp=sharing"
}
```

### 3. Search and Export to Excel

**Endpoint:** `POST /api/search-to-excel`

**Request Body:**
```json
{
  "jobTitle": "Software Engineer",
  "location": "New York",
  "maxResults": 20,
  "filename": "software_engineer_jobs.xlsx"
}
```

**Parameters:**
- `jobTitle` (required): The job title to search for
- `location` (optional): The location for the job search
- `maxResults` (optional): Maximum number of results to return (default: 50)
- `filename` (optional): Custom filename for the Excel file

**Response:**
Direct download of Excel file (.xlsx)

## Implementation Details

### Search Algorithm

Our search is focused on finding companies actively looking to hire. We use Google's Custom Search API with a special query that targets job listings containing "Looking for [job title]" phrases.

The search query looks something like this:
```
site:linkedin.com OR site:indeed.com OR site:glassdoor.com OR site:monster.com OR site:ziprecruiter.com "Looking for {jobTitle}" {location}
```

This helps zero in on job listings where companies explicitly mention they're looking for candidates with your specified skills.

### Data Processing

For each job listing we find, we pull out the most important information:
- The exact job title
- A direct link to apply
- A snippet of the job description
- Which website it came from (LinkedIn, Indeed, etc.)

This gives you a clean, organized view of potential opportunities without the clutter.

### Integration Options

You can connect this API with your:
- Job board website
- Recruitment dashboard
- Automated job application scripts
- Career coaching tools



## Error Handling

The API uses easy-to-understand HTTP status codes:

- `200`: Everything worked!
- `400`: Something's wrong with your request (missing job title, etc.)
- `500`: Something went wrong on our end

Error messages are clear and helpful:

```json
{
  "error": "Missing required parameter: jobTitle is required"
}
```

### Common Issues

**No results found**
- Try broadening your job title (e.g., "developer" instead of "senior React developer")
- Make sure location isn't too specific (try "New York" instead of "Manhattan East Village")

**Spreadsheet creation fails**
- Double-check your Google Sheets API credentials
- Make sure your service account has permission to create new spreadsheets

## API Limitations

- Google Custom Search API has a limit of 100 free queries per day
- After that, you'll be charged per additional 1000 queries
- The Google Sheets API has generous usage limits but might throttle with extremely heavy usage

## Security Considerations

- Never commit your `.env` file to GitHub
- Consider adding API key authentication for production
- Always validate and sanitize input data

## Author

This project was created by Zaid Sayyed.
- GitHub: [Zaidusyy](https://github.com/Zaidusyy)
- LinkedIn: [Zaid Sayyed](https://www.linkedin.com/in/zaid-sayyed/)

Feel free to reach out with questions or feedback!

## Contributing

I welcome contributions! If you want to improve this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please message me before working on major changes.


---

Thanks for checking out my Lead Generation API Server! I built this to make finding job opportunities easier and more organized. Hope it helps with your job search or recruitment efforts!
