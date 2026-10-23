import { User } from '../entities/user.entity';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { AdStatus } from '../entities/ad.entity';
export declare class AdsController {
    private adsService;
    constructor(adsService: AdsService);
    create(createAdDto: CreateAdDto, admin: User): Promise<import("../entities/ad.entity").Ad>;
    findAll(status?: AdStatus, page?: number, limit?: number): Promise<{
        ads: {
            id: string;
            _id: string;
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
            createdBy: string | null;
            maxImpressions: number;
            budget: number;
            spentAmount: number;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
    }>;
    getActiveAds(): Promise<{
        id: string;
        _id: string;
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
        createdBy: string | null;
        maxImpressions: number;
        budget: number;
        spentAmount: number;
        createdAt: Date;
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
        totalClicks: number;
        totalViews: number;
        totalImpressions: number;
        totalCTR: number;
        totalSpent: number;
        totalBudget: number;
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
        _id: string;
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
        createdBy: string | null;
        maxImpressions: number;
        budget: number;
        spentAmount: number;
        createdAt: Date;
    }>;
    update(id: string, updateAdDto: UpdateAdDto, admin: User): Promise<import("../entities/ad.entity").Ad>;
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
