/**
 * Datos de ejemplo para desarrollo:
 * - un usuario demo por rol (más una técnica y dos empleados extra),
 * - 8 tickets "de escaparate" con conversación,
 * - un histórico de ~45 tickets para el panel de métricas (ver seed-history.ts).
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
import { generateHistory } from "./seed-history.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

const DEMO_PASSWORD = "Password123!";

const users: { name: string; email: string; role: Role }[] = [
  { name: "Ana Admin", email: "admin@helpdesk.dev", role: "ADMIN" },
  { name: "Tomás Técnico", email: "agent@helpdesk.dev", role: "AGENT" },
  { name: "Elena Empleada", email: "user@helpdesk.dev", role: "USER" },
];

/** Usuarios extra para que el histórico y la carga por técnico sean variados (misma contraseña). */
const extraUsers: { name: string; email: string; role: Role }[] = [
  { name: "Sofía Soporte", email: "agent2@helpdesk.dev", role: "AGENT" },
  { name: "Marta Marketing", email: "marta@helpdesk.dev", role: "USER" },
  { name: "Jorge Contable", email: "jorge@helpdesk.dev", role: "USER" },
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

  for (const u of [...users, ...extraUsers]) {
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
          // Resuelto unas horas después de crearse (nunca en el futuro).
          resolvedAt:
            t.status === "RESOLVED" || t.status === "CLOSED"
              ? new Date(Math.min(createdAt.getTime() + 5 * 60 * 60 * 1000, Date.now()))
              : null,
        },
      });
    }
  }

  // Histórico para el panel de métricas: solo si aún no existe (los tickets de escaparate son 8).
  if ((await prisma.ticket.count()) < 20) {
    const byEmail = async (email: string) => (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
    const history = generateHistory({
      // Elena no aparece como creadora: su vista "Mis tickets" sigue siendo la de los 8 de escaparate.
      creators: [await byEmail("marta@helpdesk.dev"), await byEmail("jorge@helpdesk.dev")],
      agents: [await byEmail("agent@helpdesk.dev"), await byEmail("agent2@helpdesk.dev")],
    });
    await prisma.ticket.createMany({ data: history });
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
  console.log(`   (y además: ${extraUsers.map((u) => u.email).join(", ")})`);
  console.log(`   Tickets en la base de datos: ${await prisma.ticket.count()}`);
  console.log(`   Comentarios en la base de datos: ${await prisma.comment.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
