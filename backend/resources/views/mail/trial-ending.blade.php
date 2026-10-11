Usta — {{ $salonName }}

@if ($daysLeft > 0)
AZ: Pulsuz sınaq müddətiniz {{ $endsOn }} tarixində bitir. Salonunuzun axtarışda qalması üçün planı ödəyin.
RU: Пробный период заканчивается {{ $endsOn }}. Оплатите тариф, чтобы салон оставался в поиске.
EN: Your free trial ends on {{ $endsOn }}. Pay for a plan to keep your salon in search.
@else
AZ: Pulsuz sınaq müddətiniz bu gün bitir. Ödənişdən sonra salonunuz axtarışda qalacaq; mövcud bronlar qüvvədədir.
RU: Пробный период заканчивается сегодня. После оплаты салон останется в поиске; существующие записи сохраняются.
EN: Your free trial ends today. Pay to stay in search; existing bookings stay valid.
@endif
