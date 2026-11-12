/**
 * Datos de ejemplo para desarrollo: un usuario por rol.
 * Ejecutar con: npm run db:seed
 * Es idempotente: se puede ejecutar varias veces sin duplicar datos.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  type Role,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

const DEMO_PASSWORD = "Password123!";

const users: { name: string; email: string; role: Role }[] = [
  { name: "Ana Admin", email: "admin@helpdesk.dev", role: "ADMIN" },
  { name: "Tomás Técnico", email: "agent@helpdesk.dev", role: "AGENT" },
  { name: "Elena Empleada", email: "user@helpdesk.dev", role: "USER" },
];

type SampleTicket = {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdBy: "user" | "agent";
  assigned: boolean;
  daysAgo: number;
  comments?: { by: "user" | "agent"; body: string; internal?: boolean }[];
};

const tickets: SampleTicket[] = [
  {
    title: "No puedo conectarme a la VPN desde casa",
    description: "Al abrir el cliente VPN aparece 'Tiempo de espera agotado'. Ayer funcionaba bien.",
    status: "OPEN",
    priority: "HIGH",
    category: "NETWORK",
    createdBy: "user",
    assigned: false,
    daysAgo: 0,
  },
  {
    title: "La impresora de la planta 2 atasca el papel",
    description: "Cada 3 o 4 hojas se atasca. Ya revisé que la bandeja no estuviera sobrecargada.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    category: "HARDWARE",
    createdBy: "user",
    assigned: true,
    daysAgo: 1,
    comments: [
      { by: "agent", body: "Hola, paso por la planta 2 en una hora para revisarla." },
      { by: "agent", body: "El rodillo de arrastre está desgastado. Pedido repuesto al proveedor.", internal: true },
      { by: "user", body: "¡Gracias! Mientras tanto uso la impresora de la planta 1." },
    ],
  },
  {
    title: "Solicitud de acceso a la carpeta de Finanzas",
    description: "Necesito permisos de lectura en la carpeta compartida de Finanzas para el cierre mensual.",
    status: "RESOLVED",
    priority: "LOW",
    category: "ACCESS",
    createdBy: "user",
    assigned: true,
    daysAgo: 3,
  },
  {
    title: "Excel se cierra al abrir archivos grandes",
    description: "Con archivos de más de 50 MB Excel se cierra sin mostrar ningún mensaje de error.",
    status: "OPEN",
    priority: "MEDIUM",
    category: "SOFTWARE",
    createdBy: "user",
    assigned: false,
    daysAgo: 2,
  },
  {
    title: "Servidor de correo no envía mensajes externos",
    description: "Los correos a dominios externos quedan en la cola de salida desde las 9:00.",
    status: "IN_PROGRESS",
    priority: "URGENT",
    category: "NETWORK",
    createdBy: "agent",
    assigned: true,
    daysAgo: 0,
  },
  {
    title: "Portátil nuevo para incorporación",
    description: "Preparar un portátil con la imagen corporativa para la persona que se incorpora el lunes.",
    status: "CLOSED",
    priority: "LOW",
    category: "HARDWARE",
    createdBy: "user",
    assigned: true,
    daysAgo: 10,
  },
  {
    title: "Contraseña bloqueada tras varios intentos",
    description: "Mi cuenta se bloqueó al intentar entrar con la contraseña antigua después del cambio.",
    status: "RESOLVED",
    priority: "HIGH",
    category: "ACCESS",
    createdBy: "user",
    assigned: true,
    daysAgo: 5,
    comments: [
      { by: "agent", body: "He desbloqueado la cuenta. Prueba a entrar con la contraseña nueva." },
      { by: "user", body: "Ya puedo entrar, muchas gracias." },
    ],
  },
  {
    title: "El proyector de la sala de reuniones no detecta HDMI",
    description: "Probé con dos portátiles distintos y el proyector muestra 'Sin señal'.",
    status: "OPEN",
    priority: "LOW",
    category: "OTHER",
    createdBy: "user",
    assigned: false,
    daysAgo: 4,
  },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  // Solo se crean tickets si la tabla está vacía, para no duplicarlos.
  if ((await prisma.ticket.count()) === 0) {
    const demoUser = await prisma.user.findUniqueOrThrow({ where: { email: "user@helpdesk.dev" } });
    const demoAgent = await prisma.user.findUniqueOrThrow({ where: { email: "agent@helpdesk.dev" } });

    const idOf = (who: "user" | "agent") => (who === "user" ? demoUser.id : demoAgent.id);

    for (const { createdBy, assigned, daysAgo: age, comments: _c, ...t } of tickets) {
      const createdAt = daysAgo(age);
      await prisma.ticket.create({
        data: {
          ...t,
          createdAt,
          createdById: idOf(createdBy),
          assignedToId: assigned ? demoAgent.id : null,
          resolvedAt: t.status === "RESOLVED" || t.status === "CLOSED" ? createdAt : null,
        },
      });
    }
  }

  // Comentarios de ejemplo (por separado, para poder añadirlos a una BD que ya tenía tickets).
  if ((await prisma.comment.count()) === 0) {
    const demoUser = await prisma.user.findUniqueOrThrow({ where: { email: "user@helpdesk.dev" } });
    const demoAgent = await prisma.user.findUniqueOrThrow({ where: { email: "agent@helpdesk.dev" } });
    const idOf = (who: "user" | "agent") => (who === "user" ? demoUser.id : demoAgent.id);

    for (const sample of tickets.filter((t) => t.comments?.length)) {
      const ticket = await prisma.ticket.findFirst({ where: { title: sample.title } });
      if (!ticket) continue;

      await prisma.comment.createMany({
        data: sample.comments!.map((c, i) => ({
          ticketId: ticket.id,
          body: c.body,
          isInternal: c.internal ?? false,
          authorId: idOf(c.by),
          // Un comentario cada 30 minutos desde la creación del ticket
          createdAt: new Date(ticket.createdAt.getTime() + (i + 1) * 30 * 60 * 1000),
        })),
      });
    }
  }

  console.log(`🌱 Seed completado. Usuarios demo (contraseña: ${DEMO_PASSWORD}):`);
  users.forEach((u) => console.log(`   ${u.role.padEnd(5)} → ${u.email}`));
  console.log(`   Tickets en la base de datos: ${await prisma.ticket.count()}`);
  console.log(`   Comentarios en la base de datos: ${await prisma.comment.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
