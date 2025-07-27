const { generateDocsForProject } = require('../services/docServices');

async function generateDocsController(req, res) {
    const { projectPath } = req.body;
    try {
        await generateDocsForProject(projectPath);
        res.status(200).json({ message: 'Documentation generated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate docs.' });
    }
}

module.exports = { generateDocsController };