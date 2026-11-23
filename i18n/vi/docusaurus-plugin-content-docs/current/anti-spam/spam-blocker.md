---
title: Spam Blocker
description: Dịch vụ phát hiện spam được host sẵn cho các cộng đồng Bitsocial, với chấm điểm rủi ro, kiểm tra bằng CAPTCHA và đăng nhập, cùng các chính sách kết nối.
sidebar_position: 1
---

# Spam Blocker

Spam Blocker chấm điểm rủi ro spam cho bài đăng, trả lời và lượt bình chọn trước khi cộng đồng chấp nhận chúng. Cộng đồng cài đặt gói thử thách, và gói này gửi từng nội dung tới một dịch vụ Spam Blocker. Bitsocial vận hành một dịch vụ như vậy tại `spamblocker.bitsocial.net`.

- **`@bitsocial/spam-blocker-challenge`** là gói thử thách mã nguồn mở mà các cộng đồng cài đặt. Hợp đồng tích hợp, các schema dùng chung và API của gói đều công khai.
- **Dịch vụ được host** chấm điểm nội dung và cung cấp các trang CAPTCHA và đăng nhập. Các trọng số và quy tắc suy đoán chi tiết của dịch vụ được giữ kín, như [chính sách mã nguồn](https://github.com/bitsocialnet/spam-blocker/blob/master/docs/architecture/hosted-service-source-policy.md) giải thích.

**Mã nguồn:** [github.com/bitsocialnet/spam-blocker](https://github.com/bitsocialnet/spam-blocker)

## Cách một nội dung được kiểm tra

1. Thử thách của cộng đồng gửi nội dung đã ký tới dịch vụ, và dịch vụ trả về điểm rủi ro trong khoảng từ 0 đến 1.
2. Dưới ngưỡng tự động chấp nhận của cộng đồng, nội dung được thông qua. Bằng hoặc trên ngưỡng tự động từ chối, nội dung bị từ chối và tác giả được biết lý do.
3. Ở khoảng giữa, lần đăng nhập được ghi nhớ của tác giả sẽ được dùng lại nếu đủ. Nếu không, tác giả nhận được một trang xác minh: CAPTCHA khi chỉ riêng CAPTCHA là có thể qua, hoặc đăng nhập. Qua kết nối VPN, proxy hoặc trung tâm dữ liệu mà cộng đồng hạn chế, tác giả cần đăng nhập ở mọi mức điểm dưới ngưỡng tự động từ chối, trừ khi áp dụng một miễn trừ trong mục Chính sách kết nối.
4. Sau đó cộng đồng đối chiếu kết quả với dịch vụ và áp dụng quy tắc riêng của mình về quốc gia, rủi ro IP và loại kết nối.

Trước khi tải lên tệp đính kèm, máy khách có thể chạy cùng phép kiểm tra đó dưới dạng kiểm tra trước, nhờ vậy phần lớn những tác giả sẽ bị từ chối không phải tải lên. Nội dung được kiểm tra lại khi được đăng, nên vẫn có thể bị từ chối dù kiểm tra trước đã được thông qua.

## Điểm rủi ro

| Tín hiệu                 | Mô tả                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Tuổi tài khoản           | Tài khoản càng mới thì điểm rủi ro càng cao.                                                                             |
| Karma                    | Karma tích lũy trong cộng đồng làm giảm rủi ro.                                                                          |
| Uy tín tác giả           | Dữ liệu từ một bộ lập chỉ mục chạy nền, theo dõi những tác giả nào được chấp nhận, bị gỡ bỏ hoặc bị cấm ở các cộng đồng. |
| Nội dung và liên kết     | Phân tích văn bản và liên kết, bao gồm cả nội dung lặp lại.                                                              |
| Tần suất đăng            | Đăng liên tiếp dồn dập từ cùng một tác giả làm tăng rủi ro.                                                              |
| Thông tin về IP          | Loại kết nối (Tor, VPN, proxy, trung tâm dữ liệu) và rủi ro IP. Địa chỉ IP thô không bao giờ được chia sẻ với cộng đồng. |
| Tài khoản liên kết       | Nhiều tài khoản đăng bài từ cùng một mạng sẽ làm rủi ro tăng dần.                                                        |
| Xác minh qua mạng xã hội | Các lần đăng nhập trước đó trên tài khoản của tác giả làm giảm rủi ro.                                                   |

## Xác minh

Mỗi bước hoàn tất sẽ nhân điểm rủi ro với một hệ số, và nội dung được thông qua khi kết quả dưới 0.4.

| Bước                                                           | Hệ số nhân |
| -------------------------------------------------------------- | ---------- |
| CAPTCHA (Cloudflare Turnstile)                                 | × 0.7      |
| Đăng nhập bằng Google, Apple hoặc Telegram                     | × 0.6      |
| Đăng nhập bằng một nhà cung cấp thứ hai, khác nhà cung cấp đầu | thêm × 0.5 |

Nếu CAPTCHA chưa đủ, bước tiếp theo là đăng nhập. Nếu đăng nhập chưa đủ, bước tiếp theo là CAPTCHA khi như vậy là đủ để hoàn tất phép kiểm tra, còn không thì là đăng nhập bằng nhà cung cấp thứ hai.

### Lần đăng nhập được ghi nhớ

Dịch vụ ghi nhớ tài khoản mà tác giả dùng để đăng nhập gần nhất. Một bài đăng sau đó cần xác minh sẽ dùng lại tài khoản này, như thể tác giả vừa đăng nhập lại, nếu có một bài đăng của tác giả đã dùng tài khoản đó trong 30 ngày qua. Mỗi lần dùng lại cũng được tính là một bài đăng như vậy, nên mốc 30 ngày bắt đầu lại sau mỗi lần. Khi như vậy là đủ, bài đăng được thông qua mà không cần CAPTCHA. Một lệnh cấm trong cộng đồng gắn với tài khoản đó sẽ chấm dứt việc này, và việc gỡ nhà cung cấp của tài khoản khỏi dịch vụ cũng vậy.

## Chính sách kết nối

Cộng đồng có thể hạn chế nội dung đến từ các kết nối Tor, VPN (bao gồm iCloud Private Relay), proxy và trung tâm dữ liệu. Trên dịch vụ được host:

- **Kết nối VPN, proxy và trung tâm dữ liệu** có thể đăng bài sau khi đăng nhập. Trang xác minh giải thích vì sao cần đăng nhập và cách đăng bài mà không cần đăng nhập bằng cách tắt VPN. Khi đó, lệnh cấm trong cộng đồng cũng áp dụng cho tài khoản đã dùng để đăng nhập.
- **Tài khoản lâu năm** được miễn các hạn chế đối với VPN, proxy và trung tâm dữ liệu, nhưng không được miễn hạn chế đối với Tor. Một tài khoản trở thành tài khoản lâu năm sau khi vượt qua CAPTCHA hoặc đăng nhập vào 3 ngày khác nhau từ các kết nối không bị hạn chế; các bài đăng được thông qua mà không cần CAPTCHA hay đăng nhập thì không được tính. Một mạng chỉ được tính cho một tài khoản: khi một tài khoản khác vượt qua kiểm tra từ mạng đó, mạng đó không được tính cho tài khoản nào trong hai tài khoản ấy. Trong cộng đồng đã cấm một tài khoản trên một trong các mạng đó, toàn bộ lịch sử này đều không được tính.
- **Tor** vẫn bị hạn chế, trừ những tác giả có miễn trừ do cộng đồng cấu hình: vai trò người kiểm duyệt, danh sách trắng của cộng đồng, hoặc tên `.bso` đã được xác minh.

Tệp đính kèm tải lên Forge Images tuân theo cùng các quy tắc này. Qua kết nối VPN, proxy hoặc trung tâm dữ liệu, việc tải lên cần một lần kiểm tra trước đã được thông qua nhờ đăng nhập, hoặc một tài khoản lâu năm. Qua Tor, cần có một miễn trừ đã được xác minh.

## Quyền riêng tư

- **Đơn vị vận hành** lưu địa chỉ IP thô và nội dung được đăng để phát hiện lạm dụng, đồng thời gửi địa chỉ IP tới một nhà cung cấp bên thứ ba để phân loại (mặc định là proxycheck.io).
- **Cộng đồng** chỉ nhận được mã quốc gia, rủi ro IP, ước tính loại kết nối và kết quả đạt hay không đạt. Cộng đồng không bao giờ nhận được IP thô hay tài khoản đăng nhập.
- **Đăng nhập** không yêu cầu bất kỳ dữ liệu hồ sơ nào. Dịch vụ chỉ nhận một ID tài khoản từ Google, Apple hoặc Telegram, không bao giờ nhận tên, email hay ảnh. Dịch vụ lưu ID cùng với bài đăng, không tự động xóa, để lệnh cấm cũng áp dụng cho tài khoản đó.
- **Tác giả dùng VPN** vẫn giữ kín địa chỉ IP thật khi đăng nhập: dịch vụ chỉ thấy địa chỉ của VPN.

## Giới hạn tần suất

Trước khi chấm điểm, dịch vụ từ chối những tác giả vượt quá hạn mức theo giờ hoặc theo ngày cho bài đăng, trả lời và lượt bình chọn. Hạn mức tăng theo tuổi tài khoản và uy tín tốt, và giảm sau các lần bị cấm hoặc bị gỡ bỏ.

## API

Các đường dẫn chính, tương đối so với `spamblocker.bitsocial.net/api/v1`:

| Đường dẫn                | Bên gọi                     | Mục đích                                            |
| ------------------------ | --------------------------- | --------------------------------------------------- |
| `POST /evaluate`         | Iframe thử thách, cộng đồng | Chấm điểm một nội dung và tạo phiên cho nội dung đó |
| `POST /challenge/verify` | Cộng đồng                   | Đọc kết quả phiên và thông tin về IP                |
| `POST /precheck`         | Iframe kiểm tra trước       | Chấm điểm bản nháp trước khi tải lên                |
| `GET /iframe/:sessionId` | Trình duyệt của tác giả     | Trang xác minh                                      |
| `POST /upload/authorize` | Máy khách của tác giả       | Cấp phép tệp đính kèm cho Forge Images              |

Toàn bộ hợp đồng, bao gồm cách ký yêu cầu và schema phản hồi, có trong [README của spam-blocker](https://github.com/bitsocialnet/spam-blocker#api-contract).
