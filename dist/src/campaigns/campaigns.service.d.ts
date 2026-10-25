import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { ClaimedCode } from '../entities/claimed-code.entity';
import { ItemComment } from '../entities/item-comment.entity';
import { User } from '../entities/user.entity';
export declare class CampaignsService {
    private campaignRepo;
    private codeRepo;
    private commentRepo;
    private userRepo;
    constructor(campaignRepo: Repository<Campaign>, codeRepo: Repository<ClaimedCode>, commentRepo: Repository<ItemComment>, userRepo: Repository<User>);
    findAll(city?: string): Promise<any[]>;
    findMyCampaigns(userId: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    create(userId: string, data: Partial<Campaign>): Promise<any>;
    update(id: string, userId: string, userRole: string, data: Partial<Campaign>): Promise<any>;
    delete(id: string, userId: string, userRole: string): Promise<{
        success: boolean;
    }>;
    claimCode(id: string, userId: string): Promise<{
        code: string;
    }>;
    getMyCodes(userId: string): Promise<any[]>;
    toggleLike(id: string, userId: string): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    getComments(id: string): Promise<any[]>;
    addComment(id: string, userId: string, text: string): Promise<any>;
}
