export type Locale = 'es' | 'en';
export type TextPart = { text: string; emphasis?: boolean };
export type HomeCopy = {
  intro: {
    greeting: string; prefix: string; name: string;
    // Narrative cursor: label is a proper noun (never translated); the rest is
    // the cursor bubble copy — short greeting, then the escalating idle nudges.
    cursorLabel: string; cursorShort: string;
    idleQuestion: string; scrollInvite: string; idlePing: string;
  };
  // `title` is the plain sentence (screen-reader label + static fallback).
  // `parts` is the same sentence split for the animation; concatenating the
  // parts must equal `title`, and exactly one part is the emphasis fragment.
  purpose: { title: string; parts: TextPart[] };
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
  ai: {
    tags: [string, string, string]; title: string; message: string; support: string; cta: string;
    window: {
      file: string; status: string; contextTitle: string; context: { label: string; meta: string }[];
      prompt: string; reply: string; options: [string, string, string]; chosen: number; inputPlaceholder: string;
      artifactTitle: string; artifactHeading: string; artifactNote: string;
    };
  };
  manifesto: { tag: string; lines: [string, string, string]; cta: string };
  identity: {
    tag: string; prefix: string; closingPrefix: string; roles: string[]; name: string;
    text: string; ctaPrimary: string; ctaSecondary: string;
  };
  // First-person lines Paula "says" as the scrub reaches a point on the pinned
  // timeline — a beat: driven by scroll, reverts when scrubbed back. One phrase
  // per beat for now; an array so a beat can grow. Scene keys are optional and
  // tolerant: a scene with no entry just means the cursor parks there silently.
  narration: {
    transition: { say: string }[];
    premise?: { say: string }[];
    board?: { say: string }[];
    figma?: { say: string }[];
    code?: { say: string }[];
    ai?: { say: string }[];
    manifesto?: { say: string }[];
    identity?: { say: string }[];
  };
  relatedProjects: string; scroll: string; skip: string;
};
// Stable content contract; JSON and language routing can replace this adapter later.
export const homeCopy: Record<Locale, HomeCopy> = {
  es: {
    intro: {
      greeting: '¡Hola!', prefix: 'Yo soy', name: 'Paula Rodas',
      cursorLabel: 'Paula', cursorShort: 'Hey! Hola...',
      idleQuestion: '¿Continuamos...?', scrollInvite: 'Vamos, haz scroll...',
      idlePing: 'Hey, ¿sigues ahí?',
    },
    purpose: {
      title: 'Diseño para darle forma a lo que todavía no está claro.',
      parts: [
        { text: 'Diseño para darle ' },
        { text: 'forma', emphasis: true },
        { text: ' a lo que todavía no está claro.' },
      ],
    },
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
    ai: {
      tags: ['IA', 'COLABORACIÓN', 'EXPERIMENTACIÓN'],
      title: 'Ampliar lo posible.',
      message: 'Colaboro con la IA para explorar más caminos, prototipar con rapidez y convertir ideas en algo que podemos evaluar.',
      support: 'La velocidad tiene sentido cuando conserva el contexto, el criterio y la intención humana.',
      cta: 'Explore my work',
      window: {
        file: 'Exploración · Checkout', status: '4 FUENTES EN CONTEXTO',
        contextTitle: 'CONTEXTO',
        context: [
          { label: 'Entrevistas', meta: '12 notas' },
          { label: 'Objetivos', meta: 'Q3' },
          { label: 'Flujo actual', meta: 'v2' },
          { label: 'Sistema', meta: 'Tokens' },
        ],
        prompt: 'Propón tres caminos que respeten las necesidades detectadas.',
        reply: 'Puedo explorar tres hipótesis:',
        options: ['01 · Simplificar el inicio', '02 · Guiar por intención', '03 · Mostrar progreso'],
        chosen: 1,
        inputPlaceholder: 'Refinar con criterio y contexto…',
        artifactTitle: 'ARTEFACTO GENERADO · HIPÓTESIS 02',
        artifactHeading: 'Una dirección para probar, no una respuesta final.',
        artifactNote: 'Paula revisa · ajusta · decide',
      },
    },
    manifesto: {
      tag: 'TECNOLOGÍA CON PROPÓSITO',
      lines: [
        'La tecnología amplifica lo que hacemos.',
        'Las personas le damos sentido.',
        'Diseñar sigue siendo decidir qué merece existir, para quién y por qué.',
      ],
      cta: 'Explore my work',
    },
    identity: {
      tag: 'WHAT I DO',
      prefix: 'I AM A', closingPrefix: 'I AM',
      roles: ['UX DESIGNER', 'UI DESIGNER', 'PRODUCT DESIGNER', 'UX ENGINEER', 'FULL-STACK DEVELOPER', 'BUILDER', 'BRAND DESIGNER', 'DEV DESIGNER'],
      name: 'PAULA RODAS',
      text: 'I research, design and build to turn complex ideas into clear, useful and human products.',
      ctaPrimary: 'Explore my work', ctaSecondary: 'Let’s talk',
    },
    narration: { transition: [{ say: 'Hey, ¡espérame!' }] },
    relatedProjects: 'Explorar proyectos relacionados', scroll: 'Haz scroll para explorar', skip: 'Ir a los proyectos',
  },
  en: {
    intro: {
      greeting: 'Hi!', prefix: 'I’m', name: 'Paula Rodas',
      cursorLabel: 'Paula', cursorShort: 'Hey! Hi...',
      idleQuestion: 'Shall we continue?', scrollInvite: 'Go ahead, scroll...',
      idlePing: 'Hey, still there?',
    },
    purpose: {
      title: 'Design gives shape to what is not clear yet.',
      parts: [
        { text: 'Design gives ' },
        { text: 'shape', emphasis: true },
        { text: ' to what is not clear yet.' },
      ],
    },
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
    ai: {
      tags: ['AI', 'COLLABORATION', 'EXPERIMENTATION'],
      title: 'Widen what is possible.',
      message: 'I collaborate with AI to explore more paths, prototype quickly and turn ideas into something we can evaluate.',
      support: 'Speed makes sense when it keeps the context, the judgement and the human intent.',
      cta: 'Explore my work',
      window: {
        file: 'Exploration · Checkout', status: '4 SOURCES IN CONTEXT',
        contextTitle: 'CONTEXT',
        context: [
          { label: 'Interviews', meta: '12 notes' },
          { label: 'Goals', meta: 'Q3' },
          { label: 'Current flow', meta: 'v2' },
          { label: 'System', meta: 'Tokens' },
        ],
        prompt: 'Propose three paths that respect the needs we found.',
        reply: 'I can explore three hypotheses:',
        options: ['01 · Simplify the start', '02 · Guide by intent', '03 · Show progress'],
        chosen: 1,
        inputPlaceholder: 'Refine with judgement and context…',
        artifactTitle: 'GENERATED ARTIFACT · HYPOTHESIS 02',
        artifactHeading: 'A direction to test, not a final answer.',
        artifactNote: 'Paula reviews · adjusts · decides',
      },
    },
    manifesto: {
      tag: 'TECHNOLOGY WITH PURPOSE',
      lines: [
        'Technology amplifies what we do.',
        'People are the ones who give it meaning.',
        'Designing is still deciding what deserves to exist, for whom and why.',
      ],
      cta: 'Explore my work',
    },
    identity: {
      tag: 'WHAT I DO',
      prefix: 'I AM A', closingPrefix: 'I AM',
      roles: ['UX DESIGNER', 'UI DESIGNER', 'PRODUCT DESIGNER', 'UX ENGINEER', 'FULL-STACK DEVELOPER', 'BUILDER', 'BRAND DESIGNER', 'DEV DESIGNER'],
      name: 'PAULA RODAS',
      text: 'I research, design and build to turn complex ideas into clear, useful and human products.',
      ctaPrimary: 'Explore my work', ctaSecondary: 'Let’s talk',
    },
    narration: { transition: [{ say: 'Hey, wait for me!' }] },
    relatedProjects: 'Explore related work', scroll: 'Scroll to explore', skip: 'Skip to projects',
  },
};
