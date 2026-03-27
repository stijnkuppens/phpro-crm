# React 19 & Next.js Best Practices

Non-negotiable conventions. Every new or modified component must follow these patterns. These supplement (not replace) CLAUDE.md and the styleguide.

---

## React 19 — New Features

### Forms: `useActionState` + `<form action={fn}>`

**Never** use `useState` for loading/error state in forms. **Never** use `onSubmit` + `e.preventDefault()`.

```tsx
// BAD
const [loading, setLoading] = useState(false);
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  await someAction(data);
  setLoading(false);
};
<form onSubmit={handleSubmit}>...</form>

// GOOD
const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
  const result = await someAction(formData.get('field') as string);
  if (!result.success) { toast.error(result.error as string); return null; }
  toast.success('Opgeslagen');
  return null;
}, null);
<form action={formAction}>...</form>
```

- Import `useActionState` from `react` (not `react-dom`)
- Signature: `[state, action, isPending]` — state first, action second
- Never `throw` inside the action — return error state and call `toast.error()`
- Reset form on success: `useRef<HTMLFormElement>` + `formRef.current?.reset()`
- For controlled selects, keep `useState` for that field only; pass as closure variable

### Submit buttons: always use `SubmitButton`

`src/components/ui/submit-button.tsx` uses `useFormStatus()` — no `disabled={loading}` prop-drilling needed.

```tsx
// BAD
<Button type="submit" disabled={loading}>
  {loading ? <Loader2 className="animate-spin" /> : <Save />} Opslaan
</Button>

// GOOD
<SubmitButton icon={<Save />}>Opslaan</SubmitButton>
```

`SubmitButton` must be a descendant of the `<form>` element — `useFormStatus` reads from the closest ancestor form.

### Optimistic updates: `useOptimistic`

Never manually update local state before `await`. Use `useOptimistic` for instant UI feedback with automatic rollback on error.

```tsx
const [optimisticList, updateOptimistic] = useOptimistic(
  items,
  (state, updated: Item) => state.map(i => i.id === updated.id ? updated : i)
);

const handleToggle = async (item: Item) => {
  updateOptimistic({ ...item, active: !item.active }); // instant
  await toggleItem(item.id);                            // server (rollback on error)
};
```

### Context provider: `<Context value>` not `<Context.Provider value>`

```tsx
// BAD (deprecated)
<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>

// GOOD
<ThemeContext value={theme}>{children}</ThemeContext>
```

### Refs: pass as prop, no `forwardRef`

```tsx
// BAD
const MyInput = forwardRef<HTMLInputElement, Props>(({ placeholder }, ref) =>
  <input ref={ref} placeholder={placeholder} />
);

// GOOD
function MyInput({ placeholder, ref }: Props & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} placeholder={placeholder} />;
}
```

Use ref callback cleanup functions for imperative setup/teardown:

```tsx
<div ref={(el) => {
  if (!el) return;
  const obs = new ResizeObserver(cb);
  obs.observe(el);
  return () => obs.disconnect();
}} />
```

---

## Component Design

### Prefer server components — add `'use client'` only when required

A component needs `'use client'` only if it uses: hooks, browser APIs, event handlers, or third-party client libraries. Static UI, data display, and layout are server components by default.

**Wrong reasons to add `'use client'`:**
- "It's a leaf component" — doesn't matter
- "It imports a client component" — server components can import and render client components
- "It's in a features/ folder" — location doesn't determine boundary

### Keep client components as leaves

Push `'use client'` as deep as possible. A page that has one interactive button should not make the entire page a client component — extract the button.

```tsx
// BAD — entire page is client for one button
'use client';
export default function ProductPage({ product }) { ... }

// GOOD — only the interactive part is client
// product-page.tsx (server)
export default function ProductPage({ product }) {
  return <div><h1>{product.name}</h1><FavoriteButton id={product.id} /></div>;
}
// favorite-button.tsx (client)
'use client';
export function FavoriteButton({ id }) { ... }
```

### Component size limit

If a component exceeds ~150 lines, split it. Extract sub-components or custom hooks. Large components are hard to test and indicate missing abstractions.

### Props: explicit over spreading

Never spread unknown props onto DOM elements — it leaks non-standard attributes.

```tsx
// BAD
function Card({ className, ...props }) {
  return <div className={className} {...props} />;
}

// GOOD
function Card({ className, children, onClick }: CardProps) {
  return <div className={className} onClick={onClick}>{children}</div>;
}
```

Exception: UI primitives (`Button`, `Input`) that intentionally forward HTML attributes.

### Composition over configuration

Build flexible components through composition (children, slots) rather than growing prop lists.

```tsx
// BAD — config-driven, fragile
<DataTable hasSearch hasPagination searchPlaceholder="..." pageSize={10} />

// GOOD — composable
<DataTable>
  <DataTableToolbar><SearchInput /></DataTableToolbar>
  <DataTableContent />
  <DataTablePagination />
</DataTable>
```

---

## Hooks

### Dependency arrays must be complete

Every dependency used inside a `useEffect`, `useCallback`, or `useMemo` must be in the array. No omissions, no `// eslint-disable-next-line`. If the full dep array causes infinite loops, the logic is wrong — fix it.

```tsx
// BAD
useEffect(() => {
  fetchData(userId); // userId not in deps
}, []);

// GOOD
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Async `useEffect` always needs a cancellation flag

```tsx
useEffect(() => {
  let cancelled = false;
  fetchData().then((data) => {
    if (!cancelled) setData(data);
  });
  return () => { cancelled = true; };
}, [deps]);
```

### Custom hooks for reusable stateful logic

If the same combination of `useState` + `useEffect` appears in two places, extract a custom hook. Hook names start with `use`.

### `useCallback` / `useMemo` only for genuine performance needs

Do not wrap every function in `useCallback` or every value in `useMemo` by default. Use them when:
- A callback is a `useEffect` dependency
- A value is an expensive computation (>1ms)
- A callback is passed to a memoized child that would otherwise re-render

### Never call hooks conditionally

Hooks must be called in the same order every render. No hooks inside `if`, loops, or nested functions.

```tsx
// BAD
if (isLoggedIn) {
  const data = useData(); // conditional hook call
}

// GOOD — React 19's use() can be conditional
const data = isLoggedIn ? use(dataPromise) : null;
```

### `use()` for reading context conditionally

React 19's `use()` can be called after early returns, unlike `useContext`.

```tsx
function Heading({ children }) {
  if (!children) return null; // early return
  const theme = use(ThemeContext); // valid — use() supports this
  return <h1 style={{ color: theme.color }}>{children}</h1>;
}
```

---

## Performance

### `React.memo` only for proven re-render problems

Don't memoize every component. Memoization has a cost. Profile first, then memoize.

When memoizing, ensure props are referentially stable:
```tsx
// memo is wasted if handler is re-created every render
const handler = useCallback(() => doThing(id), [id]);
<MemoizedChild onAction={handler} />;
```

### Lazy load heavy components with `next/dynamic`

Anything not needed on initial paint: modals, editors, charts, maps, rich text.

```tsx
const RichEditor = dynamic(() => import('@/components/rich-editor'), { ssr: false });
const HeavyChart = dynamic(() => import('@/features/revenue/components/chart'));
```

### Virtualize long lists

Lists over ~50 items should use virtualization. The codebase uses TanStack Table — enable row virtualization for large datasets.

### Images: always `next/image`

Never use `<img>`. Always use `<Image>` from `next/image`:
- Required props: `width`+`height` or `fill`
- Above-the-fold images: `priority` prop
- Below-the-fold: default lazy loading

### Fonts: always `next/font`

Never import fonts via CSS `@import` or `<link>`. Use `next/font/google` or `next/font/local` — they inline critical CSS and avoid layout shift.

---

## TypeScript

### Strict mode is on — no `any`

`tsconfig.json` has strict mode. Never use `any` except in `eslint-disable` comments with a written justification. Use `unknown` for truly unknown types, then narrow.

### Infer return types from implementation

Don't annotate return types unless the function is a public API (exported server action, query, hook). Let TypeScript infer from the implementation.

```tsx
// BAD — redundant annotation
function getUser(): Promise<User> {
  return supabase.from('users').select('*').single();
}

// GOOD — inferred
function getUser() {
  return supabase.from('users').select('*').single();
}

// REQUIRED — public server action
export async function createUser(values: Values): Promise<ActionResult<{ id: string }>> { ... }
```

### Type props with `type`, not `interface` for component props

`type` is more flexible (unions, intersections). Use `interface` only when you need declaration merging.

```tsx
type ButtonProps = {
  variant: 'default' | 'outline' | 'destructive';
  size?: 'sm' | 'default' | 'icon';
  children: React.ReactNode;
};
```

### Use `React.ReactNode` for children

```tsx
type Props = {
  children: React.ReactNode; // not JSX.Element, not React.FC
};
```

### Discriminated unions for state

```tsx
// BAD — three separate booleans that can be in impossible states
type State = { loading: boolean; error: string | null; data: User | null };

// GOOD — impossible states are impossible to represent
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: User };
```

---

## State Management

### Local state first

Don't reach for a state management library. React's built-in state (`useState`, `useReducer`, `useContext`) handles the vast majority of cases.

### `useReducer` for complex local state

When a component has 3+ related state variables that change together, use `useReducer`:

```tsx
type Action =
  | { type: 'set_filter'; filter: string }
  | { type: 'set_page'; page: number }
  | { type: 'reset' };

function reducer(state: State, action: Action): State { ... }
const [state, dispatch] = useReducer(reducer, initialState);
```

### URL as state for navigational state

Filters, search terms, pagination, tab selection — anything that should survive a browser refresh or be shareable — belongs in the URL (via `nuqs`, which is already installed).

```tsx
import { useQueryState } from 'nuqs';
const [search, setSearch] = useQueryState('q', { defaultValue: '' });
```

### Avoid unnecessary derived state

Don't sync values into state that can be derived from existing state or props.

```tsx
// BAD — derived state causes sync bugs
const [fullName, setFullName] = useState(`${firstName} ${lastName}`);
useEffect(() => setFullName(`${firstName} ${lastName}`), [firstName, lastName]);

// GOOD — compute during render
const fullName = `${firstName} ${lastName}`;
```

---

## Error Handling

### Error boundaries per section, not just per route

`error.tsx` catches route-level errors. For sections within a page that can fail independently (tabs, widgets), wrap them in `<ErrorBoundary>` so one failing section doesn't kill the whole page.

### Never swallow errors silently

```tsx
// BAD
try {
  await doThing();
} catch {
  // silently ignored
}

// GOOD
try {
  await doThing();
} catch (err) {
  toast.error(err instanceof Error ? err.message : 'Er ging iets mis');
  logger.error('doThing failed', { err });
}
```

### Server action errors must surface to the user

Every `if (!result.success)` branch must show a `toast.error()`. Silent failures are worse than visible errors.

---

## Accessibility

### Interactive elements must be focusable and keyboard-operable

- Buttons: use `<button>` or `<Button>`, never `<div onClick>`
- Links: use `<Link>` or `<a>`, never `<span onClick>`
- Custom controls: add `role`, `tabIndex={0}`, `onKeyDown` (Enter/Space)

### Every image needs descriptive `alt` text

```tsx
// BAD — missing or empty alt
<Image src={logo} alt="" />
<Image src={logo} />

// GOOD
<Image src={logo} alt="PHPro logo" />
<Image src={heroPhoto} alt="PHPro team at company event" />

// Decorative images: empty string is correct
<Image src={divider} alt="" role="presentation" />
```

### Form inputs must have labels

Every `<input>`, `<select>`, `<textarea>` needs a `<label>` with matching `htmlFor`/`id`, or `aria-label`.

### Color contrast

Never rely on color alone to convey information. Status indicators must include both color and text/icon.

---

## Next.js App Router

### Streaming with Suspense

Wrap slow data-fetching components in `<Suspense fallback={<Skeleton />}>` to stream HTML progressively instead of blocking the entire page.

```tsx
export default async function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" />
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />  {/* fetches slowly — doesn't block page */}
      </Suspense>
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
```

### Route groups for layout sharing

Use `(groupName)` folders to share layouts without adding to the URL path:
```
app/
  (auth)/login/page.tsx         # shares auth layout
  (auth)/register/page.tsx
  admin/dashboard/page.tsx      # shares admin layout
```

### Parallel routes for independent loading sections

Use `@slot` folders for sections of a page that load independently (e.g. sidebar + main content):
```
app/admin/
  @analytics/page.tsx
  @notifications/page.tsx
  layout.tsx   # receives analytics and notifications as props
```

### Intercepting routes for modal patterns

Use `(.)route` to intercept navigation and show content in a modal while keeping the background page. This is the correct pattern for detail views that can be both standalone pages and modals.

### `notFound()` for missing entities

In detail page server components, always call `notFound()` if the entity doesn't exist. Never render an empty page or error state for a missing entity.

```tsx
export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
```

### `redirect()` over `router.push()` in server components

Use `redirect()` from `next/navigation` in server components and server actions. `router.push()` is client-only.

### Caching: explicit over implicit

Next.js 15+ defaults to **no caching** for `fetch`. Be explicit:

```tsx
// Cache indefinitely (static)
fetch(url, { cache: 'force-cache' });

// Revalidate every hour
fetch(url, { next: { revalidate: 3600 } });

// Never cache (dynamic)
fetch(url, { cache: 'no-store' });
```

Tag-based revalidation for mutation-driven invalidation:
```tsx
fetch(url, { next: { tags: ['products'] } });
// in server action:
revalidateTag('products');
```

### Middleware for auth guards

Auth checks belong in `middleware.ts`, not in individual page server components. The middleware runs before the page renders and can redirect unauthenticated users at the edge.

### Environment variables

- `NEXT_PUBLIC_*` — exposed to browser. Only for non-secret config (API URLs, feature flags).
- All others — server-only. Never access `process.env.SECRET_KEY` in a client component.

Access server-only env vars through server actions or server components — never pass them as props to client components.

---

## Code Quality

### One component per file

Never put multiple exported components in the same file. The exception is private sub-components (not exported) used only by the parent in the same file.

### Co-locate tests with source

Test files go next to the component they test: `account-form.test.tsx` next to `account-form.tsx`.

### Name event handlers `handle*`

```tsx
// BAD
const onSubmit = () => { ... };
const submit = () => { ... };

// GOOD
const handleSubmit = () => { ... };
const handleModalClose = () => { ... };
```

### Conditional rendering: `&&` only with boolean conditions

```tsx
// BAD — renders "0" when count is 0
{count && <Badge>{count}</Badge>}

// GOOD
{count > 0 && <Badge>{count}</Badge>}
{Boolean(count) && <Badge>{count}</Badge>}
```

### Keys must be stable and unique

Never use array index as key for lists that can reorder or change. Use entity IDs.

```tsx
// BAD
{items.map((item, i) => <Row key={i} item={item} />)}

// GOOD
{items.map((item) => <Row key={item.id} item={item} />)}
```
