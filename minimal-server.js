const http = require('http');
const url = require('url');

const port = process.env.PORT || 8080;

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
        const projects = [
            {
                id: "12345678-1234-1234-1234-123456789012",
                name: "Sample Project",
                description: "A sample Azure DevOps project for testing",
                url: "https://dev.azure.com/PwCD365CE/SampleProject",
                state: "wellFormed",
                visibility: "private",
                lastUpdateTime: new Date().toISOString()
            }
        ];

        const response = {
            success: true,
            data: projects,
            count: projects.length,
            message: "Mock data - deployment successful!"
        };

        res.writeHead(200);
        res.end(JSON.stringify(response));
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