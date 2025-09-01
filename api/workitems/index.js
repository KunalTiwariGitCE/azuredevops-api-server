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
    context.log('Work Items endpoint called');
    
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

        if (req.method === 'POST') {
            // Create work item
            const { project, type, title, description } = req.body;
            
            if (!project || !type || !title) {
                context.res = {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: { success: false, error: 'Project, type, and title are required' }
                };
                return;
            }

            const workItemData = [
                { op: 'add', path: '/fields/System.Title', value: title }
            ];
            
            if (description) {
                workItemData.push({ op: 'add', path: '/fields/System.Description', value: description });
            }

            const response = await axios.post(
                `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$${type}?api-version=7.1-preview.3`,
                workItemData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json-patch+json'
                    }
                }
            );

            context.res = {
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: true,
                    data: {
                        id: response.data.id,
                        title: response.data.fields['System.Title'],
                        state: response.data.fields['System.State'],
                        assignedTo: response.data.fields['System.AssignedTo']?.displayName,
                        createdDate: response.data.fields['System.CreatedDate'],
                        url: response.data._links.html.href
                    }
                }
            };
        } else {
            // Get work item by ID
            const workItemId = context.bindingData.id || req.query.id;
            
            if (!workItemId) {
                context.res = {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: { success: false, error: 'Work item ID is required' }
                };
                return;
            }

            const response = await axios.get(
                `https://dev.azure.com/${organization}/_apis/wit/workitems/${workItemId}?api-version=7.1-preview.3`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: true,
                    data: {
                        id: response.data.id,
                        title: response.data.fields['System.Title'],
                        description: response.data.fields['System.Description'],
                        state: response.data.fields['System.State'],
                        assignedTo: response.data.fields['System.AssignedTo']?.displayName,
                        createdDate: response.data.fields['System.CreatedDate'],
                        changedDate: response.data.fields['System.ChangedDate'],
                        url: response.data._links.html.href
                    }
                }
            };
        }
    } catch (error) {
        context.log.error('Error with work items:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                error: error.response?.data?.message || error.message || 'Work item operation failed'
            }
        };
    }
};