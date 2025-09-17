export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type PointCloud = ReadonlyArray<Point3D>;
