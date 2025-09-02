const axios = require('axios');

module.exports = async function (context, req) {
    context.log('Projects endpoint called');
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
        return;
    }
    
    try {
        // For now, return mock data to test deployment
        const projects = [
            {
                id: "12345678-1234-1234-1234-123456789012",
                name: "Sample Project",
                description: "A sample Azure DevOps project",
                url: "https://dev.azure.com/PwCD365CE/SampleProject",
                state: "wellFormed",
                visibility: "private",
                lastUpdateTime: new Date().toISOString()
            }
        ];

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: {
                success: true,
                data: projects,
                count: projects.length,
                message: "Mock data - Azure authentication will be configured in production"
            }
        };
    } catch (error) {
        context.log.error('Error fetching projects:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                error: error.message || 'Failed to fetch projects'
            }
        };
    }
};