const http = require('http');
const https = require('https');
const url = require('url');

const port = process.env.PORT || 8080;
const organization = 'PwCD365CE';

// Function to get Azure access token using Managed Identity
async function getAccessToken() {
    return new Promise((resolve, reject) => {
        console.log('Attempting to get access token from Managed Identity...');
        
        // Try Managed Identity endpoint with Azure DevOps resource
        const resource = encodeURIComponent('https://app.vssps.visualstudio.com');
        console.log(`Requesting token for resource: https://app.vssps.visualstudio.com`);
        const options = {
            hostname: '169.254.169.254',
            port: 80,
            path: `/metadata/identity/oauth2/token?api-version=2018-02-01&resource=${resource}`,
            method: 'GET',
            headers: {
                'Metadata': 'true'
            },
            timeout: 10000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Managed Identity response: ${res.statusCode}, data: ${data}`);
                if (res.statusCode === 200) {
                    try {
                        const token = JSON.parse(data);
                        console.log('Successfully got access token from Managed Identity');
                        resolve(token.access_token);
                    } catch (error) {
                        console.log('Failed to parse token response:', error.message);
                        reject(new Error('Failed to parse token response'));
                    }
                } else {
                    console.log(`Managed Identity failed with status ${res.statusCode}: ${data}`);
                    reject(new Error(`Managed Identity returned ${res.statusCode} - using mock data`));
                }
            });
        });

        req.on('error', (error) => {
            console.log('Managed Identity request error:', error.message);
            console.log('Trying alternative authentication methods...');
            tryAlternativeAuth(resolve, reject);
        });

        req.on('timeout', () => {
            console.log('Managed Identity request timeout');
            req.destroy();
            console.log('Trying alternative authentication methods...');
            tryAlternativeAuth(resolve, reject);
        });

        req.end();
    });
}

// Alternative authentication methods
function tryAlternativeAuth(resolve, reject) {
    // Check if MSI_ENDPOINT and MSI_SECRET are available (alternative managed identity method)
    const msiEndpoint = process.env.MSI_ENDPOINT;
    const msiSecret = process.env.MSI_SECRET;
    
    if (msiEndpoint && msiSecret) {
        console.log('Trying MSI_ENDPOINT authentication...');
        const msiUrl = new URL(msiEndpoint);
        const resource = encodeURIComponent('https://app.vssps.visualstudio.com');
        
        const options = {
            hostname: msiUrl.hostname,
            port: msiUrl.port || (msiUrl.protocol === 'https:' ? 443 : 80),
            path: `${msiUrl.pathname}?resource=${resource}&api-version=2017-09-01`,
            method: 'GET',
            headers: {
                'Secret': msiSecret
            }
        };

        const protocol = msiUrl.protocol === 'https:' ? https : http;
        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`MSI_ENDPOINT response: ${res.statusCode}, data: ${data}`);
                if (res.statusCode === 200) {
                    try {
                        const token = JSON.parse(data);
                        console.log('Successfully got access token from MSI_ENDPOINT');
                        resolve(token.access_token);
                        return;
                    } catch (error) {
                        console.log('Failed to parse MSI_ENDPOINT token response:', error.message);
                    }
                }
                reject(new Error('All authentication methods failed - using mock data'));
            });
        });

        req.on('error', (error) => {
            console.log('MSI_ENDPOINT request error:', error.message);
            reject(new Error('All authentication methods failed - using mock data'));
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('All authentication methods timed out - using mock data'));
        });

        req.end();
    } else {
        console.log('No alternative authentication methods available');
        reject(new Error('All authentication methods failed - using mock data'));
    }
}

// Function to make Azure DevOps API calls
async function callAzureDevOpsAPI(endpoint, accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'dev.azure.com',
            port: 443,
            path: `/${organization}/_apis/${endpoint}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Azure-DevOps-API-Server/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (error) {
                        reject(new Error('Failed to parse API response'));
                    }
                } else {
                    reject(new Error(`API call failed with status ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('API request timeout'));
        });

        req.end();
    });
}

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    console.log(`${new Date().toISOString()} - ${req.method} ${path}`);

    // Health check
    if (path === '/api/health') {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Azure DevOps API Server',
            version: '1.0.0'
        };
        res.writeHead(200);
        res.end(JSON.stringify(health));
        return;
    }

    // List projects
    if (path === '/api/projects' && req.method === 'GET') {
        // Try to get real data from Azure DevOps
        getAccessToken()
            .then(accessToken => {
                return callAzureDevOpsAPI('projects?api-version=7.1-preview.4', accessToken);
            })
            .then(apiResponse => {
                // Transform real Azure DevOps data
                const projects = apiResponse.value.map(project => ({
                    id: project.id,
                    name: project.name,
                    description: project.description || `Azure DevOps project in ${organization}`,
                    url: project.url,
                    state: project.state,
                    visibility: project.visibility,
                    lastUpdateTime: project.lastUpdateTime
                }));

                const response = {
                    success: true,
                    data: projects,
                    count: projects.length,
                    message: `Real data from ${organization} organization`
                };

                console.log(`Returned ${projects.length} real projects from ${organization}`);
                res.writeHead(200);
                res.end(JSON.stringify(response));
            })
            .catch(error => {
                // Fallback to mock data if authentication fails
                console.log('Using mock data:', error.message);
                
                const mockProjects = [
                    {
                        id: "12345678-1234-1234-1234-123456789012",
                        name: "NHG (Mock)",
                        description: "Mock project - Azure authentication needed for real data",
                        url: `https://dev.azure.com/${organization}/NHG`,
                        state: "wellFormed",
                        visibility: "private",
                        lastUpdateTime: new Date().toISOString()
                    }
                ];

                const response = {
                    success: true,
                    data: mockProjects,
                    count: mockProjects.length,
                    message: `Mock data - ${error.message}. Need to configure Managed Identity for real data.`
                };

                res.writeHead(200);
                res.end(JSON.stringify(response));
            });
        return;
    }

    // Create work item
    if (path === '/api/workitems' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const response = {
                    success: true,
                    data: {
                        id: 12345,
                        title: data.title || 'Sample Work Item',
                        state: 'New',
                        assignedTo: 'user@example.com',
                        createdDate: new Date().toISOString(),
                        url: `https://dev.azure.com/PwCD365CE/${data.project || 'Project'}/_workitems/edit/12345`
                    },
                    message: "Mock data - work item created successfully!"
                };
                res.writeHead(201);
                res.end(JSON.stringify(response));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // Get work item
    if (path === '/api/workitems' && req.method === 'GET') {
        const workItemId = parsedUrl.query.id;
        if (!workItemId) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'Work item ID required' }));
            return;
        }

        const response = {
            success: true,
            data: {
                id: parseInt(workItemId),
                title: 'Sample Work Item',
                description: 'This is a sample work item for testing',
                state: 'Active',
                assignedTo: 'user@example.com',
                createdDate: '2024-01-01T10:00:00Z',
                changedDate: new Date().toISOString(),
                url: `https://dev.azure.com/PwCD365CE/Project/_workitems/edit/${workItemId}`
            },
            message: "Mock data - work item retrieved successfully!"
        };

        res.writeHead(200);
        res.end(JSON.stringify(response));
        return;
    }

    // Root path - simple HTML page
    if (path === '/') {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Azure DevOps API Server</title>
</head>
<body>
    <h1>🚀 Azure DevOps API Server</h1>
    <p><strong>Status:</strong> ✅ Running successfully!</p>
    <h2>Available Endpoints:</h2>
    <ul>
        <li><a href="/api/health">/api/health</a> - Health check</li>
        <li><a href="/api/projects">/api/projects</a> - List projects</li>
        <li>/api/workitems - Work item operations</li>
    </ul>
    <p>Ready for Microsoft Copilot Studio integration!</p>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(html);
        return;
    }

    // Not found
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', path: path }));
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health: http://localhost:${port}/api/health`);
    console.log(`Projects: http://localhost:${port}/api/projects`);
});

// Handle server errors
server.on('error', (err) => {
    console.error('Server error:', err);
});

module.exports = server;