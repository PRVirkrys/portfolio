export type Locale = 'es' | 'en';
export type HomeCopy = {
  intro: { greeting: string; prefix: string; name: string };
  purpose: { title: string };
  premise: { tag: string; title: string; body: string };
  board: { tags: [string, string, string]; title: string; message: string; support: string; nodes: Record<'research' | 'needs' | 'goals' | 'flows' | 'product', string>; cursor: string };
  relatedProjects: string; scroll: string; skip: string;
};
// Stable content contract; JSON and language routing can replace this adapter later.
export const homeCopy: Record<Locale, HomeCopy> = {
  es: {
    intro: { greeting: '¡Hola!', prefix: 'Yo soy', name: 'Paula Rodas' },
    purpose: { title: 'Diseño para darle forma a lo que todavía no está claro.' },
    premise: { tag: 'DISEÑAR ES ENTENDER', title: 'El proceso aún importa.', body: 'Porque una buena experiencia no empieza en la interfaz. Empieza entendiendo a las personas, el problema y por qué merece ser resuelto.' },
    board: { tags: ['INVESTIGACIÓN UX', 'ESTRATEGIA', 'ARQUITECTURA'], title: 'Pensar y organizar', message: 'Diseño y construyo productos que convierten ideas complejas en experiencias claras y útiles.', support: 'Trabajo en la intersección de producto, sistemas de diseño y código para llevar ideas a producción.', nodes: { research: 'Investigación', needs: 'Necesidades de las personas', goals: 'Objetivos del negocio', flows: 'Flujos', product: 'Producto' }, cursor: 'Paula' },
    relatedProjects: 'Explorar proyectos relacionados', scroll: 'Haz scroll para explorar', skip: 'Ir a los proyectos',
  },
  en: {
    intro: { greeting: 'Hi!', prefix: 'I’m', name: 'Paula Rodas' },
    purpose: { title: 'Design gives shape to what is not clear yet.' },
    premise: { tag: 'DESIGN IS UNDERSTANDING', title: 'The process still matters.', body: 'A good experience does not start with the interface. It starts with understanding people, the problem, and why it is worth solving.' },
    board: { tags: ['UX RESEARCH', 'STRATEGY', 'ARCHITECTURE'], title: 'Thinking and organizing', message: 'I design and build products that turn complex ideas into clear, useful experiences.', support: 'I work at the intersection of product, design systems and code to bring ideas into production.', nodes: { research: 'Research', needs: 'User needs', goals: 'Business goals', flows: 'Flows', product: 'Product' }, cursor: 'Paula' },
    relatedProjects: 'Explore related work', scroll: 'Scroll to explore', skip: 'Skip to projects',
  },
};
