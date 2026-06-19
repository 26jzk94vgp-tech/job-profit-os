// 澳洲税务常量 — 全站单一来源(防止费率多处硬编码漂移)
// ATO 2025-26财年,每年7月可能更新,更新只改这里
// 核对日期:2026-06,来源ATO官网

export const HOME_OFFICE_RATE = 0.70      // 家庭办公固定费率 ¢/小时 (2024-25起0.70,前0.67)
export const VEHICLE_CENTS_PER_KM = 0.88  // 车辆里程法 ¢/km (2024-25及2025-26)
export const VEHICLE_KM_CAP = 5000        // 里程法上限 km/车/年 (max claim $4,400)
export const GST_RATE = 0.10              // GST 10%
export const GST_DIVISOR = 11             // 含税价提取GST: amount/11
export const INSTANT_WRITEOFF_THRESHOLD = 20000  // 即时注销阈值(2026-07降回1000)
export const CAR_DEPRECIATION_LIMIT = 69674      // 车辆折旧上限 2025-26
