require('dotenv').config()
const app = require("./app");
const socketUtil = require('./utils/socket'); // Import our new utility

const http = require("http");
const server = http.createServer(app);

socketUtil.init(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
