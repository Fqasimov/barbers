Usta — {{ $salonName }}

@if ($daysLeft > 0)
AZ: Pulsuz sınaq müddətiniz {{ $endsOn }} tarixində bitir. İndiyə qədər heç bir ödəniş alınmayıb. Salonunuzun axtarışda qalması üçün Android tətbiqində və ya saytda Biznes → Plan bölməsində ödəniş üsulunu əlavə edin. İstəmirsinizsə, heç nə etməyin: avtomatik ödəniş yoxdur.
RU: Пробный период заканчивается {{ $endsOn }}. До сих пор оплата не списывалась. Чтобы салон оставался в поиске, добавьте способ оплаты в Android-приложении или на сайте, раздел Бизнес → Тариф. Если не хотите продолжать, ничего делать не нужно: автосписаний нет.
EN: Your free trial ends on {{ $endsOn }}. Nothing has been charged so far. To keep your salon in search, add a payment method in the Android app or on the website, under Business → Plan. If you don't want to continue, do nothing: there is no automatic charge.
@else
AZ: Pulsuz sınaq müddətiniz bu gün bitir. Salonunuz {{ $hiddenOn }} tarixinə qədər axtarışda qalır və bron qəbul edir; bu tarixə qədər ödəniş edilməsə, axtarışdan çıxacaq və yeni bron qəbul etməyəcək. Mövcud bronlar qüvvədə qalır.
RU: Пробный период заканчивается сегодня. Салон остаётся в поиске и принимает записи до {{ $hiddenOn }}; если не оплатить до этой даты, он пропадёт из поиска и перестанет принимать новые записи. Существующие записи сохраняются.
EN: Your free trial ends today. Your salon stays in search and keeps taking bookings until {{ $hiddenOn }}; if it isn't paid by then, it leaves search and stops taking new bookings. Existing bookings stay valid.
@endif
