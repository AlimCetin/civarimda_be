import { Model, Types } from 'mongoose';
import { Ad, AdStatus } from '../entities/ad.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
export declare class AdsService {
    private adModel;
    private activityLogModel;
    constructor(adModel: Model<Ad>, activityLogModel: Model<ActivityLog>);
    create(createAdDto: CreateAdDto, adminId: string): Promise<import("mongoose").Document<unknown, {}, Ad, {}, import("mongoose").DefaultSchemaOptions> & Ad & Required<{
        _id: Types.ObjectId;
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
    findOne(adId: string): Promise<{
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
    update(adId: string, updateAdDto: UpdateAdDto, adminId: string): Promise<import("mongoose").Document<unknown, {}, Ad, {}, import("mongoose").DefaultSchemaOptions> & Ad & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    delete(adId: string, adminId: string): Promise<{
        success: boolean;
    }>;
    recordImpression(adId: string): Promise<void>;
    recordClick(adId: string): Promise<void>;
    recordView(adId: string): Promise<void>;
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
}
