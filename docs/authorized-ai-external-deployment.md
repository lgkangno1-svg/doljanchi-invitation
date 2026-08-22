# 권한 보유 AI용 실행 명령서: 채원이 돌잔치 초대장 독립 외부 배포

## 1. 역할, 권한 및 최종 목표

당신은 아래 계정에 대한 실제 실행 권한을 가진 배포 담당 AI입니다. 이 문서는 권한 없는 보조 AI가 아니라, Railway·Cloudflare·R2/S3·GitHub에 접근 가능한 담당자가 그대로 수행할 수 있도록 작성한 실행 절차입니다.

| 구분 | 필요한 권한 또는 대상 |
|---|---|
| 소스 | 비공개 GitHub 저장소 `https://github.com/lgkangno1-svg/doljanchi-invitation`의 `main` 브랜치 |
| 애플리케이션 | Railway 또는 동등한 Node.js + MySQL 호스팅 |
| DNS | Cloudflare `avocadoss.co.kr` Zone |
| 미디어 | Cloudflare R2 또는 S3 호환 오브젝트 스토리지 |
| 현재 운영본 | `https://doljanchi-t3vnch8e.manus.space` |

최종적으로 공개 초대장과 관리자 화면은 **하나의 웹 서비스, 하나의 MySQL 데이터베이스, 하나의 미디어 버킷**을 공유해야 합니다. 두 서브도메인을 별도 서비스나 별도 DB로 분리하면 RSVP·방명록·미디어 저장 상태가 어긋날 수 있습니다.

| 용도 | 최종 주소 | 첫 화면 |
|---|---|---|
| 공개 초대장 | `https://invite.avocadoss.co.kr` | `/invite/invite-peach-ribbon-x7k2p` |
| 관리자 | `https://admin.avocadoss.co.kr` | `/admin` |

> **변경 보호 원칙:** 외부 환경에서 기능 검증이 끝나기 전까지 현재 Manus 사이트, 데이터베이스, 업로드된 사진·GIF·동영상, `avocadoss.co.kr` 루트 레코드를 삭제하거나 변경하지 않습니다. 현재 루트 도메인은 Cloudflare Tunnel 오류 상태일 수 있으므로, `invite`와 `admin` 서브도메인만 새로 만듭니다.

---

## 2. 외부 환경에서도 반드시 유지할 행사장·지도 설정

다음 값은 배포 담당자가 DB 이전, 데이터 확인, 디자인 검수, 지도 테스트에 사용하는 **단일 기준값**입니다. 행사장 저장값에는 실제 줄바꿈 문자(`\n`)가 포함되어야 합니다.

| 항목 | 정확한 값 | 구현 기준 |
|---|---|---|
| 아이 이름 | 강채원 | 공개 초대장 및 공유 정보 |
| 행사 일시 | 2026-10-18 일요일 12:00 PM | 초대장 행사 정보 |
| 행사장 저장값 | `코트야드 메리어트 서울 명동\n3층 한양 1+2홀` | 관리자 편집값·DB·공개 초대장 기준 |
| 공개 행사장 표시 | 첫 줄 `코트야드 메리어트 서울 명동`<br>둘째 줄 `3층 한양 1+2홀` | 줄바꿈을 공백으로 합치지 말 것 |
| 지도·내비 검색어 | `서울 코트야드 메리어트 명동` | 홀 정보·도로명 주소를 검색어에 포함하지 말 것 |
| 지도 좌표 | 위도 `37.5636`, 경도 `126.9791` | TMAP·카카오내비 목적지 좌표 |
| 주소 안내 | 서울특별시 중구 남대문로 9 | 초대장 보조 주소 표시에만 사용 |

### 2.1 지도 링크 수용 기준

외부 배포본의 지도 iframe과 네 개의 버튼은 모두 `서울 코트야드 메리어트 명동`만 목적지/검색어로 사용해야 합니다. `3층 한양 1+2홀`, 가운데점, 도로명 주소는 네비게이션 검색어에 넣지 않습니다.

| 대상 | 기대 규칙 |
|---|---|
| Google 지도 iframe | `q=서울 코트야드 메리어트 명동`을 URL 인코딩한 값 |
| 네이버지도 | 호텔명 단독 검색 결과 |
| 카카오맵 | 호텔명 단독 검색 결과 |
| 티맵 | 목적지명 `서울 코트야드 메리어트 명동` 및 저장된 좌표 |
| 카카오내비 | 목적지명 `서울 코트야드 메리어트 명동` 및 저장된 좌표 |

외부 이전 중 데이터 import나 배포 환경 수정으로 이 값이 달라졌다면, DNS 전환 전에 `invitations` 테이블의 해당 slug를 다음 값으로 복구합니다.

```sql
UPDATE invitations
SET venueName = '코트야드 메리어트 서울 명동\n3층 한양 1+2홀'
WHERE slug = 'invite-peach-ribbon-x7k2p';
```

---

## 3. 시작 전 보호 백업

먼저 [Manus Task Data Backup](https://manus.im/backup)에서 전체 작업·전체 기간 내보내기를 실행합니다. 이어서 현재 관리자 페이지에서 **Excel 다운로드**와 **외부 이전용 JSON 백업**을 각각 내려받아 암호화된 개인 저장소에 보관합니다.

JSON 파일에는 초대장 설정, RSVP, 방명록, 히어로·갤러리 미디어 참조가 담길 수 있으므로 공개 저장소, 이슈, 채팅, 정적 URL에 올리지 않습니다. 외부 DB import 직전과 DNS 전환 직전에 같은 백업을 한 번 더 생성해 복구 지점을 분명히 남깁니다.

| 백업물 | 목적 | 보관 원칙 |
|---|---|---|
| Manus Task Data Backup | 전체 작업 복구 안전망 | 비공개 개인 저장소 |
| 관리자 Excel | RSVP·방명록의 사람이 읽기 쉬운 대조본 | 비공개 개인 저장소 |
| 관리자 JSON | 초대장·RSVP·방명록·미디어 참조 이전 | 비공개 개인 저장소 |
| R2/S3 객체 목록 | 미디어 복사 완결성 대조 | 비공개 운영 기록 |

---

## 4. 외부 인프라와 환경 변수 구성

Railway에서 비공개 GitHub 저장소의 `main`을 연결한 새 프로젝트를 만들고, MySQL 호환 DB를 연결합니다. 애플리케이션은 저장소의 `railway.toml` 기준으로 `pnpm install --frozen-lockfile && pnpm build` 후 `pnpm start`로 실행합니다. Railway Custom Domain 설정은 제공자가 요구하는 CNAME과 인증 절차를 따릅니다.[1]

Cloudflare R2 또는 S3 호환 버킷으로 `chaewon-invitation-media`를 만들고, 브라우저에서 HTTPS로 읽을 수 있는 공개 미디어 URL 또는 미디어 도메인을 준비합니다. 이 버킷에는 사진, GIF, MP4, WEBM, BGM을 포함해 실제 공개 초대장에 표시되는 모든 미디어를 옮깁니다.

Railway Variables 또는 같은 수준의 Secret Manager에 아래 키를 설정합니다. `.env.external.example`은 키 이름 참고용일 뿐이고, 실제 값은 절대로 커밋하지 않습니다.

```dotenv
NODE_ENV=production
PORT=3000
CANONICAL_ORIGIN=https://invite.avocadoss.co.kr
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/chaewon_invitation

JWT_SECRET=<새롭고_긴_무작위_비밀값>
ADMIN_DASHBOARD_PASSWORD=<기존_값_또는_새_보호값>
SECONDARY_ADMIN_DASHBOARD_PASSWORD=<기존_값_또는_새_보호값>

EXTERNAL_S3_BUCKET=chaewon-invitation-media
EXTERNAL_S3_PUBLIC_BASE_URL=https://<공개-미디어-호스트>
EXTERNAL_S3_ENDPOINT=https://<R2-또는-S3-엔드포인트>
EXTERNAL_S3_REGION=auto
EXTERNAL_S3_ACCESS_KEY_ID=<버킷_쓰기_권한_키>
EXTERNAL_S3_SECRET_ACCESS_KEY=<버킷_쓰기_권한_비밀값>
EXTERNAL_S3_FORCE_PATH_STYLE=false
```

외부 환경에서 `EXTERNAL_S3_*` 값이 모두 설정되면 `server/storage.ts`가 외부 버킷을 사용해야 합니다. 공개 초대장과 전용 관리자 로그인은 Manus OAuth가 아닌 현재 전용 관리자 세션 흐름으로 동작하는지 확인합니다. 외부 환경에서 새 기능을 먼저 추가하지 말고, 기존 기능과 데이터의 동등성을 확보한 뒤에만 개선 작업을 진행합니다.

---

## 5. DB·미디어 이전

새 MySQL DB에는 저장소의 Drizzle 마이그레이션을 순서대로 적용합니다. 그 뒤 기존 DB 백업을 복원하거나, 관리자 JSON을 읽는 **일회성 import 스크립트**를 작성하여 초대장·RSVP·방명록을 이관합니다. 기존 OAuth 사용자 데이터는 핵심 이전 대상이 아니므로, 아래 운영 데이터의 정확성을 우선합니다.

| 테이블 | 이전·대조 대상 |
|---|---|
| `invitations` | slug, 아이·부모 성함, 행사 정보, 계좌, `heroImageUrl`, `galleryImageUrls`, 두 줄 `venueName` |
| `rsvp_responses` | 대표자·일행, `attendeeDetails`, 참석 여부, 성인/아기 수, 연락처, 메모, 편집 토큰 |
| `guestbook_entries` | 작성자·일행·메시지·숨김 상태 |

미디어는 JSON의 `heroImageUrl`과 `galleryImageUrls`에 있는 `/manus-storage/...` 참조를 모두 추출해 외부 버킷에 복사합니다. 복사 후 DB의 JSON 내부 URL을 `EXTERNAL_S3_PUBLIC_BASE_URL` 기반 HTTPS URL로 바꾸고, 이미지·GIF·동영상·BGM을 실제 브라우저에서 각각 열어 200 응답과 렌더링을 확인합니다. 외부 전환이 끝날 때까지 기존 Manus 미디어 URL을 삭제하지 않습니다.

---

## 6. `invite`·`admin` 서브도메인 연결

하나의 Railway 웹 서비스에 다음 Custom Domain 두 개를 추가합니다.

```text
invite.avocadoss.co.kr
admin.avocadoss.co.kr
```

Cloudflare DNS에는 Railway가 안내한 정확한 대상으로 신규 CNAME을 만들고, 처음에는 **DNS only**로 검증합니다. Cloudflare에서는 별도 CNAME 레코드를 만들고 프록시 상태를 조정할 수 있습니다.[2] Railway에서 두 도메인의 HTTPS 인증서와 검증이 정상임을 확인한 다음에만 Cloudflare Proxy 사용 여부를 결정합니다.

| Type | Name | Target | 초기 Proxy |
|---|---|---|---|
| CNAME | `invite` | Railway가 제공한 서비스 대상 | DNS only |
| CNAME | `admin` | Railway가 제공한 서비스 대상 | DNS only |

현재 공개 경로는 `/invite/invite-peach-ribbon-x7k2p`, 관리자 경로는 `/admin`입니다. 외부 검증이 끝난 뒤 웹 서버 또는 Cloudflare Redirect Rule로 아래 호스트별 첫 화면 동작을 구현합니다.

| 요청 | 기대 동작 |
|---|---|
| `https://invite.avocadoss.co.kr/` | `/invite/invite-peach-ribbon-x7k2p`로 302 또는 308 이동 |
| `https://admin.avocadoss.co.kr/` | `/admin`으로 302 또는 308 이동 |
| `https://invite.avocadoss.co.kr/admin` | `admin` 호스트로 이동하거나 관리자 경로 차단 |
| `https://admin.avocadoss.co.kr/invite/...` | `invite` 호스트로 이동 |

호스트 기반 리디렉션을 적용한 뒤에는 관리자 쿠키의 `Secure`, `HttpOnly`, `SameSite` 속성과 로그인 유지 동작을 반드시 실제 브라우저에서 확인합니다.

---

## 7. 전환 전 수용 테스트

아래 검증은 **새 서브도메인에서 모두 통과한 경우에만** 가족에게 새 주소를 안내할 수 있습니다. 테스트용 RSVP·방명록은 반드시 구분 가능한 이름으로 입력하고, 결과를 완료 보고에 남깁니다.

| 순서 | 검증 항목 | 통과 조건 |
|---:|---|---|
| 1 | HTTPS 및 라우팅 | 두 서브도메인에 TLS 경고가 없고 첫 화면 리디렉션이 정확함 |
| 2 | 행사장 표시 | `코트야드 메리어트 서울 명동`과 `3층 한양 1+2홀`이 정확히 두 줄로 보임 |
| 3 | 지도 iframe | 검색어에 홀·주소 없이 `서울 코트야드 메리어트 명동`만 사용 |
| 4 | 지도·내비 버튼 | 네이버·카카오맵·티맵·카카오내비 모두 같은 호텔명 단독 목적지 사용 |
| 5 | 초대장 핵심 정보 | 부모 성함, 계좌, BGM, 공유 메타데이터가 이전본과 일치 |
| 6 | RSVP | 성인과 아기가 포함된 실제 테스트 1건 후 관리자 미니 대시보드가 갱신 |
| 7 | 방명록 | 테스트 1건이 공개 목록과 관리자 목록에 모두 표시 |
| 8 | 관리자 | 두 관리자 계정 각각으로 로그인, 미디어 저장, Excel·JSON 내보내기 성공 |
| 9 | 데이터 대조 | 새 DB의 RSVP·방명록·미디어 수가 JSON·Excel 백업과 일치 |
| 10 | 비밀값 노출 | 페이지 소스, 공개 API, GitHub에 DB URL·S3 키·관리자 비밀번호가 없음 |

---

## 8. 전환, 롤백 및 완료 보고

수용 테스트가 끝난 뒤에만 카카오톡 공유와 가족 안내 링크를 `https://invite.avocadoss.co.kr`로 교체합니다. 전환 직전과 직후에 각각 최종 Task Data Backup, JSON, Excel을 보관합니다.

문제가 생기면 새 `invite`·`admin` CNAME 또는 Redirect Rule만 되돌리고, 현재 Manus 주소를 즉시 계속 사용합니다. 외부 서비스가 안정화되기 전에는 Manus DB·미디어·도메인 설정을 삭제하지 않습니다.

완료 보고에는 외부 URL 두 개와 TLS 상태, 데이터 이전 기준 시각, 마지막 백업 파일 이름, 실제 테스트한 RSVP·방명록·미디어 저장 결과, 비밀값의 **설정 완료 여부만**, 그리고 DNS·호스팅 롤백 절차를 포함합니다. 비밀값 자체, 원본 백업, 개인 연락처, 관리자 비밀번호는 보고에 적지 않습니다.

## 참고 자료

[1] [Railway Docs — Custom Domains](https://docs.railway.com/guides/public-networking#custom-domains)

[2] [Cloudflare Docs — DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
