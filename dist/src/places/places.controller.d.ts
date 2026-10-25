import { User } from '../entities/user.entity';
import { PlacesService } from './places.service';
export declare class PlacesController {
    private placesService;
    constructor(placesService: PlacesService);
    findAll(city?: string, category?: string, lat?: number, lng?: number, radius?: number): Promise<any[]>;
    findMyPlaces(user: User): Promise<any[]>;
    findOne(id: string): Promise<any>;
    create(body: any, user: User): Promise<any>;
    updatePatch(id: string, body: any, user: User): Promise<any>;
    updatePut(id: string, body: any, user: User): Promise<any>;
    delete(id: string, user: User): Promise<{
        success: boolean;
    }>;
    toggleLike(id: string, user: User): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    getComments(id: string): Promise<any[]>;
    addComment(id: string, text: string, user: User): Promise<any>;
}
