# API Updates Summary

PORTAL_API.md 명세에 맞춰 `src/lib/api.ts`를 업데이트했습니다.

## 🔄 수정된 API 메서드

### 1. My Resources (나의 리소스)

**변경 전:**
```typescript
async getMyClasses(): Promise<InstitutionClass[]>
  → GET /portal/classes

async getMyStudents(): Promise<Student[]>  
  → 클라이언트 사이드 aggregation (비효율적)

async getMySharedTablets(): Promise<SharedTablet[]>
  → 클라이언트 사이드 aggregation (비효율적)
```

**변경 후:**
```typescript
async getMyClasses(): Promise<InstitutionClass[]>
  → GET /portal/my-classes

async getMyStudents(): Promise<{ students: Student[]; total: number }>
  → GET /portal/my-students

async getMySharedTablets(): Promise<{ tablets: SharedTablet[]; total: number }>
  → GET /portal/my-shared-tablets
```

### 2. Classes (반 관리)

**추가된 메서드:**
```typescript
async updatePortalClass(classId: string, payload: UpdateClassPayload): Promise<InstitutionClass>
  → PUT /portal/classes/:classId

async deletePortalClass(classId: string): Promise<void>
  → DELETE /portal/classes/:classId
```

### 3. Students (학생 관리)

**추가된 메서드:**
```typescript
async deletePortalStudent(studentId: string): Promise<void>
  → DELETE /portal/students/:studentId

async getStudentPortfolios(studentId: string): Promise<{ portfolios: Portfolio[]; total: number }>
  → GET /portal/students/:studentId/portfolios
```

### 4. Shared Tablets (공용 태블릿)

**추가된 메서드:**
```typescript
async createPortalSharedTablet(payload: CreateSharedTabletPayload): Promise<SharedTablet>
  → POST /portal/shared-tablets

async updatePortalSharedTablet(id: string, payload: UpdateSharedTabletPayload): Promise<SharedTablet>
  → PUT /portal/shared-tablets/:id

async deletePortalSharedTablet(id: string): Promise<void>
  → DELETE /portal/shared-tablets/:id
```

### 5. User Search (사용자 검색)

**이름 변경 및 추가:**
```typescript
async searchPortalUser(email: string): Promise<UserSearchResult[]>
  → GET /portal/users/search?email=xxx
  (기존 searchUserByEmail과 충돌 방지를 위해 이름 변경)
```

## 🗑️ 제거된 메서드

```typescript
async getClassStudents(classId: string): Promise<Student[]>
  → PORTAL_API.md 명세에 없는 legacy 엔드포인트
```

## 📝 타입 업데이트

### AssignTeacherPayload
```typescript
// Before
{ userId: string }

// After  
{ teacherUserId: string }
```

## ✅ 완료된 작업

1. ✅ 모든 Portal API 엔드포인트가 PORTAL_API.md와 일치
2. ✅ 응답 구조 통일 (`{ items: [], total: number }` 패턴)
3. ✅ CRUD 작업 완성 (Create, Read, Update, Delete)
4. ✅ 메서드명 충돌 해결 (`searchPortalUser` vs `searchUserByEmail`)
5. ✅ Legacy 코드 제거 (클라이언트 사이드 aggregation)

## 🎯 다음 단계

페이지 컴포넌트에서 업데이트된 API 메서드를 사용하도록 수정이 필요할 수 있습니다:
- Portal 페이지: `api.searchPortalUser()` 사용
- Admin 페이지: `api.searchUserByEmail()` 사용 (기존 유지)
