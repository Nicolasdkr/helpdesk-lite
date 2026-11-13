/**
 * Genera un histórico realista de tickets para que el panel de métricas tenga datos:
 * ~45 tickets repartidos en los últimos 75 días, con tiempos de resolución
 * que dependen de la prioridad (los urgentes se resuelven antes).
 *
 * Usa un generador pseudoaleatorio con semilla fija: el resultado es siempre el mismo,
 * así todos los que clonen el repo ven el mismo panel.
 */
import type { TicketCategory, TicketPriority, TicketStatus } from "../src/generated/prisma/client.js";

/** PRNG mulberry32: pequeño, rápido y determinista. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TEMPLATES: { category: TicketCategory; title: string; description: string }[] = [
  { category: "HARDWARE", title: "El teclado no responde", description: "Algunas teclas dejaron de funcionar tras derramar café." },
  { category: "HARDWARE", title: "Monitor con parpadeo constante", description: "La pantalla parpadea cada pocos segundos, sobre todo al encenderla." },
  { category: "HARDWARE", title: "Ratón inalámbrico sin conexión", description: "El ratón no se conecta aunque cambié las pilas." },
  { category: "HARDWARE", title: "El portátil no carga", description: "El indicador de carga no se enciende con el cargador conectado." },
  { category: "SOFTWARE", title: "Error al abrir el ERP", description: "Al iniciar el ERP aparece 'Licencia no válida'." },
  { category: "SOFTWARE", title: "Teams se cierra en las videollamadas", description: "Teams se cierra solo a los pocos minutos de empezar una llamada." },
  { category: "SOFTWARE", title: "Solicitud de instalación de Visio", description: "Necesito Visio para preparar diagramas de procesos." },
  { category: "SOFTWARE", title: "Actualización de Windows bloqueada", description: "La actualización se queda al 30% desde hace dos días." },
  { category: "NETWORK", title: "Wi-Fi lento en la sala de reuniones", description: "La conexión es muy lenta en la sala grande, en el resto va bien." },
  { category: "NETWORK", title: "Sin acceso a la unidad compartida", description: "La unidad S: aparece desconectada desde esta mañana." },
  { category: "NETWORK", title: "La VPN se desconecta cada hora", description: "La VPN se corta y tengo que volver a iniciar sesión." },
  { category: "ACCESS", title: "Alta de usuario para nueva incorporación", description: "Crear cuenta y correo para la persona que empieza el lunes." },
  { category: "ACCESS", title: "Permisos de edición en SharePoint", description: "Necesito permisos de edición en el sitio de Marketing." },
  { category: "ACCESS", title: "Restablecer contraseña de correo", description: "No recuerdo la contraseña después de las vacaciones." },
  { category: "OTHER", title: "Consulta sobre el uso del escáner", description: "¿Cómo se configura el escáner para enviar a mi correo?" },
  { category: "OTHER", title: "Mover el puesto a la planta 3", description: "Trasladar el equipo y el teléfono a mi nueva mesa." },
];

const PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "MEDIUM", "MEDIUM", "HIGH", "HIGH", "URGENT"];

/** Horas de resolución típicas por prioridad: [mínimo, máximo]. */
const RESOLUTION_HOURS: Record<TicketPriority, [number, number]> = {
  URGENT: [1, 8],
  HIGH: [3, 30],
  MEDIUM: [6, 72],
  LOW: [12, 140],
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export interface HistoryTicket {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  createdById: string;
  assignedToId: string | null;
}

export function generateHistory(opts: { creators: string[]; agents: string[]; count?: number; now?: Date }) {
  const rand = mulberry32(2026);
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!;
  const now = (opts.now ?? new Date()).getTime();
  const result: HistoryTicket[] = [];

  for (let i = 0; i < (opts.count ?? 45); i++) {
    const template = pick(TEMPLATES);
    const priority = pick(PRIORITIES);
    // Más tickets recientes que antiguos (la actividad crece con el tiempo).
    const ageDays = Math.floor(75 * rand() ** 1.4) + 1;
    // Horario laboral: entre las 8:00 y las 18:00 UTC.
    const createdAt = new Date(now - ageDays * DAY - (now % DAY) + (8 + rand() * 10) * HOUR);

    const [minH, maxH] = RESOLUTION_HOURS[priority];
    const resolvedCandidate = new Date(createdAt.getTime() + (minH + rand() * (maxH - minH)) * HOUR);
    // Los antiguos casi siempre están resueltos; los recientes, a menudo siguen abiertos.
    const isDone = resolvedCandidate.getTime() < now && rand() < (ageDays > 7 ? 0.92 : 0.45);

    const status: TicketStatus = isDone
      ? ageDays > 14 && rand() < 0.7
        ? "CLOSED"
        : "RESOLVED"
      : rand() < 0.55
        ? "IN_PROGRESS"
        : "OPEN";

    result.push({
      ...template,
      priority,
      status,
      createdAt,
      resolvedAt: isDone ? resolvedCandidate : null,
      createdById: pick(opts.creators),
      // Los abiertos pueden seguir sin asignar; el resto lo atiende un técnico.
      assignedToId: status === "OPEN" && rand() < 0.6 ? null : pick(opts.agents),
    });
  }
  return result;
}
