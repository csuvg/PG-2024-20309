# Speller App

## Descripción

Se desarrolló una aplicación de escritorio multiplataforma desarrollada con Electron, React y TypeScript. Su objetivo principal es proporcionar la capacidad de escribir e interactuar con un computador personal mediante la predicción de palabras y la interacción con el sistema mediante un solo metodo de entrada. 

La aplicación incorpora características para la predicción de palabras utilizando modelos de n-gramas. Asismismo, permite una configuración personalizada para adaptarse a las preferencias del usuario.

Este proyecto esta pensado para personas con discapacidad motora, ya que les permite interactuar con el computador de una manera más accesible y eficiente.

## Instrucciones de Instalación

### Requisitos Previos

Tener instalados los siguientes paquetes:

- [Node.js](https://nodejs.org/) (versión 16 o superior)
- [Bun](https://bun.sh/) (Se puede usar npm o yarn)
- [Python](https://www.python.org/) (versión 3.12 preferiblemente)

### Instalación del Proyecto

```bash
bun install
```

### Ejecución de la Aplicación

Para iniciar la aplicación en modo de desarrollo:

```bash
bun run dev
```

Para construir la aplicación para producción:

- **Para Windows:**

    ```bash
    bun run build:win
    ```

- **Para macOS:**

    Es necesario tener instalado el SDK de Apple para poder construir la aplicación para macOS. (Utilizar un mac para construir la aplicación)

    ```bash
    bun run build:mac
    ```

- **Para Linux:**

    ```bash
    bun run build:linux
    ```

## Demo

Una demostración visual de la aplicación está disponible en la carpeta `/demo/`:

- [Video de Demostración](./demo/demo.mp4)

## Informe Final

El informe final del proyecto de graduación está disponible en formato PDF dentro de la carpeta `/docs/`:

- [Informe Final](./docs/informe_final.pdf)

