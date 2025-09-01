const axios = require('axios');
const { DefaultAzureCredential } = require('@azure/identity');

async function getAccessToken() {
    try {
        const credential = new DefaultAzureCredential();
        const tokenResponse = await credential.getToken('https://app.vssps.visualstudio.com/.default');
        return tokenResponse.token;
    } catch (error) {
        throw new Error(`Authentication failed: ${error.message}`);
    }
}

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
        const organization = 'PwCD365CE';
        const accessToken = await getAccessToken();
        
        const response = await axios.get(
            `https://dev.azure.com/${organization}/_apis/projects?api-version=7.1-preview.4`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const projects = response.data.value.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            url: project.url,
            state: project.state,
            visibility: project.visibility,
            lastUpdateTime: project.lastUpdateTime
        }));

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
                count: projects.length
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