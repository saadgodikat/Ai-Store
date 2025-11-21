# AI Nexus - AI Tools Directory

A premium, curated directory of 2000+ verified AI tools with real-time search, category filtering, and dark mode support.

## 🌟 Features

- **2000+ Verified AI Tools** - Every tool has been programmatically verified for availability
- **Real-Time Search** - Instant filtering by tool name and description
- **Category Filters** - Browse by Chat, Image, Video, Coding, Writing, Audio, and Productivity
- **Dark/Light Mode** - Beautiful theme toggle with preference persistence
- **Sticky Header** - Responsive header that shrinks on scroll for better UX
- **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- **Agent-Friendly** - Comprehensive API and agentic SEO for AI agents

## 🌐 Live Site

Visit: [https://saadgodikat.github.io/Ai-Store/](https://saadgodikat.github.io/Ai-Store/)

## 🤖 API & Agentic SEO

AI Nexus is designed to be easily discoverable and usable by AI agents and LLMs.

### API Endpoint

**Tools API**: [https://saadgodikat.github.io/Ai-Store/tools.json](https://saadgodikat.github.io/Ai-Store/tools.json)

Returns a curated list of 20+ popular AI tools with complete metadata.

### Schema

Each tool includes:
```json
{
  "name": "string",
  "slug": "string",
  "url": "string (URI)",
  "category": "Chat|Image|Video|Coding|Writing|Audio|Productivity",
  "tags": ["string"],
  "description": "string",
  "pricing": "Free|Freemium|Paid",
  "icon": "string (URI, optional)",
  "verified": boolean,
  "lastUpdated": "string (ISO 8601)"
}
```

### Agent Discovery Files

- **ai.txt**: [/ai.txt](https://saadgodikat.github.io/Ai-Store/ai.txt) - Agent instruction file
- **OpenAPI Spec**: [/openapi.json](https://saadgodikat.github.io/Ai-Store/openapi.json) - Full API specification
- **Sitemap**: [/sitemap.xml](https://saadgodikat.github.io/Ai-Store/sitemap.xml) - Search engine sitemap

### Usage Example

```javascript
// Fetch tools from the API
fetch('https://saadgodikat.github.io/Ai-Store/tools.json')
  .then(res => res.json())
  .then(data => {
    console.log(`Total tools in directory: ${data.metadata.totalTools}`);
    console.log(`Featured tools: ${data.tools.length}`);
    
    // Filter by category
    const chatTools = data.tools.filter(t => t.category === 'Chat');
    console.log('Chat tools:', chatTools);
  });
```

## 💻 Tech Stack

- Pure HTML5, CSS3, and Vanilla JavaScript
- No frameworks or dependencies
- Font Awesome icons
- Google Fonts (Inter)

## 📦 Installation

Clone the repository and open `index.html`:

```bash
git clone https://github.com/saadgodikat/Ai-Store.git
cd Ai-Store
# Open index.html in your browser
```

## 🎨 Features Breakdown

### Search
Type any keyword to instantly filter through 2000+ tools

### Categories
- **Chat**: AI chatbots and conversational AI
- **Image**: Image generation and editing tools
- **Video**: Video creation and editing AI
- **Coding**: AI coding assistants and dev tools
- **Writing**: Content creation and copywriting AI
- **Audio**: Voice, music, and audio AI tools
- **Productivity**: Task management and automation

### Theme Toggle
Switch between light and dark modes with a single click

## 📊 Statistics

- **Total Verified Tools**: 2000+
- **Categories**: 8
- **Verification Rate**: 100%
- **API Response Size**: ~35KB (curated subset)
- **Full Dataset Size**: ~680KB

## 🔧 SEO & Structured Data

- **JSON-LD Schema**: ItemList with SoftwareApplication entries
- **Open Graph**: Full OG and Twitter card support
- **Canonical URL**: Proper canonicalization
- **Sitemap**: XML sitemap for search engines

## 📄 License

All rights reserved © 2024 AI Nexus

## 🤝 Contributing

This is a personal project. To suggest tools or improvements, please open an issue on GitHub.

---

Built with ❤️ by Saad Godikat

