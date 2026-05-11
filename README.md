# Estela

![Stars](https://img.shields.io/github/stars/JesseJohn7/Estela) ![Forks](https://img.shields.io/github/forks/JesseJohn7/Estela) ![License](https://img.shields.io/badge/license-MIT-blue) ![npm](https://img.shields.io/npm/v/npm)

Estela is a web application that allows users to cast their wishes into a shared starfield, where each wish is represented by a star. Engage with celestial aesthetics while sharing hopes and dreams in a visually stunning interface powered by a canvas of animated stars.

## Features

- Interactive starfield where users can launch their wishes.
- View details of each wish by clicking on stars.
- A visually appealing UI with custom animations.

## Installation

To get started with Estela, clone the repository and install the dependencies.

```bash
git clone https://github.com/JesseJohn7/Estela.git
cd Estela
npm install
```

## Usage

To run the application in development mode, use the following command:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to view the application.

### Environment Variables

Make sure to set up the following environment variables for Supabase integration:

```plaintext
NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```

## Components

- **StarCanvas**: Renders the animated starfield and handles star click events.
- **WishCard**: Displays the details of a selected wish.
- **LaunchWish**: Provides an interface for users to submit their wishes.

## Tech Stack

Estela is built using the following technologies:

- **TypeScript** for type safety
- **React** for UI components
- **Next.js** for server-side rendering and routing
- **Supabase** for backend services
- **Tailwind CSS** for styling

## Demo

Check out the live application [here](https://estela-six.vercel.app).



## Contributing

Contributions are welcome! Please create a pull request or open an issue to discuss your ideas.