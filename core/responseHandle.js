class SuccessfullyResponse {
    constructor({ data, message, status = true, code = 200 }) {
        this.data = data;
        this.message = message;
        this.status = status;
        this.code = code;
    }
    json(res) {
        res.json({
            status: this.status,
            message: this.message,
            data: this.data,
        });
    }
}

class ErrorResponse extends Error {
    constructor({ message = "", status = false, code = 500 }) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

module.exports = {
    SuccessfullyResponse,
    ErrorResponse,
};
