const fs = require('fs').promises;
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const prettier = require('prettier');
const { explainWithGemini } = require('../llm/geminiLlm');

function extractServiceCallsFromFunctionBody(fnBodyNode) {
    const dummyProgram = {
        type: 'File',
        program: {
            type: 'Program',
            body: fnBodyNode.body,
            directives: [],
            sourceType: 'module'
        }
    };

    const calls = [];
    traverse(dummyProgram, {
        CallExpression(path) {
            const callee = path.node.callee;
            if (callee.type === 'MemberExpression') {
                const obj = callee.object.name;
                const method = callee.property.name;
                if (obj && method) {
                    calls.push(`${obj}.${method}()`);
                }
            }
        },
    });

    return [...new Set(calls)];
}

async function parseFileToMarkdown(filePath) {
    const code = await fs.readFile(filePath, 'utf-8');
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
    });

    let markdown = `# ${require('path').basename(filePath)}\n\n`;

    const functionNodes = [];
    traverse(ast, {
        FunctionDeclaration(path) {
            functionNodes.push(path);
        }
    });

    for (const path of functionNodes) {
        const name = path.node.id?.name || 'anonymous';
        const params = path.node.params.map(p => p.name);
        const returnNode = path.node.body.body.find(n => n.type === 'ReturnStatement');
        const returnStr = returnNode?.argument?.type || 'unknown';
        const called = extractServiceCallsFromFunctionBody(path.node.body);

        const funcCode = code.slice(path.node.start, path.node.end);

        markdown += `## Function: ${name}\n\n`;
        markdown += `**Parameters**: ${params.join(', ') || 'None'}\n\n`;
        if (called.length > 0) markdown += `**Calls**: ${called.join(', ')}\n\n`;
        markdown += `**Returns**: ${returnStr}\n\n`;

        markdown += `**Description**:\n`;
        markdown += await explainWithGemini(funcCode);
        markdown += `\n\n---\n\n`;
    }

    return prettier.format(markdown, { parser: 'markdown' });
}

module.exports = { parseFileToMarkdown };
