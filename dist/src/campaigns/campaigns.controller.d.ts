import { User } from '../entities/user.entity';
import { CampaignsService } from './campaigns.service';
export declare class CampaignsController {
    private campaignsService;
    constructor(campaignsService: CampaignsService);
    findAll(city?: string): Promise<any[]>;
    findMyCampaigns(user: User): Promise<any[]>;
    getMyCodes(user: User): Promise<any[]>;
    findOne(id: string): Promise<any>;
    create(body: any, user: User): Promise<any>;
    updatePatch(id: string, body: any, user: User): Promise<any>;
    updatePut(id: string, body: any, user: User): Promise<any>;
    delete(id: string, user: User): Promise<{
        success: boolean;
    }>;
    claimCode(id: string, user: User): Promise<{
        code: string;
    }>;
    toggleLike(id: string, user: User): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    getComments(id: string): Promise<any[]>;
    addComment(id: string, text: string, user: User): Promise<any>;
}
