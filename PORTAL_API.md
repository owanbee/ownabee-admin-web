# Portal API 엔드포인트 명세

모든 엔드포인트는 인증이 필요합니다 (JWT Bearer Token).

## 📋 목차

1. [사용자 정보](#1-사용자-정보)
2. [나의 리소스](#2-나의-리소스-my-resources)
3. [반(Class) 관리](#3-반class-관리)
4. [선생님-반 배정](#4-선생님-반-배정)
5. [학생 관리](#5-학생-관리)
6. [포트폴리오](#6-포트폴리오)
7. [공용 태블릿](#7-공용-태블릿)
8. [기관 구성원 관리](#8-기관-구성원-관리)
9. [사용자 검색](#9-사용자-검색)

---

## 1. 사용자 정보

### GET /api/portal/me

현재 로그인한 사용자의 정보 조회

**요청**

```
GET /api/portal/me
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "userId": "string",
  "email": "string",
  "name": "string",
  "picture": "string | null",
  "globalRole": "USER | OPERATOR",
  "roles": ["OPERATOR" | "INSTITUTION_ADMIN" | "TEACHER"],
  "isInstitutionAdmin": true,
  "isTeacher": false,
  "institutionMemberships": [
    {
      "institutionId": "string",
      "institutionName": "string",
      "role": "INSTITUTION_ADMIN | TEACHER"
    }
  ],
  "assignedClasses": [
    {
      "classId": "string",
      "className": "string",
      "institutionId": "string",
      "institutionName": "string"
    }
  ]
}
```

---

## 2. 나의 리소스 (My Resources)

### GET /api/portal/my-institutions

내가 속한 기관 목록 조회

**요청**

```
GET /api/portal/my-institutions
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
[
  {
    "id": "string",
    "name": "string",
    "memo": "string | null",
    "myRole": "INSTITUTION_ADMIN | TEACHER",
    "_count": {
      "institutionClasses": 5,
      "members": 10,
      "students": 50,
      "sharedTablets": 3
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /api/portal/my-classes

접근 가능한 모든 반 목록 조회 (Institution Admin: 기관 전체, Teacher: 배정된 반만)

**요청**

```
GET /api/portal/my-classes
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
[
  {
    "id": "string",
    "name": "string",
    "memo": "string | null",
    "institutionId": "string",
    "institution": {
      "id": "string",
      "name": "string"
    },
    "_count": {
      "students": 10,
      "teachers": 2,
      "sharedTablets": 3
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /api/portal/my-students

접근 가능한 모든 학생 조회

**요청**

```
GET /api/portal/my-students
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "students": [
    {
      "id": "string",
      "userId": "string",
      "username": "string | null",
      "name": "string",
      "userType": "STUDENT",
      "profiles": [
        {
          "id": "string",
          "name": "string",
          "picture": "string | null"
        }
      ],
      "institutionId": "string",
      "institutionClassId": "string",
      "institution": {
        "id": "string",
        "name": "string"
      },
      "institutionClass": {
        "id": "string",
        "name": "string"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

### GET /api/portal/my-shared-tablets

접근 가능한 모든 공용 태블릿 조회

**요청**

```
GET /api/portal/my-shared-tablets
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "tablets": [
    {
      "id": "string",
      "userId": "string",
      "username": "string | null",
      "name": "string",
      "institutionId": "string",
      "institutionClassId": "string",
      "institution": {
        "id": "string",
        "name": "string"
      },
      "institutionClass": {
        "id": "string",
        "name": "string"
      },
      "memo": "string | null",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 3
}
```

### GET /api/portal/my-portfolios

접근 가능한 모든 포트폴리오 조회

**요청**

```
GET /api/portal/my-portfolios
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "portfolios": [
    {
      "id": "string",
      "userId": "string",
      "profileId": "string",
      "title": "string",
      "coverComponents": {},
      "coverUrl": "string (presigned URL)",
      "profile": {
        "id": "string",
        "name": "string",
        "picture": "string | null",
        "user": {
          "id": "string",
          "email": "string",
          "name": "string"
        },
        "institution": {
          "id": "string",
          "name": "string"
        },
        "institutionClass": {
          "id": "string",
          "name": "string"
        }
      },
      "contents": [
        {
          "id": "string",
          "type": "IMAGE | PDF | AUDIOBOOK",
          "order": 0,
          "name": "string"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

---

## 3. 반(Class) 관리

### GET /api/portal/classes

접근 가능한 반 목록 조회 (legacy, /my-classes 사용 권장)

**요청/응답**: `/my-classes`와 동일

### POST /api/portal/classes

새 반 생성 **(Institution Admin 전용)**

**요청**

```json
POST /api/portal/classes
Authorization: Bearer {token}
Content-Type: application/json

{
  "institutionId": "string",
  "name": "string",
  "memo": "string (optional)"
}
```

**응답** (201 Created)

```json
{
  "message": "Class created successfully",
  "class": {
    "id": "string",
    "name": "string",
    "memo": "string | null",
    "institutionId": "string",
    "institution": {
      "id": "string",
      "name": "string"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/portal/classes/:classId

반 상세 조회

**요청**

```
GET /api/portal/classes/{classId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "id": "string",
  "name": "string",
  "memo": "string | null",
  "institutionId": "string",
  "institution": {
    "id": "string",
    "name": "string"
  },
  "_count": {
    "students": 10,
    "sharedTablets": 3
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/portal/classes/:classId

반 정보 수정 **(Institution Admin 전용)**

**요청**

```json
PUT /api/portal/classes/{classId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "memo": "string (optional)"
}
```

**응답** (200 OK)

```json
{
  "id": "string",
  "name": "string",
  "memo": "string | null",
  "institutionId": "string",
  "institution": {
    "id": "string",
    "name": "string"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /api/portal/classes/:classId

반 삭제 **(Institution Admin 전용)**

⚠️ **삭제 조건**: students와 sharedTablets가 0개여야 함

**요청**

```
DELETE /api/portal/classes/{classId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "message": "Class deleted successfully"
}
```

**에러** (400 Bad Request)

```json
{
  "error": "Cannot delete class with existing students",
  "details": "Class has 5 student(s)"
}
```

---

## 4. 선생님-반 배정

### GET /api/portal/classes/:classId/teachers

반에 배정된 선생님 목록 조회

**요청**

```
GET /api/portal/classes/{classId}/teachers
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
[
  {
    "id": "string",
    "institutionClassId": "string",
    "userId": "string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "picture": "string | null"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /api/portal/classes/:classId/teachers

반에 선생님 배정 **(Institution Admin 전용)**

**요청**

```json
POST /api/portal/classes/{classId}/teachers
Authorization: Bearer {token}
Content-Type: application/json

{
  "teacherUserId": "string"
}
```

**응답** (201 Created)

```json
{
  "id": "string",
  "institutionClassId": "string",
  "userId": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "picture": "string | null"
  },
  "institutionClass": {
    "id": "string",
    "name": "string",
    "institution": {
      "id": "string",
      "name": "string"
    }
  }
}
```

### DELETE /api/portal/classes/:classId/teachers/:teacherUserId

반에서 선생님 배정 해제 **(Institution Admin 전용)**

**요청**

```
DELETE /api/portal/classes/{classId}/teachers/{teacherUserId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "message": "Teacher unassigned successfully"
}
```

---

## 5. 학생 관리

### POST /api/portal/students

학생 계정 생성 **(Institution Admin 전용)**

**요청**

```json
POST /api/portal/students
Authorization: Bearer {token}
Content-Type: application/json

{
  "institutionId": "string",
  "institutionClassId": "string",
  "username": "string",
  "password": "string (최소 4자)",
  "name": "string",
  "studentNumber": "string (optional)",
  "grade": "string (optional)",
  "memo": "string (optional)"
}
```

**응답** (201 Created)

```json
{
  "message": "Student account created successfully",
  "student": {
    "id": "string",
    "userId": "string",
    "username": "string",
    "name": "string",
    "studentNumber": "string | null",
    "grade": "string | null",
    "institutionId": "string",
    "institutionClassId": "string",
    "profileId": "string"
  }
}
```

### GET /api/portal/students?institutionId=xxx&institutionClassId=yyy

학생 목록 조회 (기관별 또는 반별)

**쿼리 파라미터**:

- `institutionId` (필수): 기관 ID
- `institutionClassId` (선택): 반 ID (지정 시 해당 반의 학생만 조회)

**요청**

```
GET /api/portal/students?institutionId={institutionId}&institutionClassId={classId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "students": [
    {
      "id": "string",
      "userId": "string",
      "username": "string | null",
      "name": "string",
      "userType": "STUDENT",
      "profiles": [
        {
          "id": "string",
          "name": "string",
          "picture": "string | null"
        }
      ],
      "institutionId": "string",
      "institutionClassId": "string",
      "institution": {
        "id": "string",
        "name": "string"
      },
      "institutionClass": {
        "id": "string",
        "name": "string"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

### GET /api/portal/students/:studentId

학생 상세 조회

**요청**

```
GET /api/portal/students/{studentId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "userType": "STUDENT",
  "profiles": [
    {
      "id": "string",
      "name": "string",
      "picture": "string | null"
    }
  ],
  "institution": {
    "id": "string",
    "name": "string"
  },
  "institutionClass": {
    "id": "string",
    "name": "string"
  },
  "user": {
    "id": "string",
    "name": "string",
    "userType": "STUDENT"
  }
}
```

### PUT /api/portal/students/:studentId

학생 정보 수정 **(Institution Admin 전용)**

**요청**

```json
PUT /api/portal/students/{studentId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string (optional)",
  "studentNumber": "string (optional)",
  "grade": "string (optional)",
  "memo": "string (optional)",
  "institutionClassId": "string (optional, 반 이동)",
  "password": "string (optional, 최소 4자)"
}
```

**응답** (200 OK)

```json
{
  "message": "Student updated successfully",
  "student": {
    "id": "string",
    "name": "string",
    "studentNumber": "string | null",
    "grade": "string | null",
    "memo": "string | null"
  }
}
```

### DELETE /api/portal/students/:studentId

학생 계정 삭제 (Soft Delete) **(Institution Admin 전용)**

**요청**

```
DELETE /api/portal/students/{studentId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "message": "Student account deleted successfully"
}
```

---

## 6. 포트폴리오

> **중요**: 포트폴리오 API는 두 가지 방식으로 제공됩니다:
>
> 1. **기관/클래스 기반 조회**: `/api/portal/portfolios` - 쿼리스트링으로 필터링
> 2. **학생 기반 조회/수정**: `/api/portal/students/:studentId/portfolios` - studentId 사용

### GET /api/portal/portfolios

기관/클래스/학생별 포트폴리오 목록 조회 (필터링 가능)

**쿼리 파라미터** (모두 선택적):

- `institutionId`: 특정 기관의 포트폴리오만 조회
- `institutionClassId`: 특정 클래스의 포트폴리오만 조회
- `studentId`: 특정 학생(Student ID)의 포트폴리오만 조회
- 파라미터 없음: 접근 가능한 모든 포트폴리오 조회

**요청**

```
GET /api/portal/portfolios?institutionId={institutionId}&institutionClassId={institutionClassId}&studentId={studentId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
[
  {
    "id": "string",
    "userId": "string",
    "profileId": "string",
    "title": "string",
    "coverComponents": {},
    "coverUrl": "string (presigned URL)",
    "profile": {
      "id": "string",
      "name": "string",
      "picture": "string | null",
      "user": {
        "id": "string",
        "email": "string",
        "name": "string"
      },
      "institution": {
        "id": "string",
        "name": "string"
      },
      "institutionClass": {
        "id": "string",
        "name": "string"
      }
    },
    "contents": [
      {
        "id": "string",
        "type": "IMAGE | PDF | AUDIOBOOK",
        "order": 0,
        "name": "string"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**사용 예시**:

```
# 모든 접근 가능한 포트폴리오
GET /api/portal/portfolios

# 특정 기관의 포트폴리오
GET /api/portal/portfolios?institutionId=inst-123

# 특정 클래스의 포트폴리오
GET /api/portal/portfolios?institutionClassId=class-456

# 특정 학생의 포트폴리오
GET /api/portal/portfolios?studentId=student-789

# 특정 기관의 특정 클래스
GET /api/portal/portfolios?institutionId=inst-123&institutionClassId=class-456
```

### GET /api/portal/portfolios/:portfolioId

포트폴리오 상세 조회 (ID 기반)

**경로 파라미터**:

- `portfolioId`: Portfolio ID

**요청**

```
GET /api/portal/portfolios/{portfolioId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "id": "string",
  "userId": "string",
  "profileId": "string",
  "title": "string",
  "coverComponents": {},
  "coverUrl": "string (presigned URL)",
  "profile": {
    "id": "string",
    "name": "string",
    "picture": "string | null",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string"
    },
    "institution": {
      "id": "string",
      "name": "string"
    },
    "institutionClass": {
      "id": "string",
      "name": "string"
    }
  },
  "contents": [
    {
      "id": "string",
      "type": "IMAGE | PDF | AUDIOBOOK",
      "order": 0,
      "name": "string",
      "fileUrl": "string (presigned URL)",
      "coverPageUrl": "string (AUDIOBOOK인 경우, optional)",
      "audioBookEditionId": "string (AUDIOBOOK인 경우)"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**에러**:

- `403 Forbidden`: B2C 포트폴리오 접근 시 또는 권한 없음
- `404 Not Found`: 포트폴리오를 찾을 수 없음

---

### GET /api/portal/students/:studentId/portfolios

학생의 포트폴리오 목록 조회

**경로 파라미터**:

- `studentId`: Student 테이블의 ID (Student.id)

**요청**

```
GET /api/portal/students/{studentId}/portfolios
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
[
  {
    "id": "string",
    "userId": "string (student의 userId)",
    "profileId": "string",
    "title": "string",
    "coverComponents": {},
    "contents": [
      {
        "id": "string",
        "type": "IMAGE | PDF | AUDIOBOOK",
        "order": 0,
        "name": "string"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /api/portal/students/:studentId/portfolios

포트폴리오 저장/생성

**경로 파라미터**:

- `studentId`: Student 테이블의 ID (Student.id)

**요청**

```json
POST /api/portal/students/{studentId}/portfolios
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "id": "string (optional, 수정 시)",
  "title": "string",
  "content": "[JSON array of content items]",
  "coverComponents": "[JSON object, optional]",
  "cover": "File (optional, 커버 이미지)",
  "file_{tempId}": "File (업로드할 파일들)"
}
```

**content JSON 구조**:

```json
[
  {
    "id": "string (optional, 기존 항목)",
    "type": "IMAGE | PDF | AUDIOBOOK",
    "order": 0,
    "name": "string (optional)",
    "fileTempId": "string (새 파일인 경우)",
    "audioBookEditionId": "string (AUDIOBOOK인 경우)",
    "isNew": true
  }
]
```

**응답** (200 OK)

```json
{
  "id": "string",
  "userId": "string (student의 userId)",
  "profileId": "string",
  "title": "string",
  "coverComponents": {},
  "coverUrl": "string (presigned URL)",
  "contents": [
    {
      "id": "string",
      "type": "IMAGE | PDF | AUDIOBOOK",
      "order": 0,
      "name": "string",
      "fileUrl": "string (presigned URL)",
      "coverPageUrl": "string (AUDIOBOOK인 경우)"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/portal/students/:studentId/portfolios/:portfolioId

포트폴리오 상세 조회

**경로 파라미터**:

- `studentId`: Student 테이블의 ID (Student.id)
- `portfolioId`: Portfolio ID

**요청**

```
GET /api/portal/students/{studentId}/portfolios/{portfolioId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "id": "string",
  "userId": "string (student의 userId)",
  "profileId": "string",
  "title": "string",
  "coverComponents": {},
  "coverUrl": "string (presigned URL)",
  "contents": [
    {
      "id": "string",
      "type": "IMAGE | PDF | AUDIOBOOK",
      "order": 0,
      "name": "string",
      "fileUrl": "string (presigned URL)",
      "coverPageUrl": "string (AUDIOBOOK인 경우, optional)",
      "audioBookEditionId": "string (AUDIOBOOK인 경우)"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 7. 공용 태블릿

### POST /api/portal/shared-tablets

공용 태블릿 생성 **(Institution Admin 전용)**

**요청**

```json
POST /api/portal/shared-tablets
Authorization: Bearer {token}
Content-Type: application/json

{
  "institutionId": "string",
  "institutionClassId": "string",
  "name": "string",
  "username": "string",
  "password": "string (최소 4자)",
  "memo": "string (optional)"
}
```

**응답** (201 Created)

```json
{
  "message": "Shared tablet created successfully",
  "tablet": {
    "id": "string",
    "userId": "string",
    "username": "string",
    "name": "string",
    "institutionId": "string",
    "institutionClassId": "string",
    "memo": "string | null",
    "profileId": "string"
  }
}
```

### GET /api/portal/shared-tablets?institutionId=xxx&institutionClassId=yyy

공용 태블릿 목록 조회 (기관별 또는 반별)

**쿼리 파라미터**:

- `institutionId` (필수): 기관 ID
- `institutionClassId` (선택): 반 ID (지정 시 해당 반의 태블릿만 조회)

**요청**

```
GET /api/portal/shared-tablets?institutionId={institutionId}&institutionClassId={classId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "tablets": [
    {
      "id": "string",
      "userId": "string",
      "username": "string | null",
      "name": "string",
      "institutionId": "string",
      "institutionClassId": "string",
      "institution": {
        "id": "string",
        "name": "string"
      },
      "institutionClass": {
        "id": "string",
        "name": "string"
      },
      "memo": "string | null",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 3
}
```

### GET /api/portal/shared-tablets/:id

공용 태블릿 상세 조회

**요청**

```
GET /api/portal/shared-tablets/{id}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "memo": "string | null",
  "institutionId": "string",
  "institutionClassId": "string",
  "institution": {
    "id": "string",
    "name": "string"
  },
  "institutionClass": {
    "id": "string",
    "name": "string"
  },
  "user": {
    "id": "string",
    "name": "string"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/portal/shared-tablets/:id

공용 태블릿 정보 수정 **(Institution Admin 전용)**

**요청**

```json
PUT /api/portal/shared-tablets/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string (optional)",
  "memo": "string (optional)",
  "password": "string (optional, 최소 4자)"
}
```

**응답** (200 OK)

```json
{
  "message": "Shared tablet updated successfully",
  "tablet": {
    "id": "string",
    "name": "string",
    "memo": "string | null"
  }
}
```

### DELETE /api/portal/shared-tablets/:id

공용 태블릿 삭제 (Soft Delete) **(Institution Admin 전용)**

**요청**

```
DELETE /api/portal/shared-tablets/{id}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "message": "Shared tablet deleted successfully"
}
```

---

## 8. 기관 구성원 관리

### GET /api/portal/members?institutionId=xxx

기관 구성원 목록 조회 **(Institution Admin 전용)**

**요청**

```
GET /api/portal/members?institutionId={institutionId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
[
  {
    "id": "string",
    "institutionId": "string",
    "userId": "string",
    "role": "INSTITUTION_ADMIN | TEACHER",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "picture": "string | null"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /api/portal/members

기관 구성원 추가 **(Institution Admin 전용)**

**요청**

```json
POST /api/portal/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "institutionId": "string",
  "memberUserId": "string",
  "role": "INSTITUTION_ADMIN | TEACHER"
}
```

**응답** (201 Created)

```json
{
  "message": "Member added successfully",
  "member": {
    "id": "string",
    "institutionId": "string",
    "userId": "string",
    "role": "INSTITUTION_ADMIN | TEACHER",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
}
```

**기존 구성원 역할 업데이트** (200 OK)

```json
{
  "message": "Member role updated successfully",
  "member": {
    /* 동일한 구조 */
  }
}
```

### DELETE /api/portal/members/:memberUserId?institutionId=xxx

기관 구성원 제거 **(Institution Admin 전용)**

⚠️ **제한사항**: 자기 자신은 제거 불가

**요청**

```
DELETE /api/portal/members/{memberUserId}?institutionId={institutionId}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
{
  "message": "Member removed successfully"
}
```

---

## 9. 사용자 검색

### GET /api/portal/users/search?email=xxx

이메일로 사용자 검색 (구성원 추가용)

**요청**

```
GET /api/portal/users/search?email={searchQuery}
Authorization: Bearer {token}
```

**응답** (200 OK)

```json
[
  {
    "id": "string",
    "email": "string",
    "name": "string",
    "picture": "string | null",
    "globalRole": "USER | OPERATOR"
  }
]
```

_최대 10명까지 반환, 대소문자 구분 없이 부분 검색_

---

## 🔐 권한 체크

- **모든 엔드포인트**: 인증 필요 (JWT Token)
- **Institution Admin 전용**:
  - 반/학생/태블릿 생성/수정/삭제
  - 구성원 관리
  - 선생님-반 배정 관리

## 🚨 공통 에러 응답

```json
// 400 Bad Request
{ "error": "Error message" }

// 403 Forbidden
{ "error": "Institution Admin permission required" }

// 404 Not Found
{ "error": "Resource not found" }

// 409 Conflict
{ "error": "Resource already exists" }

// 500 Internal Server Error
{
  "error": "Error message",
  "details": "Detailed error information"
}
```
