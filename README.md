
  El proyecto está enfocado en aplicar buenas prácticas de desarrollo frontend: arquitectura modular, consumo de
  APIs REST, manejo de estados de carga/error y diseño de interfaz centrado en usabilidad.
  Entre sus funcionalidades principales se incluyen búsqueda de películas, visualización de resultados enriquecidos
  (póster, valoración, fecha de estreno y metadatos clave) y navegación fluida para mejorar la experiencia del
  usuario.

  Este repositorio forma parte de mi práctica en desarrollo web, con énfasis en la construcción de aplicaciones
  escalables, mantenibles y alineadas con flujos reales de producto.

  ## Cómo ejecutar el proyecto

  ### Requisitos
  - Node.js 18+ (recomendado LTS)
  - Angular CLI instalado globalmente:
    ```bash
    npm install -g @angular/cli

  ### 1. Clonar el repositorio

  git clone <URL_DEL_REPOSITORIO>
  cd tmdb-angular

  ### 2. Instalar dependencias

  npm install

  ### 3. Configurar variables de entorno

  Crea el archivo src/environments/environment.ts (si no existe) con tu API key de TMDB:

  export const environment = {
    production: false,
    tmdbApiKey: 'TU_API_KEY'
  };

  Si usas environment.prod.ts, agrega la misma propiedad para producción.

  ### 4. Ejecutar en modo desarrollo

  ng serve

  Abrir en navegador:
  http://localhost:4200

  ### 5. Generar build de producción

  ng build --configuration production

  Los archivos compilados se generan en dist/.

  ## Scripts útiles

  - npm start: inicia el servidor de desarrollo
  - npm run build: compila el proyecto
  - npm test: ejecuta pruebas unitarias
