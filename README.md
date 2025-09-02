# 🚀 Azure DevOps API Server for Microsoft Copilot Studio

A production-ready REST API server that integrates Azure DevOps with Microsoft Copilot Studio, enabling natural language interaction with your DevOps workflows.

## 🌐 Live Production Server

- **Base URL**: `https://azuredevops-api-live.azurewebsites.net`
- **Organization**: `PwCD365CE`
- **Project**: `NHG`
- **Status**: ✅ Active and monitored

## ✨ Verified Working Features

### 1. **List Projects** - `GET /api/projects`
- Returns all Azure DevOps projects in your organization
- Includes project ID, name, description, and URLs
- **Real data** from live Azure DevOps instance

### 2. **Create Work Item** - `POST /api/workitems`
- Create Tasks, Bugs, User Stories, Features
- **Returns real Azure DevOps URLs** for created items
- Supports rich descriptions and metadata

### 3. **Get Work Item** - `GET /api/workitems?id={id}`
- Retrieve complete work item details
- Real-time data synchronization
- Full work item history and status

### 4. **Health Check** - `GET /api/health`
- Monitor API server status and version
- Service uptime and performance metrics

## 🎯 Microsoft Copilot Studio Integration

### Quick Setup
1. **Import the Custom Connector**:
   - Use `azure-devops-working-swagger.json` from this repository
   - Base URL: `https://azuredevops-api-live.azurewebsites.net`

2. **Available Actions in Copilot**:
   - ✅ **ListProjects**
   - ✅ **CreateWorkItem** 
   - ✅ **GetWorkItem**
   - ✅ **HealthCheck**

3. **Natural Language Examples**:
   - *"List all my Azure DevOps projects"*
   - *"Create a bug called 'Login issue' in the NHG project"*
   - *"Get details for work item 148"*
   - *"Show me project information"*

## 📋 Live API Examples

### List Projects
```bash
curl https://azuredevops-api-live.azurewebsites.net/api/projects
```
**Response**: Real projects from PwCD365CE organization

### Create Work Item
```bash
curl -X POST https://azuredevops-api-live.azurewebsites.net/api/workitems \
  -H "Content-Type: application/json" \
  -d '{
    "project": "NHG",
    "type": "Task",
    "title": "API Integration Test",
    "description": "Testing Azure DevOps API integration"
  }'
```
**Response**: Real Azure DevOps work item with clickable URL

### Get Work Item
```bash
curl "https://azuredevops-api-live.azurewebsites.net/api/workitems?id=148"
```
**Response**: Complete work item details with current status

## 🏗️ Technical Architecture

### System Components
```
┌─────────────────────┐    ┌─────────────────────┐    ┌───────────────────┐
│   Copilot Studio    │────│   Azure App Service │────│   Azure DevOps    │
│   Custom Connector  │    │   REST API Server   │    │   Organization    │
│   Natural Language  │    │   Managed Identity  │    │   PwCD365CE/NHG   │
└─────────────────────┘    └─────────────────────┘    └───────────────────┘
```

### Core Technologies
1. **Node.js HTTP Server** (`minimal-server.js`)
   - Pure Node.js implementation (zero dependencies)
   - Request routing and processing
   - Real Azure DevOps API integration

2. **Azure Managed Identity Authentication**
   - Automatic token management
   - No stored credentials
   - Secure service-to-service authentication

3. **OpenAPI/Swagger Integration**
   - Custom connector definition for Copilot Studio
   - Structured API documentation
   - Parameter validation and types

### Authentication Flow
```
User Request → Copilot Studio → Custom Connector → Azure App Service → 
Managed Identity → Azure DevOps API → Response → User
```

### Data Flow
- **Inbound**: Natural language → Copilot actions → REST endpoints
- **Processing**: Parameter validation → API calls → Response formatting  
- **Outbound**: Real Azure DevOps data → JSON responses → Natural language

## 📁 Clean Repository Structure

```
azuredevops-api-server/
├── minimal-server.js                      # Main API server (core functionality)
├── package.json                           # Node.js project configuration
├── azure-devops-working-swagger.json      # Copilot Studio connector definition
├── README.md                              # This documentation
├── DEPLOYMENT_GUIDE.md                    # Azure deployment instructions  
├── COPILOT_STUDIO_INTEGRATION.md          # Integration setup guide
├── LICENSE.md                             # MIT license
└── .github/workflows/                     # CI/CD automation
    └── azure-deploy.yml                   # Auto-deployment to Azure
```

## 🔐 Security & Production Features

- ✅ **HTTPS Only**: All communications encrypted
- ✅ **Managed Identity**: No credential storage
- ✅ **CORS Enabled**: Cross-origin request support  
- ✅ **Input Validation**: Parameter sanitization
- ✅ **Error Handling**: Graceful failure responses
- ✅ **Request Logging**: Comprehensive monitoring
- ✅ **Health Monitoring**: Service status endpoints

## 🚀 Deployment Status

- **Environment**: Azure App Service (Production)
- **Region**: West US 2
- **Runtime**: Node.js 20 LTS
- **Auto-Scale**: Enabled
- **Monitoring**: Application Insights
- **CI/CD**: GitHub Actions
- **Uptime**: 99.9% availability target

## 💡 Key Benefits

1. **Zero Configuration**: Works immediately after deployment
2. **Real Data Integration**: Live Azure DevOps synchronization
3. **Natural Language Interface**: Conversational DevOps workflows
4. **Production Ready**: Enterprise-grade security and monitoring
5. **Cost Effective**: Minimal resource requirements
6. **Extensible**: Easy to add new endpoints and features

---

**🎯 Result: A complete bridge between Microsoft Copilot Studio and Azure DevOps, enabling powerful conversational DevOps workflows with real project data.**