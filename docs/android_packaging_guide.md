# Android APK·AAB 패키징 판단과 실행 계획

기준일: **2026-09-16**

## 1. 결론

**이 프로젝트는 APK와 AAB로 빌드할 수 있다. 다만 현재 저장소는 아직 APK를 만드는 단계까지 설정되어 있지 않다.**

현재 React/Vite/Phaser 앱은 `npm run build`로 웹 파일인 `dist/`를 만든다. 이 결과물을 Capacitor의 Android WebView 컨테이너에 넣으면 Android Studio와 Gradle을 통해 설치용 APK 또는 스토어 제출용 AAB를 생성할 수 있다. 게임을 Unity나 Android 네이티브 코드로 다시 만들 필요는 없다.

## 2. 현재 상태 점검

| 항목 | 현재 상태 | 판단 |
| --- | --- | --- |
| 웹 프로덕션 빌드 | `dist/` 생성 성공 | Android에 넣을 웹 콘텐츠는 준비됨 |
| Node.js | `v22.22.0` | Capacitor 8의 Node 22 이상 요구 충족 |
| Capacitor 패키지 | 없음 | 설치 필요 |
| `capacitor.config.*` | 없음 | 앱 ID, 앱 이름, `webDir` 설정 필요 |
| `android/` 프로젝트 | 없음 | `npx cap add android`로 생성 필요 |
| Android Studio·SDK | 명령행에서 확인되지 않음 | 설치 및 SDK 설정 필요 |
| Java/JDK | 현재 PATH에 없음 | Android Studio 내장 JDK 사용 가능 |
| 서명 키 | 없음 | 첫 릴리스 전에 관리 방식을 결정해야 함 |

따라서 지금 `npm run build`만 실행해서 나오는 것은 APK가 아니라 웹 배포물이다. Android 도구와 Capacitor를 한 번 설정한 뒤부터 APK 빌드가 가능하다.

## 3. 권장 기술 경로

현재 프로젝트에는 Capacitor 8을 붙이는 방식이 가장 직접적이다.

```text
React UI + Phaser 전투
          ↓ npm run build
       dist/ 웹 파일
          ↓ npx cap sync android
 Capacitor Android 프로젝트
          ↓ Android Studio / Gradle
     debug APK / release APK / AAB
          ↓ 서명 및 실기기 검증
          원스토어 등록
```

Capacitor 8 공식 문서는 기존 웹 프로젝트에 Capacitor를 추가할 수 있다고 설명하며, Android는 API 24 이상을 지원한다. Android 개발에는 Android Studio와 Android SDK가 필요하고 Android Studio가 적절한 JDK를 함께 설치한다.

## 4. 최초 설정 절차

아래 명령은 패키지명과 앱 이름을 확정한 뒤 실행한다. 예시 패키지명 `com.example.asadal`은 출시용으로 그대로 쓰지 않는다.

```powershell
npm install @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli
npx cap init
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

`npx cap init` 질문에서 앱 이름과 확정한 고유 패키지명을 입력하고, 생성된 설정의 `webDir`가 `dist`인지 확인한다.

생성되는 핵심 항목은 다음과 같다.

- `capacitor.config.*`: 앱 ID, 앱 이름, 웹 빌드 폴더 설정
- `android/`: Gradle, AndroidManifest, 리소스, 네이티브 앱 프로젝트
- `android/app/src/main/assets/public`: 동기화된 `dist/` 콘텐츠

이후 웹 코드가 바뀔 때의 반복 절차는 `npm run build` 다음 `npx cap sync android`다.

## 5. APK와 AAB의 차이

| 형식 | 이 프로젝트에서의 용도 | 장점 | 주의점 |
| --- | --- | --- | --- |
| Debug APK | 개발 중 직접 설치 | 서명 준비 없이 빠른 기기 확인 | 출시용이 아님 |
| Release APK | 원스토어 제출 또는 직접 배포 | 설치 파일을 직접 검사하기 쉬움 | 개발자가 서명 키를 계속 안전하게 관리해야 함 |
| Release AAB | 원스토어 제출 | 스토어가 단말별 APK를 생성 | 원스토어에서 AAB로 전환하면 다시 APK 방식으로 돌아갈 수 없음 |

원스토어는 Android 앱에 APK와 AAB를 모두 지원하고, AAB 상품은 `minSdkVersion 21` 이상이어야 한다. 그러나 현재 Capacitor 8 자체가 API 24 이상을 지원하므로 실제 최소 버전은 24 이상으로 잡히게 된다.

초기 개발 순서는 다음을 권장한다.

1. Debug APK로 실기기 기능과 성능을 확인한다.
2. 서명 키 정책과 다른 마켓 동시 출시 여부를 정한다.
3. Release APK와 AAB를 모두 로컬에서 만들어 검사한다.
4. 원스토어 상품을 APK 또는 AAB 중 하나로 최초 등록한다.

원스토어는 APK에서 AAB로 전환하는 것은 허용하지만 AAB로 전환한 뒤 APK로 되돌리는 것은 허용하지 않는다. 첫 등록 전에 형식을 결정해야 한다.

## 6. 예상 빌드 명령과 산출물

Android 프로젝트 생성 후 Windows에서 사용할 수 있는 대표 명령은 다음과 같다.

```powershell
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat assembleRelease
.\gradlew.bat bundleRelease
```

일반적인 산출 위치는 다음과 같다.

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`

Release 산출물은 서명 설정 전에는 원스토어에 올릴 수 있는 최종 파일이 아니다.

## 7. 이 게임에 필요한 Android 대응

### 화면과 입력

- 세로 화면 고정 여부 확정
- 상태 표시줄과 내비게이션 바를 포함한 안전 영역 처리
- 터치 조이스틱과 선택 버튼의 작은 화면·고밀도 화면 검사
- Android 뒤로 가기에서 선택창 닫기, 일시정지, 앱 종료 순서 정의

### 생명주기와 오디오

- 홈 버튼, 전화, 화면 잠금 시 Phaser 전투 일시정지
- 앱 복귀 시 중복 게임 루프와 중복 오디오가 생기지 않는지 검사
- 오디오 포커스를 잃었을 때 음소거하고 복귀 시 설정값 복원

### 저장과 오프라인

- 현재 `localStorage` 기반 영구 수련·엔딩·기억이 앱 업데이트 뒤 유지되는지 검사
- 네트워크가 없는 상태에서 모든 이미지와 게임 파일이 로컬에서 열리는지 검사
- 앱 데이터 삭제와 재설치 시 저장이 초기화된다는 점을 사용자 정책에 반영

### 성능

- 중저가 Android 단말에서 적·투사체·파티클이 많을 때 프레임 측정
- WebView 메모리 압박으로 앱이 백그라운드에서 종료된 뒤 복귀하는 상황 검사
- 텍스처 크기와 첫 로딩 시간 측정

### 출시 리소스

- 적응형 앱 아이콘과 시작 화면
- 앱 이름, 버전명, `versionCode`, 고유 패키지명
- 개인정보 처리방침, 권한 사용 설명, 게임 등급 자료
- 원스토어 상세 이미지와 소개 문구

## 8. 서명 키 결정

Android 업데이트는 이전 버전과 같은 앱 서명 키를 사용해야 한다. 첫 공개 릴리스 전에 다음 중 하나를 선택한다.

- 개발자가 Java Keystore를 생성하고 APK/AAB와 키 백업을 직접 관리
- AAB를 사용하며 원스토어 앱 서명 서비스를 사용
- 다른 마켓과 동시에 배포할 경우 동일 앱의 서명 체계를 마켓 전체에서 일관되게 설계

키 파일, 비밀번호, 복구 자료는 Git에 커밋하지 않는다. 로컬 한 곳에만 두지 말고 암호화된 별도 백업을 만든다.

## 9. 원스토어 제출 판단

- 원스토어는 Android 바이너리로 APK와 AAB를 받는다.
- 신규 바이너리는 최대 2GB이며 패키지명, 서명 키, 버전 코드 등을 검사한다.
- AAB는 `minSdkVersion 21` 이상이어야 한다.
- AAB만 제출해도 원스토어가 만든 범용 APK를 내려받아 설치 검증하는 것이 권장된다.
- 인앱 상품을 넣지 않는 무료 게임이라면 원스토어 IAP SDK는 필수 작업이 아니다.
- 광고 SDK, 로그인 SDK, 결제 SDK를 추가하면 각 SDK의 권한·개인정보·생명주기 검사가 별도로 필요하다.

## 10. 완료 판정 기준

다음 항목을 모두 통과해야 “APK 빌드 가능”이 아니라 “Android 출시 후보가 준비됨”으로 상태를 바꾼다.

- [ ] Capacitor 설정과 `android/` 프로젝트가 저장소에 존재한다.
- [ ] `npm run build`와 `npx cap sync android`가 반복 실행된다.
- [ ] Debug APK가 실제 Android 기기에 설치되고 오프라인으로 실행된다.
- [ ] 홈, 수련, 출정, 전투, 보상, 엔딩, 재실행 후 저장 유지가 동작한다.
- [ ] 앱 전환·화면 잠금·뒤로 가기·오디오 포커스가 정상 동작한다.
- [ ] Release APK 또는 AAB가 확정된 키로 서명된다.
- [ ] 버전 코드 증가와 동일 키 업데이트 설치를 시험한다.
- [ ] 원스토어 등록 자료와 개인정보·등급 자료를 준비한다.

## 11. 공식 참고 자료

- [Capacitor 공식 소개 및 설치](https://capacitorjs.com/docs)
- [Capacitor 환경 요구사항](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Capacitor Android 추가·실행](https://capacitorjs.com/docs/android)
- [원스토어 Android 바이너리 가이드](https://onestore-dev.gitbook.io/dev/docs/apps/product/android/binary.md)
- [원스토어 앱 서명 가이드](https://onestore-dev.gitbook.io/dev/docs/apps/product/android/app-signing.md)
