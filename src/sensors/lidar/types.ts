export interface RawLidarFrame {
  ts?: number | string; // epoch ms or ISO
  obstaclePoints?: Array<{ d: number }>; // optional raw obstacle distances
  obstacle_distance_min?: number; // already derived
  lateral_deviation_mean?: number;
  stride_length_var?: number;
  surface_roughness?: number;
  elevation_change_rate?: number;
  processing_latency_ms?: number;
  hazards?: Array<{ type: string; distance: number; bearing_deg?: number }>;
  [k: string]: unknown; // extra fields ignored
}

export interface NormalizedLidarFrame {
  ts: number; // epoch ms
  metrics: {
    obstacle_distance_min?: number;
    lateral_deviation_mean?: number;
    stride_length_var?: number;
    surface_roughness?: number;
    elevation_change_rate?: number;
  };
  hazards?: Array<{ type: string; distance: number; bearing_deg?: number }>;
  processing_latency_ms?: number;
}

export interface LidarIngestBatch {
  frames: NormalizedLidarFrame[];
  device?: { id?: string; fw?: string };
  schema?: number;
}
