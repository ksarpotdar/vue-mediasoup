const fs = require("fs");

module.exports = {
    devServer: {
        https: {
            key: fs.readFileSync("./certs/privkey.pem"),
            cert: fs.readFileSync("./certs/fullchain.pem")
        },
        host: "conference.oostvoort.work"
    }
};