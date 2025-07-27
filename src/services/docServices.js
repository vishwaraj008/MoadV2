const path = require('path');
const fs = require('fs-extra');
const { parseFileToMarkdown } = require('../utils/parseUtils');

async function generateDocsForProject(projectPath) {
    const projectName = path.basename(projectPath);
    const docsRoot = path.resolve(`./output/${projectName} Docs`);
    await fs.ensureDir(docsRoot);

    async function traverse(dir, relative = '') {
        const skipFiles = ['package.json', 'package-lock.json', '.env', '.gitignore'];
        const skipDirs = ['node_modules', '.git', 'dist', 'build', '.vscode'];

        const files = await fs.readdir(dir);
        for (const file of files) {
            if (skipFiles.includes(file) || file.startsWith('.')) continue;

            const fullPath = path.join(dir, file);
            const relPath = path.join(relative, file);
            const stats = await fs.stat(fullPath);

            if (stats.isDirectory()) {
                if (skipDirs.includes(file)) continue;
                await traverse(fullPath, relPath);
            } 
            else if (file.endsWith('.js')) {
                try {
                    const md = await parseFileToMarkdown(fullPath);
                    const targetPath = path.join(docsRoot, relPath.replace('.js', '.md'));
                    await fs.ensureDir(path.dirname(targetPath));
                    await fs.writeFile(targetPath, md);
                } catch (err) {
                    console.warn(`⚠️ Skipped file due to error: ${fullPath}\n`, err.message);
                }
            }
        }
    }

    await traverse(projectPath);
}

module.exports = { generateDocsForProject };