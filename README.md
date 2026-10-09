# DripDrip 💧

Bản web của DripDrip: nuôi người bạn giọt nước qua thói quen uống nước. Giao diện tiếng Việt, ưu tiên điện thoại, pastel ocean blue. Mã nguồn JavaScript ES modules, HTML/CSS và SVG; không cần backend, tài khoản, API key hoặc thư viện runtime.

## Chạy local

Cần Node.js 22 trở lên. Không cần `npm install`.

```sh
npm run check
npm test
npm run build
npm run dev
```

Mở `http://127.0.0.1:4173`. Server phục vụ `dist/`; sau khi sửa source hãy chạy lại build. Không mở trực tiếp `index.html` bằng `file://`, vì module, IndexedDB và service worker cần HTTP(S).

## GitHub Pages

Repository: https://github.com/datngoo/DripDrip

1. Trong **Settings → Pages → Build and deployment**, chọn **Source: GitHub Actions**.
2. Push vào `main` hoặc chạy workflow **Test and deploy DripDrip** trong tab Actions.
3. Workflow kiểm tra cú pháp, chạy unit tests, tạo `dist/` và deploy bằng GitHub Pages.
4. URL dự kiến khi deploy thành công: `https://datngoo.github.io/DripDrip/`.

Tất cả đường dẫn asset, manifest, service worker đều tương đối; chạy được dưới `/DripDrip/` và domain riêng. Website không chứa secret. Nếu repository private, cần gói GitHub hỗ trợ Pages cho private repo. Workflow deployment không chạy từ pull request.

## Tính năng

- Ghi nhanh 200 / 350 / 500 ml, nhập hoặc kéo thanh lượng tùy chọn 25–2.000 ml.
- Hoàn tác, xóa log trong ngày; lịch sử đã chốt được giữ nguyên.
- Pet SVG có 5 trạng thái, animation theo trạng thái, phản hồi chạm và rung ở thiết bị hỗ trợ.
- Streak, Water Coins, tự dùng Freeze; quà 7 ngày (Neonglow), 14 ngày (Boba), 30 ngày (Golden).
- Cửa hàng skin Ocean / Neonglow / Cloud / Dragon / Golden, phụ kiện hoa / boba / crown. Xu chỉ kiếm trong app, không mua bằng tiền thật.
- Biểu đồ 7 ngày, tổng nước, trung bình những ngày đã tham gia, nhật ký gần nhất.
- Water Wrapped: xuất PNG 1080×1920 và Web Share API khi trình duyệt hỗ trợ chia sẻ tệp. Fallback tải ảnh về thiết bị.
- Cài PWA, mở lại và ghi nước offline sau lần tải online đầu tiên thành công.
- Lựa chọn lời nhắc gentle / sarcastic / aesthetic, thông báo foreground có xin quyền.
- Sao lưu JSON, kiểm tra dữ liệu trước khi khôi phục, xác nhận trước khi ghi đè/xóa dữ liệu.
- Responsive, semantic HTML, keyboard navigation, native dialog, reduced motion, progressbar có nhãn.

## Các quy tắc đã chọn

- Mặc định 2.000 ml để bắt đầu và có thể tùy chỉnh 500–8.000 ml. Đây là mục tiêu theo dõi, không phải khuyến nghị y khoa. Công thức trong PRD được đặt trong phần ước tính tùy chọn, không tự áp dụng.
- `<20%`: dehydrated, `[20%,50%)`: thirsty, `[50%,100%)`: normal, `[100%,150%]`: hydrated, `>150%`: overHydrated. PRD bỏ trống đúng 150%; bản này giữ nó ở hydrated.
- Mỗi ngày được snapshot mục tiêu. Đổi mục tiêu sau khi đã ghi nước có hiệu lực từ ngày kế tiếp; không tính lại mục tiêu các ngày cũ.
- UI hiển thị streak dự kiến ngay khi đạt mục tiêu hôm nay. Xu và cột mốc chỉ được chốt sau khi ngày kết thúc, một lần duy nhất. Nhờ vậy hoàn tác không tạo lỗi farm xu.
- Khi mở app, qua ngày hoặc quay lại tab, engine đối soát từng ngày chưa chốt theo lịch địa phương. Không cần app chạy lúc nửa đêm. Freeze giữ chuỗi nhưng không tăng streak, không tặng xu. Chỉ tiêu thụ Freeze khi có streak cần bảo vệ.
- 7 ngày liên tiếp **thực sự đạt mục tiêu** tặng 1 Freeze, trần 3. Một ngày frozen ngắt chuỗi kiếm Freeze nhưng bảo vệ streak chính. Mốc skin dựa trên số ngày đạt mục tiêu trong streak được bảo vệ.
- Ngày log được lưu ngay lúc nhập. Đổi timezone về sau không chuyển log sang ngày khác. Nếu đồng hồ lùi vào ngày đã chốt, app báo lỗi thay vì sửa lịch sử.
- Vượt mục tiêu không tặng thêm xu. Thông điệp pet khuyên nghỉ khi đã đạt mục tiêu.
- Số dư và nhật ký nằm ở thiết bị; đây không phải nền kinh tế chống gian lận trên máy chủ. Người kiểm soát trình duyệt hoặc tệp backup có thể sửa dữ liệu.

## Khác với bản iOS native

| iOS PRD                          | Bản web                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| SwiftData                        | IndexedDB, transaction nguyên tử, đồng bộ các tab bằng BroadcastChannel                                                               |
| SwiftUI                          | Semantic HTML / CSS và các view module                                                                                                |
| ImageRenderer                    | Canvas 1080×1920, PNG và Web Share                                                                                                    |
| WidgetKit + App Intent           | Nút ghi nhanh trong app; manifest shortcut mở xác nhận 200 ml. Không có widget lock screen iOS và không ghi nền một chạm khi app đóng |
| Local notification theo lịch     | Chỉ nhắc 08:00–22:00 khi app đang mở, trang đang visible và chưa đủ mục tiêu. Không có lịch nhắc sau khi đóng app                     |
| Live Activities / Dynamic Island | Không khả dụng từ một static PWA                                                                                                      |
| Haptics                          | `navigator.vibrate` ở thiết bị hỗ trợ; Safari iPhone có thể không rung                                                                |
| Custom app icon theo milestone   | Icon PWA cố định; milestone Golden thay diện mạo pet                                                                                  |

Muốn thông báo khi app đóng cần Web Push và một backend gửi push, hoặc app native. Static GitHub Pages không cung cấp backend lên lịch. iPhone cần thêm PWA vào màn hình chính trước khi dùng Web Push, nhưng phiên bản này không triển khai Web Push.

## Cấu trúc mã nguồn

```text
index.html / styles.css            App shell và theme
src/app.js                        Bootstrap, routing, settings, orchestration
src/models.js                     UserProfile, WaterLog, StreakRecord, catalog
src/storage.js                    IndexedDB transactions, backup validation
src/hydration-engine.js            PetState, tiến độ, thống kê, calculator
src/streak-manager.js              Đối soát ngày, xu, freeze, milestones
src/actions.js                     Log, undo, mua và equip, đổi settings
src/dashboard-view.js              Dashboard và lịch sử
src/pet-mascot.js                  Pet SVG, skin, phụ kiện, biểu cảm
src/store-view.js                  Cửa hàng
src/share-story-view.js            Water Wrapped / PNG
src/notification-engine.js         Permission, nội dung và hiển thị nhắc
src/ui.js                         Icons, escaping, formatters
sw.js / manifest.webmanifest       PWA, offline app shell, shortcut
scripts/                          Build tĩnh, preview server, syntax checks
tests/domain.test.mjs              Test logic quan trọng
.github/workflows/deploy.yml       CI và GitHub Pages
```

Các module tương ứng với file Swift trong kế hoạch ban đầu, nhưng là source chạy trực tiếp trong trình duyệt. Có thể tái sử dụng đặc tả/domain tests khi triển khai bản Swift sau này.

## Lưu trữ, update, riêng tư

IndexedDB lưu một state có version trong transaction read-write: việc đọc, đối soát, cập nhật và ghi là một thao tác nguyên tử, bao gồm nhiều tab cùng lúc. Không dùng localStorage làm nguồn dữ liệu. Thất bại lưu được báo rõ, không hiển thị thành công giả. Dữ liệu chỉ cùng một origin và browser profile; không tự đồng bộ điện thoại/máy tính. Clearing site data, chế độ riêng tư hoặc storage eviction có thể mất dữ liệu, vì vậy có chức năng sao lưu.

Service worker precache toàn bộ app shell. Build ID được hash từ source và assets; worker mới đợi các tab cũ đóng trước khi kích hoạt để tránh trộn phiên bản. Đóng các tab DripDrip rồi mở lại để nhận bản cập nhật. Không cache dữ liệu ra server. CSP chặn script bên ngoài và HTML không tin cậy được escape. Font dùng hệ thống, không gọi Google Fonts, analytics hoặc CDN.

## Kiểm thử

`npm test` kiểm tra ngưỡng pet, qua nửa đêm, DST/calendar, reward idempotency, undo, freeze, milestone, goal snapshot, store, backup, input và clock rollback. Cần kiểm tra thêm trên Safari/iPhone thật cho cài PWA, share sheet và quyền thông báo trước khi phát hành iOS chính thức.

Kiểm thử IndexedDB thật có trong `tests/storage-browser.html`. Chạy build, copy thư mục `tests/` vào `dist/tests/`, rồi mở preview bằng biến môi trường `PORT=4174` và truy cập `http://127.0.0.1:4174/tests/storage-browser.html`. Trang test chỉ cho chạy trên cổng riêng này và dùng dữ liệu kiểm thử. Nó kiểm tra 20 transaction cùng lúc: không mất log, không nhận thưởng trùng, không mua trùng và rollback khi transaction bị hủy. Trang test không nằm trong build triển khai bình thường.

Đã kiểm tra bản này trên trình duyệt desktop và viewport điện thoại 390 px: ghi nhanh/tùy chỉnh/hoàn tác, lưu sau reload, đổi mục tiêu, restore JSON, mua/equip, xuất PNG 1080×1920, đồng bộ hai tab và reload/ghi nước khi server local đã tắt. 25 domain tests và 4 bài kiểm tra transaction IndexedDB đều thành công. Việc cài app, share sheet và thông báo trên thiết bị iPhone thật chưa được xác minh.

Nguồn platform: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [MDN PWA offline/background](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation), [WebKit Web Push trên iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
