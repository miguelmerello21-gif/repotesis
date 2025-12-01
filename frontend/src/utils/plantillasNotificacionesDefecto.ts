// Plantillas prediseñadas para notificaciones recurrentes

export const plantillasDefecto = [
  {
    id: 'plant-suspension-lluvia',
    nombre: 'Suspensión por lluvia',
    tipo: 'horario',
    titulo: '🌧️ Entrenamiento Suspendido por Condiciones Climáticas',
    mensaje: 'Estimados apoderados y atletas,\n\nDebido a las condiciones climáticas adversas (lluvia), el entrenamiento de hoy ha sido suspendido.\n\nSe reagendará para la próxima sesión.\n\nGracias por su comprensión.\n\nLa Colmena - Reign All Stars',
    destinatariosRoles: ['apoderado'],
    prioridad: 'alta',
    fechaCreacion: new Date().toISOString()
  },
  {
    id: 'plant-recordatorio-pago',
    nombre: 'Recordatorio de mensualidad',
    tipo: 'financiera',
    titulo: '💳 Recordatorio: Mensualidad Próxima a Vencer',
    mensaje: 'Estimado apoderado,\n\nTe recordamos que la mensualidad de tu atleta vence próximamente.\n\nPor favor, realiza tu pago antes de la fecha de vencimiento para evitar recargos.\n\nPuedes pagar a través de la plataforma en la sección "Mis Pagos".\n\nGracias,\nReign All Stars',
    destinatariosRoles: ['apoderado'],
    prioridad: 'media',
    fechaCreacion: new Date().toISOString()
  },
  {
    id: 'plant-evento-competencia',
    nombre: 'Anuncio de competencia',
    tipo: 'evento',
    titulo: '🏆 Próxima Competencia Regional',
    mensaje: 'Estimada familia de La Colmena,\n\n¡Nos complace anunciar nuestra participación en la próxima competencia regional!\n\nFecha: [COMPLETAR]\nLugar: [COMPLETAR]\nHora de llegada: [COMPLETAR]\n\nMás detalles próximamente.\n\n¡Vamos La Colmena! 🐝',
    destinatariosRoles: ['apoderado'],
    prioridad: 'media',
    fechaCreacion: new Date().toISOString()
  },
  {
    id: 'plant-cambio-horario',
    nombre: 'Cambio de horario permanente',
    tipo: 'horario',
    titulo: '📅 Cambio de Horario de Entrenamiento',
    mensaje: 'Estimados apoderados,\n\nInformamos que a partir de la próxima semana habrá un cambio en el horario de entrenamiento:\n\nNuevo horario: [COMPLETAR DÍA Y HORA]\n\nPor favor, tomen nota del cambio.\n\nGracias,\nReign All Stars',
    destinatariosRoles: ['apoderado'],
    prioridad: 'alta',
    fechaCreacion: new Date().toISOString()
  },
  {
    id: 'plant-reunion-apoderados',
    nombre: 'Convocatoria reunión de apoderados',
    tipo: 'evento',
    titulo: '👥 Reunión de Apoderados',
    mensaje: 'Estimados apoderados,\n\nSe les convoca a una reunión de apoderados para tratar temas importantes del club.\n\nFecha: [COMPLETAR]\nHora: [COMPLETAR]\nLugar: [COMPLETAR]\n\nSu asistencia es muy importante.\n\nGracias,\nReign All Stars',
    destinatariosRoles: ['apoderado'],
    prioridad: 'alta',
    fechaCreacion: new Date().toISOString()
  },
  {
    id: 'plant-aviso-deuda',
    nombre: 'Aviso de deuda pendiente',
    tipo: 'financiera',
    titulo: '⚠️ Deuda Pendiente - Acción Requerida',
    mensaje: 'Estimado apoderado,\n\nTe informamos que tienes una deuda pendiente en tu cuenta.\n\nMonto adeudado: [COMPLETAR]\nFecha de vencimiento: [COMPLETAR]\n\nPor favor, regulariza tu situación a la brevedad para que tu atleta pueda seguir participando en las actividades del club.\n\nPuedes pagar a través de la plataforma.\n\nGracias,\nReign All Stars',
    destinatariosRoles: ['apoderado'],
    prioridad: 'alta',
    fechaCreacion: new Date().toISOString()
  },
  {
    id: 'plant-feriado',
    nombre: 'Suspensión por feriado',
    tipo: 'horario',
    titulo: '📅 Suspensión de Entrenamientos - Feriado',
    mensaje: 'Estimada familia de La Colmena,\n\nInformamos que debido al feriado de [COMPLETAR], no habrá entrenamientos esta semana.\n\nRetomamos actividades normales el [COMPLETAR].\n\n¡Disfruten el descanso!\n\nReign All Stars 🐝',
    destinatariosRoles: ['apoderado', 'entrenador'],
    prioridad: 'media',
    fechaCreacion: new Date().toISOString()
  },
  {
    id: 'plant-felicitaciones',
    nombre: 'Felicitaciones por logro',
    tipo: 'general',
    titulo: '🎉 ¡Felicitaciones por el Logro!',
    mensaje: 'Estimada familia de La Colmena,\n\n¡Queremos felicitar a nuestros atletas por su excelente desempeño en [COMPLETAR EVENTO]!\n\nSu dedicación y esfuerzo nos llena de orgullo.\n\n¡Sigamos volando alto! 🐝\n\nReign All Stars',
    destinatariosRoles: ['apoderado'],
    prioridad: 'baja',
    fechaCreacion: new Date().toISOString()
  }
];

// Función para inicializar plantillas si no existen
export const inicializarPlantillasDefecto = () => {
  const plantillasGuardadas = localStorage.getItem('plantillasNotificaciones');
  
  if (!plantillasGuardadas || JSON.parse(plantillasGuardadas).length === 0) {
    localStorage.setItem('plantillasNotificaciones', JSON.stringify(plantillasDefecto));
    return true;
  }
  
  return false;
};
