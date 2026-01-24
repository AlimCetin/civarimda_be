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
exports.ConversationSchema = exports.Conversation = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Conversation = class Conversation extends mongoose_2.Document {
    participants;
    lastMessage;
    lastMessageAt;
    deletedAt;
};
exports.Conversation = Conversation;
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: String, ref: 'User' }], required: true }),
    __metadata("design:type", Array)
], Conversation.prototype, "participants", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, ref: 'Message' }),
    __metadata("design:type", String)
], Conversation.prototype, "lastMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Conversation.prototype, "lastMessageAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Conversation.prototype, "deletedAt", void 0);
exports.Conversation = Conversation = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Conversation);
exports.ConversationSchema = mongoose_1.SchemaFactory.createForClass(Conversation);
exports.ConversationSchema.index({ participants: 1 });
exports.ConversationSchema.index({ lastMessageAt: -1 });
//# sourceMappingURL=conversation.entity.js.map