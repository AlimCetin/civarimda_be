"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = void 0;
exports.isValidId = isValidId;
function isValidId(id) {
    if (!id || typeof id !== 'string')
        return false;
    const trimmed = id.trim();
    return /^[0-9a-fA-F]{24}$/.test(trimmed) || /^[0-9a-fA-F-]{36}$/.test(trimmed);
}
exports.Types = {
    ObjectId: {
        isValid: (id) => isValidId(id),
    },
};
//# sourceMappingURL=id.util.js.map