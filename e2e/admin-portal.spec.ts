import { test, expect, Page } from "@playwright/test";

const TEST_EMAIL = "holyfavor@gmail.com";
const TEST_PIN = "123456";

/**
 * Admin Portal E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 로그인
 * 2. 클래스 목록 조회
 * 3. 클래스 상세 페이지 - 공용 태블릿 관리
 * 4. 클래스 학생 목록 조회
 * 5. 포트폴리오 생성/조회/수정
 * 6. 포트폴리오 전송
 * 7. 부모 등록 및 관리
 */

async function login(page: Page) {
  await page.goto("/login");
  
  // PIN 탭이 기본 선택되어 있음
  await page.getByRole("textbox", { name: "Email" }).fill(TEST_EMAIL);
  await page.getByRole("textbox", { name: "PIN Code" }).fill(TEST_PIN);
  await page.getByRole("button", { name: "Sign in with PIN" }).click();
  
  // 대시보드로 리다이렉트 확인
  await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
}

test.describe("Admin Portal - 인증", () => {
  test("PIN 로그인 성공", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
  });

  test("잘못된 PIN으로 로그인 실패", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email" }).fill(TEST_EMAIL);
    await page.getByRole("textbox", { name: "PIN Code" }).fill("000000");
    await page.getByRole("button", { name: "Sign in with PIN" }).click();
    
    // 에러 메시지 확인
    await expect(page.getByText(/Invalid|error/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Admin Portal - 클래스 관리", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("클래스 목록 조회", async ({ page }) => {
    await page.getByRole("link", { name: "Manage Classes" }).click();
    await expect(page).toHaveURL("/admin/classes");
    await expect(page.getByRole("heading", { name: "Manage Classes" })).toBeVisible();
  });

  test("클래스 상세 페이지 - 공용 태블릿 관리", async ({ page }) => {
    await page.goto("/admin/classes");
    
    // 첫 번째 클래스의 "Manage Shared Tablets" 링크 클릭
    const tabletLink = page.getByRole("link", { name: "Manage Shared Tablets" }).first();
    if (await tabletLink.isVisible()) {
      await tabletLink.click();
      
      // 클래스 상세 페이지 확인
      await expect(page.getByRole("heading", { name: "Shared Tablets" })).toBeVisible();
      
      // Add Tablet 버튼 확인
      await expect(page.getByRole("button", { name: "Add Tablet" })).toBeVisible();
    }
  });

  test("공용 태블릿 등록", async ({ page }) => {
    await page.goto("/admin/classes");
    
    const tabletLink = page.getByRole("link", { name: "Manage Shared Tablets" }).first();
    if (await tabletLink.isVisible()) {
      await tabletLink.click();
      
      // Add Tablet 버튼 클릭
      await page.getByRole("button", { name: "Add Tablet" }).click();
      
      // 모달 확인
      await expect(page.getByRole("heading", { name: "Add Shared Tablet" })).toBeVisible();
      
      // 폼 입력
      const timestamp = Date.now();
      await page.getByRole("textbox", { name: "Tablet Name" }).fill(`Test Tablet ${timestamp}`);
      await page.getByRole("textbox", { name: "Login ID" }).fill(`test_tablet_${timestamp}`);
      await page.getByRole("textbox", { name: "PIN Code" }).fill("1234");
      
      // 생성 버튼 클릭
      await page.getByRole("button", { name: "Create Tablet" }).click();
      
      // 생성된 태블릿 확인
      await expect(page.getByText(`Test Tablet ${timestamp}`)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Admin Portal - 클래스 학생 목록", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("클래스 학생 목록 조회", async ({ page }) => {
    await page.getByRole("link", { name: "Classes" }).first().click();
    await expect(page).toHaveURL("/classes");
    
    // 클래스 카드 클릭
    const classCard = page.locator("[data-testid='class-card']").first();
    if (await classCard.isVisible()) {
      await classCard.click();
      
      // 학생 목록 확인
      await expect(page.getByText(/students/i)).toBeVisible();
    }
  });
});

test.describe("Admin Portal - 포트폴리오 관리", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("학생 포트폴리오 목록 조회", async ({ page }) => {
    // 클래스 페이지로 이동
    await page.goto("/classes");
    
    // 첫 번째 클래스 클릭 (있는 경우)
    const classLink = page.getByRole("link").filter({ hasText: /View Students|students/i }).first();
    if (await classLink.isVisible()) {
      await classLink.click();
      
      // 학생 목록 페이지 확인
      await expect(page.getByText(/Student|Portfolio/i)).toBeVisible();
    }
  });

  test("포트폴리오 생성", async ({ page }) => {
    // 학생 포트폴리오 페이지로 직접 이동 (테스트용 프로필 ID 필요)
    // 실제 테스트에서는 동적으로 프로필 ID를 가져와야 함
    await page.goto("/classes");
    
    // 클래스 선택 후 학생 선택
    const classCard = page.locator("a[href*='/classes/']").first();
    if (await classCard.isVisible()) {
      await classCard.click();
      
      // 학생 선택
      const studentCard = page.locator("a[href*='/students/']").first();
      if (await studentCard.isVisible()) {
        await studentCard.click();
        
        // 포트폴리오 생성 버튼 확인
        const createBtn = page.getByRole("button", { name: /Create|New|Add/i });
        if (await createBtn.isVisible()) {
          await createBtn.click();
          
          // 포트폴리오 폼 확인
          await expect(page.getByRole("textbox", { name: /Title/i })).toBeVisible();
        }
      }
    }
  });
});

test.describe("Admin Portal - 부모 관리", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("부모 목록 조회", async ({ page }) => {
    await page.getByRole("link", { name: "Parents" }).click();
    await expect(page).toHaveURL("/admin/parents");
    await expect(page.getByRole("heading", { name: /Parents/i })).toBeVisible();
  });

  test("부모 등록 모달 열기", async ({ page }) => {
    await page.goto("/admin/parents");
    
    const addBtn = page.getByRole("button", { name: /Add|Register|New/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      
      // 모달 확인
      await expect(page.getByRole("dialog")).toBeVisible();
    }
  });
});

test.describe("Admin Portal - 포트폴리오 전송", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("전송 페이지 접근", async ({ page }) => {
    await page.getByRole("link", { name: "Transfers" }).click();
    await expect(page).toHaveURL("/admin/transfers");
    await expect(page.getByRole("heading", { name: /Transfer/i })).toBeVisible();
  });

  test("전송 이력 조회", async ({ page }) => {
    await page.goto("/admin/transfers/history");
    await expect(page.getByText(/History|Transfer/i)).toBeVisible();
  });
});

test.describe("Admin Portal - 공용 태블릿 관리 (기관별)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("공용 태블릿 목록 조회", async ({ page }) => {
    await page.getByRole("link", { name: "Shared Tablets" }).click();
    await expect(page).toHaveURL("/admin/shared-tablets");
    await expect(page.getByRole("heading", { name: /Shared Tablets/i })).toBeVisible();
  });
});

test.describe("Admin Portal - 기관 관리", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("기관 목록 조회", async ({ page }) => {
    await page.getByRole("link", { name: "Institutions" }).click();
    await expect(page).toHaveURL("/admin/institutions");
    await expect(page.getByRole("heading", { name: /Institutions/i })).toBeVisible();
  });
});

test.describe("Admin Portal - 멤버 관리", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("멤버 목록 조회", async ({ page }) => {
    await page.getByRole("link", { name: "Members" }).click();
    await expect(page).toHaveURL("/admin/members");
    await expect(page.getByRole("heading", { name: /Members/i })).toBeVisible();
  });
});
