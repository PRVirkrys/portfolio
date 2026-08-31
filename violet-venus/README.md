# Violet Venus

Portfolio personal construido con Astro. El proyecto reune una presentacion profesional, CV, informacion de contacto, casos de estudio y un blog, con una base de componentes reutilizables y estilos propios.

## Tecnologias

- [Astro](https://astro.build/) como framework principal.
- TypeScript, HTML y Sass para la interfaz y los estilos.
- Tailwind CSS para utilidades de estilo.
- React para los componentes que necesiten interactividad.
- MDX y Content Collections para el blog.

## Estructura

```text
src/
├── assets/       Imagenes, logos e iconos del portfolio
├── components/   Cabecera, pie, navegacion y componentes de interfaz
├── content/      Entradas del blog y casos de estudio
├── data/         Datos reutilizables, como la navegacion de proyectos
├── layouts/      Plantillas compartidas para contenido editorial
├── pages/        Rutas del sitio
└── styles/       Estilos globales y tokens de diseno
```

Las rutas principales viven en `src/pages/`:

- `/` Inicio.
- `/about` Perfil profesional.
- `/cv` Curriculum vitae.
- `/contacto` Contacto.
- `/blog` Blog y casos de estudio.

## Desarrollo local

Requiere Node.js 22.12 o superior. La version usada en el proyecto es Node 22.23.2.

```bash
npm install
npm run dev
```

El sitio estara disponible en `http://localhost:4321`.

## Comandos

| Comando | Descripcion |
| --- | --- |
| `npm run dev` | Inicia el entorno de desarrollo. |
| `npm run build` | Genera la version de produccion en `dist/`. |
| `npm run preview` | Sirve localmente la version generada. |
| `npm run astro -- --help` | Muestra la ayuda de Astro. |

## Contenido y personalizacion

- Actualiza la informacion general del sitio en `src/consts.ts`.
- Edita las paginas del portfolio en `src/pages/`.
- Anade o modifica articulos en `src/content/blog/`.
- Ajusta la identidad visual mediante los tokens de `src/styles/tokens/`.
- Guarda imagenes y recursos visuales en `src/assets/`.

## Despliegue

Antes de publicar, define la URL final del sitio en `astro.config.mjs` y ejecuta:

```bash
npm run build
```

Astro generara los archivos estaticos listos para desplegar desde `dist/`.
