# Storybook Konfiguration

## Übersicht

Dieses Projekt verwendet Storybook 10 mit Next.js und Vite. Die Konfiguration befindet sich im `.storybook` Ordner.

## Wichtige Unterschiede zu älteren Storybook-Versionen

### ❌ Veraltete API (Storybook < 7)
```typescript
import { Meta } from "@storybook/addon-docs/blocks"; // NICHT MEHR VERWENDEN!
```

### ✅ Moderne API (Storybook 10)
```typescript
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
```

## Eine neue Story erstellen

1. **Komponente erstellen** (z.B. `MyComponent.tsx`)
2. **Story-Datei erstellen** (z.B. `MyComponent.stories.ts`)

```typescript
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MyComponent } from './MyComponent';

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Definiere Controls für Props
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Props hier
  },
};
```

## Verfügbare Addons

- **@storybook/addon-docs**: Automatische Dokumentation
- **@storybook/addon-a11y**: Barrierefreiheits-Tests
- **@storybook/addon-vitest**: Testing Integration
- **@chromatic-com/storybook**: Chromatic Integration

## Styles

Die `globals.css` mit Tailwind CSS wird automatisch in allen Stories geladen (siehe `.storybook/preview.ts`).

## Storybook starten

```bash
npm run storybook
```

Die Storybook UI öffnet sich auf `http://localhost:6006`.

## Build

```bash
npm run build-storybook
```

