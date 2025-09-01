#!/usr/bin/env node
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import * as azdev from "azure-devops-node-api";
import { AzureCliCredential, ChainedTokenCredential, DefaultAzureCredential } from "@azure/identity";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import express from "express";
import cors from "cors";
import { configurePrompts } from "./prompts.js";
import { configureAllTools } from "./tools.js";
import { UserAgentComposer } from "./useragent.js";
import { packageVersion } from "./version.js";
import { DomainsManager } from "./shared/domains.js";
// Parse command line arguments using yargs
const argv = yargs(hideBin(process.argv))
    .scriptName("mcp-http-server-azuredevops")
    .usage("Usage: $0 <organization> [options]")
    .version(packageVersion)
    .command("$0 <organization> [options]", "Azure DevOps MCP HTTP Server", (yargs) => {
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
    .option("domains", {
    alias: "d",
    describe: "Domain(s) to enable: 'all' for everything, or specific domains like 'repositories builds work'. Defaults to 'all'.",
    type: "string",
    array: true,
    default: "all",
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
const domainsManager = new DomainsManager(argv.domains);
export const enabledDomains = domainsManager.getEnabledDomains();
async function getAzureDevOpsToken() {
    if (process.env.ADO_MCP_AZURE_TOKEN_CREDENTIALS) {
        process.env.AZURE_TOKEN_CREDENTIALS = process.env.ADO_MCP_AZURE_TOKEN_CREDENTIALS;
    }
    else {
        process.env.AZURE_TOKEN_CREDENTIALS = "dev";
    }
    let credential = new DefaultAzureCredential(); // CodeQL [SM05138] resolved by explicitly setting AZURE_TOKEN_CREDENTIALS
    if (tenantId) {
        // Use Azure CLI credential if tenantId is provided for multi-tenant scenarios
        const azureCliCredential = new AzureCliCredential({ tenantId });
        credential = new ChainedTokenCredential(azureCliCredential, credential);
    }
    const token = await credential.getToken("499b84ac-1321-427f-aa17-267ca6975798/.default");
    if (!token) {
        throw new Error("Failed to obtain Azure DevOps token. Ensure you have Azure CLI logged in or another token source setup correctly.");
    }
    return token;
}
function getAzureDevOpsClient(userAgentComposer) {
    return async () => {
        const token = await getAzureDevOpsToken();
        const authHandler = azdev.getBearerHandler(token.token);
        const connection = new azdev.WebApi(orgUrl, authHandler, undefined, {
            productName: "AzureDevOps.MCP.HTTP",
            productVersion: packageVersion,
            userAgent: userAgentComposer.userAgent,
        });
        return connection;
    };
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
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            server: 'Azure DevOps MCP HTTP Server',
            version: packageVersion,
            organization: orgName,
            enabledDomains: enabledDomains
        });
    });
    // MCP Server setup
    const server = new McpServer({
        name: "Azure DevOps MCP HTTP Server",
        version: packageVersion,
    });
    const userAgentComposer = new UserAgentComposer(packageVersion);
    server.server.oninitialized = () => {
        userAgentComposer.appendMcpClientInfo(server.server.getClientVersion());
    };
    configurePrompts(server);
    configureAllTools(server, getAzureDevOpsToken, getAzureDevOpsClient(userAgentComposer), () => userAgentComposer.userAgent, enabledDomains);
    // SSE endpoint for MCP communication
    app.get('/sse', async (req, res) => {
        console.log('SSE connection established');
        const transport = new SSEServerTransport('/message', res);
        await server.connect(transport);
    });
    // Handle MCP messages via POST
    app.use(express.json());
    app.post('/message', async (req, res) => {
        try {
            // This would need to be implemented based on MCP protocol
            // For now, return a simple response
            res.json({
                message: "MCP HTTP endpoint - use SSE for full MCP protocol support",
                server: "Azure DevOps MCP HTTP Server",
                version: packageVersion
            });
        }
        catch (error) {
            console.error('Error handling message:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    // Start HTTP server
    app.listen(port, () => {
        console.log(`🚀 Azure DevOps MCP HTTP Server running on port ${port}`);
        console.log(`📋 Organization: ${orgName}`);
        console.log(`🌐 Health check: http://localhost:${port}/health`);
        console.log(`🔌 SSE endpoint: http://localhost:${port}/sse`);
        console.log(`📡 Enabled domains: ${Array.from(enabledDomains).join(', ')}`);
    });
}
main().catch((error) => {
    console.error("Fatal error in HTTP server main():", error);
    process.exit(1);
});
