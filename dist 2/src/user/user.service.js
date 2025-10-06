"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const drizzle_module_1 = require("../db/drizzle.module");
const schema = __importStar(require("../db/schema"));
const bcrypt = __importStar(require("bcrypt"));
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
let UserService = UserService_1 = class UserService {
    db;
    logger = new common_1.Logger(UserService_1.name);
    constructor(db) {
        this.db = db;
    }
    async createUser(createUserDto) {
        this.logger.log('Attempting to create a new user...');
        console.log('Incoming signup data from frontend:', createUserDto);
        const { email, name, password } = createUserDto;
        const existingUser = await this.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existingUser.length > 0) {
            this.logger.warn(`Registration failed: email ${email} already exists.`);
            throw new common_1.ConflictException('User with this email already exists');
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        this.logger.log('Password hashed successfully.');
        this.logger.log(`Inserting new user ${name} (${email}) into the database...`);
        const newUser = await this.db
            .insert(schema.users)
            .values({
            email,
            name,
            passwordHash,
        })
            .returning({
            id: schema.users.id,
            email: schema.users.email,
            name: schema.users.name,
            createdAt: schema.users.createdAt,
        });
        console.log('Response from database after insertion:', newUser[0]);
        this.logger.log(`User ${newUser[0].name} created successfully with ID: ${newUser[0].id}`);
        return newUser[0];
    }
    async findOne(email) {
        this.logger.log(`Searching for user with email: ${email}`);
        const user = await this.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (user.length > 0) {
            this.logger.log(`User with email ${email} found.`);
            return user[0];
        }
        this.logger.log(`User with email ${email} not found.`);
        return undefined;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(drizzle_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], UserService);
//# sourceMappingURL=user.service.js.map