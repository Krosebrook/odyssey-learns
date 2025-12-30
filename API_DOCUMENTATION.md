# API Documentation

**Project**: Odyssey Learns  
**API Version**: v1  
**Last Updated**: 2024-12-30

---

## Overview

Odyssey Learns uses Supabase as its backend, which automatically generates a RESTful API from the PostgreSQL database schema. This document describes the API endpoints, data models, and usage patterns.

## Base Configuration

### Supabase Client Setup

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### Authentication

All API requests require authentication via JWT token:

```typescript
// Automatic with Supabase client
const { data, error } = await supabase
  .from('table_name')
  .select('*');
  
// Token automatically included in Authorization header
```

### Rate Limiting

- **Authentication endpoints**: 10 requests/minute
- **Read operations**: 100 requests/minute
- **Write operations**: 50 requests/minute
- **File uploads**: 10 requests/minute

---

## Core Entities

### User Profiles

#### Get Current User Profile

```typescript
GET /rest/v1/profiles?id=eq.{userId}

const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

**Response**:
```json
{
  "id": "uuid",
  "role": "parent",
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Update Profile

```typescript
PATCH /rest/v1/profiles?id=eq.{userId}

const { data, error } = await supabase
  .from('profiles')
  .update({ full_name: 'New Name' })
  .eq('id', userId);
```

---

### Children

#### List Children (Parent Only)

```typescript
GET /rest/v1/children?parent_id=eq.{parentId}

const { data: children } = await supabase
  .from('children')
  .select('*')
  .eq('parent_id', parentId)
  .order('created_at', { ascending: true });
```

**Response**:
```json
[
  {
    "id": "uuid",
    "parent_id": "uuid",
    "name": "Alice",
    "grade_level": 5,
    "avatar_config": {
      "hair": "long",
      "color": "brown",
      "accessory": "glasses"
    },
    "total_points": 350,
    "total_tokens": 125,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Child

```typescript
POST /rest/v1/children

interface CreateChildData {
  parent_id: string;
  name: string;
  grade_level: number;
  pin_hash?: string;
  avatar_config?: object;
}

const { data: child, error } = await supabase
  .from('children')
  .insert({
    parent_id: userId,
    name: 'Alice',
    grade_level: 5,
    pin_hash: hashedPin,
  })
  .select()
  .single();
```

#### Update Child

```typescript
PATCH /rest/v1/children?id=eq.{childId}

const { data, error } = await supabase
  .from('children')
  .update({ 
    grade_level: 6,
    avatar_config: newAvatarConfig 
  })
  .eq('id', childId);
```

#### Delete Child

```typescript
DELETE /rest/v1/children?id=eq.{childId}

const { error } = await supabase
  .from('children')
  .delete()
  .eq('id', childId);
```

---

### Lessons

#### List Lessons

```typescript
GET /rest/v1/lessons?grade_level=eq.{grade}&is_active=eq.true

interface LessonFilters {
  grade_level?: number;
  subject?: string;
  is_active?: boolean;
}

const { data: lessons } = await supabase
  .from('lessons')
  .select('id, title, description, subject, grade_level, estimated_minutes, points_value, thumbnail_url')
  .eq('grade_level', grade)
  .eq('subject', 'math')
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

**Response**:
```json
[
  {
    "id": "uuid",
    "title": "Introduction to Fractions",
    "description": "Learn the basics of fractions...",
    "subject": "math",
    "grade_level": 3,
    "estimated_minutes": 15,
    "points_value": 50,
    "thumbnail_url": "https://..."
  }
]
```

#### Get Lesson Details

```typescript
GET /rest/v1/lessons?id=eq.{lessonId}

const { data: lesson } = await supabase
  .from('lessons')
  .select('*')
  .eq('id', lessonId)
  .single();
```

**Response** (includes full content):
```json
{
  "id": "uuid",
  "title": "Introduction to Fractions",
  "content_markdown": "# Fractions\n\nA fraction represents...",
  "quiz_questions": [
    {
      "question": "What is 1/2 + 1/4?",
      "options": ["3/4", "1/6", "2/6", "3/6"],
      "correct": 0,
      "explanation": "..."
    }
  ],
  // ... other fields
}
```

#### Search Lessons

```typescript
GET /rest/v1/lessons?title=ilike.*{query}*

const { data: results } = await supabase
  .from('lessons')
  .select('id, title, description, subject, grade_level')
  .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
  .eq('is_active', true)
  .limit(20);
```

---

### User Progress

#### Get Child's Progress

```typescript
GET /rest/v1/user_progress?child_id=eq.{childId}

const { data: progress } = await supabase
  .from('user_progress')
  .select(`
    *,
    lessons (
      id,
      title,
      subject,
      points_value
    )
  `)
  .eq('child_id', childId)
  .order('created_at', { ascending: false });
```

**Response**:
```json
[
  {
    "id": "uuid",
    "child_id": "uuid",
    "lesson_id": "uuid",
    "status": "completed",
    "score": 95,
    "time_spent_seconds": 900,
    "completed_at": "2024-01-15T10:30:00Z",
    "lessons": {
      "id": "uuid",
      "title": "Introduction to Fractions",
      "subject": "math",
      "points_value": 50
    }
  }
]
```

#### Create/Update Progress

```typescript
POST /rest/v1/user_progress
PATCH /rest/v1/user_progress?child_id=eq.{childId}&lesson_id=eq.{lessonId}

const { data, error } = await supabase
  .from('user_progress')
  .upsert({
    child_id: childId,
    lesson_id: lessonId,
    status: 'completed',
    score: 95,
    time_spent_seconds: 900,
    completed_at: new Date().toISOString(),
  })
  .select();
```

#### Get Progress Statistics

```typescript
// Custom query for stats
const { data: stats } = await supabase
  .from('user_progress')
  .select('status, score, lessons(subject)')
  .eq('child_id', childId);

// Calculate client-side
const totalCompleted = stats.filter(s => s.status === 'completed').length;
const avgScore = stats.reduce((sum, s) => sum + s.score, 0) / stats.length;
const bySubject = stats.reduce((acc, s) => {
  acc[s.lessons.subject] = (acc[s.lessons.subject] || 0) + 1;
  return acc;
}, {});
```

---

### Badges

#### Get Available Badges

```typescript
GET /rest/v1/achievement_badges?is_active=eq.true

const { data: badges } = await supabase
  .from('achievement_badges')
  .select('*')
  .eq('is_active', true)
  .order('tier', { ascending: true });
```

#### Get Child's Badges

```typescript
GET /rest/v1/user_badges?child_id=eq.{childId}

const { data: earnedBadges } = await supabase
  .from('user_badges')
  .select(`
    *,
    achievement_badges (
      badge_id,
      name,
      description,
      icon,
      tier,
      points_reward
    )
  `)
  .eq('child_id', childId)
  .order('earned_at', { ascending: false });
```

#### Award Badge

```typescript
POST /rest/v1/user_badges

const { data, error } = await supabase
  .from('user_badges')
  .insert({
    child_id: childId,
    badge_id: badgeId,
  })
  .select();
```

---

### Rewards

#### List Rewards (Parent)

```typescript
GET /rest/v1/rewards?parent_id=eq.{parentId}

const { data: rewards } = await supabase
  .from('rewards')
  .select('*')
  .eq('parent_id', parentId)
  .eq('is_active', true);
```

#### Create Reward

```typescript
POST /rest/v1/rewards

const { data: reward, error } = await supabase
  .from('rewards')
  .insert({
    parent_id: parentId,
    name: '30 minutes extra screen time',
    description: 'Additional 30 minutes of screen time',
    points_cost: 50,
    icon: 'screen',
  })
  .select()
  .single();
```

#### Request Reward Redemption

```typescript
POST /rest/v1/reward_redemptions

const { data, error } = await supabase
  .from('reward_redemptions')
  .insert({
    child_id: childId,
    reward_id: rewardId,
    points_spent: pointsCost,
    status: 'pending',
  })
  .select();
```

#### Approve/Deny Redemption

```typescript
PATCH /rest/v1/reward_redemptions?id=eq.{redemptionId}

const { data, error } = await supabase
  .from('reward_redemptions')
  .update({
    status: 'approved', // or 'denied'
    reviewed_at: new Date().toISOString(),
    reviewer_notes: 'Great job this week!',
  })
  .eq('id', redemptionId);
```

---

### Daily Quests

#### Get Today's Quests

```typescript
GET /rest/v1/daily_quests?child_id=eq.{childId}&date=eq.{today}

const today = new Date().toISOString().split('T')[0];

const { data: quests } = await supabase
  .from('daily_quests')
  .select('*')
  .eq('child_id', childId)
  .eq('date', today);
```

#### Update Quest Progress

```typescript
PATCH /rest/v1/daily_quests?id=eq.{questId}

const { data, error } = await supabase
  .from('daily_quests')
  .update({
    current_progress: newProgress,
    status: newProgress >= targetValue ? 'completed' : 'active',
  })
  .eq('id', questId);
```

---

### Notifications

#### Get User Notifications

```typescript
GET /rest/v1/notifications?user_id=eq.{userId}&is_read=eq.false

const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('created_at', { ascending: false })
  .limit(20);
```

#### Mark as Read

```typescript
PATCH /rest/v1/notifications?id=eq.{notificationId}

const { error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId);
```

#### Real-time Subscription

```typescript
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('New notification:', payload.new);
      // Update UI
    }
  )
  .subscribe();
```

---

### Screen Time Sessions

#### Track Session

```typescript
POST /rest/v1/screen_time_sessions

const { data: session, error } = await supabase
  .from('screen_time_sessions')
  .insert({
    child_id: childId,
    start_time: new Date().toISOString(),
  })
  .select()
  .single();
```

#### End Session

```typescript
PATCH /rest/v1/screen_time_sessions?id=eq.{sessionId}

const { error } = await supabase
  .from('screen_time_sessions')
  .update({
    end_time: new Date().toISOString(),
    duration_minutes: Math.floor((endTime - startTime) / 60000),
  })
  .eq('id', sessionId);
```

#### Get Session History

```typescript
GET /rest/v1/screen_time_sessions?child_id=eq.{childId}

const { data: sessions } = await supabase
  .from('screen_time_sessions')
  .select('*')
  .eq('child_id', childId)
  .gte('start_time', lastWeek)
  .order('start_time', { ascending: false });
```

---

## File Storage

### Avatar Upload

```typescript
// Upload avatar
const file = event.target.files[0];
const fileName = `${userId}/${Date.now()}-${file.name}`;

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(fileName);

// Update profile
await supabase
  .from('profiles')
  .update({ avatar_url: publicUrl })
  .eq('id', userId);
```

### Lesson Thumbnail Upload

```typescript
const { data, error } = await supabase.storage
  .from('lesson-thumbnails')
  .upload(`${lessonId}/thumbnail.jpg`, file);
```

---

## Error Handling

### Standard Error Format

```json
{
  "error": {
    "message": "Invalid input",
    "details": "grade_level must be between 0 and 12",
    "code": "22P02"
  }
}
```

### Common Error Codes

- `22P02`: Invalid input syntax
- `23505`: Unique violation
- `23503`: Foreign key violation
- `42501`: Permission denied (RLS)
- `PGRST116`: Row not found

### Error Handling Example

```typescript
try {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();
    
  if (error) throw error;
  
  return data;
} catch (error) {
  if (error.code === 'PGRST116') {
    throw new Error('Lesson not found');
  } else if (error.code === '42501') {
    throw new Error('Access denied');
  } else {
    console.error('Database error:', error);
    throw new Error('Failed to fetch lesson');
  }
}
```

---

## Security

### Row-Level Security (RLS)

All tables have RLS enabled. Policies enforce:

- **Profiles**: Users can only view/update their own profile
- **Children**: Parents can only access their own children
- **Lessons**: All authenticated users can view active lessons
- **Progress**: Parents can view their children's progress
- **Rewards**: Parents can only manage their own rewards
- **Redemptions**: Children can request, parents can approve

### Input Validation

Always validate and sanitize inputs:

```typescript
import { z } from 'zod';
import { sanitizeText } from '@/lib/inputSanitization';

const schema = z.object({
  name: z.string().min(1).max(100),
  grade_level: z.number().int().min(0).max(12),
});

const validated = schema.parse({
  name: sanitizeText(rawInput.name),
  grade_level: parseInt(rawInput.grade_level),
});
```

---

## Rate Limiting

Implement client-side rate limiting:

```typescript
import { RateLimiter } from '@/lib/rateLimiter';

const limiter = new RateLimiter();

if (!limiter.isAllowed(`api-call-${userId}`, 100, 60000)) {
  throw new Error('Rate limit exceeded. Please try again later.');
}

// Proceed with API call
await supabase.from('table').select('*');
```

---

## Best Practices

### 1. Use TypeScript Types

```typescript
import type { Database } from '@/integrations/supabase/types';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type LessonInsert = Database['public']['Tables']['lessons']['Insert'];
type LessonUpdate = Database['public']['Tables']['lessons']['Update'];
```

### 2. Handle Errors Gracefully

```typescript
const { data, error } = await supabase
  .from('lessons')
  .select('*');

if (error) {
  console.error('Error fetching lessons:', error);
  toast.error('Failed to load lessons');
  return [];
}

return data;
```

### 3. Use React Query for Caching

```typescript
export function useLessons(gradeLevel: number) {
  return useQuery({
    queryKey: ['lessons', gradeLevel],
    queryFn: () => fetchLessons(gradeLevel),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 4. Optimize Queries

```typescript
// ❌ Bad - fetches all columns
const { data } = await supabase
  .from('lessons')
  .select('*');

// ✅ Good - fetches only needed columns
const { data } = await supabase
  .from('lessons')
  .select('id, title, description, points_value');
```

### 5. Use Transactions When Needed

```typescript
// Atomic operation - award points and badge together
await supabase.rpc('award_points_and_badge', {
  p_child_id: childId,
  p_points: 50,
  p_badge_id: badgeId,
});
```

---

## Testing

### Mock Supabase Client

```typescript
import { vi } from 'vitest';

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    })),
  })),
};
```

### Integration Tests

```typescript
describe('Lesson API', () => {
  test('fetches lessons by grade level', async () => {
    const lessons = await getLessons(5);
    
    expect(lessons).toHaveLength(10);
    expect(lessons[0]).toHaveProperty('grade_level', 5);
  });
});
```

---

## Changelog

### v1.0.0 (Current)
- Initial API documentation
- All core endpoints documented
- RLS policies documented

---

**For questions or issues**, please open an issue on GitHub or contact the development team.
