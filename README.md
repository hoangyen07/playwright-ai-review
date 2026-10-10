# Playwright AI Review

Sandbox Playwright + TypeScript để luyện và kiểm chứng việc **review test do AI (Claude Code) viết**.
Ý tưởng chuyển thể từ [dvasyliev/evaluating-ai-code](https://github.com/dvasyliev/evaluating-ai-code). Repo gốc dùng một máy tính Python làm đối tượng review; repo này dùng một màn hình thanh toán ví đơn giản và tập trung vào câu hỏi: *test có fail khi feature hỏng không?*

Repo chạy độc lập. Khi có framework thật, chỉ cần mang phần cấu hình AI sang (xem [Tích hợp vào framework khác](#tích-hợp-vào-framework-khác)).

## Cấu trúc

```
├── CLAUDE.md                              # nguyên tắc làm việc cho AI, luôn được load
├── .claude/
│   ├── rules/playwright.md                # rule Playwright, load khi AI sửa test/page/fixture
│   └── skills/ai-test-review/SKILL.md     # skill review test do AI viết
├── app/                                   # ứng dụng demo (đối tượng được test)
│   ├── checkout.html
│   └── server.mjs                         # static server, không cần thư viện
├── pages/checkout.page.ts                 # page object
├── fixtures/index.ts                      # fixture checkoutPage
├── data/test-data.ts                      # hằng số nghiệp vụ, message, format VND
├── test-cases/payment/TC-1031.md          # test case nguồn, dùng để đối chiếu khi review
├── tests/payment/wallet-payment.spec.ts   # test mẫu viết theo rule
└── examples/
    ├── seeded-bugs.spec.ts                # test cài sẵn 11 lỗi, có ghi đáp án ở đầu file
    ├── blind-seeded-bugs.spec.ts          # cùng code nhưng không có đáp án, để đo skill thật
    └── blind-seeded-bugs.key.md           # đáp án cho bản mù
```

## Ứng dụng demo

Màn hình thanh toán đơn hàng bằng **Ví** hoặc **Ngân hàng liên kết**. Trạng thái truyền qua query string để test tự setup data mà không cần đi qua UI:

```
http://localhost:4173/checkout.html?amount=50000&balance=100000&spentToday=0&orderId=ORD-0001
```

| Tình huống                                   | Kết quả                                          |
| -------------------------------------------- | ------------------------------------------------ |
| Ví đủ số dư                                  | Thành công, trừ tiền ví, hiện mã giao dịch       |
| Ví không đủ số dư                            | Thất bại — "Số dư ví không đủ", số dư giữ nguyên |
| Tổng chi trong ngày vượt 20.000.000 đ        | Thất bại — "Vượt hạn mức giao dịch trong ngày…"  |
| Ngân hàng liên kết                           | Thành công, không trừ tiền ví                    |
| Bấm thanh toán 2 lần liên tiếp               | Chỉ trừ tiền 1 lần                               |

Chạy app riêng để xem: `npm run app` rồi mở http://localhost:4173.

## Cài đặt và chạy

Cần Node.js 18 trở lên.

```bash
npm install
npx playwright install chromium

npm test              # chạy toàn bộ test (tự bật app demo)
npm run test:smoke    # chỉ test @smoke
npm run check         # tsc + eslint
npm run report        # mở HTML report
```

Kết quả mong đợi: `7 passed`.

Chạy với môi trường khác: đặt `BASE_URL`, khi đó Playwright không tự bật app demo.

## Bài tập với Claude Code

Mở repo bằng Claude Code (`claude` trong thư mục repo).

**1. Kiểm chứng skill review.** Gõ:

```
/ai-test-review examples/seeded-bugs.spec.ts theo test case TC-1024 ghi ở đầu file
```

Đối chiếu báo cáo với danh sách 11 lỗi ở đầu file. Lỗi nào skill bỏ sót thì bổ sung check vào `SKILL.md` rồi chạy lại.

Vì AI đọc được danh sách lỗi ở đầu file, kết quả này dễ đẹp hơn thực tế. Để đo thật, mở **phiên Claude Code mới** và review bản mù:

```
/ai-test-review examples/blind-seeded-bugs.spec.ts theo test case TC-1024 ghi ở đầu file. Không mở file nào khác trong examples/.
```

Sau đó chấm điểm bằng `examples/blind-seeded-bugs.key.md`: số lỗi tìm đúng trên 11, số lỗi thêm, và số finding sai. AI vẫn có thể tự tìm thấy `seeded-bugs.spec.ts` trong repo, nên hãy xem lại các file nó đã mở trước khi tin con số.

**2. Cho AI viết test mới rồi review.** Ví dụ:

```
Viết test TC-1031: thanh toán khi spentToday = 0 và amount = 20.000.000 đ bằng ví có 25.000.000 đ
```

Sau đó `/ai-test-review` trên test vừa sinh. Quan sát AI có tuân theo `rules/playwright.md` không (locator, web-first assertion, ID test case trong tên).

**3. Mutation check bằng tay.** Sửa một chỗ trong `app/checkout.html` để tạo bug, ví dụ trừ tiền gấp đôi:

```js
if (method === 'wallet') state.balance -= state.amount * 2;
```

Chạy `npm test`: TC-1024, TC-1026, TC-1029 phải fail. Nhớ hoàn tác. Thử các bug khác (đổi `>` thành `>=` ở hạn mức, bỏ chặn double submit) để xem test nào bắt được, test nào không — đó chính là chỗ cần bổ sung test.

## Lưới an toàn ngoài AI

Một số lỗi bắt được bằng công cụ, không cần trông vào AI review:

- `tsc` (trong `npm run check`) bắt API Playwright không tồn tại, ví dụ `toHaveExactText`.
- ESLint với `@typescript-eslint/no-floating-promises` và `eslint-plugin-playwright` bắt thiếu `await`, `waitForTimeout`, `test.only`, assertion không retry.

Thư mục `examples/` được loại khỏi `tsc`, ESLint và `npm test` để không làm hỏng build. Muốn thấy công cụ bắt lỗi, chạy:

```bash
npx eslint --no-ignore examples/seeded-bugs.spec.ts
npx tsc --noEmit --strict --skipLibCheck --module esnext --moduleResolution bundler --target es2022 examples/seeded-bugs.spec.ts
```

Hai lệnh này bắt được 4/11 lỗi cài sẵn: fixed wait [3], thiếu await [4], try/catch rỗng [7], API bịa [8]. Bảy lỗi còn lại (assertion yếu, thiếu expected result, locator bịa, phụ thuộc thứ tự, credential, locator CSS theo vị trí, thiếu ID test case) chỉ lộ ra khi review — đó là phần việc của skill.

## Tích hợp vào framework khác

1. Copy `CLAUDE.md` và thư mục `.claude/` vào root framework.
2. Viết lại phần **Project context** trong `CLAUDE.md` theo cấu trúc và lệnh chạy của framework.
3. Sửa `paths` ở đầu `.claude/rules/playwright.md` cho khớp thư mục test, page object, fixture.
4. Thêm các rule ESLint trong `eslint.config.mjs` vào cấu hình lint của framework.
5. Thay ví dụ trong rules và skill bằng tình huống nghiệp vụ thật của team nếu cần.
