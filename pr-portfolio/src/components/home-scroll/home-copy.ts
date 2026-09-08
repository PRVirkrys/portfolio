export type Locale = 'es' | 'en';
export type HomeCopy = {
  intro: { greeting: string; prefix: string; name: string };
  purpose: { title: string };
  premise: { tag: string; title: string; body: string };
  board: { tags: [string, string, string]; title: string; message: string; support: string; cta: string; nodes: Record<'research' | 'needs' | 'goals' | 'flows' | 'product', string>; cursor: string };
  figma: {
    tags: [string, string, string]; title: string; message: string; support: string; cta: string;
    window: { file: string; status: string; layersTitle: string; layers: string[]; propsTitle: string; props: string[]; feedback: string };
  };
  code: {
    tags: [string, string, string]; title: string; message: string; support: string; cta: string;
    window: {
      file: string; status: string; explorerTitle: string; files: string[]; lines: string[]; highlightLine: number;
      previewTitle: string; previewHeading: string; previewBody: string; previewCta: string;
    };
  };
  relatedProjects: string; scroll: string; skip: string;
};
// Stable content contract; JSON and language routing can replace this adapter later.
export const homeCopy: Record<Locale, HomeCopy> = {
  es: {
    intro: { greeting: '¡Hola!', prefix: 'Yo soy', name: 'Paula Rodas' },
    purpose: { title: 'Diseño para darle forma a lo que todavía no está claro.' },
    premise: { tag: 'DISEÑAR ES ENTENDER', title: 'El proceso aún importa.', body: 'Porque una buena experiencia no empieza en la interfaz. Empieza entendiendo a las personas, el problema y por qué merece ser resuelto.' },
    board: { tags: ['INVESTIGACIÓN UX', 'ESTRATEGIA', 'ARQUITECTURA'], title: 'Investigar, pensar y organizar.', message: 'Observo, pregunto y conecto lo que descubro para entender a las personas, el contexto y los objetivos del negocio.', support: 'Los hallazgos se convierten en relaciones, prioridades y flujos que dan dirección al producto.', cta: 'Explore my work', nodes: { research: 'Investigación', needs: 'Necesidades de las personas', goals: 'Objetivos del negocio', flows: 'Flujos', product: 'Producto' }, cursor: 'Paula' },
    figma: {
      tags: ['IDEACIÓN', 'INTERACCIÓN', 'PROTOTIPADO'],
      title: 'Imaginar, dar forma y probar.',
      message: 'Convierto esa dirección en ideas, flujos y wireframes que podemos ver, recorrer y cuestionar.',
      support: 'Prototipo para aprender pronto: pruebo, escucho y ajusto antes de decidir qué merece construirse.',
      cta: 'Explore my work',
      window: {
        file: 'Checkout · Wireframe', status: 'TEST 03 · 2 HALLAZGOS',
        layersTitle: 'CAPAS', layers: ['01 Inicio', '02 Flujo', '03 Formulario', '04 Confirmación'],
        propsTitle: 'PROPIEDADES', props: ['W 280', 'H 360', 'Gap 16'],
        feedback: 'Claridad mejorada',
      },
    },
    code: {
      tags: ['UX ENGINEERING', 'FRONT-END', 'DESIGN SYSTEMS'],
      title: 'Diseñar también es construir.',
      message: 'Implemento lo que diseño para que la intención no se pierda entre el prototipo y el producto real.',
      support: 'El código me permite validar decisiones, crear sistemas consistentes y llevar experiencias cuidadas a producción.',
      cta: 'Explore my work',
      window: {
        file: 'ProductCard.astro', status: 'BUILD PASSED',
        explorerTitle: 'EXPLORER',
        files: ['src', 'components', 'ProductCard.astro', 'Button.astro', 'styles', 'pages'],
        lines: [
          '---',
          'const { title, body } = Astro.props;',
          '---',
          '<article class="product-card">',
          '  <h3>{title}</h3>',
          '  <p>{body}</p>',
          '  <Button>Explore</Button>',
          '</article>',
        ],
        highlightLine: 3,
        previewTitle: 'LIVE PREVIEW', previewHeading: 'Producto claro',
        previewBody: 'Diseño y código, unidos.', previewCta: 'Explore',
      },
    },
    relatedProjects: 'Explorar proyectos relacionados', scroll: 'Haz scroll para explorar', skip: 'Ir a los proyectos',
  },
  en: {
    intro: { greeting: 'Hi!', prefix: 'I’m', name: 'Paula Rodas' },
    purpose: { title: 'Design gives shape to what is not clear yet.' },
    premise: { tag: 'DESIGN IS UNDERSTANDING', title: 'The process still matters.', body: 'A good experience does not start with the interface. It starts with understanding people, the problem, and why it is worth solving.' },
    board: { tags: ['UX RESEARCH', 'STRATEGY', 'ARCHITECTURE'], title: 'Research, think and organise.', message: 'I observe, ask and connect what I find to understand people, context and business goals.', support: 'Findings turn into relationships, priorities and flows that give the product direction.', cta: 'Explore my work', nodes: { research: 'Research', needs: 'User needs', goals: 'Business goals', flows: 'Flows', product: 'Product' }, cursor: 'Paula' },
    figma: {
      tags: ['IDEATION', 'INTERACTION', 'PROTOTYPING'],
      title: 'Imagine, shape and test.',
      message: 'I turn that direction into ideas, flows and wireframes we can see, walk through and question.',
      support: 'I prototype to learn early: I test, listen and adjust before deciding what is worth building.',
      cta: 'Explore my work',
      window: {
        file: 'Checkout · Wireframe', status: 'TEST 03 · 2 FINDINGS',
        layersTitle: 'LAYERS', layers: ['01 Start', '02 Flow', '03 Form', '04 Confirmation'],
        propsTitle: 'PROPERTIES', props: ['W 280', 'H 360', 'Gap 16'],
        feedback: 'Clarity improved',
      },
    },
    code: {
      tags: ['UX ENGINEERING', 'FRONT-END', 'DESIGN SYSTEMS'],
      title: 'Designing is building too.',
      message: 'I implement what I design so the intent is not lost between the prototype and the real product.',
      support: 'Code lets me validate decisions, build consistent systems and take careful experiences to production.',
      cta: 'Explore my work',
      window: {
        file: 'ProductCard.astro', status: 'BUILD PASSED',
        explorerTitle: 'EXPLORER',
        files: ['src', 'components', 'ProductCard.astro', 'Button.astro', 'styles', 'pages'],
        lines: [
          '---',
          'const { title, body } = Astro.props;',
          '---',
          '<article class="product-card">',
          '  <h3>{title}</h3>',
          '  <p>{body}</p>',
          '  <Button>Explore</Button>',
          '</article>',
        ],
        highlightLine: 3,
        previewTitle: 'LIVE PREVIEW', previewHeading: 'Clear product',
        previewBody: 'Design and code, together.', previewCta: 'Explore',
      },
    },
    relatedProjects: 'Explore related work', scroll: 'Scroll to explore', skip: 'Skip to projects',
  },
};
