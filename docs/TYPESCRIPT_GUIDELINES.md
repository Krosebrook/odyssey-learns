# TypeScript Best Practices Guide
## Odyssey Learns Platform

**Version**: 1.0  
**Last Updated**: 2026-02-09  
**Audience**: All Engineers

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Type Annotations](#type-annotations)
3. [Interfaces vs Types](#interfaces-vs-types)
4. [Function Types](#function-types)
5. [React TypeScript Patterns](#react-typescript-patterns)
6. [Zod Integration](#zod-integration)
7. [Utility Types](#utility-types)
8. [Common Pitfalls](#common-pitfalls)
9. [Code Review Checklist](#code-review-checklist)

---

## Core Principles

### 1. Never Use `any` Without Justification

**❌ Bad**:
```typescript
function processData(data: any) {
  return data.items.map((item: any) => item.name);
}
```

**✅ Good**:
```typescript
interface DataResponse {
  items: Array<{ name: string; id: number }>;
}

function processData(data: DataResponse) {
  return data.items.map((item) => item.name);
}
```

**⚠️ Acceptable (with comment)**:
```typescript
// @ts-expect-error - Legacy API returns inconsistent shape, refactor in PLAT-123
function processLegacyData(data: any) {
  // Temporary workaround until API v2 is deployed
}
```

---

### 2. Prefer Explicit Return Types

**❌ Bad** (inferred return type can change unexpectedly):
```typescript
function getUser(id: string) {
  return supabase.from('users').select('*').eq('id', id);
}
```

**✅ Good**:
```typescript
async function getUser(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return data as User;
}
```

---

### 3. Use Type Guards for Runtime Validation

**❌ Bad**:
```typescript
function processUser(user: User | null) {
  console.log(user.name); // Error: Object is possibly 'null'
}
```

**✅ Good**:
```typescript
function processUser(user: User | null) {
  if (!user) {
    console.log('No user found');
    return;
  }
  
  console.log(user.name); // TypeScript knows user is not null
}
```

**✅ Even Better** (custom type guard):
```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

function processUser(data: unknown) {
  if (isUser(data)) {
    console.log(data.name); // TypeScript knows it's a User
  }
}
```

---

## Type Annotations

### When to Annotate

**Always annotate**:
- Function parameters
- Function return types (especially exported functions)
- React component props
- State variables with complex types

**Can skip annotation** (type inference is good):
- Simple variable assignments
- Loop iterators
- Array methods with clear context

**Examples**:

```typescript
// ✅ Good: Annotate parameters and return type
function calculateTotal(items: CartItem[]): number {
  // TypeScript infers 'total' as number
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return total;
}

// ✅ Good: TypeScript infers item type from items array
items.forEach(item => {
  console.log(item.name); // item is CartItem
});

// ✅ Good: Annotate state with complex type
const [user, setUser] = useState<User | null>(null);

// ❌ Bad: Unnecessary annotation (inference is clear)
const count: number = 5;

// ✅ Good: Let TypeScript infer
const count = 5;
```

---

## Interfaces vs Types

### When to Use `interface`

Use `interface` for:
- Object shapes
- React component props
- API response shapes
- Database models

**Reasons**:
- Better error messages
- Can be extended with `extends`
- Can be merged (declaration merging)

```typescript
// ✅ Good: Interface for object shape
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Extend interface
interface AdminUser extends User {
  role: 'admin';
  permissions: string[];
}

// ✅ Good: React props
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}
```

---

### When to Use `type`

Use `type` for:
- Union types
- Intersection types
- Mapped types
- Utility type transformations
- Function types

```typescript
// ✅ Good: Union type
type Status = 'pending' | 'approved' | 'rejected';

// ✅ Good: Intersection type
type AuditedUser = User & {
  createdAt: Date;
  updatedAt: Date;
};

// ✅ Good: Function type
type Validator<T> = (value: T) => boolean;

// ✅ Good: Mapped type
type ReadOnly<T> = {
  readonly [P in keyof T]: T[P];
};
```

---

## Function Types

### Async Functions

Always include `Promise` in return type:

```typescript
// ❌ Bad: Missing Promise
async function fetchUser(id: string): User {
  return await supabase.from('users').select('*').eq('id', id);
}

// ✅ Good: Explicit Promise
async function fetchUser(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return data as User;
}
```

---

### Callbacks

Use arrow function type syntax:

```typescript
// ❌ Bad: Verbose function type
type Callback = {
  (value: string): void;
};

// ✅ Good: Arrow function syntax
type Callback = (value: string) => void;

// ✅ Good: Generic callback
type Callback<T> = (value: T) => void;

// ✅ Good: In function parameter
function subscribe(callback: (value: string) => void) {
  // ...
}
```

---

## React TypeScript Patterns

### Component Props

```typescript
// ✅ Good: Interface for props
interface LessonCardProps {
  lesson: Lesson;
  onStart: (id: string) => void;
  className?: string;
}

// ✅ Good: Functional component with props
export function LessonCard({ lesson, onStart, className }: LessonCardProps) {
  return (
    <Card className={className}>
      <h3>{lesson.title}</h3>
      <Button onClick={() => onStart(lesson.id)}>Start</Button>
    </Card>
  );
}
```

---

### Children Prop

```typescript
// ✅ Good: ReactNode for children
interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
}
```

---

### Event Handlers

```typescript
// ✅ Good: Type event handlers
interface FormProps {
  onSubmit: (data: FormData) => void;
}

export function Form({ onSubmit }: FormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

### useState with Types

```typescript
// ✅ Good: Type state explicitly
const [user, setUser] = useState<User | null>(null);

// ✅ Good: Initial value infers type
const [count, setCount] = useState(0); // count is number

// ✅ Good: Array state
const [items, setItems] = useState<Item[]>([]);

// ❌ Bad: Don't use any
const [data, setData] = useState<any>(null);
```

---

### Custom Hooks

```typescript
// ✅ Good: Type return value
function useUser(userId: string): {
  user: User | null;
  loading: boolean;
  error: Error | null;
} {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // ... fetch logic
  
  return { user, loading, error };
}

// ✅ Even better: Use a type
type UseUserReturn = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

function useUser(userId: string): UseUserReturn {
  // ...
}
```

---

## Zod Integration

### Schema to TypeScript Type

```typescript
import { z } from 'zod';

// ✅ Good: Define schema
const lessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  gradeLevel: z.number().int().min(0).max(12),
  isActive: z.boolean().default(true),
});

// ✅ Good: Infer TypeScript type from schema
type Lesson = z.infer<typeof lessonSchema>;

// ✅ Good: Use in form validation
function LessonForm() {
  const form = useForm<Lesson>({
    resolver: zodResolver(lessonSchema),
  });
  
  const onSubmit = (data: Lesson) => {
    // data is fully typed and validated
    console.log(data.title);
  };
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

---

### Runtime Validation

```typescript
// ✅ Good: Validate external data
async function fetchLesson(id: string): Promise<Lesson> {
  const response = await fetch(`/api/lessons/${id}`);
  const data = await response.json();
  
  // Runtime validation
  const result = lessonSchema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Invalid lesson data: ${result.error}`);
  }
  
  return result.data; // Type is Lesson
}
```

---

## Utility Types

### Partial<T>

Make all properties optional:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Update function with partial
function updateUser(id: string, updates: Partial<User>) {
  // updates can have any subset of User properties
}

updateUser('123', { name: 'Alice' }); // ✅ Valid
updateUser('123', { email: 'alice@example.com' }); // ✅ Valid
```

---

### Pick<T, K>

Select specific properties:

```typescript
// ✅ Good: Pick only what you need
type UserPreview = Pick<User, 'id' | 'name'>;

function displayUserPreview(user: UserPreview) {
  console.log(user.name);
  // user.email is not available
}
```

---

### Omit<T, K>

Exclude specific properties:

```typescript
// ✅ Good: Omit sensitive data
type PublicUser = Omit<User, 'password' | 'apiKey'>;

function getPublicProfile(user: User): PublicUser {
  const { password, apiKey, ...publicUser } = user;
  return publicUser;
}
```

---

### Required<T>

Make all properties required:

```typescript
interface Config {
  host?: string;
  port?: number;
}

// ✅ Good: Ensure config is complete
function validateConfig(config: Required<Config>) {
  console.log(config.host); // Always defined
  console.log(config.port); // Always defined
}
```

---

### Record<K, T>

Object with specific key-value types:

```typescript
// ✅ Good: Map with known keys
type GradeColors = Record<number, string>;

const gradeColors: GradeColors = {
  0: '#blue',
  1: '#green',
  2: '#yellow',
};

// ✅ Good: Generic record
type Permissions = Record<string, boolean>;

const userPermissions: Permissions = {
  'read:lessons': true,
  'write:lessons': false,
  'delete:lessons': false,
};
```

---

## Common Pitfalls

### 1. Index Access on Arrays

**❌ Problem**:
```typescript
const items = ['a', 'b', 'c'];
const first = items[0]; // Type: string | undefined (with noUncheckedIndexedAccess)
console.log(first.toUpperCase()); // Error: Object is possibly 'undefined'
```

**✅ Solution**:
```typescript
const first = items[0];
if (first) {
  console.log(first.toUpperCase()); // Safe
}

// Or use optional chaining
console.log(first?.toUpperCase());

// Or use array method
console.log(items.at(0)?.toUpperCase());
```

---

### 2. Null vs Undefined

**❌ Bad**: Mixing null and undefined
```typescript
function getUser(): User | null | undefined {
  // Confusing: when is it null vs undefined?
}
```

**✅ Good**: Pick one convention
```typescript
// Option 1: Use null for "intentionally empty"
function getUser(): User | null {
  if (!userId) return null;
  return fetchUser(userId);
}

// Option 2: Use undefined for "not set"
function getConfig(): Config | undefined {
  return localStorage.getItem('config') || undefined;
}
```

**Team Convention**: Prefer `null` for API/database responses, `undefined` for optional parameters.

---

### 3. Type Assertions (as)

**❌ Dangerous**: Overriding TypeScript
```typescript
const user = data as User; // Dangerous: What if data isn't a User?
```

**✅ Safe**: Validate before asserting
```typescript
if (isUser(data)) {
  const user = data; // Type guard narrows type
}

// Or use Zod
const result = userSchema.safeParse(data);
if (result.success) {
  const user = result.data; // Validated
}
```

**When to use `as`**:
- Supabase types (already validated by database): `data as User`
- DOM elements: `e.target as HTMLInputElement`
- Known safe transformations: `JSON.parse(str) as Config`

---

### 4. Enums vs Union Types

**❌ Avoid enums** (they have runtime overhead and weird behavior):
```typescript
enum Status {
  Pending,
  Approved,
  Rejected
}
```

**✅ Use union types**:
```typescript
type Status = 'pending' | 'approved' | 'rejected';

// ✅ Good: Const for autocomplete
const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];
```

---

## Code Review Checklist

When reviewing TypeScript code:

- [ ] No `any` types without `@ts-expect-error` + justification
- [ ] Function parameters have explicit types
- [ ] Function return types are explicit (not inferred)
- [ ] Null/undefined handled explicitly (no implicit access)
- [ ] Types are reused (interfaces extracted to `/types`)
- [ ] Zod schemas used for external data validation
- [ ] React components have typed props
- [ ] Custom hooks have typed return values
- [ ] No type assertions (`as`) without validation
- [ ] Union types preferred over enums

---

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Zod Documentation](https://zod.dev/)
- [Total TypeScript](https://www.totaltypescript.com/)
- [ADR-002: TypeScript Adoption Strategy](./adr/ADR-002-typescript-adoption-strategy.md)

---

**Questions?** Ask in #engineering-typescript channel or during TypeScript Office Hours (Fridays 3-3:30 PM)

---

_Last updated: 2026-02-09_
