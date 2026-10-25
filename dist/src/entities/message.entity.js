"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const typeorm_1 = require("typeorm");
const crypto_1 = require("crypto");
let Message = class Message {
    id;
    get _id() {
        return this.id;
    }
    set _id(val) {
        if (val)
            this.id = val;
    }
    conversationId;
    senderId;
    text;
    read;
    deletedAt;
    createdAt;
    updatedAt;
    generateId() {
        if (!this.id) {
            this.id = (0, crypto_1.randomUUID)();
        }
    }
    populateVirtuals() {
        this._id = this.id;
    }
    toObject() {
        return {
            ...this,
            _id: this.id,
        };
    }
};
exports.Message = Message;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 64 }),
    __metadata("design:type", String)
], Message.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], Message.prototype, "conversationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], Message.prototype, "senderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Message.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "read", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true, default: null }),
    __metadata("design:type", Object)
], Message.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Message.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Message.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Message.prototype, "generateId", null);
__decorate([
    (0, typeorm_1.AfterLoad)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Message.prototype, "populateVirtuals", null);
exports.Message = Message = __decorate([
    (0, typeorm_1.Entity)('messages'),
    (0, typeorm_1.Index)(['conversationId', 'createdAt']),
    (0, typeorm_1.Index)(['senderId']),
    (0, typeorm_1.Index)(['read'])
], Message);
//# sourceMappingURL=message.entity.js.map