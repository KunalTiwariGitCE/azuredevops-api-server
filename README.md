# 🚀 Azure DevOps REST API Server for Microsoft Copilot Studio

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/template/https://github.com/KunalTiwariGitCE/azuredevops-api-server)
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/KunalTiwariGitCE/azuredevops-api-server)

A comprehensive REST API server that exposes all Azure DevOps operations for integration with Microsoft Copilot Studio and other applications.

## ✨ Features

- **Complete Azure DevOps Integration**: All operations from the Microsoft Azure DevOps MCP server
- **Microsoft Copilot Studio Ready**: Standard REST endpoints for custom connectors
- **Production Ready**: CORS, error handling, logging, health checks
- **Comprehensive Coverage**: Projects, work items, repositories, builds, releases, wikis, search

## 🌐 Live Demo

- **GitHub Repository**: `https://github.com/KunalTiwariGitCE/azuredevops-api-server`
- **API Base URL**: Deploy using one of the options below
- **Health Check**: `https://your-deployed-url/health`
- **API Documentation**: `https://your-deployed-url/api`

## 📡 Available Endpoints

### Core Domain
- `GET /api/projects` - List all projects
- `GET /api/projects/{project}/teams` - List teams in project
- `GET /api/projects/{project}` - Get project details

### Work Items Domain  
- `GET /api/projects/{project}/workitems` - List work items
- `GET /api/workitems/{id}` - Get work item details
- `POST /api/workitems` - Create work item
- `PUT /api/workitems/{id}` - Update work item

### Repository Domain
- `GET /api/projects/{project}/repositories` - List repositories
- `GET /api/repositories/{repo}/branches` - List branches
- `GET /api/repositories/{repo}/pullrequests` - List pull requests

### Build & Release Domain
- `GET /api/projects/{project}/builds` - List builds
- `GET /api/projects/{project}/pipelines` - List pipelines
- `GET /api/projects/{project}/releases` - List releases

### Wiki & Search Domain
- `GET /api/projects/{project}/wikis` - List wikis
- `GET /api/search/code` - Search code
- `GET /api/search/workitems` - Search work items

## 🚀 Quick Deploy

### Option 1: Railway (Recommended)
1. Click the Railway deploy button above
2. Set environment variable: `ADO_ORGANIZATION=your-org-name`
3. Deploy automatically

### Option 2: Render
1. Fork this repository
2. Connect to Render
3. Set build command: `npm run build`
4. Set start command: `npm start`

### Option 3: Heroku
1. Click the Heroku deploy button above
2. Set config vars for your Azure DevOps organization
3. Deploy

## 🛠️ Local Development

```bash
# Clone repository
git clone https://github.com/KunalTiwariGitCE/azuredevops-api-server.git
cd azuredevops-api-server

# Install dependencies
npm install

# Build
npm run build

# Start server
npm run start-comprehensive -- YourOrgName --port 8080
```

## 🔗 Microsoft Copilot Studio Integration

### Step 1: Create Custom Connector
1. Go to https://copilotstudio.microsoft.com
2. Navigate to **Data > Connectors > New connector**
3. Use the deployed API URL as the host

### Step 2: Configure Actions
Add these key actions to your connector:
- **ListProjects**: `GET /api/projects`
- **CreateWorkItem**: `POST /api/workitems`
- **ListWorkItems**: `GET /api/projects/{project}/workitems`
- **GetWorkItem**: `GET /api/workitems/{id}`

### Step 3: Create Copilot Topics
Example topics:
- "Show my projects" → Call ListProjects
- "Create work item" → Call CreateWorkItem
- "List tasks in [project]" → Call ListWorkItems

## ⚙️ Configuration

### Environment Variables
- `ADO_ORGANIZATION` - Your Azure DevOps organization name
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (production/development)

### Authentication
The server uses Azure CLI authentication by default. In production:
1. Set up Azure Managed Identity
2. Grant permissions to your Azure DevOps organization
3. Configure authentication in your deployment platform

## 📋 API Examples

### List Projects
```bash
curl https://your-api-url/api/projects
```

### Create Work Item
```bash
curl -X POST https://your-api-url/api/workitems \
  -H "Content-Type: application/json" \
  -d '{
    "project": "MyProject",
    "type": "Task",
    "title": "New task from API",
    "description": "Created via REST API"
  }'
```

### Get Work Item
```bash
curl https://your-api-url/api/workitems/123
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Copilot Studio │────│  REST API Server │────│  Azure DevOps   │
│  Custom Actions │    │  (This Project)  │    │  Organization   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Create an issue for bug reports
- Check the deployment guide for setup help
- Review the API documentation for usage examples

---

**Ready to supercharge your Azure DevOps workflow with AI? Deploy now and start building! 🚀**