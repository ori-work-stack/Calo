"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(error, req, res, next) {
    console.error('Error:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.message
        });
    }
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized'
        });
    }
    res.status(500).json({
        error: 'Internal server error'
    });
}
//# sourceMappingURL=errorHandler.js.map