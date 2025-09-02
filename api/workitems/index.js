const axios = require('axios');

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
        if (req.method === 'POST') {
            // Create work item - mock response
            const { project, type, title, description } = req.body || {};
            
            if (!project || !type || !title) {
                context.res = {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: { success: false, error: 'Project, type, and title are required' }
                };
                return;
            }

            context.res = {
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: true,
                    data: {
                        id: 12345,
                        title: title,
                        state: 'New',
                        assignedTo: 'user@example.com',
                        createdDate: new Date().toISOString(),
                        url: `https://dev.azure.com/PwCD365CE/${project}/_workitems/edit/12345`
                    },
                    message: "Mock data - Azure authentication will be configured in production"
                }
            };
        } else {
            // Get work item by ID - mock response
            const workItemId = req.query.id;
            
            if (!workItemId) {
                context.res = {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: { success: false, error: 'Work item ID is required' }
                };
                return;
            }

            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
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
                    message: "Mock data - Azure authentication will be configured in production"
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
                error: error.message || 'Work item operation failed'
            }
        };
    }
};