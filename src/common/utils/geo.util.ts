import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

/**
 * GPS koordinatları ve yarıçap parametrelerini doğrular,
 * geçerliyse sorguya Haversine mesafe seçimi, yarıçap filtresi ve sıralama ekler.
 */
export function applyHaversineGeoFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  lat?: number,
  lng?: number,
  radiusKm?: number,
): { hasCoords: boolean; hasRadius: boolean } {
  const hasCoords =
    lat !== undefined &&
    lat !== null &&
    !Number.isNaN(Number(lat)) &&
    lng !== undefined &&
    lng !== null &&
    !Number.isNaN(Number(lng));

  const userLat = hasCoords ? Number(lat) : null;
  const userLng = hasCoords ? Number(lng) : null;
  const radius =
    radiusKm !== undefined &&
    radiusKm !== null &&
    !Number.isNaN(Number(radiusKm)) &&
    Number(radiusKm) > 0
      ? Number(radiusKm)
      : null;

  if (hasCoords && userLat !== null && userLng !== null) {
    const haversineFormula = `(6371 * acos(least(1.0, greatest(-1.0, cos(radians(:lat)) * cos(radians(${alias}.latitude)) * cos(radians(${alias}.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(${alias}.latitude))))))`;

    qb.addSelect(haversineFormula, 'distance').setParameters({
      lat: userLat,
      lng: userLng,
    });

    if (radius) {
      qb.andWhere(
        `${alias}.latitude IS NOT NULL AND ${alias}.longitude IS NOT NULL AND ${haversineFormula} <= :radius`,
        { radius },
      );
    }

    qb.orderBy(
      `CASE WHEN ${alias}.latitude IS NOT NULL AND ${alias}.longitude IS NOT NULL THEN 0 ELSE 1 END`,
      'ASC',
    )
      .addOrderBy('distance', 'ASC')
      .addOrderBy(`${alias}.createdAt`, 'DESC');
  } else {
    qb.orderBy(`${alias}.createdAt`, 'DESC');
  }

  return { hasCoords, hasRadius: radius !== null };
}

