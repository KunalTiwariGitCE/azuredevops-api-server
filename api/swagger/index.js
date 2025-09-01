const fs = require('fs');
const path = require('path');

module.exports = async function (context, req) {
    context.log('Swagger endpoint called');
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
        return;
    }
    
    try {
        // Return the complete swagger specification with all required responses
        const swaggerSpec = {
            "swagger": "2.0",
            "info": {
                "title": "Azure DevOps API",
                "description": "Connect to Azure DevOps for project and work item operations",
                "version": "1.0"
            },
            "host": "calm-pond-0d73b6c0f.2.azurestaticapps.net",
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
                            },
                            "500": {
                                "description": "Service is unhealthy",
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "status": {"type": "string"},
                                        "error": {"type": "string"}
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
                                        },
                                        "count": {"type": "integer"}
                                    }
                                }
                            },
                            "500": {
                                "description": "Failed to fetch projects",
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "error": {"type": "string"}
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
                        "parameters": [
                            {
                                "name": "body",
                                "in": "body",
                                "required": true,
                                "schema": {
                                    "type": "object",
                                    "required": ["project", "type", "title"],
                                    "properties": {
                                        "project": {
                                            "type": "string",
                                            "description": "Project name"
                                        },
                                        "type": {
                                            "type": "string",
                                            "description": "Work item type",
                                            "enum": ["Task", "Bug", "User Story", "Feature"]
                                        },
                                        "title": {
                                            "type": "string",
                                            "description": "Work item title"
                                        },
                                        "description": {
                                            "type": "string",
                                            "description": "Work item description"
                                        }
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
                            },
                            "400": {
                                "description": "Bad request - missing required fields",
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "error": {"type": "string"}
                                    }
                                }
                            },
                            "500": {
                                "description": "Failed to create work item",
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "error": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "get": {
                        "operationId": "GetWorkItem",
                        "summary": "Get work item",
                        "description": "Get work item by ID",
                        "parameters": [
                            {
                                "name": "id",
                                "in": "query",
                                "required": true,
                                "type": "integer",
                                "description": "Work item ID"
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
                                                "createdDate": {"type": "string"},
                                                "url": {"type": "string"}
                                            }
                                        }
                                    }
                                }
                            },
                            "400": {
                                "description": "Bad request - work item ID is required",
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "error": {"type": "string"}
                                    }
                                }
                            },
                            "500": {
                                "description": "Failed to retrieve work item",
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "error": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "definitions": {},
            "parameters": {},
            "responses": {},
            "securityDefinitions": {},
            "security": [],
            "tags": []
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: swaggerSpec
        };
    } catch (error) {
        context.log.error('Error serving swagger spec:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                error: error.message || 'Failed to load API specification'
            }
        };
    }
};