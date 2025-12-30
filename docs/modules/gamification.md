# Gamification Module Documentation

**Module**: Gamification System (Points, Badges, Quests, Rewards)  
**Location**: `src/components/gamification/`, `src/lib/badgeChecker.ts`, `src/lib/questGenerator.ts`  
**Last Updated**: 2024-12-30

---

## Overview

The gamification module makes learning engaging through points, badges, daily quests, and rewards. It motivates children to complete lessons and achieve learning goals while giving parents control over the reward system.

## Architecture

### System Components

```
Gamification System
├── Points System
│   ├── Earn points for lessons
│   ├── Track total points
│   └── Spend on rewards
├── Badge System
│   ├── Achievement definitions
│   ├── Unlock criteria
│   └── Badge tiers (Bronze, Silver, Gold)
├── Quest System
│   ├── Daily quest generation
│   ├── Progress tracking
│   └── Bonus rewards
├── Reward System
│   ├── Parent-defined rewards
│   ├── Redemption workflow
│   └── Approval process
└── Token Economy
    ├── Avatar item purchases
    ├── Token earning
    └── Customization unlocks
```

## Points System

### How Points Work

**Earning Points**:
- Complete a lesson: 50-100 points (based on difficulty)
- Complete a quiz with 80%+: +25 bonus points
- Complete a daily quest: 30-75 points
- First lesson of the day: +10 bonus points
- Lesson streak (7 days): +50 bonus points

**Point Storage**:
```sql
-- In children table
total_points INTEGER DEFAULT 0
```

### Point Calculation

**Location**: Inline in lesson completion logic

```typescript
function calculatePoints(lesson: Lesson, quizScore: number): number {
  let points = lesson.points_value; // Base points (50-100)
  
  // Quiz bonus
  if (quizScore >= 80) {
    points += 25;
  } else if (quizScore >= 90) {
    points += 50;
  }
  
  // First lesson of day bonus
  if (isFirstLessonToday) {
    points += 10;
  }
  
  // Streak bonus
  if (streakDays >= 7) {
    points += 50;
  }
  
  return points;
}
```

### Updating Points

```typescript
async function awardPoints(childId: string, points: number): Promise<void> {
  const { error } = await supabase
    .from('children')
    .update({ 
      total_points: supabase.sql`total_points + ${points}` 
    })
    .eq('id', childId);
    
  if (error) throw error;
  
  // Show celebration animation
  showPointsAnimation(points);
}
```

## Badge System

### Badge Structure

**Database Schema**:
```sql
CREATE TABLE achievement_badges (
  id UUID PRIMARY KEY,
  badge_id TEXT UNIQUE,        -- e.g., 'first-lesson', 'math-master'
  name TEXT NOT NULL,           -- Display name
  description TEXT,             -- What it's for
  icon TEXT,                    -- Icon identifier
  category TEXT,                -- 'lesson', 'quest', 'social', 'special'
  tier TEXT,                    -- 'bronze', 'silver', 'gold', 'platinum'
  unlock_criteria JSONB,        -- Conditions to unlock
  points_reward INTEGER,        -- Bonus points on unlock
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES children(id),
  badge_id UUID REFERENCES achievement_badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, badge_id)
);
```

### Unlock Criteria

Criteria stored as JSONB:

```json
{
  "type": "lessons_completed",
  "value": 10,
  "subject": "math"
}

{
  "type": "streak_days",
  "value": 7
}

{
  "type": "quiz_perfect_scores",
  "value": 5
}

{
  "type": "combined",
  "conditions": [
    { "type": "lessons_completed", "value": 50 },
    { "type": "quiz_avg_score", "value": 85 }
  ]
}
```

### Badge Checker

**Location**: `src/lib/badgeChecker.ts`

```typescript
interface BadgeCriteria {
  type: string;
  value: number;
  subject?: string;
}

export async function checkBadgeUnlocks(childId: string): Promise<Badge[]> {
  // Get child's stats
  const stats = await getChildStats(childId);
  
  // Get all active badges
  const { data: badges } = await supabase
    .from('achievement_badges')
    .select('*')
    .eq('is_active', true);
  
  // Get already earned badges
  const { data: earned } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('child_id', childId);
    
  const earnedIds = new Set(earned?.map(b => b.badge_id) || []);
  
  // Check each badge
  const newlyUnlocked: Badge[] = [];
  
  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;
    
    if (meetsCriteria(stats, badge.unlock_criteria)) {
      // Award badge
      await awardBadge(childId, badge.id);
      newlyUnlocked.push(badge);
    }
  }
  
  return newlyUnlocked;
}

function meetsCriteria(stats: ChildStats, criteria: BadgeCriteria): boolean {
  switch (criteria.type) {
    case 'lessons_completed':
      const count = criteria.subject
        ? stats.lessonsBySubject[criteria.subject]
        : stats.totalLessons;
      return count >= criteria.value;
      
    case 'streak_days':
      return stats.currentStreak >= criteria.value;
      
    case 'quiz_perfect_scores':
      return stats.perfectScores >= criteria.value;
      
    case 'combined':
      return criteria.conditions.every(c => meetsCriteria(stats, c));
      
    default:
      return false;
  }
}
```

### Badge Categories

1. **Lesson Badges**
   - First Lesson: Complete 1st lesson
   - Dedicated Learner: Complete 10 lessons
   - Knowledge Seeker: Complete 50 lessons
   - Master Scholar: Complete 100 lessons

2. **Subject Badges**
   - Math Master: Complete 20 math lessons
   - Reading Champion: Complete 20 reading lessons
   - Science Explorer: Complete 20 science lessons
   - Social Studies Pro: Complete 20 social lessons

3. **Streak Badges**
   - Week Warrior: 7-day streak
   - Month Master: 30-day streak
   - Year Champion: 365-day streak

4. **Performance Badges**
   - Perfect Score: 10 perfect quiz scores
   - Quick Learner: Complete lesson in < 10 min
   - Thoroughness: Read all lesson content

5. **Special Badges**
   - Beta Tester: Joined beta program
   - First to 1000: Reached 1000 points first
   - Community Helper: Shared 5 lessons

### Badge Tiers

Badges have different tiers that increase difficulty:

```typescript
const BADGE_TIERS = {
  bronze: { color: '#CD7F32', multiplier: 1 },
  silver: { color: '#C0C0C0', multiplier: 2 },
  gold: { color: '#FFD700', multiplier: 3 },
  platinum: { color: '#E5E4E2', multiplier: 5 },
};
```

Example:
- Bronze Math Master: 10 math lessons
- Silver Math Master: 25 math lessons
- Gold Math Master: 50 math lessons
- Platinum Math Master: 100 math lessons

## Quest System

### Daily Quests

Auto-generated personalized quests each day.

**Database Schema**:
```sql
CREATE TABLE daily_quests (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES children(id),
  quest_type TEXT,              -- 'lesson_count', 'subject_specific', etc.
  description TEXT,             -- Human-readable description
  target_value INTEGER,         -- Goal (e.g., complete 3 lessons)
  current_progress INTEGER DEFAULT 0,
  points_reward INTEGER,        -- Bonus points on completion
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'expired'
  date DATE NOT NULL,
  UNIQUE(child_id, date)
);
```

### Quest Generator

**Location**: `src/lib/questGenerator.ts`

```typescript
interface Quest {
  type: string;
  description: string;
  target: number;
  reward: number;
}

export function generateDailyQuests(
  child: Child,
  history: LearningHistory
): Quest[] {
  const quests: Quest[] = [];
  
  // Quest 1: Lesson completion
  const lessonQuest = {
    type: 'lesson_count',
    description: 'Complete 3 lessons today',
    target: 3,
    reward: 50,
  };
  quests.push(lessonQuest);
  
  // Quest 2: Subject focus (based on weakest subject)
  const weakestSubject = findWeakestSubject(history);
  const subjectQuest = {
    type: 'subject_specific',
    description: `Complete 2 ${weakestSubject} lessons`,
    target: 2,
    reward: 40,
  };
  quests.push(subjectQuest);
  
  // Quest 3: Performance
  const performanceQuest = {
    type: 'quiz_score',
    description: 'Score 90% or higher on 2 quizzes',
    target: 2,
    reward: 30,
  };
  quests.push(performanceQuest);
  
  return quests;
}
```

### Quest Types

1. **Lesson Count**: Complete N lessons
2. **Subject Specific**: Complete N lessons in specific subject
3. **Quiz Performance**: Score above threshold on N quizzes
4. **Time-based**: Spend N minutes learning
5. **Streak**: Maintain learning streak
6. **Social**: Collaborate with a friend

### Quest Completion

```typescript
async function updateQuestProgress(
  childId: string,
  questType: string,
  increment: number = 1
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: quest } = await supabase
    .from('daily_quests')
    .select('*')
    .eq('child_id', childId)
    .eq('date', today)
    .eq('quest_type', questType)
    .eq('status', 'active')
    .single();
    
  if (!quest) return;
  
  const newProgress = quest.current_progress + increment;
  
  // Check if quest completed
  if (newProgress >= quest.target_value) {
    await completeQuest(childId, quest.id, quest.points_reward);
  } else {
    await supabase
      .from('daily_quests')
      .update({ current_progress: newProgress })
      .eq('id', quest.id);
  }
}

async function completeQuest(
  childId: string,
  questId: string,
  reward: number
): Promise<void> {
  // Mark quest complete
  await supabase
    .from('daily_quests')
    .update({ 
      status: 'completed',
      current_progress: quest.target_value
    })
    .eq('id', questId);
  
  // Award points
  await awardPoints(childId, reward);
  
  // Show celebration
  showQuestCompleteAnimation();
  toast.success(`Quest completed! +${reward} points`);
}
```

## Reward System

### Parent-Defined Rewards

Parents create custom rewards for their children.

**Database Schema**:
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,               -- e.g., "30 min extra screen time"
  description TEXT,                 -- Additional details
  points_cost INTEGER NOT NULL,     -- How many points to redeem
  icon TEXT,                        -- Icon identifier
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES children(id),
  reward_id UUID REFERENCES rewards(id),
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',    -- 'pending', 'approved', 'denied'
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT
);
```

### Redemption Workflow

```
1. Child browses rewards
   ↓
2. Child requests reward (if enough points)
   ↓
3. Notification sent to parent
   ↓
4. Parent reviews request
   ↓
5. Parent approves/denies
   ↓
6. If approved: Points deducted
   ↓
7. Notification sent to child
```

### Reward Request

```typescript
async function requestReward(
  childId: string,
  rewardId: string
): Promise<void> {
  // Get child's current points
  const { data: child } = await supabase
    .from('children')
    .select('total_points, parent_id')
    .eq('id', childId)
    .single();
  
  // Get reward details
  const { data: reward } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .single();
  
  // Check if child has enough points
  if (child.total_points < reward.points_cost) {
    throw new Error('Not enough points');
  }
  
  // Create redemption request
  const { data: redemption } = await supabase
    .from('reward_redemptions')
    .insert({
      child_id: childId,
      reward_id: rewardId,
      points_spent: reward.points_cost,
      status: 'pending',
    })
    .select()
    .single();
  
  // Notify parent
  await createNotification({
    user_id: child.parent_id,
    type: 'reward_request',
    title: 'Reward Request',
    message: `Your child requested: ${reward.name}`,
    related_id: redemption.id,
  });
  
  toast.success('Reward requested! Waiting for parent approval.');
}
```

### Reward Approval

```typescript
async function approveReward(
  redemptionId: string,
  notes?: string
): Promise<void> {
  // Get redemption details
  const { data: redemption } = await supabase
    .from('reward_redemptions')
    .select('*, children(parent_id, total_points)')
    .eq('id', redemptionId)
    .single();
  
  // Deduct points
  await supabase
    .from('children')
    .update({
      total_points: redemption.children.total_points - redemption.points_spent
    })
    .eq('id', redemption.child_id);
  
  // Update redemption status
  await supabase
    .from('reward_redemptions')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewer_notes: notes,
    })
    .eq('id', redemptionId);
  
  // Notify child
  await createNotification({
    user_id: redemption.child_id,
    type: 'reward_approved',
    title: 'Reward Approved!',
    message: `Your reward has been approved!`,
    related_id: redemptionId,
  });
}

async function denyReward(
  redemptionId: string,
  reason: string
): Promise<void> {
  // Update redemption status
  await supabase
    .from('reward_redemptions')
    .update({
      status: 'denied',
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reason,
    })
    .eq('id', redemptionId);
  
  // Notify child (points not deducted)
  await createNotification({
    user_id: redemption.child_id,
    type: 'reward_denied',
    title: 'Reward Request Denied',
    message: reason || 'Your reward request was denied.',
    related_id: redemptionId,
  });
}
```

### Common Reward Examples

Parents typically create rewards like:
- 30 minutes extra screen time (50 points)
- Choose dinner menu (75 points)
- Stay up 30 min late (100 points)
- Movie night choice (100 points)
- Pizza night (150 points)
- Small toy under $10 (200 points)
- Day trip to favorite place (500 points)

## Token Economy

### Avatar Item Purchases

Separate from rewards, tokens unlock avatar customization items.

**Token Earning**:
- Complete lesson: 10 tokens
- Earn badge: 25 tokens
- Complete quest: 15 tokens

**Token Spending**:
- Hair styles: 50-100 tokens
- Accessories: 75-150 tokens
- Backgrounds: 100-200 tokens
- Special items: 250-500 tokens

**Storage**:
```sql
-- In children table
total_tokens INTEGER DEFAULT 0

-- In avatar_items table
CREATE TABLE avatar_items (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT, -- 'hair', 'accessory', 'background'
  token_cost INTEGER NOT NULL,
  icon_url TEXT,
  unlock_condition JSONB -- Optional badge requirement
);
```

## Celebration Animations

### Point Animation

**Location**: `src/components/celebration/PointsAnimation.tsx`

```typescript
export function PointsAnimation({ points }: { points: number }) {
  return (
    <motion.div
      initial={{ scale: 0, y: 0 }}
      animate={{ scale: [0, 1.2, 1], y: -50 }}
      exit={{ opacity: 0, y: -100 }}
      className="text-4xl font-bold text-yellow-500"
    >
      +{points} points!
    </motion.div>
  );
}
```

### Badge Unlock Animation

**Location**: `src/components/celebration/BadgeUnlockAnimation.tsx`

Shows confetti and badge modal when earned.

```typescript
export function BadgeUnlockModal({ badge }: { badge: Badge }) {
  return (
    <>
      <Confetti numberOfPieces={200} recycle={false} />
      <Dialog open>
        <DialogContent>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <Badge size="large" badge={badge} />
          </motion.div>
          <h2>Badge Unlocked!</h2>
          <p>{badge.description}</p>
          <p>+{badge.points_reward} points</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## Best Practices

### Balancing the Economy

1. **Point Values**: Lessons should give 50-100 points
2. **Reward Costs**: Start at 50 points minimum
3. **Quest Rewards**: 30-75 points per quest
4. **Badge Bonuses**: 25-100 points per badge

### Avoiding Exploitation

- Rate limit point earning actions
- Validate quiz scores server-side
- Audit point changes in security logs
- Alert parents to unusual activity

### Engagement Strategies

- Daily quests keep children coming back
- Badges provide long-term goals
- Rewards give immediate gratification
- Tokens enable personalization

## Testing

### Unit Tests

```typescript
describe('badgeChecker', () => {
  test('unlocks first lesson badge', async () => {
    const stats = { totalLessons: 1 };
    const criteria = { type: 'lessons_completed', value: 1 };
    
    expect(meetsCriteria(stats, criteria)).toBe(true);
  });
  
  test('does not unlock if criteria not met', async () => {
    const stats = { totalLessons: 5 };
    const criteria = { type: 'lessons_completed', value: 10 };
    
    expect(meetsCriteria(stats, criteria)).toBe(false);
  });
});
```

## Future Enhancements

1. **Seasonal Events**: Special quests and badges for holidays
2. **Leaderboards**: Friend-based, privacy-focused competition
3. **Team Challenges**: Collaborative quests with friends
4. **Limited Edition Badges**: Time-limited unlock opportunities
5. **Achievement Showcase**: Public profile badges
6. **Trading System**: Trade avatar items with friends (parent-approved)

## Related Documentation

- [Lessons Module](./lessons.md)
- [Social Module](./social.md)
- [Database Schema](../DATABASE_SCHEMA.md)

---

**Last Updated**: 2024-12-30  
**Maintainer**: Development Team  
**Review Schedule**: Quarterly
