# Android 아이콘 및 스토어 준비 체크리스트

## 1. 현재 상태

- Android 앱 네이티브 프로젝트는 생성 완료
- 앱 패키지명: `com.asadal.game`
- 앱 이름: `아사달`
- 릴리즈 APK/AAB는 빌드 완료
- 커스텀 앱 아이콘 적용 완료
- 아이콘 원본: `public/assets/asadal-app-icon-1024.png`
- 아이콘 기준 이미지: `public/assets/ung-bear-warrior.png`

## 2. 아이콘 확인 포인트

- Android 기본 리소스 폴더에는 `mipmap-*` 디렉터리가 존재
- `ic_launcher`, `ic_launcher_round`, `ic_launcher_foreground` 리소스가 실제 PNG로 준비되어 있음
- Android adaptive icon 배경색은 `#10213F`로 설정

## 3. 필요한 작업

1. 앱 아이콘 원본 이미지 준비 - 완료
   - 권장 규격: 1024x1024 PNG
   - 생성 파일: `public/assets/asadal-app-icon-1024.png`
   - `ung-bear-warrior.png`를 참고한 웅 캐릭터 클로즈업 구성

2. Android 아이콘 생성 - 완료
   - mipmap 5개 크기 생성 완료
   - 반영 파일:
     - `mipmap-mdpi/ic_launcher.png`
     - `mipmap-hdpi/ic_launcher.png`
     - `mipmap-xhdpi/ic_launcher.png`
     - `mipmap-xxhdpi/ic_launcher.png`
     - `mipmap-xxxhdpi/ic_launcher.png`
     - 각 `ic_launcher_round`, `ic_launcher_foreground`도 동일하게 생성

3. 실제 적용 확인 - 완료
   - [android/app/src/main/AndroidManifest.xml](../android/app/src/main/AndroidManifest.xml) 에서 아이콘 경로 확인
   - `android:icon="@mipmap/ic_launcher"` 사용 중
   - `android:roundIcon="@mipmap/ic_launcher_round"` 사용 중

## 4. 출시 전 추가 점검

- 앱 이름과 패키지명 최종 확정: `아사달`, `com.asadal.game`
- 버전 코드/버전 이름 결정: `versionCode 1`, `versionName "1.0"`
- 스플래시 로고 또는 기본 이미지 추가 여부 검토: 기존 splash 리소스 유지
- 원스토어 등록용 스크린샷 준비: 스토어 등록 시 별도 준비 필요
- 앱 설명, 카테고리, 개인정보 처리방침 링크 확인: 스토어 등록 시 별도 확정 필요

## 5. 다음 액션 권장

- `./gradlew assembleRelease` 재빌드
- 설치 테스트 또는 스토어 검수용 APK 재확인
- 원스토어 등록용 스크린샷, 설명, 개인정보 처리방침 링크 준비

## 6. 메모

기본 Android 아이콘은 웅 캐릭터 기반 커스텀 아이콘으로 교체되었습니다. 1024x1024 원본은 향후 Toss 미니앱 제출 이미지가 필요할 때도 기준 파일로 재사용할 수 있습니다.
