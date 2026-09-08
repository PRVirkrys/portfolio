export type Locale = 'es' | 'en';
export type HomeCopy = {
  intro: { greeting: string; prefix: string; name: string };
  purpose: { title: string };
  premise: { tag: string; title: string; body: string };
  board: { tags: [string, string, string]; title: string; message: string; support: string; cta: string; nodes: Record<'research' | 'needs' | 'goals' | 'flows' | 'product', string>; cursor: string };
  relatedProjects: string; scroll: string; skip: string;
};
// Stable content contract; JSON and language routing can replace this adapter later.
export const homeCopy: Record<Locale, HomeCopy> = {
  es: {
    intro: { greeting: '¡Hola!', prefix: 'Yo soy', name: 'Paula Rodas' },
    purpose: { title: 'Diseño para darle forma a lo que todavía no está claro.' },
    premise: { tag: 'DISEÑAR ES ENTENDER', title: 'El proceso aún importa.', body: 'Porque una buena experiencia no empieza en la interfaz. Empieza entendiendo a las personas, el problema y por qué merece ser resuelto.' },
    board: { tags: ['INVESTIGACIÓN UX', 'ESTRATEGIA', 'ARQUITECTURA'], title: 'Investigar, pensar y organizar.', message: 'Observo, pregunto y conecto lo que descubro para entender a las personas, el contexto y los objetivos del negocio.', support: 'Los hallazgos se convierten en relaciones, prioridades y flujos que dan dirección al producto.', cta: 'Explore my work', nodes: { research: 'Investigación', needs: 'Necesidades de las personas', goals: 'Objetivos del negocio', flows: 'Flujos', product: 'Producto' }, cursor: 'Paula' },
    relatedProjects: 'Explorar proyectos relacionados', scroll: 'Haz scroll para explorar', skip: 'Ir a los proyectos',
  },
  en: {
    intro: { greeting: 'Hi!', prefix: 'I’m', name: 'Paula Rodas' },
    purpose: { title: 'Design gives shape to what is not clear yet.' },
    premise: { tag: 'DESIGN IS UNDERSTANDING', title: 'The process still matters.', body: 'A good experience does not start with the interface. It starts with understanding people, the problem, and why it is worth solving.' },
    board: { tags: ['UX RESEARCH', 'STRATEGY', 'ARCHITECTURE'], title: 'Research, think and organise.', message: 'I observe, ask and connect what I find to understand people, context and business goals.', support: 'Findings turn into relationships, priorities and flows that give the product direction.', cta: 'Explore my work', nodes: { research: 'Research', needs: 'User needs', goals: 'Business goals', flows: 'Flows', product: 'Product' }, cursor: 'Paula' },
    relatedProjects: 'Explore related work', scroll: 'Scroll to explore', skip: 'Skip to projects',
  },
};
