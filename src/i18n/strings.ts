import type { Loc } from './types';

const L = (az: string, ru: string, en: string): Loc => ({ az, ru, en });

/**
 * Every interface string, in Azerbaijani (default), Russian and English.
 * `{name}` placeholders are filled by `t(key, { name })`.
 */
export const strings = {
  // Navigation
  tabDiscover: L('Kəşf et', 'Главная', 'Discover'),
  tabMap: L('Xəritə', 'Карта', 'Map'),
  tabBookings: L('Növbələr', 'Записи', 'Bookings'),
  tabProfile: L('Profil', 'Профиль', 'Profile'),
  back: L('Geri', 'Назад', 'Back'),
  close: L('Bağla', 'Закрыть', 'Close'),
  seeAll: L('Hamısı', 'Все', 'See all'),
  all: L('Hamısı', 'Все', 'All'),
  continue: L('Davam et', 'Продолжить', 'Continue'),
  reset: L('Sıfırla', 'Сбросить', 'Reset'),
  today: L('Bu gün', 'Сегодня', 'Today'),
  tomorrow: L('Sabah', 'Завтра', 'Tomorrow'),
  yesterday: L('Dünən', 'Вчера', 'Yesterday'),
  you: L('Siz', 'Вы', 'You'),
  guest: L('Qonaq', 'Гость', 'Guest'),

  // Discover
  nearYou: L('Yaxınlığınızda', 'Рядом с вами', 'Near you'),
  centralBaku: L('Bakı mərkəzi', 'Центр Баку', 'Central Baku'),
  goodMorning: L('Sabahınız xeyir', 'Доброе утро', 'Good morning'),
  goodAfternoon: L('Günortanız xeyir', 'Добрый день', 'Good afternoon'),
  goodEvening: L('Axşamınız xeyir', 'Добрый вечер', 'Good evening'),
  goodNight: L('Gecəniz xeyrə', 'Доброй ночи', 'Good night'),
  discoverTitle: L('Növbəti ziyarətinizi tapın', 'Найдите свой следующий визит', 'Find your next visit'),
  searchPlaceholder: L('Xidmət, salon və ya usta', 'Услуга, салон или мастер', 'Service, salon or master'),
  findSlot: L('Boş vaxt tap', 'Найти свободное время', 'Find a free slot'),
  findSlotHint: L(
    'Xidmət, gün və saat — bütün şəhər üzrə',
    'Услуга, день и время — по всему городу',
    'Service, day and time — across the city',
  ),
  availableToday: L('Bu gün boş vaxtlar', 'Свободно сегодня', 'Available today'),
  availableTodaySub: L(
    'Şəhər üzrə ən yaxın boş yerlər',
    'Ближайшие свободные окна по городу',
    'The next open chairs across the city',
  ),
  nearbyTitle: L('Yaxınlıqda ən yaxşılar', 'Лучшие рядом', 'Highly rated nearby'),
  topRated: L('Ən yüksək reytinq', 'Лучшие по рейтингу', 'Top rated'),
  mastersTitle: L('Müştərilərin qayıtdığı ustalar', 'Мастера, к которым возвращаются', 'Masters people rebook'),
  bestMatch: L('Ən uyğun', 'Лучший выбор', 'Best match'),
  nextUp: L('Növbəti görüş', 'Следующий визит', 'Next up'),
  nothingInCategory: L(
    'Bu kateqoriyada hələ heç nə yoxdur.',
    'В этой категории пока пусто.',
    'Nothing in this category yet.',
  ),
  rankingNote: L(
    'Reytinq rəylərin sayını da nəzərə alır — bir neçə beşulduzlu rəy siyahının başına çıxara bilməz.',
    'Рейтинг учитывает количество отзывов — несколько пятёрок не выведут место в топ.',
    'Rankings weigh volume, so a handful of five-star reviews can’t top the list.',
  ),

  // Open state
  openUntil: L('{time}-dək açıqdır', 'Открыто до {time}', 'Open until {time}'),
  closesSoon: L('Tezliklə bağlanır · {time}', 'Скоро закроется · {time}', 'Closes {time}'),
  opensAt: L('Açılır: {time}', 'Откроется в {time}', 'Opens {time}'),
  closedNow: L('Bağlıdır', 'Закрыто', 'Closed now'),
  closedToday: L('Bu gün bağlıdır', 'Сегодня выходной', 'Closed today'),

  // Units & templates
  walk: L('{n} dəq piyada', '{n} мин пешком', '{n} min walk'),
  experience: L('{years} təcrübə', 'опыт {years}', '{years} experience'),
  minShort: L('dəq', 'мин', 'min'),
  hourShort: L('saat', 'ч', 'h'),

  // Salon
  tabServices: L('Xidmətlər', 'Услуги', 'Services'),
  tabMasters: L('Ustalar', 'Мастера', 'Masters'),
  tabReviews: L('Rəylər', 'Отзывы', 'Reviews'),
  tabAbout: L('Haqqında', 'О салоне', 'About'),
  call: L('Zəng', 'Позвонить', 'Call'),
  directions: L('Marşrut', 'Маршрут', 'Directions'),
  share: L('Paylaş', 'Поделиться', 'Share'),
  compare: L('Müqayisə', 'Сравнить', 'Compare'),
  addToCompare: L('Müqayisəyə əlavə et', 'Добавить к сравнению', 'Add to compare'),
  removeFromCompare: L('Müqayisədən çıxar', 'Убрать из сравнения', 'Remove from compare'),
  save: L('Yadda saxla', 'Сохранить', 'Save'),
  unsave: L('Saxlanılanlardan çıxar', 'Убрать из сохранённых', 'Remove from saved'),
  womenOnly: L('Yalnız qadınlar üçün', 'Только для женщин', 'Women only'),
  englishSpoken: L('İngiliscə danışılır', 'Говорят по-английски', 'English spoken'),
  book: L('Növbə götür', 'Записаться', 'Book'),
  chooseTime: L('Vaxt seç', 'Выбрать время', 'Choose time'),
  takingToday: L('Bu gün qəbul var', 'Есть запись на сегодня', 'Taking bookings today'),
  bookLater: L('Bu həftə üçün yazılın', 'Запишитесь на эту неделю', 'Book for later this week'),
  pickTime: L('Sizə uyğun vaxtı seçin', 'Выберите удобное время', 'Pick a time that suits you'),
  nextFree: L('Ən yaxın boş vaxt', 'Ближайшее окно', 'Next free'),
  fullyBooked: L('Boş vaxt yoxdur', 'Нет свободных окон', 'Fully booked'),
  follow: L('İzlə', 'Следить', 'Follow'),
  following: L('İzlənilir', 'Вы следите', 'Following'),
  openingHours: L('İş saatları', 'Часы работы', 'Opening hours'),
  closed: L('Bağlı', 'Выходной', 'Closed'),
  offDay: L('İstirahət', 'Выходной', 'Day off'),
  goodToKnow: L('Bilmək faydalıdır', 'Полезно знать', 'Good to know'),
  readAll: L('Bütün rəylər', 'Все отзывы', 'All reviews'),
  rateVisit: L('Ziyarətinizi qiymətləndirin', 'Оцените визит', 'Rate your visit'),
  reviewsAfterVisit: L(
    'Rəyi bu məkana tamamlanmış ziyarətdən sonra yaza bilərsiniz.',
    'Отзыв можно оставить после завершённого визита.',
    'You can review this place after a completed visit.',
  ),
  verifiedVisit: L('Təsdiqlənmiş ziyarət', 'Подтверждённый визит', 'Verified visit'),
  notFound: L(
    'Bu məkan artıq fəaliyyət göstərmir.',
    'Это место больше не работает.',
    'This place has closed its doors.',
  ),
  backToDiscover: L('Ana səhifəyə qayıt', 'На главную', 'Back to Discover'),
  todaySuffix: L('Bu gün', 'Сегодня', 'Today'),

  // Booking
  stepServices: L('Xidmət seçin', 'Выберите услуги', 'Choose services'),
  stepMaster: L('Ustanı seçin', 'Выберите мастера', 'Choose your master'),
  stepTime: L('Gün və saat', 'День и время', 'Pick a day & time'),
  stepConfirm: L('Yoxlayın və təsdiqləyin', 'Проверьте и подтвердите', 'Review & confirm'),
  stepOf: L('Addım {n}/4', 'Шаг {n} из 4', 'Step {n} of 4'),
  nothingSelected: L('Hələ heç nə seçilməyib', 'Ничего не выбрано', 'Nothing selected yet'),
  confirmBooking: L('Təsdiqlə', 'Подтвердить', 'Confirm booking'),
  anyMaster: L('İstənilən usta', 'Любой мастер', 'Any master'),
  anyMasterLabel: L('İlk boş usta', 'Первый свободный мастер', 'First available master'),
  anyMasterSub: L(
    'Seçdiyiniz vaxtda boş olan ən yüksək reytinqli ustanı təyin edəcəyik.',
    'Назначим мастера с лучшим рейтингом, свободного в выбранное время.',
    'We’ll match you with the best-rated master free at your time.',
  ),
  mastersForBooking: L('Bu sifariş üçün {masters}', '{masters} для этой записи', '{masters} for this booking'),
  noSingleMaster: L(
    'Bunların hamısını bir usta etmir. Ayrı-ayrı növbə götürməyi sınayın.',
    'Один мастер не делает всё это сразу. Попробуйте записаться отдельно.',
    'No single master does all of these together. Try booking them separately.',
  ),
  showingMaster: L('{name} ustasının xidmətləri', 'Услуги мастера {name}', 'Showing what {name} does'),
  dayOff: L('İstirahət günü — başqa gün seçin.', 'Выходной — выберите другой день.', 'Day off — choose another day.'),
  dayFull: L(
    'Boş vaxt yoxdur — başqa gün seçin.',
    'Свободных окон нет — выберите другой день.',
    'Fully booked — choose another day.',
  ),
  morning: L('Səhər', 'Утро', 'Morning'),
  afternoon: L('Gündüz', 'День', 'Afternoon'),
  evening: L('Axşam', 'Вечер', 'Evening'),
  firstAvailable: L('İlk boş usta', 'Первый свободный', 'First available'),
  totalAtVenue: L('Cəmi, salonda ödənilir', 'Итого, оплата в салоне', 'Total, paid at the venue'),
  noteForMaster: L('Usta üçün qeyd', 'Комментарий мастеру', 'Note for your master'),
  notePlaceholder: L(
    'İstəyə bağlı — məsələn, nümunə şəkil, həssas dəri…',
    'Необязательно — например, фото-референс, чувствительная кожа…',
    'Optional — e.g. a reference photo, sensitive skin…',
  ),
  policy: L(
    'Görüşdən 2 saat əvvələdək pulsuz ləğv. Ödəniş {salon} salonunda edilir — kart lazım deyil.',
    'Бесплатная отмена за 2 часа до визита. Оплата в {salon} — карта не нужна.',
    'Free cancellation up to 2 hours before. You pay at {salon} — no card needed.',
  ),
  booked: L('Növbəniz qəbul olundu', 'Вы записаны', 'You’re booked'),
  bookedBody: L(
    '{day}, saat {time} · {master} · {salon}. Növbələr bölməsində saxladıq.',
    '{day} в {time} · {master} · {salon}. Запись сохранена в разделе «Записи».',
    '{day} at {time} with {master} at {salon}. Saved to your bookings.',
  ),
  viewBookings: L('Növbələrimə bax', 'Мои записи', 'View my bookings'),
  done: L('Hazırdır', 'Готово', 'Done'),
  yourMaster: L('ustanız', 'ваш мастер', 'your master'),
  slotTaken: L(
    'Bu vaxt artıq tutulub — başqa saat seçin.',
    'Это время уже заняли — выберите другое.',
    'That time was just taken — pick another.',
  ),

  // Bookings
  upcoming: L('Gələcək', 'Предстоящие', 'Upcoming'),
  past: L('Keçmiş', 'Прошедшие', 'Past'),
  emptyUpcomingTitle: L('Hələ növbəniz yoxdur', 'Записей пока нет', 'Nothing booked yet'),
  emptyUpcomingBody: L(
    'Etibar etdiyiniz ustanı tapın və vaxt seçin — bir dəqiqədən az çəkir.',
    'Найдите мастера, которому доверяете, и выберите время — это меньше минуты.',
    'Find a master you trust and pick a time — it takes under a minute.',
  ),
  discoverPlaces: L('Məkanlara bax', 'Смотреть места', 'Discover places'),
  emptyPastTitle: L('Tarixçə boşdur', 'Истории пока нет', 'No history yet'),
  emptyPastBody: L(
    'Keçmiş ziyarətlər burada görünəcək — qiymətləndirmək və ya təkrar yazılmaq üçün.',
    'Здесь появятся прошлые визиты — чтобы оценить или записаться снова.',
    'Past visits appear here, ready to review or rebook.',
  ),
  cancelled: L('Ləğv edilib', 'Отменена', 'Cancelled'),
  completed: L('Tamamlanıb', 'Завершена', 'Completed'),
  cancel: L('Ləğv et', 'Отменить', 'Cancel'),
  cancelTitle: L('Növbə ləğv edilsin?', 'Отменить запись?', 'Cancel this booking?'),
  keep: L('Saxla', 'Оставить', 'Keep it'),
  cancelBooking: L('Növbəni ləğv et', 'Отменить запись', 'Cancel booking'),
  cancelledToast: L(
    'Növbə ləğv edildi. Vaxt yenidən boşdur.',
    'Запись отменена. Время снова свободно.',
    'Booking cancelled. The slot is free again.',
  ),
  bookAgain: L('Yenidən yazıl', 'Записаться снова', 'Book again'),
  thanksReviewed: L(
    'Bu ziyarətə rəy yazmısınız. Təşəkkürlər!',
    'Спасибо за отзыв об этом визите.',
    'Thanks for reviewing this visit.',
  ),
  whatsapp: L('WhatsApp', 'WhatsApp', 'WhatsApp'),
  waMessage: L(
    'Salam! Usta vasitəsilə {day}, saat {time} üçün növbə götürmüşəm: {services}.',
    'Здравствуйте! Я записался(-ась) через Usta на {day} в {time}: {services}.',
    'Hi! I booked {services} for {day} at {time} through Usta.',
  ),

  // Profile
  namePlaceholder: L('Adınızı yazın', 'Ваше имя', 'Add your name'),
  nameHint: L('Rəylərinizdə görünür', 'Отображается в ваших отзывах', 'Shown on the reviews you write'),
  statBooked: L('Növbə', 'Записи', 'Booked'),
  statReviews: L('Rəy', 'Отзывы', 'Reviews'),
  statSaved: L('Saxlanılan', 'Сохранено', 'Saved'),
  savedPlaces: L('Saxlanılan məkanlar', 'Сохранённые места', 'Saved places'),
  savedHint: L(
    'Hər hansı məkanın ürək işarəsinə toxunun — sonrakı dəfə üçün burada qalacaq.',
    'Нажмите на сердечко у любого места — оно сохранится здесь.',
    'Tap the heart on any venue to keep it here for next time.',
  ),
  followedMasters: L('İzlədiyiniz ustalar', 'Ваши мастера', 'Masters you follow'),
  followedHint: L(
    'Ustanı izləyin — boş vaxtı olanda və ya başqa salona keçəndə burada görəcəksiniz.',
    'Следите за мастером — увидите здесь его свободное время, даже если он сменит салон.',
    'Follow a master to see their next free slot here — even if they move salons.',
  ),
  language: L('Dil', 'Язык', 'Language'),
  appearance: L('Görünüş', 'Оформление', 'Appearance'),
  system: L('Sistem', 'Системное', 'System'),
  light: L('Açıq', 'Светлое', 'Light'),
  dark: L('Tünd', 'Тёмное', 'Dark'),
  colophon: L(
    'Versiya 1.1 · Bakının bərbərxanaları, salonları və ustaları üçün.',
    'Версия 1.1 · Для барбершопов, салонов и мастеров Баку.',
    'Version 1.1 · Made for Baku’s barbers, salons and the masters behind them.',
  ),

  // Top rated
  bestInBaku: L('Bakının ən yaxşıları', 'Лучшие в Баку', 'Best in Baku'),
  bestOf: L('Ən yaxşı {cat}', 'Лучшие: {cat}', 'The best {cat}'),
  rankingExplain: L(
    'Çəkili reytinqə görə sıralanıb: yuxarı qalxmaq üçün çoxlu ziyarətdə sabit yüksək bal lazımdır.',
    'Сортировка по взвешенному рейтингу: чтобы подняться, нужны стабильные оценки по многим визитам.',
    'Ranked by a weighted rating: a place needs consistent scores across many visits to rise.',
  ),

  // Reviews
  reviewsTitle: L('Rəylər', 'Отзывы', 'Reviews'),
  latestNote: L(
    'Son yazılı rəylər göstərilir. Bal bütün qiymətləndirilmiş ziyarətləri nəzərə alır.',
    'Показаны последние отзывы. Оценка учитывает все визиты.',
    'Showing the latest written reviews. Scores include every rated visit.',
  ),
  stars5: L('5 ulduz', '5 звёзд', '5 stars'),
  stars4: L('4 ulduz', '4 звезды', '4 stars'),
  starsLow: L('3 və aşağı', '3 и ниже', '3 and below'),
  noReviewsInRange: L(
    'Bu aralıqda yazılı rəy yoxdur.',
    'В этом диапазоне отзывов нет.',
    'No written reviews in this range yet.',
  ),
  ratingDistribution: L('Reytinq bölgüsü', 'Распределение оценок', 'Rating distribution'),

  // Write review
  howWasVisit: L('Ziyarətiniz necə keçdi?', 'Как прошёл визит?', 'How was your visit?'),
  tapOrDrag: L(
    'Ulduzlara toxunun və ya sürüşdürün',
    'Нажмите или проведите по звёздам',
    'Tap or drag across the stars',
  ),
  rating5: L('Möhtəşəm', 'Отлично', 'Exceptional'),
  rating4: L('Çox yaxşı', 'Очень хорошо', 'Very good'),
  rating3: L('Yaxşı', 'Хорошо', 'Good'),
  rating2: L('Narazı qaldım', 'Разочарован(а)', 'Disappointing'),
  rating1: L('Pis', 'Плохо', 'Poor'),
  ratingLabel: L('Qiymət', 'Оценка', 'Rating'),
  ofFive: L('5-dən {n}', '{n} из 5', '{n} of 5 stars'),
  notRated: L('Qiymət verilməyib', 'Без оценки', 'Not rated'),
  whoLooked: L('Sizə kim xidmət etdi?', 'Кто вас обслуживал?', 'Who looked after you?'),
  whatStood: L('Nə xoşunuza gəldi?', 'Что понравилось?', 'What stood out?'),
  yourReview: L('Rəyiniz', 'Ваш отзыв', 'Your review'),
  reviewPlaceholder: L(
    'Kəsim, qarşılanma, gözləmə — başqaları nəyi bilməlidir?',
    'Стрижка, приём, ожидание — что важно знать другим?',
    'The cut, the welcome, the wait — what should others know?',
  ),
  nameOnReview: L('Rəydə görünən ad', 'Имя в отзыве', 'Name on the review'),
  postReview: L('Rəyi dərc et', 'Опубликовать', 'Post review'),
  chooseRatingFirst: L('Əvvəlcə qiymət verin', 'Сначала поставьте оценку', 'Choose a rating first'),
  thanksToast: L(
    'Təşəkkürlər — rəyiniz dərc olundu.',
    'Спасибо — отзыв опубликован.',
    'Thank you — your review is live.',
  ),
  visitOn: L('{date} ziyarəti · {service}', 'Визит {date} · {service}', 'Visit on {date} · {service}'),
  reviewLockedTitle: L('Rəy yalnız ziyarətdən sonra', 'Отзыв — только после визита', 'Reviews follow real visits'),
  reviewLockedBody: L(
    'Usta-da hər rəy tamamlanmış növbəyə bağlıdır — buna görə reytinqlərə etibar etmək olur.',
    'В Usta каждый отзыв привязан к завершённой записи — поэтому рейтингам можно доверять.',
    'On Usta every review is tied to a completed booking — that’s why the ratings can be trusted.',
  ),

  // Search
  search: L('Axtarış', 'Поиск', 'Search'),
  clearSearch: L('Təmizlə', 'Очистить', 'Clear search'),
  popular: L('Bu həftə populyar', 'Популярно на этой неделе', 'Popular this week'),
  browse: L('Kateqoriyalar', 'Категории', 'Browse'),
  places: L('Məkanlar', 'Места', 'Places'),
  nothingFor: L('«{q}» üzrə heç nə tapılmadı', 'По запросу «{q}» ничего нет', 'Nothing for “{q}”'),
  searchTry: L(
    'Xidmət (məsələn, «fade») və ya rayon (məsələn, «Nizami») yazın.',
    'Попробуйте услугу («фейд») или район («Низами»).',
    'Try a service like “fade” or a district like “Nizami”.',
  ),

  // Find a free slot
  service: L('Xidmət', 'Услуга', 'Service'),
  day: L('Gün', 'День', 'Day'),
  time: L('Saat', 'Время', 'Time'),
  windowAny: L('İstənilən', 'Любое', 'Any time'),
  windowMorning: L('Səhər · 09–12', 'Утро · 09–12', 'Morning · 9–12'),
  windowAfternoon: L('Gündüz · 12–17', 'День · 12–17', 'Afternoon · 12–17'),
  windowEvening: L('Axşam · 17-dən', 'Вечер · с 17', 'Evening · from 17'),
  filters: L('Filtrlər', 'Фильтры', 'Filters'),
  womenOnlyFilter: L('Yalnız qadınlar üçün', 'Только для женщин', 'Women-only salons'),
  englishFilter: L('İngiliscə danışan usta', 'Мастер говорит по-английски', 'English-speaking master'),
  sortEarliest: L('Ən tez', 'Раньше всего', 'Earliest'),
  sortCheapest: L('Ən ucuz', 'Дешевле', 'Cheapest'),
  sortNearest: L('Ən yaxın', 'Ближе', 'Nearest'),
  sortRating: L('Reytinq', 'Рейтинг', 'Rating'),
  noSlots: L(
    'Bu seçim üçün boş vaxt yoxdur. Başqa gün və ya saat seçin.',
    'Под этот запрос свободного времени нет. Попробуйте другой день или время.',
    'No free slots for that. Try another day or time.',
  ),
  slotsAcross: L('{slots} · {places}', '{slots} · {places}', '{slots} · {places}'),

  // Compare
  compareTitle: L('Müqayisə', 'Сравнение', 'Compare'),
  compareEmptyTitle: L('Yan-yana baxın', 'Сравните рядом', 'Side by side'),
  compareEmpty: L(
    'Qiymət, reytinq, məsafə və ilk boş vaxtı yan-yana görmək üçün 2–3 məkan əlavə edin.',
    'Добавьте 2–3 места, чтобы увидеть цену, рейтинг, расстояние и ближайшее окно рядом.',
    'Add 2–3 places to see price, rating, distance and the next free slot side by side.',
  ),
  addPlace: L('Məkan əlavə et', 'Добавить место', 'Add a place'),
  compareFor: L('Xidmət üzrə müqayisə', 'Сравнить по услуге', 'Compare for'),
  rowPrice: L('Qiymət', 'Цена', 'Price'),
  rowRating: L('Reytinq', 'Рейтинг', 'Rating'),
  rowDistance: L('Məsafə', 'Расстояние', 'Distance'),
  rowNextFree: L('Ən yaxın boş vaxt', 'Ближайшее окно', 'Next free'),
  rowToday: L('Bu gün', 'Сегодня', 'Today'),
  rowMasters: L('Ustalar', 'Мастера', 'Masters'),
  rowAmenities: L('Xüsusiyyətlər', 'Удобства', 'Good to know'),
  notOffered: L('Yoxdur', 'Нет', 'Not offered'),
  best: L('Ən yaxşı', 'Лучшее', 'Best'),
  compareTray: L('{places}', '{places}', '{places}'),
  compareNow: L('Müqayisə et', 'Сравнить', 'Compare'),
  compareHint: L(
    'Qiymət, reytinq və boş vaxt — yan-yana',
    'Цена, рейтинг и свободное время — рядом',
    'Price, rating and free time, side by side',
  ),
  compareLimit: L(
    'Ən çox 3 məkan müqayisə etmək olar.',
    'Можно сравнить до 3 мест.',
    'You can compare up to 3 places.',
  ),
  compareAdded: L('Müqayisəyə əlavə edildi', 'Добавлено к сравнению', 'Added to compare'),
  bookHere: L('Burada yazıl', 'Записаться', 'Book here'),
  clearAll: L('Hamısını təmizlə', 'Очистить всё', 'Clear all'),

  // Map
  sortBest: L('Ən uyğun', 'Лучший выбор', 'Best match'),
  sortNear: L('Ən yaxın', 'Ближайшие', 'Nearest'),
  sortTop: L('Reytinq', 'Рейтинг', 'Top rated'),
  bestPick: L('Yaxınlıqda ən yaxşı seçim', 'Лучший вариант рядом', 'Best pick near you'),
  nothingInRange: L('Bu aralıqda heç nə yoxdur', 'В этом диапазоне ничего нет', 'Nothing in that range'),
  widenRange: L(
    'Qiymət aralığını genişləndirin və ya kateqoriyanı təmizləyin.',
    'Расширьте ценовой диапазон или сбросьте категорию.',
    'Widen the price range or clear the category.',
  ),
  locationOff: L(
    'Məkan söndürülüb — məsafələr Fəvvarələr meydanından',
    'Геолокация выключена — расстояния от Фонтанной площади',
    'Location off — distances from Fountain Square',
  ),
  useMyLocation: L('Mənim məkanım', 'Моё местоположение', 'Use my location'),
  centredOnYou: L('Sizin məkanınız', 'Вы здесь', 'Centred on you'),
  searchCentre: L('Axtarış mərkəzi', 'Центр поиска', 'Search centre'),
  pricesHint1: L('Sərfəli qiymətlər', 'Недорогие', 'Everyday prices'),
  pricesHint2: L('Orta qiymətlər', 'Средние цены', 'Mid-range prices'),
  pricesHint3: L('Premium qiymətlər', 'Премиум', 'Premium prices'),

  // Splash
  loading: L('{app} yüklənir', '{app} загружается', '{app} is loading'),
} as const;

export type StringKey = keyof typeof strings;

/** Plural forms per language: az [form], ru [one, few, many], en [one, other]. */
export const forms = {
  review: { az: ['rəy'], ru: ['отзыв', 'отзыва', 'отзывов'], en: ['review', 'reviews'] },
  service: { az: ['xidmət'], ru: ['услуга', 'услуги', 'услуг'], en: ['service', 'services'] },
  master: { az: ['usta'], ru: ['мастер', 'мастера', 'мастеров'], en: ['master', 'masters'] },
  year: { az: ['il'], ru: ['год', 'года', 'лет'], en: ['year', 'years'] },
  place: { az: ['məkan'], ru: ['место', 'места', 'мест'], en: ['place', 'places'] },
  slot: { az: ['boş vaxt'], ru: ['окно', 'окна', 'окон'], en: ['free slot', 'free slots'] },
  free: { az: ['boş'], ru: ['свободно', 'свободно', 'свободно'], en: ['free', 'free'] },
} as const;

export type FormKey = keyof typeof forms;
