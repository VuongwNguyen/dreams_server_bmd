class successfullyReponse {
    constructor({ data, message, status = true }) {
        this.data = data;
        this.message = message;
        this.status = status;
    }
    json(res) {
        res.json({
            status: this.status,
            message: this.message,
            data: this.data,
        });
    }
}

class errorReponse extends Error {
    constructor({ message = "", status = false, code = 500 }) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

module.exports = {
    successfullyReponse,
    errorReponse,
};
