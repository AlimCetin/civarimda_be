import { Repository } from 'typeorm';
import { Place } from '../entities/place.entity';
import { ItemComment } from '../entities/item-comment.entity';
import { User } from '../entities/user.entity';
export declare class PlacesService {
    private placeRepo;
    private commentRepo;
    private userRepo;
    constructor(placeRepo: Repository<Place>, commentRepo: Repository<ItemComment>, userRepo: Repository<User>);
    findAll(city?: string, category?: string): Promise<any[]>;
    findMyPlaces(userId: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    create(userId: string, data: any): Promise<any>;
    update(id: string, userId: string, userRole: string, data: any): Promise<any>;
    delete(id: string, userId: string, userRole: string): Promise<{
        success: boolean;
    }>;
    toggleLike(id: string, userId: string): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    getComments(id: string): Promise<any[]>;
    addComment(id: string, userId: string, text: string): Promise<any>;
}
