# 채원이 초대장 외부 호스팅 이전 가이드

이 문서는 현재 Manus 기반 초대장을 독립적으로 운영하기 위한 준비물과 이전 순서를 정리합니다. 권장 공개 주소는 **`https://invite.avocadoss.co.kr`**입니다. 현재 `avocadoss.co.kr` 루트는 Cloudflare Tunnel 오류 상태이므로, 루트 설정을 바꾸지 않고 `invite` 서브도메인을 별도로 연결합니다.

## 보존해야 하는 자산

| 자산 | 현재 위치 | 외부 이전 방법 |
|---|---|---|
| 소스 코드 | 비공개 GitHub 저장소 | 외부 호스팅에서 GitHub 저장소 연결 |
| 초대장·RSVP·방명록 | MySQL 데이터베이스 | 관리자 JSON 백업 + MySQL 데이터 내보내기/가져오기 |
| 사진·GIF·동영상 | Manus 스토리지 URL | 원본 미디어를 R2/S3로 복사하고 DB의 미디어 URL을 새 URL로 갱신 |
| 관리자 로그인 | 환경 변수·JWT 쿠키 | 외부 호스트의 Secret Manager에 새 비밀번호·JWT 비밀값 설정 |
| 도메인 | Cloudflare DNS | `invite` CNAME을 외부 호스팅 제공자가 주는 대상에 연결 |

## 1. 먼저 Manus 백업을 만든다

`https://manus.im/backup`에서 **Task Data Backup**을 먼저 만들고, 전환 직전에 한 번 더 최종 백업합니다. GitHub 저장소에는 DB·업로드 미디어·Manus 설정이 모두 포함되지 않으므로, Task Data Backup이 최우선 복원 수단입니다.

## 2. 관리자 화면에서 두 개의 파일을 내려받는다

관리자 페이지에서 다음을 저장합니다.

1. **엑셀 파일 다운로드**: 현재 참석 현황과 방명록을 사람이 확인하기 좋은 형태로 보관합니다.
2. **외부 이전용 JSON 백업**: 초대장 설정, RSVP, 방명록, 히어로·갤러리 미디어 참조를 기계적으로 옮기기 위한 스냅샷입니다. 이 파일에는 연락처 등 개인정보가 포함될 수 있으므로 공개 저장소나 메신저에 올리지 않습니다.

## 3. Railway와 외부 서비스를 준비한다

Railway에서 Node 서비스를 만들고 이 비공개 GitHub 저장소를 연결합니다. MySQL 호환 데이터베이스를 준비하고, `.env.external.example`의 값은 Railway Variables에 **실제 값으로만** 설정합니다. API 키나 비밀번호를 Git에 커밋하지 않습니다.

사진·동영상은 Cloudflare R2 또는 S3 호환 오브젝트 스토리지에 둡니다. `EXTERNAL_S3_*` 값이 설정되면 앱의 업로드 어댑터는 Manus 스토리지 대신 외부 버킷에 새 파일을 올립니다. 기존 파일은 별도로 복사한 뒤, 초대장 DB의 `heroImageUrl`·`galleryImageUrls`를 새 공개 URL로 바꿉니다.

## 4. 데이터베이스를 복원한다

1. 새 MySQL 데이터베이스에서 `drizzle/0000_*.sql`부터 `0005_*.sql`까지 순서대로 적용합니다.
2. 현재 데이터는 Manus Task Data Backup과 관리자 JSON 백업을 기준으로 새 DB에 가져옵니다.
3. 공개 초대장, RSVP 제출, 방명록 작성, 관리자 로그인·미디어 저장을 새 URL에서 모두 확인합니다.

> JSON 백업은 안전망과 데이터 검증용입니다. 완전한 관계형 DB 복원에는 Task Data Backup 또는 MySQL 덤프가 필요합니다.

## 5. `invite.avocadoss.co.kr` 연결

1. Railway 서비스 설정에서 `invite.avocadoss.co.kr`을 Custom Domain으로 추가합니다.
2. Railway가 안내하는 값으로 Cloudflare DNS에 `CNAME` 레코드를 만듭니다. 이름은 `invite`입니다.
3. Railway에서 도메인 검증과 TLS 발급이 완료된 뒤 `https://invite.avocadoss.co.kr`을 확인합니다.
4. 작동 확인 뒤에만 카카오톡 공유 주소와 `CANONICAL_ORIGIN`을 새 주소로 바꿉니다.

Cloudflare Tunnel은 개인 장비가 실행 중이어야 하므로 공개 초대장 운영에는 사용하지 않는 편이 좋습니다. Railway 또는 Render 같은 관리형 호스팅에 직접 연결하면 개인 PC가 꺼져 있어도 초대장이 동작합니다.

## 이전 완료 전 확인 목록

- [ ] Task Data Backup과 최종 백업 패키지를 안전한 저장소에 보관함
- [ ] 관리자 엑셀과 JSON 백업을 내려받음
- [ ] MySQL 데이터와 R2/S3 미디어를 새 계정에 복사함
- [ ] 외부 호스트 Secret Manager에 새 JWT·관리자 비밀번호를 설정함
- [ ] `invite.avocadoss.co.kr` TLS 연결을 검증함
- [ ] 공개 RSVP·방명록·관리자 미디어 저장을 새 도메인에서 확인함
