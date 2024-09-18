# 스마트팜 & 스마트팜 관리 서비스

## 🎙️프로젝트 소개

-    집안 어디에서나 쉽게 식물을 키울 수 있으며, 웹을 이용하여 모니터링이 가능한 가정용 농장

## 🪄 기술 스택

-    FE : ReactJS
-    BE : Node.js, Express.js, Swagger
-    DB : MongoDB(NoSQL)
-    DevOps : GitLab
-    협업 툴: Discord, Notion, Figma

## ⏰ 개발 기간

-    2024. 8.   12. ~ 2024. 9. 6.

### 🧑‍💻 멤버 구성

#### [FrontEnd]

-    팀원: 이다은 - 메인 페이지, 기기 등록 페이지, History 페이지(그래프, 기기 제어), 마이 페이지, 비밀번호 변경, 회원 탈퇴
-    팀원: 이도경 - 로그인 페이지, 회원가입 페이지, 비밀번호 찾기/변경 페이지, Management 페이지, History 페이지

#### [Device]

-    팀원: 김장현 - pub 기능 , 통신테스트 및 문제 해결, 회로 설계, 센서 관리
-    팀원: 장원호 - ap모드로 와이파이 연결,spiffs 파일 저장 기능, mosquitto 연결 및 관리 ,sub 기능, 회로 설계, 센서 관리

#### [BackEnd]

-    팀장: 김대중 - 회원가입/로그인 기능, device 제어 기능, 식물 정보 조회 기능, 그래프 데이터 조회 기능, 소셜 로그인 기능, 이상 알림 기능
-    팀원: 조수빈 - 이메일 인증/비밀번호 재설정 기능, device 제어 기능, 초기 데이터 생성/변경 기능, 그래프 데이터 조회 기능, device 정보 조회/삭제 기능, 마이페이지 기능, swagger 작성

### ✨ 주요 기능

#### [회원가입 기능]

-    이름, 이메일. 비밀번호, 전화번호 필수 입력
     -    이메일 조건: 영문자, 숫자, 특수문자로 구성된 로컬 파트 + @ + . + 최소 2글자의 영문자로 구성된 TLD
     -    비밀번호 조건: 영문자 + 숫자 + 특수문자, 7자리 이상

<img src="/README_img/image.png" width="400" height="300"/>

#### [로그인 기능]

-    이메일 & 비밀번호를 DB에 저장된 데이터와 비교 후 일치하는 경우에만 로그인 성공
-    이메일 기억하기 버튼 누르면 로그인 시, 최근에 로그인한 이메일이 보여짐
-    로그인 시, JWT 토큰을 쿠키에 담아 발급
-    탈퇴한 회원의 경우 로그인 불가

<img src="/README_img/image-1.png" width="400" height="300"/>

#### [마이페이지]

-    사용자의 정보 조회 가능(이름, 이메일)
-    비밀번호 변경 버튼 클릭하여 변경 가능
-    로그아웃 버튼 클릭 시, 쿠키 사라지며 로그아웃
-    회원 탈퇴하기 버튼 클릭하고 비밀번호 입력하면 탈퇴 가능

<img src="/README_img/image-4.png" width="600" height="300"/>
<img src="/README_img/image-5.png" width="300" height="300"/>
<img src="/README_img/image-6.png" width="300" height="300"/>

#### [이메일 인증/비밀번호 재설정]

-    비밀번호 재설정 시, 사용자가 입력한 이메일이 DB에 존재 여부 및 탈퇴 여부 확인 후 이메일로 랜덤한 4자리 인증코드 발송과 동시에 임시 DB에 인증번호 저장 후, 임시 토큰 발급

-    사용자가 입력한 인증번호와 사용자의 이메일로 보낸 인증번호가 일치하는지 판단 후, 일치한다면, 비밀번호 재설정 가능

<img src="/README_img/image-7.png" width="400" height="300"/>
<img src="/README_img/image-8.png" width="400" height="300"/>

#### [device 정보 조회/삭제]

-    Management 탭 클릭 시, 첫 번째로 등록한 기기 정보가 먼저 보여짐
-    드롭 다운 버튼 클릭하여 기기 선택 가능
-    기기 삭제 버튼 클릭하여 해당 기기 삭제 가능

<img src="/README_img/image-9.png" width="400" height="300"/>

#### [device 등록/변경]

-    main 페이지의 Add Devices 버튼 클릭하면 device를 등록할 수 있는 페이지로 넘어가고 해당 정보 모두 입력하면 deivce 등록 가능

-    MAC ADDRESS는 기기와 WiFi로 연결 시, `_` 뒤에 적혀져있는 문자 입력(고유 ID)
-    기기 이름은 중복될 수 없음

-    기기의 정보를 수정하려면 Management 탭에서 정보를 수정한 후, 변경하기 버튼을 클릭하면 수정 가능

<img src="/README_img/image-10.png" width="600" height="300"/>
<img src="/README_img/image-11.png" width="350" height="300"/>
<img src="/README_img/image-12.png" width="300" height="700"/>

#### [그래프 데이터]

-    1시간마다 device로부터 온도, 습도, 지습 데이터의 평균치를 받아 DB에 저장하고 하루치와 일주일치 데이터를 보여줌
-    그래프는 History 탭에서 확인 가능하며, 온도/습도/지습의 데이터를 각각 보여줌

<img src="/README_img/image-13.png" width="300" height="500"/>
<img src="/README_img/image-14.png" width="300" height="500"/>
<img src="/README_img/image-15.png" width="300" height="500"/>

#### [식물 정보 조회]

-    device로부터 실시간으로 데이터를 받아서 보여줌
-    devices 탭과 History 탭에서 확인 가능
-    해당 탭에 들어왔을 때, 새로 고침 버튼을 눌렀을 때, 30초마다 해당 정보 확인 가능

<img src="/README_img/image-17.png" width="800" height="300"/>
<img src="/README_img/image-16.png" width="400" height="300"/>
<img src="/README_img/image-18.png" width="800" height="300"/>
![alt text](image.png)

#### [device 제어]

-    ON/OFF 토글 버튼 사용하여 제어 가능
-    워터 펌프와 영양분 제어는 숫자(mL) 입력하여 제어 가능

<img src="/README_img/image-19.png" width="500" height="200"/>
<img src="/README_img/image-20.png" width="450" height="200"/>

#### [이상 알림]

-    식물의 온도/습도/지습이 사용자가 설정한 범위를 벗어나면 메일로 알림 전송

<img src="/README_img/image-21.png" width="400" height="200"/>
