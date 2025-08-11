const fs = require('fs').promises;
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const prettier = require('prettier');
const { explainWithGemini } = require('../llm/geminiLlm');
const path = require('path');

async function parseFileToMarkdown(filePath) {
    const code = await fs.readFile(filePath, 'utf-8');
    const ast = parser.parse(code, {
        sourceType: 'unambiguous',
        plugins: ['jsx', 'typescript']
    });

    let markdown = `# ${path.basename(filePath)}\n\n`;

    const imports = [];
    const exportsList = [];
    const routes = [];

    const functionNodes = [];

    traverse(ast, {
        ImportDeclaration(p) {
            imports.push(p.node.source.value);
        },
        CallExpression(p) {
            // Detect require('...')
            if (
                p.node.callee.name === 'require' &&
                p.node.arguments.length > 0 &&
                p.node.arguments[0].type === 'StringLiteral'
            ) {
                imports.push(p.node.arguments[0].value);
            }

            // Detect routes in routes folder
            if (/routes/.test(filePath)) {
                const callee = p.node.callee;
                if (callee.type === 'MemberExpression') {
                    const obj = callee.object.name;
                    const method = callee.property.name;
                    if ((obj === 'app' || obj === 'router') && ['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                        const routePath = p.node.arguments[0]?.value || '';
                        routes.push(`${method.toUpperCase()} ${routePath}`);
                    }
                }
            }
        },
        ExportNamedDeclaration(p) {
            if (p.node.declaration && p.node.declaration.declarations) {
                p.node.declaration.declarations.forEach(d => {
                    exportsList.push(d.id.name);
                });
            } else if (p.node.declaration && p.node.declaration.id) {
                exportsList.push(p.node.declaration.id.name);
            }
        },
        ExportDefaultDeclaration(p) {
            exportsList.push('default');
        },
        AssignmentExpression(p) {
            // module.exports = something
            if (
                p.node.left.type === 'MemberExpression' &&
                p.node.left.object.name === 'module' &&
                p.node.left.property.name === 'exports'
            ) {
                exportsList.push('module.exports');
            }
            // exports.foo = ...
            if (
                p.node.left.type === 'MemberExpression' &&
                p.node.left.object.name === 'exports'
            ) {
                exportsList.push(p.node.left.property.name);
            }
        },
        FunctionDeclaration(p) {
            functionNodes.push(p);
        }
    });

    // Add imports/requires section
    if (imports.length > 0) {
        markdown += `## Imports / Requires\n`;
        markdown += imports.map(i => `- ${i}`).join('\n') + '\n\n';
    }

    // Add exports section
    if (exportsList.length > 0) {
        markdown += `## Exports\n`;
        markdown += exportsList.map(e => `- ${e}`).join('\n') + '\n\n';
    }

    // Add routes section if any
    if (routes.length > 0) {
        markdown += `## Routes\n`;
        markdown += routes.map(r => `- ${r}`).join('\n') + '\n\n';
    }

    // Add functions section (keep your Gemini logic)
    if (functionNodes.length > 0) {
        for (const p of functionNodes) {
            const name = p.node.id?.name || 'anonymous';
            const params = p.node.params.map(param => param.name);
            const returnNode = p.node.body.body.find(n => n.type === 'ReturnStatement');
            const returnStr = returnNode?.argument?.type || 'unknown';

            const funcCode = code.slice(p.node.start, p.node.end);

            markdown += `## Function: ${name}\n\n`;
            markdown += `**Parameters**: ${params.join(', ') || 'None'}\n\n`;
            markdown += `**Returns**: ${returnStr}\n\n`;

            markdown += `**Description**:\n`;
            markdown += await explainWithGemini(funcCode);
            markdown += `\n\n---\n\n`;
        }
    }

    return prettier.format(markdown, { parser: 'markdown' });
}

module.exports = { parseFileToMarkdown };
