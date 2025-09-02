const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('Health check endpoint called');
    
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Azure DevOps API Server',
        version: '1.0.0',
        endpoints: {
            projects: '/api/projects',
            workitems: '/api/workitems'
        }
    };

    res.json(health);
});

// List projects endpoint
app.get('/api/projects', (req, res) => {
    console.log('Projects endpoint called');
    
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

    res.json({
        success: true,
        data: projects,
        count: projects.length,
        message: "Mock data - Azure authentication will be configured in production"
    });
});

// Create work item endpoint
app.post('/api/workitems', (req, res) => {
    console.log('Create work item endpoint called');
    
    const { project, type, title, description } = req.body || {};
    
    if (!project || !type || !title) {
        return res.status(400).json({ 
            success: false, 
            error: 'Project, type, and title are required' 
        });
    }

    res.status(201).json({
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
    });
});

// Get work item endpoint
app.get('/api/workitems', (req, res) => {
    console.log('Get work item endpoint called');
    
    const workItemId = req.query.id;
    
    if (!workItemId) {
        return res.status(400).json({ 
            success: false, 
            error: 'Work item ID is required' 
        });
    }

    res.json({
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
    });
});

// Swagger endpoint
app.get('/api/swagger', (req, res) => {
    console.log('Swagger endpoint called');
    
    const swaggerSpec = {
        "swagger": "2.0",
        "info": {
            "title": "Azure DevOps API",
            "description": "Connect to Azure DevOps for project and work item operations",
            "version": "1.0"
        },
        "host": "azuredevops-api-live.azurewebsites.net",
        "basePath": "/api",
        "schemes": ["https"],
        "consumes": ["application/json"],
        "produces": ["application/json"],
        "paths": {
            "/health": {
                "get": {
                    "operationId": "HealthCheck",
                    "summary": "Health check",
                    "description": "Check if the API service is running",
                    "produces": ["application/json"],
                    "responses": {
                        "200": {
                            "description": "Service is healthy",
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "status": {"type": "string"},
                                    "timestamp": {"type": "string"},
                                    "service": {"type": "string"}
                                }
                            }
                        }
                    }
                }
            },
            "/projects": {
                "get": {
                    "operationId": "ListProjects",
                    "summary": "List all projects",
                    "description": "Get all Azure DevOps projects",
                    "produces": ["application/json"],
                    "responses": {
                        "200": {
                            "description": "List of projects retrieved successfully",
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "success": {"type": "boolean"},
                                    "data": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "id": {"type": "string"},
                                                "name": {"type": "string"},
                                                "description": {"type": "string"},
                                                "url": {"type": "string"},
                                                "state": {"type": "string"},
                                                "visibility": {"type": "string"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/workitems": {
                "post": {
                    "operationId": "CreateWorkItem",
                    "summary": "Create work item",
                    "description": "Create a new work item in Azure DevOps",
                    "consumes": ["application/json"],
                    "produces": ["application/json"],
                    "parameters": [
                        {
                            "name": "body",
                            "in": "body",
                            "required": true,
                            "schema": {
                                "type": "object",
                                "required": ["project", "type", "title"],
                                "properties": {
                                    "project": {"type": "string"},
                                    "type": {"type": "string"},
                                    "title": {"type": "string"},
                                    "description": {"type": "string"}
                                }
                            }
                        }
                    ],
                    "responses": {
                        "201": {
                            "description": "Work item created successfully",
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "success": {"type": "boolean"},
                                    "data": {
                                        "type": "object",
                                        "properties": {
                                            "id": {"type": "integer"},
                                            "title": {"type": "string"},
                                            "state": {"type": "string"},
                                            "url": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "get": {
                    "operationId": "GetWorkItem",
                    "summary": "Get work item",
                    "description": "Get work item by ID",
                    "produces": ["application/json"],
                    "parameters": [
                        {
                            "name": "id",
                            "in": "query",
                            "required": true,
                            "type": "integer"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Work item details retrieved successfully",
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "success": {"type": "boolean"},
                                    "data": {
                                        "type": "object",
                                        "properties": {
                                            "id": {"type": "integer"},
                                            "title": {"type": "string"},
                                            "description": {"type": "string"},
                                            "state": {"type": "string"},
                                            "assignedTo": {"type": "string"},
                                            "url": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    res.json(swaggerSpec);
});

// Root endpoint - serve the index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Azure DevOps API Server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
    console.log(`Projects: http://localhost:${port}/api/projects`);
    console.log(`Swagger: http://localhost:${port}/api/swagger`);
});

module.exports = app;