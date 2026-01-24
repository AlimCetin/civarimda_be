import { AdType, AdStatus } from '../../entities/ad.entity';
export declare class CreateAdDto {
    title: string;
    type: AdType;
    mediaUrl: string;
    linkUrl: string;
    description?: string;
    startDate: string;
    endDate: string;
    maxImpressions?: number;
    budget?: number;
    status?: AdStatus;
}
