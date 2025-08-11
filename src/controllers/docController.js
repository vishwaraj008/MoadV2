const { generateDocsForProject } = require('../services/docServices');

async function generateDocsController(req, res) {
    const { projectPath, outputPath } = req.body;
    try {
        if(!projectPath || !outputPath){
            throw new Error("Invalid inputs")
        }
        await generateDocsForProject(projectPath, outputPath);
        res.status(200).json({ message: 'Documentation generated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate docs.' });
    }
}

module.exports = { generateDocsController };