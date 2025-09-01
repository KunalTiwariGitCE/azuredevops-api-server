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
    .scriptName("azuredevops-rest-api")
    .usage("Usage: $0 <organization> [options]")
    .version(packageVersion)
    .command("$0 <organization> [options]", "Azure DevOps REST API Server for Copilot Studio", (yargs) => {
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
        productName: "AzureDevOps.REST.API",
        productVersion: packageVersion,
        userAgent: `AzureDevOps-REST-API/${packageVersion}`,
    });
    return connection;
}
async function main() {
    const app = express();
    // Enable CORS for Microsoft Copilot Studio
    app.use(cors({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json());
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            server: 'Azure DevOps REST API Server',
            version: packageVersion,
            organization: orgName
        });
    });
    // API Documentation endpoint
    app.get('/api', (req, res) => {
        res.json({
            name: 'Azure DevOps REST API Server',
            version: packageVersion,
            organization: orgName,
            endpoints: {
                '/health': 'GET - Health check',
                '/api/projects': 'GET - List all projects',
                '/api/projects/{project}/teams': 'GET - List teams in a project',
                '/api/projects/{project}/workitems': 'GET - List work items in a project',
                '/api/projects/{project}/repositories': 'GET - List repositories in a project',
                '/api/projects/{project}/builds': 'GET - List builds in a project',
                '/api/projects/{project}/releases': 'GET - List releases in a project',
                '/api/workitems': 'POST - Create a work item',
                '/api/workitems/{id}': 'GET - Get work item by ID, PUT - Update work item'
            }
        });
    });
    // Projects endpoints
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
                    visibility: p.visibility
                }))
            });
        }
        catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch projects' });
        }
    });
    // Teams in project
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
    // Work items in project
    app.get('/api/projects/:project/workitems', async (req, res) => {
        try {
            const projectName = req.params.project;
            const connection = await getAzureDevOpsClient();
            const workItemTrackingApi = await connection.getWorkItemTrackingApi();
            // Query for work items
            const wiql = {
                query: `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] 
                FROM WorkItems 
                WHERE [System.TeamProject] = '${projectName}' 
                ORDER BY [System.ChangedDate] DESC`
            };
            const queryResult = await workItemTrackingApi.queryByWiql(wiql, { project: projectName, projectId: projectName, team: '', teamId: '' });
            if (queryResult.workItems && queryResult.workItems.length > 0) {
                const ids = queryResult.workItems.map(wi => wi.id).slice(0, 100); // Limit to first 100
                const workItems = await workItemTrackingApi.getWorkItems(ids);
                res.json({
                    success: true,
                    data: workItems.map(wi => ({
                        id: wi.id,
                        title: wi.fields['System.Title'],
                        state: wi.fields['System.State'],
                        type: wi.fields['System.WorkItemType'],
                        assignedTo: wi.fields['System.AssignedTo'],
                        createdDate: wi.fields['System.CreatedDate']
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
    // Repositories in project
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
                    size: r.size
                }))
            });
        }
        catch (error) {
            console.error('Error fetching repositories:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch repositories' });
        }
    });
    // Builds in project
    app.get('/api/projects/:project/builds', async (req, res) => {
        try {
            const projectName = req.params.project;
            const connection = await getAzureDevOpsClient();
            const buildApi = await connection.getBuildApi();
            const builds = await buildApi.getBuilds(projectName, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 10);
            res.json({
                success: true,
                data: builds.map(b => ({
                    id: b.id,
                    buildNumber: b.buildNumber,
                    status: b.status,
                    result: b.result,
                    definition: b.definition?.name,
                    startTime: b.startTime,
                    finishTime: b.finishTime
                }))
            });
        }
        catch (error) {
            console.error('Error fetching builds:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch builds' });
        }
    });
    // Create work item
    app.post('/api/workitems', async (req, res) => {
        try {
            const { project, type, title, description } = req.body;
            if (!project || !type || !title) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: project, type, title'
                });
            }
            const connection = await getAzureDevOpsClient();
            const workItemTrackingApi = await connection.getWorkItemTrackingApi();
            const document = [
                {
                    op: "add",
                    path: "/fields/System.Title",
                    value: title
                }
            ];
            if (description) {
                document.push({
                    op: "add",
                    path: "/fields/System.Description",
                    value: description
                });
            }
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
                    assignedTo: workItem.fields['System.AssignedTo'],
                    createdDate: workItem.fields['System.CreatedDate'],
                    changedDate: workItem.fields['System.ChangedDate']
                }
            });
        }
        catch (error) {
            console.error('Error fetching work item:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch work item' });
        }
    });
    // Start HTTP server
    app.listen(port, () => {
        console.log(`🚀 Azure DevOps REST API Server running on port ${port}`);
        console.log(`📋 Organization: ${orgName}`);
        console.log(`🌐 Health check: http://localhost:${port}/health`);
        console.log(`📚 API docs: http://localhost:${port}/api`);
        console.log(`🔗 Base URL: http://localhost:${port}`);
        console.log(`\n📡 Available endpoints:`);
        console.log(`   GET  /health - Health check`);
        console.log(`   GET  /api - API documentation`);
        console.log(`   GET  /api/projects - List projects`);
        console.log(`   GET  /api/projects/{project}/teams - List teams`);
        console.log(`   GET  /api/projects/{project}/workitems - List work items`);
        console.log(`   GET  /api/projects/{project}/repositories - List repositories`);
        console.log(`   GET  /api/projects/{project}/builds - List builds`);
        console.log(`   POST /api/workitems - Create work item`);
        console.log(`   GET  /api/workitems/{id} - Get work item by ID`);
    });
}
main().catch((error) => {
    console.error("Fatal error in REST API server main():", error);
    process.exit(1);
});
