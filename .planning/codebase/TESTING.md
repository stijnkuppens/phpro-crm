# Testing Patterns

**Analysis Date:** 2026-03-20

## Test Framework

**Current Status:**
- No test framework configured
- No test files present in codebase
- No jest.config.js, vitest.config.ts, or playwright.config.ts found
- No test dependencies in package.json

**Recommendations for Future Setup:**
- For unit/integration: Vitest (lightweight, fast, Vite-native)
- For E2E: Playwright or Cypress
- For components: React Testing Library

## Test File Organization

**Location Pattern:**
- Co-located tests recommended (not implemented)
- Suggested pattern: `{feature}/components/{name}.tsx` + `{feature}/components/{name}.test.tsx`
- Or separate test directory: `src/__tests__/features/{feature}/{module}.test.ts`

**Naming:**
- `.test.ts` for unit/integration tests
- `.spec.ts` for spec-style tests (BDD)
- Test file paired with source: `account-list.tsx` → `account-list.test.tsx`

## Test Structure

**Recommended Suite Organization:**
```typescript
describe('AccountForm', () => {
  describe('validation', () => {
    it('should reject empty name', () => {
      // test code
    });
  });

  describe('submission', () => {
    it('should call createAccount with parsed values', () => {
      // test code
    });
  });
});
```

**Setup/Teardown Pattern:**
- Use `beforeEach` for test data setup, mock initialization
- Use `afterEach` for cleanup, restore mocks
- Avoid shared state between tests

## Mocking

**Recommended Approach:**
- Mock Supabase client via vitest.mock()
- Mock server actions via vi.mocked()
- Mock Next.js navigation (useRouter) via next/navigation mock
- Mock sonner toast library to verify user feedback

**Server Action Mocking Example:**
```typescript
vi.mock('@/features/accounts/actions/create-account', () => ({
  createAccount: vi.fn().mockResolvedValue({ success: true, data: { id: '123' } }),
}));
```

**Supabase Client Mocking Example:**
```typescript
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));
```

**What to Mock:**
- External services: Supabase, APIs
- Navigation: useRouter, usePathname
- Toast notifications: verify user feedback without UI
- File uploads: mock file input/upload events

**What NOT to Mock:**
- React hooks (useState, useCallback) — test real state behavior
- Component rendering — test the actual rendered output
- Zod schemas — validate real parsing behavior
- Utility functions — test real logic

## Fixtures and Factories

**Test Data Pattern (Not Yet Implemented):**

Suggested location: `src/__tests__/fixtures/`

```typescript
// fixtures/account.ts
export const mockAccount = {
  id: 'acc-123',
  name: 'ACME Corp',
  domain: 'acme.com',
  type: 'Klant',
  status: 'Actief',
  owner_id: 'user-456',
  created_at: '2025-01-01T00:00:00Z',
};

export function createMockAccount(overrides = {}) {
  return { ...mockAccount, ...overrides };
}
```

**Suggested Factory Pattern:**
```typescript
// factories/account.ts
export class AccountFactory {
  static create(overrides = {}) {
    return { ...defaultAccount, ...overrides };
  }

  static createMany(count: number, overrides = {}) {
    return Array.from({ length: count }, (_, i) =>
      this.create({ id: `acc-${i}`, ...overrides })
    );
  }
}
```

## Coverage

**Requirements:** Not enforced (no test framework)

**Recommended Targets (when implemented):**
- Critical paths: authentication, CRUD operations, permissions checks
- Error handling: validation failures, permission denials, network errors
- Integration: server actions + database interactions

**View Coverage (future command):**
```bash
npm run test -- --coverage
# or
vitest --coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, utilities, schemas
- Approach: Test pure functions, Zod schema validation, ACL logic
- Examples: `accountFormSchema.safeParse()`, `can(role, permission)`, utility helpers

**Integration Tests:**
- Scope: Server actions, queries, client components with mocked Supabase
- Approach: Test full flow: validation → database mutation → cache revalidation
- Examples:
  - `createAccount` action: validates input, inserts to DB, logs audit, revalidates path
  - `AccountForm` component: renders with defaults, validates on submit, calls server action, shows toast

**E2E Tests:**
- Not currently configured
- Recommended: Playwright for user flows (login, navigate, form submission, verification)
- Example: "User creates account → sees it in list → views detail page"

## Common Patterns (To Implement)

**Async Testing:**
```typescript
it('should load accounts on mount', async () => {
  const { getByText } = render(<AccountList initialData={[]} initialCount={0} />);
  await waitFor(() => {
    expect(getByText('ACME Corp')).toBeInTheDocument();
  });
});
```

**Error Testing:**
```typescript
it('should show error toast on permission denied', async () => {
  createContact.mockRejectedValueOnce(new Error('Forbidden'));
  render(<ContactForm open onClose={vi.fn()} accountId="123" />);

  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Forbidden'));
  });
});
```

**Server Action Testing:**
```typescript
describe('createAccount', () => {
  it('should validate required fields', async () => {
    const result = await createAccount({ name: '' });
    expect('error' in result).toBe(true);
    expect(result.error).toEqual({ name: ['required'] });
  });

  it('should create account and return id', async () => {
    const result = await createAccount({ name: 'New Co', type: 'Klant', status: 'Actief' });
    expect('success' in result).toBe(true);
    expect(result.data?.id).toBeDefined();
  });
});
```

## Testing Best Practices (Current Codebase)

**Manual Testing Observations:**
1. **Server Action Pattern:** All mutations use `ActionResult<T>` discriminated union — testing pattern is to check `'error' in result` or `'success' in result`
2. **Zod Validation:** Both client and server validate with same schema — tests should verify both layers
3. **Database Feedback:** Query failures return empty state, not errors — tests verify graceful degradation
4. **Toast Messages:** User feedback via sonner.toast — tests can mock and assert toast calls
5. **Parallel Loading:** Multiple data sources fetched via Promise.all in server components — tests should mock all queries

**Test Isolation:**
- Mock Supabase client (singleton in client.ts) to avoid cross-test pollution
- Clear mocks between tests: `vi.clearAllMocks()`
- Reset component state via unmount/remount or test state reset

## Missing Test Infrastructure

**Critical Gaps:**
1. No test runner configured — need to add Vitest or Jest
2. No test files — 0% coverage
3. No mock setup — testing utilities library not configured
4. No CI/CD testing — npm run test not in package.json scripts

**Recommended First Steps:**
1. Add `vitest` and `@vitest/ui` to devDependencies
2. Create `vitest.config.ts` with React and Next.js support
3. Add `npm run test -- --watch` and `npm run test -- --coverage` scripts
4. Set up fixtures and mock utilities in `src/__tests__/`
5. Start with server action tests (highest ROI)
6. Add component tests for critical UI flows
7. Configure pre-commit hook to run tests (husky + lint-staged)

---

*Testing analysis: 2026-03-20*
