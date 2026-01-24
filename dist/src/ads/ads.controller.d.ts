import { User } from '../entities/user.entity';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { AdStatus } from '../entities/ad.entity';
export declare class AdsController {
    private adsService;
    constructor(adsService: AdsService);
    create(createAdDto: CreateAdDto, admin: User): Promise<import("mongoose").Document<unknown, {}, import("../entities/ad.entity").Ad, {}, import("mongoose").DefaultSchemaOptions> & import("../entities/ad.entity").Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(status?: AdStatus, page?: number, limit?: number): Promise<{
        ads: {
            id: any;
            title: any;
            type: any;
            mediaUrl: any;
            linkUrl: any;
            description: any;
            status: any;
            startDate: any;
            endDate: any;
            clickCount: any;
            viewCount: any;
            impressionCount: any;
            createdBy: any;
            maxImpressions: any;
            budget: any;
            spentAmount: any;
            createdAt: any;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
    }>;
    getActiveAds(): Promise<{
        id: any;
        title: any;
        type: any;
        mediaUrl: any;
        linkUrl: any;
        description: any;
        status: any;
        startDate: any;
        endDate: any;
        clickCount: any;
        viewCount: any;
        impressionCount: any;
        createdBy: any;
        maxImpressions: any;
        budget: any;
        spentAmount: any;
        createdAt: any;
    }[]>;
    getStatistics(adId?: string): Promise<{
        adId: string;
        title: string;
        clickCount: number;
        viewCount: number;
        impressionCount: number;
        ctr: number;
        spentAmount: number;
        budget: number;
        remainingBudget: number;
        totalAds?: undefined;
        activeAds?: undefined;
        pausedAds?: undefined;
        expiredAds?: undefined;
        totalClicks?: undefined;
        totalViews?: undefined;
        totalImpressions?: undefined;
        totalCTR?: undefined;
        totalSpent?: undefined;
        totalBudget?: undefined;
    } | {
        totalAds: number;
        activeAds: number;
        pausedAds: number;
        expiredAds: number;
        totalClicks: any;
        totalViews: any;
        totalImpressions: any;
        totalCTR: number;
        totalSpent: any;
        totalBudget: any;
        remainingBudget: number;
        adId?: undefined;
        title?: undefined;
        clickCount?: undefined;
        viewCount?: undefined;
        impressionCount?: undefined;
        ctr?: undefined;
        spentAmount?: undefined;
        budget?: undefined;
    }>;
    findOne(id: string): Promise<{
        id: string;
        title: string;
        type: import("../entities/ad.entity").AdType;
        mediaUrl: string;
        linkUrl: string;
        description: string;
        status: AdStatus;
        startDate: Date;
        endDate: Date;
        clickCount: number;
        viewCount: number;
        impressionCount: number;
        createdBy: any;
        maxImpressions: number;
        budget: number;
        spentAmount: number;
        createdAt: any;
    }>;
    update(id: string, updateAdDto: UpdateAdDto, admin: User): Promise<import("mongoose").Document<unknown, {}, import("../entities/ad.entity").Ad, {}, import("mongoose").DefaultSchemaOptions> & import("../entities/ad.entity").Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    delete(id: string, admin: User): Promise<{
        success: boolean;
    }>;
    recordImpression(id: string): Promise<{
        success: boolean;
    }>;
    recordClick(id: string): Promise<{
        success: boolean;
    }>;
    recordView(id: string): Promise<{
        success: boolean;
    }>;
}
