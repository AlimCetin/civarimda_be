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
exports.MessageSchema = exports.Message = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Message = class Message extends mongoose_2.Document {
    conversationId;
    senderId;
    text;
    read;
    deletedAt;
};
exports.Message = Message;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, ref: 'Conversation' }),
    __metadata("design:type", String)
], Message.prototype, "conversationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, ref: 'User' }),
    __metadata("design:type", String)
], Message.prototype, "senderId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "text", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "read", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Message.prototype, "deletedAt", void 0);
exports.Message = Message = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Message);
exports.MessageSchema = mongoose_1.SchemaFactory.createForClass(Message);
exports.MessageSchema.index({ conversationId: 1, createdAt: -1 });
exports.MessageSchema.index({ senderId: 1 });
exports.MessageSchema.index({ read: 1 });
//# sourceMappingURL=message.entity.js.map