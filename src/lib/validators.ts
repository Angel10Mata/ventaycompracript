import { z } from "zod";

// Se usan tanto en el cliente (react-hook-form) como en el servidor (Server Actions).

export const requisitosPassword = [
  { id: "min", etiqueta: "Mínimo 8 caracteres", prueba: (p: string) => p.length >= 8 },
  { id: "max", etiqueta: "Máximo 72 caracteres", prueba: (p: string) => p.length <= 72 },
  { id: "lower", etiqueta: "Al menos una letra minúscula (a–z)", prueba: (p: string) => /[a-z]/.test(p) },
  { id: "upper", etiqueta: "Al menos una letra mayúscula (A–Z)", prueba: (p: string) => /[A-Z]/.test(p) },
  { id: "digit", etiqueta: "Al menos un número (0–9)", prueba: (p: string) => /\d/.test(p) },
] as const;

export function evaluarRequisitosPassword(password: string) {
  return requisitosPassword.map((r) => ({ ...r, cumple: r.prueba(password) }));
}

export const loginSchema = z.object({
  correo: z.string().trim().min(1, "Ingresa tu correo").email("Correo no válido").max(120),
  password: z.string().min(1, "Ingresa tu contraseña").max(72),
});

export const registroSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(80, "Máximo 80 caracteres"),
    correo: z.string().trim().min(1, "Ingresa tu correo").email("Correo no válido").max(120),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(72, "Máximo 72 caracteres")
      .regex(/[a-z]/, "Debe incluir una minúscula")
      .regex(/[A-Z]/, "Debe incluir una mayúscula")
      .regex(/\d/, "Debe incluir un número"),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

/** Cantidad positiva con máximo 8 decimales (igual que la validación en la base de datos). */
export const cantidadSchema = z
  .number({ message: "Ingresa una cantidad válida" })
  .positive("La cantidad debe ser mayor a cero")
  .max(1_000_000_000, "Cantidad demasiado grande")
  .refine((n) => Number.isFinite(n) && Math.round(n * 1e8) / 1e8 === n, "Máximo 8 decimales");

export const operacionSchema = z.object({
  criptoId: z.number().int().positive(),
  tipo: z.enum(["compra", "venta"]),
  cantidad: cantidadSchema,
});

export const cambioEstadoSchema = z.object({
  usuarioId: z.string().uuid("Usuario no válido"),
  estado: z.enum(["activo", "suspendido", "baja"]),
});

/** Alta de usuario desde el panel de administración (mismas reglas que el registro público). */
export const crearUsuarioAdminSchema = registroSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type CrearUsuarioAdminInput = z.infer<typeof crearUsuarioAdminSchema>;
export type OperacionInput = z.infer<typeof operacionSchema>;
