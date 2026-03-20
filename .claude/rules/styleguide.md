# UI Style Guide

## Toggle Pills over Checkboxes

For boolean toggles that represent **tags, roles, or feature flags** (e.g. Steerco, Diner, Event, Gift, Kinderen), use `TogglePill` instead of Checkbox.

- Component: `src/components/admin/toggle-pill.tsx`
- Props: `name`, `label`, `icon` (LucideIcon), `defaultActive`
- Renders a clickable pill/badge: filled primary when active, outlined muted when inactive
- Submits via hidden `<input>` with value `'on'` or `''` for FormData compatibility

**Use TogglePill for:** status flags, category tags, relationship badges, boolean feature toggles
**Use Checkbox for:** terms acceptance, single boolean fields in settings, multi-select lists

```tsx
import { TogglePill } from '@/components/admin/toggle-pill';
import { Star, UtensilsCrossed } from 'lucide-react';

<TogglePill name="is_steerco" label="Steerco" icon={Star} defaultActive={false} />
<TogglePill name="invite_dinner" label="Diner" icon={UtensilsCrossed} defaultActive={false} />
```

## Icons

- Use Lucide icons (`lucide-react`), never emojis in UI components
- Icon size in pills/badges: `h-3.5 w-3.5`
- Icon size in buttons: `h-4 w-4`
