# 권한 보유 AI용 실행 명령서: 채원이 돌잔치 초대장 외부 독립 배포

## 역할과 목표

당신은 아래 서비스에 대해 **실제 권한을 보유한 배포 담당 AI**입니다.

- 비공개 GitHub 저장소: `https://github.com/lgkangno1-svg/doljanchi-invitation`
- Railway 또는 동등한 Node.js + MySQL 호스팅 계정
- Cloudflare DNS의 `avocadoss.co.kr` Zone
- Cloudflare R2 또는 S3 호환 오브젝트 스토리지

목표는 Manus 호스팅과 분리된 독립 서비스로 다음 주소를 안전하게 운영하는 것입니다.

| 용도 | 최종 주소 | 연결 방식 |
|---|---|---|
| 공개 초대장 | `https://invite.avocadoss.co.kr` | 단일 Railway 웹 서비스 |
| 관리자 | `https://admin.avocadoss.co.kr` | **같은** Railway 웹 서비스 |

공개/관리자 주소를 별도 서비스로 만들지 마십시오. 두 호스트는 하나의 코드, 하나의 MySQL DB, 하나의 미디어 버킷을 공유해야 합니다. 데이터가 분리되면 RSVP·방명록·관리자 미디어가 서로 다른 상태가 될 위험이 있습니다.

---

## 절대 준수 사항

1. **현재 Manus 사이트, DB, 업로드 미디어, Cloudflare 루트 레코드를 삭제·수정하지 마십시오.** 외부 환경에서 검증이 끝날 때까지 현재 서비스는 그대로 유지합니다.
2. API 키, DB 비밀번호, JWT 비밀값, 관리자 비밀번호, Task Data Backup, JSON 백업은 채팅·GitHub·공개 URL에 노출하지 마십시오.
3. `avocadoss.co.kr` 루트 도메인은 현재 Cloudflare Tunnel 오류 상태일 수 있으므로 건드리지 말고, `invite`와 `admin` **새 서브도메인만** 추가합니다.
4. 데이터 이전 전과 DNS 전환 직전에 Manus Task Data Backup을 각각 생성하고, 관리자 페이지에서 엑셀과 외부 이전용 JSON 백업을 모두 내려받습니다.
5. 외부 사이트에서 공개 RSVP 등록, 방명록 등록, 관리자 로그인, 미디어 업로드·저장, Excel/JSON 내보내기까지 확인한 후에만 공유 링크를 새 도메인으로 바꿉니다.

---

## 0. 시작 전 백업

1. `https://manus.im/backup`에서 **Export task data → Export more → All tasks → All time → Start export**를 실행합니다.
2. Manus 관리자 페이지 `https://doljanchi-t3vnch8e.manus.space/admin`에 로그인합니다.
3. **엑셀 파일 다운로드**와 **외부 이전용 JSON 백업**을 모두 내려받아 암호화된 개인 저장소에 보관합니다.
4. JSON 백업에는 초대장 설정, RSVP, 방명록, 히어로/갤러리 미디어 참조가 포함될 수 있으므로 공개 저장소에 올리지 않습니다.

---

## 1. 소스와 외부 환경 생성

1. Railway에서 새 프로젝트를 만들고 위 비공개 GitHub 저장소의 `main` 브랜치를 연결합니다.
2. Railway에 MySQL 호환 DB를 추가하거나, 별도 관리형 MySQL을 준비합니다.
3. Railway 서비스는 리포지토리의 `railway.toml`을 사용합니다.
   - Build: `pnpm install --frozen-lockfile && pnpm build`
   - Start: `pnpm start`
   - Health check: `/`
4. Cloudflare R2 버킷 또는 S3 호환 버킷 `chaewon-invitation-media`를 생성합니다.
5. 해당 버킷의 읽기 전용 공개 주소 또는 별도 공개 미디어 도메인을 준비합니다. 공개 초대장에 표시되는 사진·영상이므로 브라우저에서 HTTPS로 접근 가능해야 합니다.

---

## 2. 외부용 환경 변수 설정

Railway Variables 또는 동일한 비밀값 관리 기능에 다음을 설정합니다. 리포지토리의 `.env.external.example`은 **키 이름 예시**일 뿐이며 실제 비밀번호는 절대 커밋하지 않습니다.

```dotenv
NODE_ENV=production
PORT=3000
CANONICAL_ORIGIN=https://invite.avocadoss.co.kr
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/chaewon_invitation

JWT_SECRET=<새로운_길고_무작위인_비밀값>
ADMIN_DASHBOARD_PASSWORD=<기존_관리자_비밀번호_또는_새_보호값>
SECONDARY_ADMIN_DASHBOARD_PASSWORD=<추가_관리자_비밀번호_또는_새_보호값>

EXTERNAL_S3_BUCKET=chaewon-invitation-media
EXTERNAL_S3_PUBLIC_BASE_URL=https://<공개-미디어-호스트>
EXTERNAL_S3_ENDPOINT=https://<R2-또는-S3-엔드포인트>
EXTERNAL_S3_REGION=auto
EXTERNAL_S3_ACCESS_KEY_ID=<버킷_쓰기_권한_키>
EXTERNAL_S3_SECRET_ACCESS_KEY=<버킷_쓰기_권한_비밀값>
EXTERNAL_S3_FORCE_PATH_STYLE=false
```

### 중요: Manus 의존성 분리

이 프로젝트는 원래 Manus 템플릿의 `_core` 인증·스토리지 코드를 포함합니다. 외부 환경에서 기동할 때는 아래를 점검하고 필요한 최소 변경만 적용하십시오.

1. 공개 초대장과 전용 관리자 로그인은 Manus OAuth가 아닌 현재의 `adminSession.ts` 쿠키 세션으로 동작해야 합니다.
2. 외부 환경에 `EXTERNAL_S3_*` 값이 모두 있으면 `server/storage.ts`는 Forge 대신 S3/R2를 사용합니다.
3. Manus OAuth·Forge 환경 변수가 없어도 공개 라우트와 전용 관리자 라우트가 기동되는지 확인하십시오. 필요 시 `_core`의 Manus OAuth 초기화를 선택 사항으로 만들되, 공개 API·관리자 세션·SSR 메타데이터를 깨뜨리지 마십시오.
4. 외부 단계에서 새 기능을 추가하기보다, 먼저 현재 기능의 동등한 동작을 확보하십시오.

---

## 3. 데이터베이스와 미디어 이전

### DB 스키마

새 MySQL DB에 리포지토리의 Drizzle 마이그레이션을 순서대로 적용합니다.

```text
drizzle/0000_shocking_black_bolt.sql
drizzle/0001_talented_shockwave.sql
drizzle/0002_furry_nick_fury.sql
drizzle/0003_peaceful_timeslip.sql
drizzle/0004_opposite_silhouette.sql
drizzle/0005_broken_lorna_dane.sql
```

### 데이터

1. 가능한 경우 Manus Task Data Backup의 웹사이트 DB를 새 MySQL로 복원합니다.
2. 관리자 JSON 백업의 초대장·RSVP·방명록 데이터를 읽어 새 DB에 import하는 일회성 스크립트를 작성합니다.
3. 기존 사용자 OAuth 데이터는 이 서비스에서 필수가 아니므로, 전용 관리자 로그인에 필요한 `invitations`, `rsvp_responses`, `guestbook_entries`와 미디어 참조를 우선 정확히 옮깁니다.
4. 다음 필드는 절대 누락되지 않아야 합니다.

| 테이블 | 핵심 데이터 |
|---|---|
| `invitations` | slug, 부모 이름, 행사 정보, 계좌, `heroImageUrl`, `galleryImageUrls` |
| `rsvp_responses` | 대표자·일행·`attendeeDetails`, 참석 여부, 연락처, 메모, 토큰 |
| `guestbook_entries` | 작성자·일행·메시지·숨김 상태 |

### 미디어

1. JSON의 `heroImageUrl`·`galleryImageUrls`에서 `/manus-storage/...` 참조를 모두 추출합니다.
2. 원본 파일을 다운로드해 R2/S3 버킷에 복사합니다. 이미지, GIF, MP4, WEBM, BGM 파일을 모두 포함합니다.
3. 복사 뒤 DB의 `heroImageUrl`·`galleryImageUrls` JSON 내부 URL을 `EXTERNAL_S3_PUBLIC_BASE_URL`의 새 HTTPS URL로 정확히 바꿉니다.
4. 새 URL이 브라우저에서 200으로 열리고, 공개 초대장에 이미지·GIF·영상이 표시되는지 확인합니다.
5. 기존 Manus URL을 삭제하지 마십시오. 외부 검증이 끝나기 전까지 롤백 안전망으로 남겨 둡니다.

---

## 4. 두 서브도메인 연결

### Railway

하나의 Railway 웹 서비스에 다음 Custom Domain 두 개를 추가합니다.

```text
invite.avocadoss.co.kr
admin.avocadoss.co.kr
```

Railway가 각 도메인에 요구하는 검증/CNAME 대상을 기록합니다. TLS가 발급·검증될 때까지 DNS만 추가하고, 기존 루트 레코드는 수정하지 않습니다.

### Cloudflare DNS

Cloudflare `avocadoss.co.kr` Zone에 신규 CNAME 레코드를 생성합니다.

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `invite` | Railway가 제공한 서비스 대상 | 처음에는 DNS only 권장 |
| CNAME | `admin` | Railway가 제공한 서비스 대상 | 처음에는 DNS only 권장 |

Railway에서 도메인 검증과 HTTPS 인증서가 정상인지 확인한 후에만 Cloudflare Proxy 여부를 검토하십시오. 제공자가 별도의 CNAME 검증 레코드를 요구하면 그 값을 정확히 추가하십시오.

### 호스트별 첫 화면 처리

현재 앱의 실제 공개 경로는 `/invite/invite-peach-ribbon-x7k2p`, 관리 경로는 `/admin`입니다. 외부 배포에서는 다음을 구현하거나 Cloudflare Redirect Rule로 설정합니다.

| 요청 | 기대 동작 |
|---|---|
| `https://invite.avocadoss.co.kr/` | `https://invite.avocadoss.co.kr/invite/invite-peach-ribbon-x7k2p`로 302/308 이동 |
| `https://admin.avocadoss.co.kr/` | `https://admin.avocadoss.co.kr/admin`으로 302/308 이동 |
| `https://invite.avocadoss.co.kr/admin` | 관리자 경로를 숨기거나 `admin` 호스트로 이동 |
| `https://admin.avocadoss.co.kr/invite/...` | 공개 호스트로 이동 |

호스트 기반 리디렉션은 **데이터 이전과 새 서비스 검증 뒤**에만 추가하십시오. Cookie의 `Secure`, `HttpOnly`, `SameSite` 설정과 admin 호스트 간 세션 동작도 확인해야 합니다.

---

## 5. 검증 순서

다음 테스트를 **새 서브도메인에서 모두 통과**해야 합니다.

1. `https://invite.avocadoss.co.kr/`가 초대장으로 이동하고 TLS 경고가 없다.
2. 행사 정보, 부모 성함, 계좌번호, 지도 링크, BGM, 공유 메타데이터가 맞다.
3. 실제 RSVP 1건(성인·아기 포함)을 등록한 뒤 관리자 미니 대시보드가 갱신된다.
4. 방명록 1건을 등록하고 공개 목록 및 관리자 목록에서 확인한다.
5. `https://admin.avocadoss.co.kr/`에서 두 관리자 계정으로 각각 로그인한다.
6. 사진/동영상을 하나 업로드하고 **미디어 구성 저장** 후 공개 화면에 반영되는지 확인한다.
7. Excel/외부 이전 JSON 내보내기를 다운로드한다.
8. 새 DB의 RSVP·방명록·미디어 수치가 이전 JSON/엑셀과 일치하는지 비교한다.
9. 페이지 소스와 공개 API에서 비밀값·S3 키·관리자 비밀번호가 노출되지 않는지 확인한다.

---

## 6. 전환과 롤백

1. 위 검증이 끝난 뒤에만 카카오톡 공유·가족에게 보내는 주소를 `https://invite.avocadoss.co.kr`로 바꿉니다.
2. 전환 전과 전환 직후에 최종 Manus Task Data Backup과 관리자 JSON/엑셀 백업을 각각 보관합니다.
3. 오류가 나면 Cloudflare의 `invite`·`admin` 신규 레코드 또는 Redirect Rule만 되돌리고, 기존 Manus 주소를 계속 사용합니다.
4. 기존 Manus DB·미디어·도메인 설정은 외부 서비스가 안정화될 때까지 삭제하지 않습니다.

## 완료 보고에 반드시 포함할 내용

- 외부 서비스 URL 2개와 TLS 상태
- Railway 서비스·DB·R2/S3 버킷이 별개지만 연결된 구조라는 설명
- 데이터 이전 기준 시각 및 마지막 백업 파일 이름
- 실제 검증한 RSVP·방명록·미디어 저장 결과
- 새 환경에서 재설정한 비밀값은 값 자체가 아니라 **설정 완료 여부**만 보고
- 되돌릴 때 사용할 DNS/호스팅 롤백 절차
