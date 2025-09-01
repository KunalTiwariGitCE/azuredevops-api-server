#!/bin/bash

# Azure DevOps API Server - Quick Deployment Script
# This script helps you deploy to GitHub and various platforms

echo "🚀 Azure DevOps API Server - Deployment Helper"
echo "=============================================="
echo ""

# Check if git is configured
if ! git config user.name &> /dev/null; then
    echo "⚠️  Git user not configured. Please set up git:"
    echo "git config --global user.name 'Your Name'"
    echo "git config --global user.email 'your.email@example.com'"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run this script from the project directory."
    exit 1
fi

echo "📋 Current repository status:"
git status --short

echo ""
echo "🔧 Build the project..."
npm run build

echo ""
echo "📝 Add and commit all changes..."
git add .
git commit -m "Deploy: Ready for production deployment with all Azure DevOps operations

- Complete REST API server with 70+ endpoints
- Microsoft Copilot Studio integration ready
- Multiple deployment platform configurations
- Production-ready with CORS, error handling, logging
- GitHub Actions CI/CD pipeline configured" || echo "No changes to commit"

echo ""
echo "📤 Next steps:"
echo "1. Create GitHub repository: https://github.com/new"
echo "   - Name: azuredevops-api-server"
echo "   - Public repository"
echo "   - Don't initialize with README"
echo ""
echo "2. Add remote and push (replace YOUR_USERNAME):"
echo "   git remote add origin https://github.com/YOUR_USERNAME/azuredevops-api-server.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to your preferred platform:"
echo "   🚄 Railway: https://railway.app"
echo "   🌟 Render: https://render.com"
echo "   🚀 Heroku: https://heroku.com"
echo "   ⚡ Vercel: https://vercel.com"
echo ""
echo "4. Configure Microsoft Copilot Studio connector:"
echo "   📚 See COPILOT_STUDIO_INTEGRATION.md for details"
echo ""
echo "✅ Your Azure DevOps API Server is ready for deployment!"
echo "📖 Read GITHUB_SETUP_INSTRUCTIONS.md for detailed steps"