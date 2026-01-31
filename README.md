# AI Chatbot

A modern, Gemini-inspired AI chatbot interface built with Next.js 16, TypeScript, and Tailwind CSS.

![Chat Interface](/Users/tonkawzaa/.gemini/antigravity/brain/59d74bdc-e70a-45df-86e2-08b439eafc8b/landing_page_design_1769833539702.png)

## Features

- 🎨 **Modern UI**: Gemini-style dark theme interface
- ✨ **Clean Design**: Minimalist sidebar with centered welcome screen
- ⚡ **Quick Actions**: Predefined action chips for common tasks
- 📱 **Responsive**: Mobile-friendly layout
- 🚀 **Fast**: Built with Next.js 16 and Turbopack

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Font**: Geist Sans & Geist Mono

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:

```bash
git clone https://github.com/tonkawzaa/ai-chatbot.git
cd ai-chatbot
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ai-chatbot/
├── app/
│   ├── page.tsx          # Main chat interface
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── public/               # Static assets
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Customization

### Changing the Greeting

Edit the greeting in `app/page.tsx`:

```tsx
<span className="text-sm text-gray-400">✨ Hi YourName</span>
```

### Adding Quick Actions

Modify the quick actions array in `app/page.tsx`:

```tsx
const actions = [
  { icon: "🎨", label: "Your action" },
  // Add more...
];
```

## License

MIT

## Author

**PiyawatAI** (tonkawzaa)

---

Built with ❤️ using Next.js and Tailwind CSS
