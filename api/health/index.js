const { DefaultAzureCredential } = require('@azure/identity');

module.exports = async function (context, req) {
    context.log('Health check endpoint called');
    
    try {
        // Basic health check
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Azure DevOps API Server',
            version: '1.0.0',
            endpoints: {
                projects: '/api/projects',
                workitems: '/api/workitems',
                repositories: '/api/repositories',
                builds: '/api/builds',
                releases: '/api/releases'
            }
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: health
        };
    } catch (error) {
        context.log.error('Health check failed:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
};