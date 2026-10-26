import { z } from 'zod';

const uuid = z.string().uuid();
const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);
const text = (max: number) => z.string().trim().max(max);

export const registerCustomerSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().min(6).max(20),
  password: z.string().min(8).max(72),
  governorateId: uuid,
  cityId: uuid,
  address: z.string().trim().min(3).max(300),
  latitude: lat,
  longitude: lng,
});

export const registerNurseSchema = registerCustomerSchema.extend({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  qualification: z.enum(['NURSING_DIPLOMA', 'TECHNICAL_INSTITUTE', 'BACHELOR', 'POSTGRADUATE', 'OTHER']),
  yearsExperience: z.number().int().min(0).max(60),
  serviceIds: z.array(uuid).min(1).max(40),
  bio: text(500).optional(),
});

export const loginSchema = z.object({ phone: z.string().min(6).max(20), password: z.string().min(1).max(72) });
export const refreshSchema = z.object({ refreshToken: z.string().max(200).optional() });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(72), newPassword: z.string().min(8).max(72) });

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(3).max(120).optional(),
  governorateId: uuid.optional(),
  cityId: uuid.optional(),
  address: z.string().trim().min(3).max(300).optional(),
  latitude: lat.optional(),
  longitude: lng.optional(),
});

export const familyMemberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  relation: z.string().trim().min(2).max(40),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE']).nullable().optional(),
  notes: text(500).optional(),
});

const bookingBase = {
  serviceId: uuid,
  governorateId: uuid,
  cityId: uuid,
  address: z.string().trim().min(3).max(300),
  latitude: lat,
  longitude: lng,
  description: text(1000).default(''),
  notes: text(500).default(''),
  idempotencyKey: z.string().min(8).max(64),
};

export const createBookingSchema = z.object({
  ...bookingBase,
  familyMemberId: uuid.nullable().optional(),
  patientName: text(120).optional(),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
  isUrgent: z.boolean().optional(),
});

export const quoteSchema = z.object({ serviceId: uuid, governorateId: uuid });

export const guestBookingSchema = z.object({
  ...bookingBase,
  name: z.string().trim().min(3).max(120),
  phone: z.string().min(6).max(20),
  patientName: text(120).optional(),
});

export const cancelSchema = z.object({ reason: text(300).optional() });
export const locationSchema = z.object({ latitude: lat, longitude: lng });
export const onlineSchema = z.object({ online: z.boolean(), latitude: lat.optional(), longitude: lng.optional() });

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  punctuality: z.number().int().min(1).max(5).optional(),
  professionalism: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  quality: z.number().int().min(1).max(5).optional(),
  comment: text(1000).optional(),
});

export const complaintSchema = z.object({
  bookingId: uuid.nullable().optional(),
  category: z.enum(['NURSE', 'PAYMENT', 'SERVICE', 'APP']),
  description: z.string().trim().min(10).max(2000),
});

export const withdrawalSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  method: z.enum(['VODAFONE_CASH', 'ORANGE_CASH', 'ETISALAT_CASH', 'WE_PAY', 'INSTAPAY', 'BANK_TRANSFER']),
  receivingAccount: z.string().trim().min(5).max(120),
});

export const nurseProfileSchema = z.object({
  bio: text(500).optional(),
  serviceIds: z.array(uuid).min(1).max(40).optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
});

export const deviceSchema = z.object({ fcmToken: z.string().min(10).max(4096).nullable() });

// ---- admin
export const adminLoginSchema = z.object({ email: z.string().email().max(160), password: z.string().min(1).max(72) });
export const adminChangePasswordSchema = z.object({ currentPassword: z.string().min(1).max(72), newPassword: z.string().min(12).max(72) });
export const reasonSchema = z.object({ reason: text(500).optional() });
export const withdrawalActionSchema = z.object({ note: text(500).optional(), reference: text(120).optional() });
export const complaintUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED']),
  adminNote: text(2000).optional(),
});
export const governorateSchema = z.object({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{1,29}$/).optional(),
  nameAr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80),
  travelFee: z.number().min(0).max(100000),
  sortOrder: z.number().int().optional(),
});
export const governorateUpdateSchema = governorateSchema.partial().extend({
  isActive: z.boolean().optional(),
  bookingsEnabled: z.boolean().optional(),
});
export const citySchema = z.object({
  governorateId: uuid.optional(),
  nameAr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
export const settingUpdateSchema = z.object({ key: z.string().max(60), value: z.string().max(200) });
export const pageUpdateSchema = z.object({
  titleAr: z.string().trim().min(2).max(200),
  titleEn: z.string().trim().min(2).max(200),
  bodyAr: z.string().max(100_000),
  bodyEn: z.string().max(100_000),
  isPublished: z.boolean(),
});
export const adminCreateSchema = z.object({
  email: z.string().email().max(160),
  fullName: z.string().trim().min(3).max(120),
  role: z.enum(['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN']),
  temporaryPassword: z.string().min(12).max(72),
});
export const adminUpdateSchema = z.object({
  role: adminCreateSchema.shape.role.optional(),
  isActive: z.boolean().optional(),
  temporaryPassword: z.string().min(12).max(72).optional(),
});
