#!/usr/bin/env tsx

/**
 * Test script for DataForSEO MCP Server
 */

import { spawn } from 'child_process';
import { join } from 'path';

async function testMcpServer() {
  console.log('🚀 Testing DataForSEO MCP Server...\n');

  // Set environment variables
  process.env.DATAFOREO_LOGIN = process.env.DATAFOREO_LOGIN || 'your_login';
  process.env.DATAFOREO_PASSWORD = process.env.DATAFOREO_PASSWORD || 'your_password';

  const serverPath = join(process.cwd(), 'mcp-dataforseo-server.ts');
  
  console.log('Server path:', serverPath);
  console.log('Environment check:');
  console.log('- DATAFOREO_LOGIN:', process.env.DATAFOREO_LOGIN ? '✅ Set' : '❌ Missing');
  console.log('- DATAFOREO_PASSWORD:', process.env.DATAFOREO_PASSWORD ? '✅ Set' : '❌ Missing');
  
  // Test if we can start the server
  try {
    console.log('\n📡 Starting MCP server...');
    
    const server = spawn('tsx', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });

    // Send an MCP initialization message
    const initMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };

    server.stdin.write(JSON.stringify(initMessage) + '\n');

    server.stdout.on('data', (data) => {
      console.log('📤 Server response:', data.toString().trim());
    });

    server.stderr.on('data', (data) => {
      console.error('❌ Server error:', data.toString().trim());
    });

    server.on('close', (code) => {
      console.log(`\n🏁 Server process exited with code ${code}`);
    });

    // Send list tools request after a delay
    setTimeout(() => {
      console.log('\n🔧 Requesting available tools...');
      const listToolsMessage = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };
      
      server.stdin.write(JSON.stringify(listToolsMessage) + '\n');
    }, 1000);

    // Close after testing
    setTimeout(() => {
      console.log('\n⏹️  Closing test server...');
      server.kill();
    }, 3000);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

// Test tool capabilities
function displayToolCapabilities() {
  console.log('\n🛠️  DataForSEO MCP Server Capabilities:\n');
  
  const tools = [
    {
      name: 'keyword_research',
      description: 'Get comprehensive keyword data with real search volumes and difficulty scores',
      example: { keyword: 'pizza restaurant', location: 'United States' }
    },
    {
      name: 'competitor_analysis', 
      description: 'Analyze domain competitors with traffic estimates and keyword data',
      example: { domain: 'dominos.com', limit: 10 }
    },
    {
      name: 'serp_analysis',
      description: 'Check ranking positions and SERP features for keyword/domain combinations',
      example: { keyword: 'pizza delivery', domain: 'pizzahut.com', device: 'mobile' }
    },
    {
      name: 'technical_seo_audit',
      description: 'Comprehensive technical SEO audit with backlink analysis',
      example: { domain: 'pizzahut.com', page_limit: 100 }
    },
    {
      name: 'backlink_analysis',
      description: 'Detailed backlink profile with quality scoring and recommendations',
      example: { domain: 'pizzahut.com', limit: 1000, dofollow_only: true }
    },
    {
      name: 'restaurant_seo_analysis',
      description: 'Specialized restaurant SEO analysis with local optimization',
      example: { restaurant_name: 'Mario\'s Pizza', location: 'New York, NY', cuisine_type: 'Italian' }
    }
  ];

  tools.forEach((tool, index) => {
    console.log(`${index + 1}. 🔧 ${tool.name}`);
    console.log(`   📝 ${tool.description}`);
    console.log(`   💡 Example: ${JSON.stringify(tool.example)}\n`);
  });
}

// Integration examples
function showIntegrationExamples() {
  console.log('🔗 Integration Examples:\n');
  
  console.log('1. 📋 Claude Desktop Config:');
  console.log(JSON.stringify({
    mcpServers: {
      dataforseo: {
        command: 'tsx',
        args: ['./mcp-dataforseo-server.ts'],
        env: {
          DATAFOREO_LOGIN: 'your_login@email.com',
          DATAFOREO_PASSWORD: 'your_api_password'
        }
      }
    }
  }, null, 2));
  
  console.log('\n2. 🤖 API Usage Example:');
  console.log(`
// Ask Claude with MCP integration:
"Analyze the SEO performance for my pizza restaurant 'Tony's Pizza' in Chicago"

// MCP will automatically use:
- restaurant_seo_analysis tool
- keyword_research for local keywords  
- competitor_analysis for local market
- Return comprehensive recommendations
  `);

  console.log('\n3. 🔄 Workflow Integration:');
  console.log(`
// Automated SEO monitoring workflow:
1. technical_seo_audit → Check site health
2. keyword_research → Find opportunities  
3. competitor_analysis → Market positioning
4. serp_analysis → Track rankings
5. Generate automated reports
  `);
}

async function main() {
  displayToolCapabilities();
  showIntegrationExamples();
  
  if (process.argv.includes('--test')) {
    await testMcpServer();
  } else {
    console.log('\n💡 To test the server, run: tsx test-mcp-server.ts --test');
  }
}

main().catch(console.error);