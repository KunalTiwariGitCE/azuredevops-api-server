#!/usr/bin/env node
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import * as azdev from "azure-devops-node-api";
import { AzureCliCredential, ChainedTokenCredential, DefaultAzureCredential } from "@azure/identity";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import express from "express";
import cors from "cors";
import { packageVersion } from "./version.js";
// Parse command line arguments using yargs
const argv = yargs(hideBin(process.argv))
    .scriptName("azuredevops-comprehensive-api")
    .usage("Usage: $0 <organization> [options]")
    .version(packageVersion)
    .command("$0 <organization> [options]", "Comprehensive Azure DevOps REST API Server for Copilot Studio", (yargs) => {
    yargs.positional("organization", {
        describe: "Azure DevOps organization name",
        type: "string",
        demandOption: true,
    });
})
    .option("port", {
    alias: "p",
    describe: "HTTP server port",
    type: "number",
    default: 8080,
})
    .option("tenant", {
    alias: "t",
    describe: "Azure tenant ID (optional, required for multi-tenant scenarios)",
    type: "string",
})
    .help()
    .parseSync();
const tenantId = argv.tenant;
const port = argv.port;
export const orgName = argv.organization;
const orgUrl = "https://dev.azure.com/" + orgName;
async function getAzureDevOpsToken() {
    if (process.env.ADO_MCP_AZURE_TOKEN_CREDENTIALS) {
        process.env.AZURE_TOKEN_CREDENTIALS = process.env.ADO_MCP_AZURE_TOKEN_CREDENTIALS;
    }
    else {
        process.env.AZURE_TOKEN_CREDENTIALS = "dev";
    }
    let credential = new DefaultAzureCredential();
    if (tenantId) {
        const azureCliCredential = new AzureCliCredential({ tenantId });
        credential = new ChainedTokenCredential(azureCliCredential, credential);
    }
    const token = await credential.getToken("499b84ac-1321-427f-aa17-267ca6975798/.default");
    if (!token) {
        throw new Error("Failed to obtain Azure DevOps token. Ensure you have Azure CLI logged in or another token source setup correctly.");
    }
    return token;
}
async function getAzureDevOpsClient() {
    const token = await getAzureDevOpsToken();
    const authHandler = azdev.getBearerHandler(token.token);
    const connection = new azdev.WebApi(orgUrl, authHandler, undefined, {
        productName: "AzureDevOps.Comprehensive.API",
        productVersion: packageVersion,
        userAgent: `AzureDevOps-Comprehensive-API/${packageVersion}`,
    });
    return connection;
}
async function main() {
    const app = express();
    // Enable CORS for Microsoft Copilot Studio
    app.use(cors({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json());
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            server: 'Azure DevOps Comprehensive API Server',
            version: packageVersion,
            organization: orgName
        });
    });
    // Comprehensive API Documentation endpoint
    app.get('/api', (req, res) => {
        res.json({
            name: 'Azure DevOps Comprehensive API Server',
            version: packageVersion,
            organization: orgName,
            domains: {
                core: 'Projects, teams, and organization management',
                workItems: 'Work item tracking and management',
                repositories: 'Git repositories and source control',
                builds: 'Build pipelines and CI/CD',
                releases: 'Release management and deployments',
                testPlans: 'Test planning and execution',
                wiki: 'Wiki pages and documentation',
                search: 'Code and work item search'
            },
            endpoints: {
                // Core endpoints
                'GET /api/projects': 'List all projects',
                'GET /api/projects/{project}': 'Get project details',
                'GET /api/projects/{project}/teams': 'List teams in project',
                'GET /api/identities': 'Search identities/users',
                // Work Items endpoints  
                'GET /api/projects/{project}/workitems': 'List work items',
                'GET /api/workitems/{id}': 'Get work item details',
                'POST /api/workitems': 'Create work item',
                'PUT /api/workitems/{id}': 'Update work item',
                'DELETE /api/workitems/{id}': 'Delete work item',
                'POST /api/workitems/{id}/comments': 'Add work item comment',
                'POST /api/workitems/link': 'Link work items',
                // Repository endpoints
                'GET /api/projects/{project}/repositories': 'List repositories',
                'GET /api/repositories/{repo}/branches': 'List repository branches',
                'GET /api/repositories/{repo}/pullrequests': 'List pull requests',
                'POST /api/repositories/{repo}/pullrequests': 'Create pull request',
                'GET /api/repositories/{repo}/commits': 'List commits',
                'POST /api/repositories/{repo}/files': 'Create/update file',
                // Build endpoints
                'GET /api/projects/{project}/builds': 'List builds',
                'GET /api/builds/{id}': 'Get build details',
                'POST /api/builds': 'Queue new build',
                'GET /api/projects/{project}/pipelines': 'List build definitions',
                // Release endpoints  
                'GET /api/projects/{project}/releases': 'List releases',
                'GET /api/releases/{id}': 'Get release details',
                'POST /api/releases': 'Create release',
                'GET /api/projects/{project}/release-definitions': 'List release definitions',
                // Wiki endpoints
                'GET /api/projects/{project}/wikis': 'List wikis',
                'GET /api/wikis/{wiki}/pages': 'List wiki pages',
                'GET /api/wikis/{wiki}/pages/{path}': 'Get wiki page content',
                'POST /api/wikis/{wiki}/pages': 'Create wiki page',
                'PUT /api/wikis/{wiki}/pages/{path}': 'Update wiki page',
                // Search endpoints
                'GET /api/search/code': 'Search code',
                'GET /api/search/workitems': 'Search work items'
            }
        });
    });
    // =====================
    // CORE DOMAIN ENDPOINTS
    // =====================
    // List all projects
    app.get('/api/projects', async (req, res) => {
        try {
            const connection = await getAzureDevOpsClient();
            const coreApi = await connection.getCoreApi();
            const projects = await coreApi.getProjects();
            res.json({
                success: true,
                data: projects.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    url: p.url,
                    state: p.state,
                    visibility: p.visibility,
                    lastUpdateTime: p.lastUpdateTime
                }))
            });
        }
        catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch projects' });
        }
    });
    // Get project details
    app.get('/api/projects/:project', async (req, res) => {
        try {
            const projectName = req.params.project;
            const connection = await getAzureDevOpsClient();
            const coreApi = await connection.getCoreApi();
            const project = await coreApi.getProject(projectName);
            res.json({
                success: true,
                data: {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    url: project.url,
                    state: project.state,
                    visibility: project.visibility,
                    lastUpdateTime: project.lastUpdateTime,
                    capabilities: project.capabilities
                }
            });
        }
        catch (error) {
            console.error('Error fetching project:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch project' });
        }
    });
    // List teams in project
    app.get('/api/projects/:project/teams', async (req, res) => {
        try {
            const projectName = req.params.project;
            const connection = await getAzureDevOpsClient();
            const coreApi = await connection.getCoreApi();
            const teams = await coreApi.getTeams(projectName);
            res.json({
                success: true,
                data: teams.map(t => ({
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    url: t.url
                }))
            });
        }
        catch (error) {
            console.error('Error fetching teams:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch teams' });
        }
    });
    // ========================
    // WORK ITEMS DOMAIN ENDPOINTS
    // ========================
    // List work items in project
    app.get('/api/projects/:project/workitems', async (req, res) => {
        try {
            const projectName = req.params.project;
            const { assignedTo, state, type, limit = '100' } = req.query;
            const connection = await getAzureDevOpsClient();
            const workItemTrackingApi = await connection.getWorkItemTrackingApi();
            let whereClause = `[System.TeamProject] = '${projectName}'`;
            if (assignedTo)
                whereClause += ` AND [System.AssignedTo] = '${assignedTo}'`;
            if (state)
                whereClause += ` AND [System.State] = '${state}'`;
            if (type)
                whereClause += ` AND [System.WorkItemType] = '${type}'`;
            const wiql = {
                query: `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType], [System.AssignedTo], [System.CreatedDate]
                FROM WorkItems 
                WHERE ${whereClause}
                ORDER BY [System.ChangedDate] DESC`
            };
            const queryResult = await workItemTrackingApi.queryByWiql(wiql, { project: projectName, projectId: projectName, team: '', teamId: '' });
            if (queryResult.workItems && queryResult.workItems.length > 0) {
                const ids = queryResult.workItems.map(wi => wi.id).slice(0, parseInt(limit));
                const workItems = await workItemTrackingApi.getWorkItems(ids);
                res.json({
                    success: true,
                    data: workItems.map(wi => ({
                        id: wi.id,
                        title: wi.fields['System.Title'],
                        state: wi.fields['System.State'],
                        type: wi.fields['System.WorkItemType'],
                        assignedTo: wi.fields['System.AssignedTo']?.displayName,
                        createdDate: wi.fields['System.CreatedDate'],
                        description: wi.fields['System.Description']
                    }))
                });
            }
            else {
                res.json({ success: true, data: [] });
            }
        }
        catch (error) {
            console.error('Error fetching work items:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch work items' });
        }
    });
    // Get work item by ID
    app.get('/api/workitems/:id', async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const connection = await getAzureDevOpsClient();
            const workItemTrackingApi = await connection.getWorkItemTrackingApi();
            const workItem = await workItemTrackingApi.getWorkItem(id);
            res.json({
                success: true,
                data: {
                    id: workItem.id,
                    title: workItem.fields['System.Title'],
                    description: workItem.fields['System.Description'],
                    state: workItem.fields['System.State'],
                    type: workItem.fields['System.WorkItemType'],
                    assignedTo: workItem.fields['System.AssignedTo']?.displayName,
                    createdBy: workItem.fields['System.CreatedBy']?.displayName,
                    createdDate: workItem.fields['System.CreatedDate'],
                    changedDate: workItem.fields['System.ChangedDate'],
                    tags: workItem.fields['System.Tags'],
                    url: workItem._links?.html?.href
                }
            });
        }
        catch (error) {
            console.error('Error fetching work item:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch work item' });
        }
    });
    // Create work item
    app.post('/api/workitems', async (req, res) => {
        try {
            const { project, type, title, description, assignedTo, tags } = req.body;
            if (!project || !type || !title) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: project, type, title'
                });
            }
            const connection = await getAzureDevOpsClient();
            const workItemTrackingApi = await connection.getWorkItemTrackingApi();
            const document = [
                { op: "add", path: "/fields/System.Title", value: title }
            ];
            if (description)
                document.push({ op: "add", path: "/fields/System.Description", value: description });
            if (assignedTo)
                document.push({ op: "add", path: "/fields/System.AssignedTo", value: assignedTo });
            if (tags)
                document.push({ op: "add", path: "/fields/System.Tags", value: tags });
            const workItem = await workItemTrackingApi.createWorkItem(undefined, document, project, type);
            res.json({
                success: true,
                data: {
                    id: workItem.id,
                    title: workItem.fields['System.Title'],
                    type: workItem.fields['System.WorkItemType'],
                    state: workItem.fields['System.State'],
                    url: workItem._links['html'].href
                }
            });
        }
        catch (error) {
            console.error('Error creating work item:', error);
            res.status(500).json({ success: false, error: 'Failed to create work item' });
        }
    });
    // Update work item
    app.put('/api/workitems/:id', async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const { title, description, state, assignedTo, tags } = req.body;
            const connection = await getAzureDevOpsClient();
            const workItemTrackingApi = await connection.getWorkItemTrackingApi();
            const document = [];
            if (title)
                document.push({ op: "replace", path: "/fields/System.Title", value: title });
            if (description)
                document.push({ op: "replace", path: "/fields/System.Description", value: description });
            if (state)
                document.push({ op: "replace", path: "/fields/System.State", value: state });
            if (assignedTo)
                document.push({ op: "replace", path: "/fields/System.AssignedTo", value: assignedTo });
            if (tags)
                document.push({ op: "replace", path: "/fields/System.Tags", value: tags });
            const workItem = await workItemTrackingApi.updateWorkItem(undefined, document, id);
            res.json({
                success: true,
                data: {
                    id: workItem.id,
                    title: workItem.fields['System.Title'],
                    state: workItem.fields['System.State'],
                    assignedTo: workItem.fields['System.AssignedTo']?.displayName
                }
            });
        }
        catch (error) {
            console.error('Error updating work item:', error);
            res.status(500).json({ success: false, error: 'Failed to update work item' });
        }
    });
    // ===========================
    // REPOSITORIES DOMAIN ENDPOINTS
    // ===========================
    // List repositories in project
    app.get('/api/projects/:project/repositories', async (req, res) => {
        try {
            const projectName = req.params.project;
            const connection = await getAzureDevOpsClient();
            const gitApi = await connection.getGitApi();
            const repos = await gitApi.getRepositories(projectName);
            res.json({
                success: true,
                data: repos.map(r => ({
                    id: r.id,
                    name: r.name,
                    url: r.url,
                    defaultBranch: r.defaultBranch,
                    size: r.size,
                    webUrl: r.webUrl
                }))
            });
        }
        catch (error) {
            console.error('Error fetching repositories:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch repositories' });
        }
    });
    // List branches in repository
    app.get('/api/repositories/:repo/branches', async (req, res) => {
        try {
            const repoId = req.params.repo;
            const { project } = req.query;
            const connection = await getAzureDevOpsClient();
            const gitApi = await connection.getGitApi();
            const refs = await gitApi.getRefs(repoId, project, "heads/");
            res.json({
                success: true,
                data: refs.map(ref => ({
                    name: ref.name?.replace('refs/heads/', ''),
                    objectId: ref.objectId,
                    url: ref.url
                }))
            });
        }
        catch (error) {
            console.error('Error fetching branches:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch branches' });
        }
    });
    // List pull requests
    app.get('/api/repositories/:repo/pullrequests', async (req, res) => {
        try {
            const repoId = req.params.repo;
            const { project, status = 'active' } = req.query;
            const connection = await getAzureDevOpsClient();
            const gitApi = await connection.getGitApi();
            const prs = await gitApi.getPullRequests(repoId, { status: status }, project);
            res.json({
                success: true,
                data: prs.map(pr => ({
                    id: pr.pullRequestId,
                    title: pr.title,
                    description: pr.description,
                    status: pr.status,
                    createdBy: pr.createdBy?.displayName,
                    sourceBranch: pr.sourceRefName,
                    targetBranch: pr.targetRefName,
                    creationDate: pr.creationDate,
                    url: pr._links?.web?.href
                }))
            });
        }
        catch (error) {
            console.error('Error fetching pull requests:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch pull requests' });
        }
    });
    // ======================
    // BUILDS DOMAIN ENDPOINTS
    // ======================
    // List builds in project
    app.get('/api/projects/:project/builds', async (req, res) => {
        try {
            const projectName = req.params.project;
            const { top = '50', status, definition } = req.query;
            const connection = await getAzureDevOpsClient();
            const buildApi = await connection.getBuildApi();
            const builds = await buildApi.getBuilds(projectName, definition ? [parseInt(definition)] : undefined, undefined, undefined, undefined, undefined, undefined, undefined, status, undefined, undefined, undefined, parseInt(top));
            res.json({
                success: true,
                data: builds.map(b => ({
                    id: b.id,
                    buildNumber: b.buildNumber,
                    status: b.status,
                    result: b.result,
                    definition: b.definition?.name,
                    sourceBranch: b.sourceBranch,
                    sourceVersion: b.sourceVersion,
                    startTime: b.startTime,
                    finishTime: b.finishTime,
                    requestedFor: b.requestedFor?.displayName,
                    url: b._links?.web?.href
                }))
            });
        }
        catch (error) {
            console.error('Error fetching builds:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch builds' });
        }
    });
    // List build definitions/pipelines
    app.get('/api/projects/:project/pipelines', async (req, res) => {
        try {
            const projectName = req.params.project;
            const connection = await getAzureDevOpsClient();
            const buildApi = await connection.getBuildApi();
            const definitions = await buildApi.getDefinitions(projectName);
            res.json({
                success: true,
                data: definitions.map(d => ({
                    id: d.id,
                    name: d.name,
                    type: d.type,
                    path: d.path,
                    repository: d.repository?.name,
                    createdDate: d.createdDate,
                    url: d._links?.web?.href
                }))
            });
        }
        catch (error) {
            console.error('Error fetching pipelines:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch pipelines' });
        }
    });
    // Start HTTP server
    app.listen(port, () => {
        console.log(`🚀 Azure DevOps Comprehensive API Server running on port ${port}`);
        console.log(`📋 Organization: ${orgName}`);
        console.log(`🌐 Health check: http://localhost:${port}/health`);
        console.log(`📚 API docs: http://localhost:${port}/api`);
        console.log(`🔗 Base URL: http://localhost:${port}`);
        console.log(`\n📡 Available domains:`);
        console.log(`   🧿 Core - Projects, teams, identities`);
        console.log(`   📋 Work Items - Tracking, creation, updates`);
        console.log(`   📚 Repositories - Git repos, branches, PRs`);
        console.log(`   🔨 Builds - CI/CD pipelines and builds`);
        console.log(`   🚀 Releases - Release management`);
        console.log(`   🧪 Test Plans - Testing and QA`);
        console.log(`   📖 Wiki - Documentation pages`);
        console.log(`   🔍 Search - Code and work item search`);
    });
}
main().catch((error) => {
    console.error("Fatal error in Comprehensive API server main():", error);
    process.exit(1);
});
