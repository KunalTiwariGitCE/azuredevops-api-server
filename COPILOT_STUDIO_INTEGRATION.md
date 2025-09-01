# Azure DevOps REST API Server for Microsoft Copilot Studio

This document explains how to connect the Azure DevOps REST API Server to Microsoft Copilot Studio.

## 🚀 Server Status

✅ **Azure DevOps REST API Server is running successfully**

- **Server URL**: `http://localhost:8082`
- **Organization**: `PwCD365CE`
- **Status**: Active and responding
- **Version**: 2.0.0

## 📡 Available API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api` - API documentation

### Project Management
- `GET /api/projects` - List all projects in the organization
- `GET /api/projects/{project}/teams` - List teams in a specific project
- `GET /api/projects/{project}/repositories` - List repositories in a project
- `GET /api/projects/{project}/builds` - List builds in a project

### Work Item Management
- `GET /api/projects/{project}/workitems` - List work items in a project
- `GET /api/workitems/{id}` - Get specific work item by ID
- `POST /api/workitems` - Create a new work item

### Example API Responses

#### Health Check
```bash
curl http://localhost:8082/health
```
Response:
```json
{
  "status": "healthy",
  "server": "Azure DevOps REST API Server", 
  "version": "2.0.0",
  "organization": "PwCD365CE"
}
```

#### API Documentation
```bash
curl http://localhost:8082/api
```
Response:
```json
{
  "name": "Azure DevOps REST API Server",
  "version": "2.0.0", 
  "organization": "PwCD365CE",
  "endpoints": {
    "/health": "GET - Health check",
    "/api/projects": "GET - List all projects",
    "/api/projects/{project}/teams": "GET - List teams in a project",
    "/api/projects/{project}/workitems": "GET - List work items in a project",
    "/api/projects/{project}/repositories": "GET - List repositories in a project",
    "/api/projects/{project}/builds": "GET - List builds in a project",
    "/api/workitems": "POST - Create a work item",
    "/api/workitems/{id}": "GET - Get work item by ID"
  }
}
```

## 🔗 Microsoft Copilot Studio Integration

### Step 1: Create Custom Connector in Copilot Studio

1. **Open Microsoft Copilot Studio**
   - Navigate to https://copilotstudio.microsoft.com
   - Select your environment

2. **Create a New Custom Connector**
   - Go to **Data** > **Custom connectors**
   - Click **+ New custom connector**
   - Choose **Create from blank**

3. **Configure General Settings**
   - **Connector name**: `Azure DevOps API`
   - **Description**: `Connect to Azure DevOps for project management`
   - **Host**: `localhost:8082` (or your server URL)
   - **Base URL**: `/api`

### Step 2: Define API Actions

#### Action 1: List Projects
- **Operation ID**: `ListProjects`
- **Summary**: `Get all Azure DevOps projects`
- **Request**:
  - Method: `GET`
  - URL: `/projects`
- **Response**: Returns array of projects

#### Action 2: List Work Items
- **Operation ID**: `ListWorkItems`
- **Summary**: `Get work items for a project`
- **Request**:
  - Method: `GET`
  - URL: `/projects/{project}/workitems`
  - Parameters:
    - `project` (path, required): Project name
- **Response**: Returns array of work items

#### Action 3: Create Work Item
- **Operation ID**: `CreateWorkItem`
- **Summary**: `Create a new work item`
- **Request**:
  - Method: `POST`
  - URL: `/workitems`
  - Body:
    ```json
    {
      "project": "string",
      "type": "string", 
      "title": "string",
      "description": "string"
    }
    ```
- **Response**: Returns created work item details

### Step 3: Configure Authentication

Since the server runs locally with Azure CLI authentication:
1. **Authentication type**: None (for local development)
2. For production deployment, configure OAuth 2.0 with Azure AD

### Step 4: Test the Connection

1. **Test the connector** in Copilot Studio
2. **Create test flows** using the actions
3. **Verify responses** match expected format

### Step 5: Create Copilot Actions

#### Example Action: "List My Projects"
```
Trigger: "Show me my Azure DevOps projects"
Action: Call ListProjects API
Response: Display project names and descriptions
```

#### Example Action: "Create Work Item"  
```
Trigger: "Create a work item for [project]"
Action: Collect title and description, call CreateWorkItem API
Response: Confirm work item creation with ID
```

## 🔧 Server Management

### Starting the Server
```bash
cd AzureDevOpsMCPServer
node dist/rest-api-server.js PwCD365CE --port 8082
```

### Stopping the Server
```bash
# Find the process
ps aux | grep rest-api-server

# Kill the process
kill <process_id>
```

### Server Logs
Check `server.log` for detailed output and error messages.

## 🛠️ Troubleshooting

### Authentication Issues
- Ensure Azure CLI is logged in: `az login`
- Verify access to Azure DevOps organization
- Check that organization name is correct: `PwCD365CE`

### Connection Issues
- Verify server is running: `curl http://localhost:8082/health`
- Check firewall settings
- Ensure port 8082 is not blocked

### API Response Issues
- Check server logs for errors
- Verify Azure DevOps permissions
- Test endpoints individually with curl

## 📚 Additional Resources

- [Microsoft Copilot Studio Custom Connectors](https://docs.microsoft.com/en-us/power-platform/guidance/coe/copilot-studio-custom-connectors)
- [Azure DevOps REST API Documentation](https://docs.microsoft.com/en-us/rest/api/azure/devops/)
- [Power Platform Connectors](https://docs.microsoft.com/en-us/connectors/)

## 🎯 Next Steps

1. ✅ Server is running and ready
2. 🔄 Create custom connector in Copilot Studio
3. 🔄 Configure API actions  
4. 🔄 Test connection and responses
5. 🔄 Create Copilot topics using the actions
6. 🔄 Deploy to production environment (optional)

The Azure DevOps REST API server is ready for integration with Microsoft Copilot Studio!