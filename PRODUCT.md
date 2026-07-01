# Product

## Register
Product (dashboard, app shell, tool interface). Design SERVES the product. Functionality and efficiency first, visual refinement as enhancement.

## Users & Purpose
- **Primary user**: Mio — solo developer/operator managing the Hermes AI agent
- **Context**: Technical environment (Fedora Linux, terminal-native workflow). Used alongside CLI tools, Discord, and code editors.
- **Primary job**: Monitor, configure, and extend Hermes — check skills, sessions, cron jobs, knowledge vault, system health. The dashboard is a control center, not a marketing surface.
- **Workflow**: Quick scanning of status across multiple domains (skills, cron, sessions), deep-diving into specific items (knowledge graph, logs), occasional configuration changes (settings, profiles).

## Brand Personality
Dark, elegant, glassmorphism. Premium but restrained. References: Linear.app (dark theme, precision), Stripe Dashboard (data density with breathing room), Vercel (clean typography, minimal chrome).

## Anti-References
None explicitly stated. Default Impeccable anti-patterns apply. No SaaS cream/beige. No gradient text. No hero-metric templates. No AI-generated eyebrows or numbered section markers.

## Accessibility
- Dark theme only (0.0.0 → various surface shades)
- WCAG AA contrast minimum
- `prefers-reduced-motion` respected for all animations
- Mobile-responsive but desktop-first (the user is on a workstation)

## Strategic Design Principles
1. **Information density with breathing room** — show a lot without feeling cluttered
2. **Dark first, dark only** — no light mode toggle needed
3. **Glassmorphism as texture, not gimmick** — subtle blur on cards, never overwhelming
4. **Data is the UI** — graphs, metrics, status indicators are the primary visual elements
5. **Terminal-compatible aesthetic** — dark backgrounds, monospace for code/logs, high contrast for readability