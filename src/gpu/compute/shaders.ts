/**
 * GPU Compute - Compute shader infrastructure for WebGPU
 * 
 * Provides GPU-accelerated data analysis capabilities.
 */

// ============================================
// Statistics Compute Shader
// ============================================

export const STATS_COMPUTE_WGSL = `
struct StatsResult {
  min_val: f32,
  max_val: f32,
  sum: f32,
  sum_sq: f32,
  count: u32,
  padding: vec3<u32>,
}

@group(0) @binding(0) var<storage, read> input_data: array<f32>;
@group(0) @binding(1) var<storage, read_write> result: StatsResult;

var<workgroup> local_min: array<f32, 256>;
var<workgroup> local_max: array<f32, 256>;
var<workgroup> local_sum: array<f32, 256>;
var<workgroup> local_sum_sq: array<f32, 256>;
var<workgroup> local_count: array<u32, 256>;

@compute @workgroup_size(256)
fn main(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let idx = global_id.x;
  let lid = local_id.x;
  let data_len = arrayLength(&input_data);
  
  // Initialize local values
  if (idx < data_len) {
    let val = input_data[idx];
    local_min[lid] = val;
    local_max[lid] = val;
    local_sum[lid] = val;
    local_sum_sq[lid] = val * val;
    local_count[lid] = 1u;
  } else {
    local_min[lid] = 3.402823e+38; // f32 max
    local_max[lid] = -3.402823e+38; // f32 min
    local_sum[lid] = 0.0;
    local_sum_sq[lid] = 0.0;
    local_count[lid] = 0u;
  }
  
  workgroupBarrier();
  
  // Parallel reduction
  for (var stride: u32 = 128u; stride > 0u; stride = stride >> 1u) {
    if (lid < stride) {
      local_min[lid] = min(local_min[lid], local_min[lid + stride]);
      local_max[lid] = max(local_max[lid], local_max[lid + stride]);
      local_sum[lid] = local_sum[lid] + local_sum[lid + stride];
      local_sum_sq[lid] = local_sum_sq[lid] + local_sum_sq[lid + stride];
      local_count[lid] = local_count[lid] + local_count[lid + stride];
    }
    workgroupBarrier();
  }
  
  // First thread writes result (atomic for multi-workgroup)
  if (lid == 0u) {
    // Use atomics for multi-workgroup reduction
    // For now, we assume single workgroup or post-process on CPU
    result.min_val = local_min[0];
    result.max_val = local_max[0];
    result.sum = local_sum[0];
    result.sum_sq = local_sum_sq[0];
    result.count = local_count[0];
  }
}
`;

// ============================================
// Min/Max Compute Shader (for bounds calculation)
// ============================================

export const MINMAX_COMPUTE_WGSL = `
struct MinMax {
  min_x: f32,
  max_x: f32,
  min_y: f32,
  max_y: f32,
}

@group(0) @binding(0) var<storage, read> points: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> result: MinMax;

var<workgroup> local_min_x: array<f32, 256>;
var<workgroup> local_max_x: array<f32, 256>;
var<workgroup> local_min_y: array<f32, 256>;
var<workgroup> local_max_y: array<f32, 256>;

@compute @workgroup_size(256)
fn main(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>
) {
  let idx = global_id.x;
  let lid = local_id.x;
  let data_len = arrayLength(&points);
  
  if (idx < data_len) {
    let pt = points[idx];
    local_min_x[lid] = pt.x;
    local_max_x[lid] = pt.x;
    local_min_y[lid] = pt.y;
    local_max_y[lid] = pt.y;
  } else {
    local_min_x[lid] = 3.402823e+38;
    local_max_x[lid] = -3.402823e+38;
    local_min_y[lid] = 3.402823e+38;
    local_max_y[lid] = -3.402823e+38;
  }
  
  workgroupBarrier();
  
  for (var stride: u32 = 128u; stride > 0u; stride = stride >> 1u) {
    if (lid < stride) {
      local_min_x[lid] = min(local_min_x[lid], local_min_x[lid + stride]);
      local_max_x[lid] = max(local_max_x[lid], local_max_x[lid + stride]);
      local_min_y[lid] = min(local_min_y[lid], local_min_y[lid + stride]);
      local_max_y[lid] = max(local_max_y[lid], local_max_y[lid + stride]);
    }
    workgroupBarrier();
  }
  
  if (lid == 0u) {
    result.min_x = local_min_x[0];
    result.max_x = local_max_x[0];
    result.min_y = local_min_y[0];
    result.max_y = local_max_y[0];
  }
}
`;

// ============================================
// Downsample Compute Shader (Min-Max per bucket)
// ============================================

export const DOWNSAMPLE_COMPUTE_WGSL = `
struct Params {
  input_count: u32,
  output_count: u32,
  bucket_size: u32,
  padding: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> input_points: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read_write> output_points: array<vec2<f32>>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let bucket_idx = global_id.x;
  
  if (bucket_idx >= params.output_count / 2u) {
    return;
  }
  
  let start = bucket_idx * params.bucket_size;
  let end = min(start + params.bucket_size, params.input_count);
  
  if (start >= params.input_count) {
    return;
  }
  
  var min_y = input_points[start].y;
  var max_y = input_points[start].y;
  var min_idx = start;
  var max_idx = start;
  
  for (var i = start; i < end; i = i + 1u) {
    let y = input_points[i].y;
    if (y < min_y) {
      min_y = y;
      min_idx = i;
    }
    if (y > max_y) {
      max_y = y;
      max_idx = i;
    }
  }
  
  // Output min and max points (preserving x,y pairs)
  let out_base = bucket_idx * 2u;
  
  // Ensure min comes before max in x order
  if (min_idx <= max_idx) {
    output_points[out_base] = input_points[min_idx];
    output_points[out_base + 1u] = input_points[max_idx];
  } else {
    output_points[out_base] = input_points[max_idx];
    output_points[out_base + 1u] = input_points[min_idx];
  }
}
`;

// ============================================
// Peak Detection Compute Shader
// ============================================

export const PEAK_DETECT_COMPUTE_WGSL = `
struct Params {
  data_count: u32,
  threshold: f32,
  min_distance: u32,
  padding: u32,
}

struct Peak {
  index: u32,
  value: f32,
  is_peak: u32,
  padding: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> data: array<f32>;
@group(0) @binding(2) var<storage, read_write> peaks: array<Peak>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  
  if (idx >= params.data_count) {
    return;
  }
  
  peaks[idx].index = idx;
  peaks[idx].value = data[idx];
  peaks[idx].is_peak = 0u;
  
  // Skip edges
  if (idx < params.min_distance || idx >= params.data_count - params.min_distance) {
    return;
  }
  
  let val = data[idx];
  
  // Check if above threshold
  if (val < params.threshold) {
    return;
  }
  
  // Check if local maximum
  var is_max = true;
  for (var i = 1u; i <= params.min_distance; i = i + 1u) {
    if (data[idx - i] >= val || data[idx + i] >= val) {
      is_max = false;
      break;
    }
  }
  
  if (is_max) {
    peaks[idx].is_peak = 1u;
  }
}
`;
