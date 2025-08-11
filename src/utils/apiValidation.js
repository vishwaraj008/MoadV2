async function apiValidator(req, res, next) {
    const apiKey = req.header("x-api-key");
    if(!apiKey || apiKey !== process.env.API_KEY) {
        throw new Error("Invalide apiKey")
    }   next();
}

module.exports = {apiValidator}