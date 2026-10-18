// ============================================================================
// VECTR-8 // 3D Vector & Quaternion Mathematics
// ============================================================================

export const Vec3 = {
  create(x = 0, y = 0, z = 0) {
    return { x, y, z };
  },
  clone(v) {
    return { x: v.x, y: v.y, z: v.z };
  },
  add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  },
  sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  },
  scale(v, s) {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  },
  addScaled(a, b, s) {
    return { x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s };
  },
  dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  },
  cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  },
  lenSq(v) {
    return v.x * v.x + v.y * v.y + v.z * v.z;
  },
  len(v) {
    return Math.hypot(v.x, v.y, v.z);
  },
  norm(v) {
    const l = Math.hypot(v.x, v.y, v.z);
    return l > 1e-8 ? { x: v.x / l, y: v.y / l, z: v.z / l } : { x: 0, y: 0, z: 0 };
  },
};

export const Quat = {
  identity() {
    return { x: 0, y: 0, z: 0, w: 1 };
  },
  norm(q) {
    const l = Math.hypot(q.x, q.y, q.z, q.w);
    if (l < 1e-8) return { x: 0, y: 0, z: 0, w: 1 };
    return { x: q.x / l, y: q.y / l, z: q.z / l, w: q.w / l };
  },
  mul(a, b) {
    return {
      w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
      x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    };
  },
  conjugate(q) {
    return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
  },
  rotate(q, v) {
    const tx = 2 * (q.y * v.z - q.z * v.y);
    const ty = 2 * (q.z * v.x - q.x * v.z);
    const tz = 2 * (q.x * v.y - q.y * v.x);
    return {
      x: v.x + q.w * tx + (q.y * tz - q.z * ty),
      y: v.y + q.w * ty + (q.z * tx - q.x * tz),
      z: v.z + q.w * tz + (q.x * ty - q.y * tx),
    };
  },
  invRotate(q, v) {
    return Quat.rotate(Quat.conjugate(q), v);
  },
  toEuler(q) {
    const forward = Quat.rotate(q, { x: 0, y: 0, z: 1 });
    const right = Quat.rotate(q, { x: 1, y: 0, z: 0 });
    const up = Quat.rotate(q, { x: 0, y: 1, z: 0 });

    const pitch = Math.asin(Math.max(-1, Math.min(1, forward.y))); // +pitch = nose up
    const yaw = Math.atan2(forward.x, forward.z);
    const roll = Math.atan2(right.y, up.y); // +roll = right side up (bank left)
    return { pitch, roll, yaw };
  },
};
